package routers

import (
	"database/sql"
	"net/http"
	"regexp"
	"strings"
	"time"

	"lagerklar/backend/database"
	"lagerklar/backend/utils"

	"github.com/gin-gonic/gin"
)

var inventoryIDPattern = regexp.MustCompile(
	`(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`,
)

type inventoryItemResponse struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	Category       string  `json:"category"`
	Quantity       float64 `json:"quantity"`
	Unit           string  `json:"unit"`
	MinQuantity    float64 `json:"minQuantity"`
	NextExpiryDate *string `json:"nextExpiryDate,omitempty"`
	// Path to GET .../items/:itemID/image (with ?v= so a new upload is not served from cache), or omitted without a picture
	ImageURL *string `json:"imageUrl,omitempty"`
	// Number of batches that still have stock; with 2 or more the app asks which one "Brug" takes from
	BatchCount int `json:"batchCount"`
}

func GetInventoryItems(c *gin.Context) {
	companyID := c.Param("companyID")
	userID := c.GetString("userID")

	if !inventoryIDPattern.MatchString(companyID) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid company ID",
			"data":    gin.H{},
		})
		return
	}

	// Kontroller, at brugeren er medlem af virksomheden.
	var isMember bool
	err := database.DB.QueryRowContext(
		c.Request.Context(),
		`SELECT EXISTS (
SELECT 1
FROM company_memberships
WHERE company_id = $1::uuid
  AND user_id = $2::uuid
)`,
		companyID,
		userID,
	).Scan(&isMember)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not verify company membership",
			"data":    gin.H{},
		})
		return
	}

	if !isMember {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Company not found",
			"data":    gin.H{},
		})
		return
	}

	search := strings.TrimSpace(c.Query("search"))

	rows, err := database.DB.QueryContext(
		c.Request.Context(),
		`SELECT
i.id::text,
i.name,
COALESCE(c.name, ''),
COALESCE(SUM(b.remaining_quantity), 0)::double precision,
i.unit,
i.min_quantity::double precision,
MIN(b.expiry_date) FILTER (WHERE b.remaining_quantity > 0),
CASE WHEN i.image_url IS NOT NULL
     THEN '/companies/' || i.company_id::text || '/items/' || i.id::text || '/image?v='
          || COALESCE((EXTRACT(EPOCH FROM i.image_updated_at) * 1000)::bigint, 0)::text
END,
COUNT(b.id) FILTER (WHERE b.remaining_quantity > 0)
FROM items i
LEFT JOIN categories c
ON c.id = i.category_id
   AND c.company_id = i.company_id
LEFT JOIN batches b
ON b.item_id = i.id
WHERE i.company_id = $1::uuid
  AND i.archived_at IS NULL
  AND (
$2 = ''
OR i.name ILIKE '%' || $2 || '%'
OR COALESCE(c.name, '') ILIKE '%' || $2 || '%'
  )
GROUP BY i.id, c.name
ORDER BY c.name NULLS LAST, i.name`,
		companyID,
		search,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not load inventory items",
			"data":    gin.H{},
		})
		return
	}
	defer rows.Close()

	items := make([]inventoryItemResponse, 0)

	for rows.Next() {
		var item inventoryItemResponse
		var nextExpiry sql.NullTime
		var imageURL sql.NullString

		if err := rows.Scan(
			&item.ID,
			&item.Name,
			&item.Category,
			&item.Quantity,
			&item.Unit,
			&item.MinQuantity,
			&nextExpiry,
			&imageURL,
			&item.BatchCount,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read inventory items",
				"data":    gin.H{},
			})
			return
		}

		if nextExpiry.Valid {
			expiryDate := nextExpiry.Time.Format(time.DateOnly)
			item.NextExpiryDate = &expiryDate
		}

		if imageURL.Valid {
			item.ImageURL = &imageURL.String
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not read inventory items",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Inventory items loaded",
		"data":    items,
	})
}

func authorizeInventoryCompany(c *gin.Context, companyID string) bool {
	if !inventoryIDPattern.MatchString(companyID) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid company ID",
			"data":    gin.H{},
		})
		return false
	}

	var isMember bool
	err := database.DB.QueryRowContext(
		c.Request.Context(),
		`SELECT EXISTS (
SELECT 1
FROM company_memberships
WHERE company_id = $1::uuid
  AND user_id = $2::uuid
)`,
		companyID,
		c.GetString("userID"),
	).Scan(&isMember)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not verify company membership",
			"data":    gin.H{},
		})
		return false
	}

	if !isMember {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Company not found",
			"data":    gin.H{},
		})
		return false
	}

	return true
}

type createInventoryItemRequest struct {
	Name        string  `json:"name"`
	CategoryID  string  `json:"categoryId"`
	Unit        string  `json:"unit"`
	MinQuantity float64 `json:"minQuantity"`
}

func CreateInventoryItem(c *gin.Context) {
	companyID := c.Param("companyID")
	if !authorizeInventoryCompany(c, companyID) {
		return
	}

	var request createInventoryItemRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid item data",
			"data":    gin.H{},
		})
		return
	}

	request.Name = strings.TrimSpace(request.Name)
	request.Unit = strings.TrimSpace(request.Unit)

	if request.Name == "" || request.Unit == "" || request.MinQuantity < 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Name, unit and a non-negative minimum quantity are required",
			"data":    gin.H{},
		})
		return
	}

	var categoryValue any
	if request.CategoryID != "" {
		if !inventoryIDPattern.MatchString(request.CategoryID) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid category ID",
				"data":    gin.H{},
			})
			return
		}

		var categoryExists bool
		err := database.DB.QueryRowContext(
			c.Request.Context(),
			`SELECT EXISTS (
SELECT 1
FROM categories
WHERE id = $1::uuid
  AND company_id = $2::uuid
)`,
			request.CategoryID,
			companyID,
		).Scan(&categoryExists)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not verify category",
				"data":    gin.H{},
			})
			return
		}

		if !categoryExists {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Category does not belong to this company",
				"data":    gin.H{},
			})
			return
		}

		categoryValue = request.CategoryID
	}

	var itemID string
	err := database.DB.QueryRowContext(
		c.Request.Context(),
		`INSERT INTO items (company_id, category_id, name, unit, min_quantity)
 VALUES ($1::uuid, $2::uuid, $3, $4, $5)
 RETURNING id::text`,
		companyID,
		categoryValue,
		request.Name,
		request.Unit,
		request.MinQuantity,
	).Scan(&itemID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not create item",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Item created",
		"data": gin.H{
			"id": itemID,
		},
	})
}

type receiveInventoryBatchRequest struct {
	Quantity     float64 `json:"quantity"`
	PurchaseDate string  `json:"purchaseDate"`
	ExpiryDate   string  `json:"expiryDate"`
}

func ReceiveInventoryBatch(c *gin.Context) {
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

	var request receiveInventoryBatchRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid received item data",
			"data":    gin.H{},
		})
		return
	}

	purchaseDate, purchaseErr := time.Parse(time.DateOnly, request.PurchaseDate)
	expiryDate, expiryErr := time.Parse(time.DateOnly, request.ExpiryDate)

	if request.Quantity <= 0 ||
		purchaseErr != nil ||
		expiryErr != nil ||
		expiryDate.Before(purchaseDate) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Provide a positive quantity and valid purchase and expiry dates",
			"data":    gin.H{},
		})
		return
	}

	tx, err := database.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not record received items",
			"data":    gin.H{},
		})
		return
	}
	defer tx.Rollback()

	var batchID string
	err = tx.QueryRowContext(
		c.Request.Context(),
		`INSERT INTO batches (
item_id, created_by, initial_quantity, remaining_quantity,
purchase_date, expiry_date
)
SELECT id, $3::uuid, $4, $4, $5::date, $6::date
FROM items
WHERE id = $1::uuid
  AND company_id = $2::uuid
RETURNING id::text`,
		itemID,
		companyID,
		c.GetString("userID"),
		request.Quantity,
		request.PurchaseDate,
		request.ExpiryDate,
	).Scan(&batchID)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Item not found",
			"data":    gin.H{},
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not create received batch",
			"data":    gin.H{},
		})
		return
	}

	_, err = tx.ExecContext(
		c.Request.Context(),
		`INSERT INTO stock_movements (batch_id, user_id, type, quantity)
 VALUES ($1::uuid, $2::uuid, 'modtaget', $3)`,
		batchID,
		c.GetString("userID"),
		request.Quantity,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not record stock movement",
			"data":    gin.H{},
		})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not save received items",
			"data":    gin.H{},
		})
		return
	}

	// If the goods already expire soon, tell the members now instead of at the next scheduled check
	utils.NotifyBatchExpiry(batchID)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Received items recorded",
		"data": gin.H{
			"batchId": batchID,
		},
	})
}

type updateInventoryItemRequest struct {
	Name        *string  `json:"name"`
	CategoryID  *string  `json:"categoryId"`
	Unit        *string  `json:"unit"`
	MinQuantity *float64 `json:"minQuantity"`
}

func UpdateInventoryItem(c *gin.Context) {
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

	var request updateInventoryItemRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid item data",
			"data":    gin.H{},
		})
		return
	}

	if request.Name == nil &&
		request.CategoryID == nil &&
		request.Unit == nil &&
		request.MinQuantity == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "At least one field must be provided",
			"data":    gin.H{},
		})
		return
	}

	var nameValue any
	if request.Name != nil {
		name := strings.TrimSpace(*request.Name)
		if name == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Item name cannot be empty",
				"data":    gin.H{},
			})
			return
		}
		nameValue = name
	}

	var unitValue any
	if request.Unit != nil {
		unit := strings.TrimSpace(*request.Unit)
		if unit == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Unit cannot be empty",
				"data":    gin.H{},
			})
			return
		}
		unitValue = unit
	}

	var minQuantityValue any
	if request.MinQuantity != nil {
		if *request.MinQuantity < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Minimum quantity cannot be negative",
				"data":    gin.H{},
			})
			return
		}
		minQuantityValue = *request.MinQuantity
	}

	var categoryChanged bool
	var categoryValue any
	if request.CategoryID != nil {
		categoryChanged = true
		categoryID := strings.TrimSpace(*request.CategoryID)

		if categoryID != "" {
			if !inventoryIDPattern.MatchString(categoryID) {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Invalid category ID",
					"data":    gin.H{},
				})
				return
			}

			var categoryExists bool
			err := database.DB.QueryRowContext(
				c.Request.Context(),
				`SELECT EXISTS (
SELECT 1
FROM categories
WHERE id = $1::uuid
  AND company_id = $2::uuid
)`,
				categoryID,
				companyID,
			).Scan(&categoryExists)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not verify category",
					"data":    gin.H{},
				})
				return
			}

			if !categoryExists {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Category does not belong to this company",
					"data":    gin.H{},
				})
				return
			}

			categoryValue = categoryID
		} else {
			categoryValue = ""
		}
	}

	var updatedID string
	err := database.DB.QueryRowContext(
		c.Request.Context(),
		`UPDATE items
 SET name = COALESCE($3, name),
     unit = COALESCE($4, unit),
     min_quantity = COALESCE($5::numeric, min_quantity),
     category_id = CASE
         WHEN $6 THEN NULLIF($7, '')::uuid
         ELSE category_id
     END
 WHERE id = $1::uuid
   AND company_id = $2::uuid
 RETURNING id::text`,
		itemID,
		companyID,
		nameValue,
		unitValue,
		minQuantityValue,
		categoryChanged,
		categoryValue,
	).Scan(&updatedID)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Item not found",
			"data":    gin.H{},
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not update item",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Item updated",
		"data": gin.H{
			"id": updatedID,
		},
	})
}

func DeleteInventoryItem(c *gin.Context) {
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

	tx, err := database.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not start item archiving",
			"data":    gin.H{},
		})
		return
	}
	defer tx.Rollback()

	result, err := tx.ExecContext(
		c.Request.Context(),
		`UPDATE items
SET archived_at = now()
WHERE id = $1::uuid
  AND company_id = $2::uuid
  AND archived_at IS NULL`,
		itemID,
		companyID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not archive item",
			"data":    gin.H{},
		})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not confirm item archiving",
			"data":    gin.H{},
		})
		return
	}
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Active item not found",
			"data":    gin.H{},
		})
		return
	}

	_, err = tx.ExecContext(
		c.Request.Context(),
		`DELETE FROM shopping_list_items
WHERE company_id = $1::uuid
  AND item_id = $2::uuid`,
		companyID,
		itemID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not remove item from shopping list",
			"data":    gin.H{},
		})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not complete item archiving",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Item archived",
		"data":    gin.H{},
	})
}

type shoppingListEntryResponse struct {
	ID       string  `json:"id"`
	ItemID   string  `json:"itemId"`
	Name     string  `json:"name"`
	Quantity float64 `json:"quantity"`
	Unit     string  `json:"unit"`
	// Who put the item on the list, and when (shopping_list_items.created_by / created_at)
	AddedByID   string    `json:"addedById"`
	AddedByName string    `json:"addedByName"`
	AddedAt     time.Time `json:"addedAt"`
}

type shoppingListCategoryResponse struct {
	CategoryID   string                      `json:"categoryId,omitempty"`
	CategoryName string                      `json:"categoryName"`
	Items        []shoppingListEntryResponse `json:"items"`
}

func GetShoppingList(c *gin.Context) {
	companyID := c.Param("companyID")
	if !authorizeInventoryCompany(c, companyID) {
		return
	}

	rows, err := database.DB.QueryContext(
		c.Request.Context(),
		`SELECT
sli.id::text,
i.id::text,
i.name,
COALESCE(c.id::text, ''),
COALESCE(c.name, 'Uden kategori'),
sli.quantity::double precision,
i.unit,
sli.created_by::text,
COALESCE(u.name, ''),
sli.created_at
FROM shopping_list_items sli
JOIN items i
ON i.id = sli.item_id
   AND i.company_id = sli.company_id
LEFT JOIN categories c
ON c.id = i.category_id
   AND c.company_id = i.company_id
LEFT JOIN users u
ON u.id = sli.created_by
WHERE sli.company_id = $1::uuid
  AND i.archived_at IS NULL
ORDER BY c.name NULLS LAST, i.name`,
		companyID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not load shopping list",
			"data":    gin.H{},
		})
		return
	}
	defer rows.Close()

	categories := make([]shoppingListCategoryResponse, 0)
	categoryIndexes := make(map[string]int)

	for rows.Next() {
		var entry shoppingListEntryResponse
		var categoryID string
		var categoryName string

		if err := rows.Scan(
			&entry.ID,
			&entry.ItemID,
			&entry.Name,
			&categoryID,
			&categoryName,
			&entry.Quantity,
			&entry.Unit,
			&entry.AddedByID,
			&entry.AddedByName,
			&entry.AddedAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read shopping list",
				"data":    gin.H{},
			})
			return
		}

		groupKey := categoryID
		if groupKey == "" {
			groupKey = "__uncategorized__"
		}

		index, exists := categoryIndexes[groupKey]
		if !exists {
			index = len(categories)
			categoryIndexes[groupKey] = index
			categories = append(categories, shoppingListCategoryResponse{
				CategoryID:   categoryID,
				CategoryName: categoryName,
				Items:        make([]shoppingListEntryResponse, 0),
			})
		}

		categories[index].Items = append(categories[index].Items, entry)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not read shopping list",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Shopping list loaded",
		"data":    categories,
	})
}

type addShoppingListItemRequest struct {
	ItemID   string   `json:"itemId"`
	Quantity *float64 `json:"quantity"`
}

func AddShoppingListItem(c *gin.Context) {
	companyID := c.Param("companyID")
	if !authorizeInventoryCompany(c, companyID) {
		return
	}

	var request addShoppingListItemRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid shopping list data",
			"data":    gin.H{},
		})
		return
	}

	if !inventoryIDPattern.MatchString(request.ItemID) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid item ID",
			"data":    gin.H{},
		})
		return
	}

	quantity := 1.0
	if request.Quantity != nil {
		quantity = *request.Quantity
	}
	if quantity <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Quantity must be greater than zero",
			"data":    gin.H{},
		})
		return
	}

	var lineID string
	var updatedQuantity float64
	// xmax = 0 means the row was inserted; otherwise ON CONFLICT updated an existing line
	var isNewLine bool
	err := database.DB.QueryRowContext(
		c.Request.Context(),
		`INSERT INTO shopping_list_items (
company_id, item_id, quantity, created_by
)
SELECT $1::uuid, i.id, $3, $4::uuid
FROM items i
WHERE i.id = $2::uuid
  AND i.company_id = $1::uuid
  AND i.archived_at IS NULL
ON CONFLICT (company_id, item_id)
DO UPDATE SET
quantity = shopping_list_items.quantity + EXCLUDED.quantity,
updated_at = now()
RETURNING id::text, quantity::double precision, (xmax = 0)`,
		companyID,
		request.ItemID,
		quantity,
		c.GetString("userID"),
	).Scan(&lineID, &updatedQuantity, &isNewLine)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Item not found in this company",
			"data":    gin.H{},
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not add item to shopping list",
			"data":    gin.H{},
		})
		return
	}

	// Tell ejer and leder (in the background) — only for a new line, not when the amount grew
	if isNewLine {
		utils.NotifyShoppingListAdded(companyID, request.ItemID, c.GetString("userID"), quantity)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Shopping list item added",
		"data": gin.H{
			"id":       lineID,
			"quantity": updatedQuantity,
		},
	})
}

type updateShoppingListItemRequest struct {
	Quantity float64 `json:"quantity"`
}

func UpdateShoppingListItem(c *gin.Context) {
	companyID := c.Param("companyID")
	if !authorizeInventoryCompany(c, companyID) {
		return
	}

	lineID := c.Param("lineID")
	if !inventoryIDPattern.MatchString(lineID) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid shopping list item ID",
			"data":    gin.H{},
		})
		return
	}

	var request updateShoppingListItemRequest
	if err := c.ShouldBindJSON(&request); err != nil || request.Quantity <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Quantity must be greater than zero",
			"data":    gin.H{},
		})
		return
	}

	var updatedQuantity float64
	err := database.DB.QueryRowContext(
		c.Request.Context(),
		`UPDATE shopping_list_items
 SET quantity = $3,
     updated_at = now()
 WHERE id = $1::uuid
   AND company_id = $2::uuid
 RETURNING quantity::double precision`,
		lineID,
		companyID,
		request.Quantity,
	).Scan(&updatedQuantity)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Shopping list item not found",
			"data":    gin.H{},
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not update shopping list item",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Shopping list item updated",
		"data": gin.H{
			"quantity": updatedQuantity,
		},
	})
}

func DeleteShoppingListItem(c *gin.Context) {
	companyID := c.Param("companyID")
	if !authorizeInventoryCompany(c, companyID) {
		return
	}

	lineID := c.Param("lineID")
	if !inventoryIDPattern.MatchString(lineID) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid shopping list item ID",
			"data":    gin.H{},
		})
		return
	}

	result, err := database.DB.ExecContext(
		c.Request.Context(),
		`DELETE FROM shopping_list_items
 WHERE id = $1::uuid
   AND company_id = $2::uuid`,
		lineID,
		companyID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not delete shopping list item",
			"data":    gin.H{},
		})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not confirm shopping list item deletion",
			"data":    gin.H{},
		})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Shopping list item not found",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Shopping list item deleted",
		"data":    gin.H{},
	})
}

// AdjustInventoryStock registrerer en manuel lageroptælling.
type adjustInventoryStockRequest struct {
	Direction    string  `json:"direction"`
	Quantity     float64 `json:"quantity"`
	PurchaseDate string  `json:"purchaseDate"`
	ExpiryDate   string  `json:"expiryDate"`
	// Optional for "minus": take the stock from this batch only.
	// Without it, the batch that expires first is used (as before).
	BatchID string `json:"batchId"`
}

type inventoryBatchStock struct {
	ID                string
	RemainingQuantity float64
}

func AdjustInventoryStock(c *gin.Context) {
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

	var request adjustInventoryStockRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid stock adjustment data",
			"data":    gin.H{},
		})
		return
	}

	request.Direction = strings.ToLower(strings.TrimSpace(request.Direction))
	if request.Direction != "plus" && request.Direction != "minus" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Direction must be plus or minus",
			"data":    gin.H{},
		})
		return
	}

	if request.Quantity <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Quantity must be greater than zero",
			"data":    gin.H{},
		})
		return
	}

	request.BatchID = strings.TrimSpace(request.BatchID)
	if request.BatchID != "" && !inventoryIDPattern.MatchString(request.BatchID) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid batch ID",
			"data":    gin.H{},
		})
		return
	}

	var purchaseDate time.Time
	var expiryDate time.Time

	if request.Direction == "plus" {
		var purchaseErr error
		var expiryErr error

		purchaseDate, purchaseErr = time.Parse(time.DateOnly, request.PurchaseDate)
		expiryDate, expiryErr = time.Parse(time.DateOnly, request.ExpiryDate)

		if purchaseErr != nil || expiryErr != nil || expiryDate.Before(purchaseDate) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "A valid purchase date and expiry date are required for a positive adjustment",
				"data":    gin.H{},
			})
			return
		}
	}

	tx, err := database.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not adjust inventory",
			"data":    gin.H{},
		})
		return
	}
	defer tx.Rollback()

	var itemExists bool
	err = tx.QueryRowContext(
		c.Request.Context(),
		`SELECT EXISTS (
SELECT 1
FROM items
WHERE id = $1::uuid
  AND company_id = $2::uuid
)`,
		itemID,
		companyID,
	).Scan(&itemExists)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not verify item",
			"data":    gin.H{},
		})
		return
	}

	if !itemExists {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Item not found",
			"data":    gin.H{},
		})
		return
	}

	// Stock before this change; used after saving to see if it just became low or ran out
	var stockBefore float64

	if request.Direction == "plus" {
		var batchID string
		err = tx.QueryRowContext(
			c.Request.Context(),
			`INSERT INTO batches (
item_id, created_by, initial_quantity, remaining_quantity,
purchase_date, expiry_date
)
VALUES ($1::uuid, $2::uuid, $3, $3, $4::date, $5::date)
RETURNING id::text`,
			itemID,
			c.GetString("userID"),
			request.Quantity,
			request.PurchaseDate,
			request.ExpiryDate,
		).Scan(&batchID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not create adjustment batch",
				"data":    gin.H{},
			})
			return
		}

		_, err = tx.ExecContext(
			c.Request.Context(),
			`INSERT INTO stock_movements (batch_id, user_id, type, quantity, direction)
 VALUES ($1::uuid, $2::uuid, 'optælling', $3, 'plus')`,
			batchID,
			c.GetString("userID"),
			request.Quantity,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not record stock adjustment",
				"data":    gin.H{},
			})
			return
		}
	} else {
		rows, err := tx.QueryContext(
			c.Request.Context(),
			`SELECT id::text, remaining_quantity::double precision
 FROM batches
 WHERE item_id = $1::uuid
   AND remaining_quantity > 0
 ORDER BY expiry_date, purchase_date, created_at
 FOR UPDATE`,
			itemID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not load item batches",
				"data":    gin.H{},
			})
			return
		}

		batches := make([]inventoryBatchStock, 0)
		var availableQuantity float64

		for rows.Next() {
			var batch inventoryBatchStock
			if err := rows.Scan(&batch.ID, &batch.RemainingQuantity); err != nil {
				rows.Close()
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not read item batches",
					"data":    gin.H{},
				})
				return
			}

			batches = append(batches, batch)
			availableQuantity += batch.RemainingQuantity
		}

		if err := rows.Err(); err != nil {
			rows.Close()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read item batches",
				"data":    gin.H{},
			})
			return
		}
		rows.Close()

		// The whole item's stock, used for the low stock / sold out notifications
		stockBefore = availableQuantity

		// The user picked a batch: only take from that one
		if request.BatchID != "" {
			var chosen []inventoryBatchStock
			for _, batch := range batches {
				if batch.ID == request.BatchID {
					chosen = append(chosen, batch)
				}
			}
			if len(chosen) == 0 {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": "Batch not found or already used up",
					"data":    gin.H{},
				})
				return
			}
			batches = chosen
			availableQuantity = chosen[0].RemainingQuantity
		}

		if request.Quantity > availableQuantity {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Adjustment quantity exceeds available stock",
				"data": gin.H{
					"availableQuantity": availableQuantity,
				},
			})
			return
		}

		quantityToRemove := request.Quantity

		for _, batch := range batches {
			if quantityToRemove <= 0 {
				break
			}

			quantityFromBatch := batch.RemainingQuantity
			if quantityFromBatch > quantityToRemove {
				quantityFromBatch = quantityToRemove
			}

			_, err = tx.ExecContext(
				c.Request.Context(),
				`UPDATE batches
 SET remaining_quantity = remaining_quantity - $2
 WHERE id = $1::uuid`,
				batch.ID,
				quantityFromBatch,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not update batch quantity",
					"data":    gin.H{},
				})
				return
			}

			_, err = tx.ExecContext(
				c.Request.Context(),
				`INSERT INTO stock_movements (batch_id, user_id, type, quantity, direction)
 VALUES ($1::uuid, $2::uuid, 'optælling', $3, 'minus')`,
				batch.ID,
				c.GetString("userID"),
				quantityFromBatch,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Could not record stock adjustment",
					"data":    gin.H{},
				})
				return
			}

			quantityToRemove -= quantityFromBatch
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not save stock adjustment",
			"data":    gin.H{},
		})
		return
	}

	// Brug: tell ejer and leder (in the background) if the item just became low or ran out
	if request.Direction == "minus" {
		utils.NotifyStockAfterUse(companyID, itemID, c.GetString("userID"), stockBefore, stockBefore-request.Quantity)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Stock adjusted",
		"data": gin.H{
			"direction": request.Direction,
			"quantity":  request.Quantity,
		},
	})
}
