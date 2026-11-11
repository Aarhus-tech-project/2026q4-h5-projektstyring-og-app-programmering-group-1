package routers

import (
	"log"
	"net/http"

	"lagerklar/backend/database"
	"lagerklar/backend/model"

	"github.com/gin-gonic/gin"
)

const notificationListLimit = 100

// GET /v1/notifications
// Returns the authenticated user's newest notifications, newest first.
func HandleGetNotifications(c *gin.Context) {
	userID := c.GetString("userID")

	rows, err := database.DB.QueryContext(
		c.Request.Context(),
		`SELECT
			n.id::text,
			n.company_id::text,
			co.name,
			n.item_id::text,
			i.name,
			n.batch_id::text,
			n.type,
			n.message,
			n.sent_at,
			n.read_at
		 FROM notifications n
		 JOIN companies co ON co.id = n.company_id
		 LEFT JOIN items i ON i.id = n.item_id
		 WHERE n.user_id = $1::uuid
		   AND n.deleted_at IS NULL
		 ORDER BY n.sent_at DESC
		 LIMIT $2`,
		userID,
		notificationListLimit,
	)
	if err != nil {
		log.Println("Get notifications error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not load notifications",
			"data":    gin.H{},
		})
		return
	}
	defer rows.Close()

	notifications := make([]model.UserNotification, 0)
	for rows.Next() {
		var n model.UserNotification
		if err := rows.Scan(
			&n.ID,
			&n.CompanyID,
			&n.CompanyName,
			&n.ItemID,
			&n.ItemName,
			&n.BatchID,
			&n.Type,
			&n.Message,
			&n.SentAt,
			&n.ReadAt,
		); err != nil {
			log.Println("Scan notification error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read notifications",
				"data":    gin.H{},
			})
			return
		}
		notifications = append(notifications, n)
	}
	if err := rows.Err(); err != nil {
		log.Println("Read notifications error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not read notifications",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Notifications loaded",
		"data":    notifications,
	})
}

// PATCH /v1/notifications/:notificationID/read
// Marks one of the authenticated user's notifications as read.
func HandleMarkNotificationRead(c *gin.Context) {
	userID := c.GetString("userID")
	notificationID := c.Param("notificationID")

	if !inventoryIDPattern.MatchString(notificationID) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid notification id",
			"data":    gin.H{},
		})
		return
	}

	// COALESCE keeps the first read time if it is already read
	result, err := database.DB.ExecContext(
		c.Request.Context(),
		`UPDATE notifications
		 SET read_at = COALESCE(read_at, now())
		 WHERE id = $1::uuid AND user_id = $2::uuid AND deleted_at IS NULL`,
		notificationID,
		userID,
	)
	if err != nil {
		log.Println("Mark notification read error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not update notification",
			"data":    gin.H{},
		})
		return
	}

	if affected, _ := result.RowsAffected(); affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Notification not found",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Notification marked as read",
		"data":    gin.H{},
	})
}

// DELETE /v1/notifications/:notificationID
// Deletes one of the authenticated user's notifications. The row is only marked with
// deleted_at, because the notification checker uses it to know the notification was
// already sent; a real DELETE would make the checker create it again.
func HandleDeleteNotification(c *gin.Context) {
	userID := c.GetString("userID")
	notificationID := c.Param("notificationID")

	if !inventoryIDPattern.MatchString(notificationID) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid notification id",
			"data":    gin.H{},
		})
		return
	}

	result, err := database.DB.ExecContext(
		c.Request.Context(),
		`UPDATE notifications
		 SET deleted_at = now()
		 WHERE id = $1::uuid AND user_id = $2::uuid AND deleted_at IS NULL`,
		notificationID,
		userID,
	)
	if err != nil {
		log.Println("Delete notification error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not delete notification",
			"data":    gin.H{},
		})
		return
	}

	if affected, _ := result.RowsAffected(); affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Notification not found",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Notification deleted",
		"data":    gin.H{},
	})
}
