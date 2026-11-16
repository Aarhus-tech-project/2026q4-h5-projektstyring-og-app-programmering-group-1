package routers

import (
	"lagerklar/backend/model"
	"lagerklar/backend/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GET /v1/notification-test/user/:userID
func NotificationTest(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "userID is required",
		})
		return
	}

	data := model.Notification{
		UserID: userID,
		Title:  "Test Notification",
		Body:   "This is the body of the test notification",
	}

	if err := utils.SendNotification(data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Notification sent",
		"data":    data,
	})
}
