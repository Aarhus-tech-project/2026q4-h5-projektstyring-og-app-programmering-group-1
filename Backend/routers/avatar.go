package routers

import (
	"database/sql"
	"errors"
	"io"
	"log"
	"net/http"
	"strings"

	"lagerklar/backend/database"

	"github.com/gin-gonic/gin"
)

// Max size of an uploaded profile picture (5 MB).
const maxAvatarBytes = 5 << 20

var allowedAvatarTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
}

// PUT /v1/user/:userID/avatar
// Saves the uploaded image (multipart field "avatar") as a blob in users.avatar_url (BYTEA).
func HandleUploadAvatar(c *gin.Context) {
	userID := c.GetString("userID")
	if c.Param("userID") != userID {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "You can only change your own profile picture",
			"data":    gin.H{},
		})
		return
	}

	// Stop reading the body if it is larger than the limit (+ room for the multipart headers)
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxAvatarBytes+1<<20)

	fileHeader, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "No image was uploaded or the image is too large",
			"data":    gin.H{},
		})
		return
	}

	if fileHeader.Size > maxAvatarBytes {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{
			"success": false,
			"message": "Image must be 5 MB or smaller",
			"data":    gin.H{},
		})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Could not read the image",
			"data":    gin.H{},
		})
		return
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, maxAvatarBytes+1))
	if err != nil || len(data) == 0 || len(data) > maxAvatarBytes {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Could not read the image",
			"data":    gin.H{},
		})
		return
	}

	// Check the real file type from the bytes, not what the client says it is
	mimeType := http.DetectContentType(data)
	if !allowedAvatarTypes[mimeType] {
		c.JSON(http.StatusUnsupportedMediaType, gin.H{
			"success": false,
			"message": "Image must be JPEG, PNG or WebP",
			"data":    gin.H{},
		})
		return
	}

	result, err := database.DB.ExecContext(
		c.Request.Context(),
		`UPDATE users SET avatar_url = $1 WHERE id = $2::uuid`,
		data,
		userID,
	)
	if err != nil {
		log.Println("Upload avatar error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not save profile picture",
			"data":    gin.H{},
		})
		return
	}

	if rows, _ := result.RowsAffected(); rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "User not found",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Profile picture saved",
		"data":    gin.H{},
	})
}

// GET /v1/user/:userID/avatar
// Returns the user's profile picture as raw image bytes.
func HandleGetAvatar(c *gin.Context) {
	userID := strings.TrimSpace(c.Param("userID"))

	var data []byte

	err := database.DB.QueryRowContext(
		c.Request.Context(),
		`SELECT avatar_url
		 FROM users
		 WHERE id::text = $1 AND avatar_url IS NOT NULL`,
		userID,
	).Scan(&data)

	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "No profile picture",
			"data":    gin.H{},
		})
		return
	}
	if err != nil {
		log.Println("Get avatar error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not load profile picture",
			"data":    gin.H{},
		})
		return
	}

	// Only the bytes are stored, so the image type is detected from them
	c.Header("Cache-Control", "private, no-cache")
	c.Data(http.StatusOK, http.DetectContentType(data), data)
}
