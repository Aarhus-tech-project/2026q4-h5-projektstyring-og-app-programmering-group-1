package routers

import (
	"net/http"
	"strings"

	"lagerklar/backend/database"

	"github.com/gin-gonic/gin"
)

type inventoryCategoryResponse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type createInventoryCategoryRequest struct {
	Name string `json:"name"`
}

func GetInventoryCategories(c *gin.Context) {
	companyID := c.Param("companyID")
	if !authorizeInventoryCompany(c, companyID) {
		return
	}

	rows, err := database.DB.QueryContext(
		c.Request.Context(),
		`SELECT id::text, name
         FROM categories
         WHERE company_id = $1::uuid
         ORDER BY name`,
		companyID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not load categories",
			"data":    gin.H{},
		})
		return
	}
	defer rows.Close()

	categories := make([]inventoryCategoryResponse, 0)
	for rows.Next() {
		var category inventoryCategoryResponse
		if err := rows.Scan(&category.ID, &category.Name); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not read categories",
				"data":    gin.H{},
			})
			return
		}
		categories = append(categories, category)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not read categories",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Categories loaded",
		"data":    categories,
	})
}

func CreateInventoryCategory(c *gin.Context) {
	companyID := c.Param("companyID")
	if !authorizeInventoryCompany(c, companyID) {
		return
	}

	var request createInventoryCategoryRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid category data",
			"data":    gin.H{},
		})
		return
	}

	request.Name = strings.TrimSpace(request.Name)
	if request.Name == "" || len([]rune(request.Name)) > 80 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Category name must contain between 1 and 80 characters",
			"data":    gin.H{},
		})
		return
	}

	var category inventoryCategoryResponse
	err := database.DB.QueryRowContext(
		c.Request.Context(),
		`INSERT INTO categories (company_id, name)
         VALUES ($1::uuid, $2)
         ON CONFLICT (company_id, name)
         DO UPDATE SET name = EXCLUDED.name
         RETURNING id::text, name`,
		companyID,
		request.Name,
	).Scan(&category.ID, &category.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not create category",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Category created",
		"data":    category,
	})
}
