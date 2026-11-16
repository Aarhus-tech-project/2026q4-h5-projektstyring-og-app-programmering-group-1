package utils

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"time"

	"lagerklar/backend/database"
)

// Notifications sent right away when someone changes the inventory (see notification.md):
//   - an item is put on the shopping list            -> ejer + leder
//   - using an item makes it low / empties the stock -> ejer + leder
//
// The person who did the change is never notified about it.
// They run in the background, so a slow push service never delays the user's request.

const notificationTimeout = 30 * time.Second

// NotifyShoppingListAdded tells the company's ejer and leder that an item was put on the
// shopping list. Only called for a new line, not when the amount on an existing line changes.
func NotifyShoppingListAdded(companyID, itemID, actorUserID string, quantity float64) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), notificationTimeout)
		defer cancel()

		var companyName, itemName, unit, actorName string
		err := database.DB.QueryRowContext(
			ctx,
			`SELECT co.name, i.name, i.unit, COALESCE(u.name, '')
			 FROM items i
			 JOIN companies co ON co.id = i.company_id
			 LEFT JOIN users u ON u.id = $3::uuid
			 WHERE i.id = $2::uuid
			   AND i.company_id = $1::uuid`,
			companyID,
			itemID,
			actorUserID,
		).Scan(&companyName, &itemName, &unit, &actorName)
		if err != nil {
			log.Println("Shopping list notification: could not load item:", err)
			return
		}

		if actorName == "" {
			actorName = "En medarbejder"
		}
		message := fmt.Sprintf("%s har tilføjet %s %s til indkøbslisten.", actorName, formatQuantity(quantity, unit), itemName)

		recipients, err := findManagers(ctx, companyID, actorUserID, "", "")
		if err != nil {
			log.Println("Shopping list notification: could not load recipients:", err)
			return
		}

		for _, userID := range recipients {
			err := saveAndSendNotification(ctx, pendingNotification{
				UserID:      userID,
				CompanyID:   companyID,
				CompanyName: companyName,
				ItemID:      itemID,
				Type:        NotificationTypeShoppingList,
				Message:     message,
			})
			if err != nil {
				log.Println("Shopping list notification error:", err)
			}
		}
	}()
}

// NotifyStockAfterUse is called after stock was taken out of an item (Brug).
// It notifies ejer and leder only when this use crossed a limit:
//   - the stock reached 0                    -> "udsolgt"
//   - the stock dropped to or below minimum  -> "lav_beholdning"
//
// Using an item that was already low does not notify again. Each type is sent at most once
// per item per user per day, also counting what the scheduled check already sent.
func NotifyStockAfterUse(companyID, itemID, actorUserID string, stockBefore, stockAfter float64) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), notificationTimeout)
		defer cancel()

		var companyName, itemName, unit string
		var minQuantity float64
		err := database.DB.QueryRowContext(
			ctx,
			`SELECT co.name, i.name, i.unit, i.min_quantity::double precision
			 FROM items i
			 JOIN companies co ON co.id = i.company_id
			 WHERE i.id = $2::uuid
			   AND i.company_id = $1::uuid
			   AND i.archived_at IS NULL`,
			companyID,
			itemID,
		).Scan(&companyName, &itemName, &unit, &minQuantity)
		if errors.Is(err, sql.ErrNoRows) {
			return
		}
		if err != nil {
			log.Println("Stock notification: could not load item:", err)
			return
		}

		var notificationType, sameDayTypes string
		switch {
		case stockAfter <= 0 && stockBefore > 0:
			// Out of stock wins if the same use also crossed the minimum
			notificationType = NotificationTypeOutOfStock
			sameDayTypes = NotificationTypeOutOfStock
		case minQuantity > 0 && stockAfter <= minQuantity && stockBefore > minQuantity:
			notificationType = NotificationTypeLowStock
			// Skip "low" if the user was already told today that it is low or sold out
			sameDayTypes = NotificationTypeLowStock + "," + NotificationTypeOutOfStock
		default:
			return
		}

		recipients, err := findManagers(ctx, companyID, actorUserID, itemID, sameDayTypes)
		if err != nil {
			log.Println("Stock notification: could not load recipients:", err)
			return
		}

		message := lowStockMessage(itemName, stockAfter, minQuantity, unit)
		for _, userID := range recipients {
			err := saveAndSendNotification(ctx, pendingNotification{
				UserID:      userID,
				CompanyID:   companyID,
				CompanyName: companyName,
				ItemID:      itemID,
				Type:        notificationType,
				Message:     message,
			})
			if err != nil {
				log.Println("Stock notification error:", err)
			}
		}
	}()
}

// findManagers returns the ejer and leder of the company, except the user who made the change.
// With itemID and sameDayTypes (comma separated) set, users who already got one of those
// notification types for the item today are left out.
func findManagers(ctx context.Context, companyID, excludeUserID, itemID, sameDayTypes string) ([]string, error) {
	rows, err := database.DB.QueryContext(
		ctx,
		`SELECT cm.user_id::text
		 FROM company_memberships cm
		 WHERE cm.company_id = $1::uuid
		   AND cm.role IN ('ejer', 'leder')
		   AND cm.user_id <> $2::uuid
		   -- NULLIF: without an item id the comparison is NULL, so nobody is filtered out
		   -- (and '' is never cast to uuid, which would fail)
		   AND NOT EXISTS (
			 SELECT 1 FROM notifications n
			 WHERE n.user_id = cm.user_id
			   AND n.item_id = NULLIF($3, '')::uuid
			   AND n.type = ANY (string_to_array($4, ','))
			   AND n.sent_at >= current_date
		   )`,
		companyID,
		excludeUserID,
		itemID,
		sameDayTypes,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userIDs []string
	for rows.Next() {
		var userID string
		if err := rows.Scan(&userID); err != nil {
			return nil, err
		}
		userIDs = append(userIDs, userID)
	}
	return userIDs, rows.Err()
}
