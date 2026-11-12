package routers

import (
	"database/sql"
	"errors"
	"io"
	"log"
	"net/http"

	"lagerklar/backend/database"

	"github.com/gin-gonic/gin"
)

// Max size of an uploaded item picture (5 MB), same limit as profile pictures.
const maxItemImageBytes = 5 << 20

// itemImageParams validates the company/item IDs and the user's membership.
// Returns false (and has already written the response) when the request must stop.
func itemImageParams(c *gin.Context) (companyID string, itemID string, ok bool) {
	companyID = c.Param("companyID")
	if !authorizeInventoryCompany(c, companyID) {
		return "", "", false
	}

	itemID = c.Param("itemID")
	if !inventoryIDPattern.MatchString(itemID) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid item ID",
			"data":    gin.H{},
		})
		return "", "", false
	}

	return companyID, itemID, true
}

// PUT /v1/companies/:companyID/items/:itemID/image
// Saves the uploaded image (multipart field "image") as a blob in items.image_url (BYTEA).
func UploadItemImage(c *gin.Context) {
	companyID, itemID, ok := itemImageParams(c)
	if !ok {
		return
	}

	// Stop reading the body if it is larger than the limit (+ room for the multipart headers)
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxItemImageBytes+1<<20)

	fileHeader, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "No image was uploaded or the image is too large",
			"data":    gin.H{},
		})
		return
	}

	if fileHeader.Size > maxItemImageBytes {
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

	data, err := io.ReadAll(io.LimitReader(file, maxItemImageBytes+1))
	if err != nil || len(data) == 0 || len(data) > maxItemImageBytes {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Could not read the image",
			"data":    gin.H{},
		})
		return
	}

	// Check the real file type from the bytes, not what the client says it is
	// (same allowed types as profile pictures)
	if !allowedAvatarTypes[http.DetectContentType(data)] {
		c.JSON(http.StatusUnsupportedMediaType, gin.H{
			"success": false,
			"message": "Image must be JPEG, PNG or WebP",
			"data":    gin.H{},
		})
		return
	}

	result, err := database.DB.ExecContext(
		c.Request.Context(),
		`UPDATE items
		 SET image_url = $1, image_updated_at = now()
		 WHERE id = $2::uuid
		   AND company_id = $3::uuid
		   AND archived_at IS NULL`,
		data,
		itemID,
		companyID,
	)
	if err != nil {
		log.Println("Upload item image error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not save item image",
			"data":    gin.H{},
		})
		return
	}

	if rows, _ := result.RowsAffected(); rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Item not found",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Item image saved",
		"data":    gin.H{},
	})
}

// GET /v1/companies/:companyID/items/:itemID/image
// Returns the item's picture as raw image bytes. Only members of the company can see it.
func GetItemImage(c *gin.Context) {
	companyID, itemID, ok := itemImageParams(c)
	if !ok {
		return
	}

	var data []byte
	err := database.DB.QueryRowContext(
		c.Request.Context(),
		`SELECT image_url
		 FROM items
		 WHERE id = $1::uuid
		   AND company_id = $2::uuid
		   AND image_url IS NOT NULL`,
		itemID,
		companyID,
	).Scan(&data)

	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "No item image",
			"data":    gin.H{},
		})
		return
	}
	if err != nil {
		log.Println("Get item image error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not load item image",
			"data":    gin.H{},
		})
		return
	}

	// The URL changes (?v=) on every upload, so the image can be cached privately
	c.Header("Cache-Control", "private, max-age=86400")
	c.Data(http.StatusOK, http.DetectContentType(data), data)
}

// DELETE /v1/companies/:companyID/items/:itemID/image
// Removes the item's picture.
func DeleteItemImage(c *gin.Context) {
	companyID, itemID, ok := itemImageParams(c)
	if !ok {
		return
	}

	result, err := database.DB.ExecContext(
		c.Request.Context(),
		`UPDATE items
		 SET image_url = NULL, image_updated_at = now()
		 WHERE id = $1::uuid
		   AND company_id = $2::uuid
		   AND archived_at IS NULL`,
		itemID,
		companyID,
	)
	if err != nil {
		log.Println("Delete item image error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not remove item image",
			"data":    gin.H{},
		})
		return
	}

	if rows, _ := result.RowsAffected(); rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Item not found",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Item image removed",
		"data":    gin.H{},
	})
}
