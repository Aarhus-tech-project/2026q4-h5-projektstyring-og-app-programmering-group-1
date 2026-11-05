package routers

import (
	"log"
	"net/http"
	"regexp"
	"strings"

	"lagerklar/backend/database"

	"github.com/gin-gonic/gin"
)

// Expo tokens look like ExponentPushToken[xxxx] (older SDKs: ExpoPushToken[xxxx]).
var expoPushTokenPattern = regexp.MustCompile(`^Expo(nent)?PushToken\[[^\[\]]+\]$`)

type SavePushTokenReq struct {
	UserID   string `json:"user_id" binding:"required"`
	Token    string `json:"token" binding:"required"`
	Platform string `json:"platform" binding:"required"`
}

// POST /v1/expo-push-token
// Saves the device's Expo push token for the authenticated user.
func HandleSavePushToken(c *gin.Context) {
	var req SavePushTokenReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
			"data":    gin.H{},
		})
		return
	}

	// The userID in the body must be the logged-in user, so nobody can register a token on another account
	userID := c.GetString("userID")
	if strings.TrimSpace(req.UserID) != userID {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "You can only save push tokens for your own account",
			"data":    gin.H{},
		})
		return
	}

	token := strings.TrimSpace(req.Token)
	if !expoPushTokenPattern.MatchString(token) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid Expo push token",
			"data":    gin.H{},
		})
		return
	}

	platform := strings.ToLower(strings.TrimSpace(req.Platform))
	if platform != "ios" && platform != "android" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Platform must be ios or android",
			"data":    gin.H{},
		})
		return
	}

	// A token identifies a device, so if another user logs in on the same device
	// the token moves over to them instead of failing on the unique constraint.
	_, err := database.DB.ExecContext(
		c.Request.Context(),
		`INSERT INTO push_tokens (user_id, expo_push_token, platform)
		 VALUES ($1::uuid, $2, $3)
		 ON CONFLICT (expo_push_token)
		 DO UPDATE SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform`,
		userID,
		token,
		platform,
	)
	if err != nil {
		log.Println("Save push token error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not save push token",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Push token saved",
		"data":    gin.H{},
	})
}
