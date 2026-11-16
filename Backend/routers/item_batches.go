package routers

import (
	"log"
	"net/http"
	"time"

	"lagerklar/backend/database"

	"github.com/gin-gonic/gin"
)

type itemBatchResponse struct {
	ID                string  `json:"id"`
	RemainingQuantity float64 `json:"remainingQuantity"`
	PurchaseDate      string  `json:"purchaseDate"`
	ExpiryDate        string  `json:"expiryDate"`
}

// GET /v1/companies/:companyID/items/:itemID/batches
// Returns the item's batches that still have stock, the one that expires first first.
// Used by "Brug" so the user can choose which batch they take from.
func GetItemBatches(c *gin.Context) {
	companyID := c.Param("companyID")
	if !authorizeInventoryCompany(c, companyID) {
		return
	}

	itemID := c.Param("itemID")
	if !inventoryIDPattern.MatchString(itemID) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid item ID",
			"data":    gin.H{},
		})
		return
	}

	rows, err := database.DB.QueryContext(
		c.Request.Context(),
		`SELECT b.id::text, b.remaining_quantity::double precision, b.purchase_date, b.expiry_date
		 FROM batches b
		 JOIN items i ON i.id = b.item_id
		 WHERE b.item_id = $1::uuid
		   AND i.company_id = $2::uuid
		   AND b.remaining_quantity > 0
		 ORDER BY b.expiry_date, b.purchase_date, b.created_at`,
		itemID,
		companyID,
	)
	if err != nil {
		log.Println("Get item batches error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not load batches",
			"data":    gin.H{},
		})
		return
	}
	defer rows.Close()

	batches := make([]itemBatchResponse, 0)
	for rows.Next() {
		var batch itemBatchResponse
		var purchaseDate, expiryDate time.Time
		if err := rows.Scan(&batch.ID, &batch.RemainingQuantity, &purchaseDate, &expiryDate); err != nil {
			log.Println("Scan item batch error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read batches",
				"data":    gin.H{},
			})
			return
		}
		batch.PurchaseDate = purchaseDate.Format(time.DateOnly)
		batch.ExpiryDate = expiryDate.Format(time.DateOnly)
		batches = append(batches, batch)
	}
	if err := rows.Err(); err != nil {
		log.Println("Read item batches error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not read batches",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Batches loaded",
		"data":    batches,
	})
}
