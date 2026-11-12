package utils

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strconv"
	"strings"
	"sync"
	"time"

	"lagerklar/backend/database"
	"lagerklar/backend/model"
)

const (
	NotificationTypeExpiry       = "udloeb"
	NotificationTypeLowStock     = "lav_beholdning"
	NotificationTypeOutOfStock   = "udsolgt"
	NotificationTypeShoppingList = "indkoebsliste"

	notificationCheckInterval = 5 * time.Minute
)

// StartNotificationChecker checks for expiring batches and low stock right away and then
// every few minutes until ctx is cancelled. Run it in its own goroutine.
func StartNotificationChecker(ctx context.Context) {
	ticker := time.NewTicker(notificationCheckInterval)
	defer ticker.Stop()

	for {
		RunNotificationCheck(ctx, false)

		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

// TriggerNotificationCheck runs a check in the background right after the inventory
// changed (stock added/used, minimum changed), so the user does not have to wait for
// the next scheduled check. It does not block the request.
func TriggerNotificationCheck() {
	go RunNotificationCheck(context.Background(), true)
}

// Only one check may run at a time, otherwise two checks could both see that a
// notification is missing and create it twice.
var notificationCheckMu sync.Mutex

// RunNotificationCheck creates and sends the notifications that are due right now.
//
// The scheduled check only handles a company once the local time has passed its
// daily_check_time (reminder_settings, default 08:00). A triggered check
// (ignoreCheckTime = true) runs right away. Each user gets one expiry notification
// per batch, and at most one low stock notification per item per day.
func RunNotificationCheck(ctx context.Context, ignoreCheckTime bool) {
	notificationCheckMu.Lock()
	defer notificationCheckMu.Unlock()

	ctx, cancel := context.WithTimeout(ctx, time.Minute)
	defer cancel()

	expiring, err := findExpiringBatches(ctx, ignoreCheckTime, "")
	if err != nil {
		log.Println("Notification check (expiry) error:", err)
	}
	lowStock, err := findLowStockItems(ctx, ignoreCheckTime)
	if err != nil {
		log.Println("Notification check (low stock) error:", err)
	}

	for _, n := range append(expiring, lowStock...) {
		if err := saveAndSendNotification(ctx, n); err != nil {
			log.Println("Notification check error:", err)
		}
	}
}

// pendingNotification is a notification that should be saved and sent.
type pendingNotification struct {
	UserID      string
	CompanyID   string
	CompanyName string
	ItemID      string
	BatchID     *string
	Type        string
	Message     string
}

// saveAndSendNotification stores the notification so it shows in the app, then sends it
// as a push notification. The saved row is kept even if the push fails, since the user
// can still see it in the notification list.
func saveAndSendNotification(ctx context.Context, n pendingNotification) error {
	_, err := database.DB.ExecContext(
		ctx,
		`INSERT INTO notifications (user_id, company_id, item_id, batch_id, type, message)
		 VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6)`,
		n.UserID,
		n.CompanyID,
		n.ItemID,
		n.BatchID,
		n.Type,
		n.Message,
	)
	if err != nil {
		return fmt.Errorf("save notification: %w", err)
	}

	err = SendNotification(model.Notification{
		UserID: n.UserID,
		Title:  notificationTitle(n),
		Body:   n.Message,
	})
	if err != nil && !errors.Is(err, ErrNoPushTokens) {
		return fmt.Errorf("send notification: %w", err)
	}
	return nil
}

func notificationTitle(n pendingNotification) string {
	title := "Notifikation"
	switch n.Type {
	case NotificationTypeExpiry:
		title = "Udløber snart"
	case NotificationTypeLowStock:
		title = "Lav beholdning"
	case NotificationTypeOutOfStock:
		title = "Ikke på lager"
	case NotificationTypeShoppingList:
		title = "Indkøbsliste"
	}
	return n.CompanyName + ": " + title
}

// NotifyBatchExpiry is called right after goods are received (Modtag vare). If the new batch
// already expires within the company's days_before_expiry, every member is notified now,
// including the person who received it, instead of waiting for the next scheduled check.
// It holds the same lock as the scheduled check, and both skip batches that were already
// notified about, so nobody gets the notification twice.
func NotifyBatchExpiry(batchID string) {
	go func() {
		notificationCheckMu.Lock()
		defer notificationCheckMu.Unlock()

		ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
		defer cancel()

		expiring, err := findExpiringBatches(ctx, true, batchID)
		if err != nil {
			log.Println("Expiry notification after receiving error:", err)
			return
		}
		for _, n := range expiring {
			if err := saveAndSendNotification(ctx, n); err != nil {
				log.Println("Expiry notification after receiving error:", err)
			}
		}
	}()
}

// findExpiringBatches returns one notification per company member for each batch with
// stock left that expires within the company's days_before_expiry and has not been
// notified about yet. Dates use the database's time zone (Europe/Copenhagen).
// batchID limits the check to one batch; "" checks all batches.
func findExpiringBatches(ctx context.Context, ignoreCheckTime bool, batchID string) ([]pendingNotification, error) {
	rows, err := database.DB.QueryContext(
		ctx,
		`SELECT
			cm.user_id::text,
			co.id::text,
			co.name,
			i.id::text,
			b.id::text,
			i.name,
			i.unit,
			b.remaining_quantity::double precision,
			b.expiry_date - current_date
		 FROM batches b
		 JOIN items i ON i.id = b.item_id
		 JOIN companies co ON co.id = i.company_id
		 JOIN company_memberships cm ON cm.company_id = co.id
		 LEFT JOIN reminder_settings rs ON rs.company_id = co.id
		 WHERE b.remaining_quantity > 0
		   AND i.archived_at IS NULL -- skip deleted (archived) items
		   AND ($1 OR localtime >= COALESCE(rs.daily_check_time, '08:00'))
		   -- NULLIF: without a batch id every batch is checked ('' is never cast to uuid)
		   AND (NULLIF($2, '') IS NULL OR b.id = NULLIF($2, '')::uuid)
		   AND b.expiry_date <= current_date + COALESCE(rs.days_before_expiry, 3)
		   AND NOT EXISTS (
			 SELECT 1 FROM notifications n
			 WHERE n.user_id = cm.user_id
			   AND n.batch_id = b.id
			   AND n.type = 'udloeb'
		   )`,
		ignoreCheckTime,
		batchID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []pendingNotification
	for rows.Next() {
		var n pendingNotification
		var batchID, itemName, unit string
		var quantity float64
		var daysLeft int
		if err := rows.Scan(
			&n.UserID, &n.CompanyID, &n.CompanyName, &n.ItemID, &batchID,
			&itemName, &unit, &quantity, &daysLeft,
		); err != nil {
			return nil, err
		}
		n.BatchID = &batchID
		n.Type = NotificationTypeExpiry
		n.Message = expiryMessage(itemName, formatQuantity(quantity, unit), daysLeft)
		result = append(result, n)
	}
	return result, rows.Err()
}

// findLowStockItems returns one notification per ejer/leder for each item at or below its
// minimum quantity, unless the user already got a low stock or sold out notification for
// that item today (e.g. right after someone used it, see NotifyStockAfterUse).
func findLowStockItems(ctx context.Context, ignoreCheckTime bool) ([]pendingNotification, error) {
	rows, err := database.DB.QueryContext(
		ctx,
		`WITH stock AS (
			SELECT
				i.id,
				i.company_id,
				i.name,
				i.unit,
				i.min_quantity,
				COALESCE(SUM(b.remaining_quantity), 0) AS quantity
			FROM items i
			LEFT JOIN batches b ON b.item_id = i.id
			WHERE i.archived_at IS NULL -- skip deleted (archived) items
			  AND i.min_quantity > 0
			GROUP BY i.id
			HAVING COALESCE(SUM(b.remaining_quantity), 0) <= i.min_quantity
		 )
		 SELECT
			cm.user_id::text,
			co.id::text,
			co.name,
			s.id::text,
			s.name,
			s.unit,
			s.quantity::double precision,
			s.min_quantity::double precision
		 FROM stock s
		 JOIN companies co ON co.id = s.company_id
		 JOIN company_memberships cm ON cm.company_id = co.id
		 LEFT JOIN reminder_settings rs ON rs.company_id = co.id
		 WHERE ($1 OR localtime >= COALESCE(rs.daily_check_time, '08:00'))
		   AND cm.role IN ('ejer', 'leder')
		   AND NOT EXISTS (
			 SELECT 1 FROM notifications n
			 WHERE n.user_id = cm.user_id
			   AND n.item_id = s.id
			   AND n.type IN ('lav_beholdning', 'udsolgt')
			   AND n.sent_at >= current_date
		   )`,
		ignoreCheckTime,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []pendingNotification
	for rows.Next() {
		var n pendingNotification
		var itemName, unit string
		var quantity, minQuantity float64
		if err := rows.Scan(
			&n.UserID, &n.CompanyID, &n.CompanyName, &n.ItemID,
			&itemName, &unit, &quantity, &minQuantity,
		); err != nil {
			return nil, err
		}
		n.Type = NotificationTypeLowStock
		n.Message = lowStockMessage(itemName, quantity, minQuantity, unit)
		result = append(result, n)
	}
	return result, rows.Err()
}

func expiryMessage(itemName, quantity string, daysLeft int) string {
	switch {
	case daysLeft < 0:
		return fmt.Sprintf("%s af %s er udløbet.", quantity, itemName)
	case daysLeft == 0:
		return fmt.Sprintf("%s af %s udløber i dag.", quantity, itemName)
	case daysLeft == 1:
		return fmt.Sprintf("%s af %s udløber i morgen.", quantity, itemName)
	default:
		return fmt.Sprintf("%s af %s udløber om %d dage.", quantity, itemName, daysLeft)
	}
}

func lowStockMessage(itemName string, quantity, minQuantity float64, unit string) string {
	if quantity <= 0 {
		return fmt.Sprintf("%s er udsolgt (minimum %s).", itemName, formatQuantity(minQuantity, unit))
	}
	return fmt.Sprintf(
		"Der er kun %s %s tilbage (minimum %s).",
		formatQuantity(quantity, unit), itemName, formatQuantity(minQuantity, unit),
	)
}

// formatQuantity writes a quantity the Danish way, e.g. 2.5 kg -> "2,5 kg".
func formatQuantity(quantity float64, unit string) string {
	number := strings.Replace(strconv.FormatFloat(quantity, 'f', -1, 64), ".", ",", 1)
	if unit == "" {
		return number
	}
	return number + " " + unit
}
