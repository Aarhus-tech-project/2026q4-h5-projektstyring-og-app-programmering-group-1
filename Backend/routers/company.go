package routers

import (
	"errors"
	"net/http"
	"strings"

	"lagerklar/backend/database"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
)

type CreateCompanyRequest struct {
	Name    string `json:"name" binding:"required"`
	CVR     string `json:"cvr" binding:"required"`
	Address string `json:"address" binding:"required"`
}

func CreateCompany(c *gin.Context) {
	var request CreateCompanyRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid company data",
			"data":    gin.H{},
		})
		return
	}

	name := strings.TrimSpace(request.Name)
	cvr := strings.TrimSpace(request.CVR)
	address := strings.TrimSpace(request.Address)

	if name == "" || address == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Company name and address are required",
			"data":    gin.H{},
		})
		return
	}

	if len(cvr) != 8 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "CVR must contain exactly 8 digits",
			"data":    gin.H{},
		})
		return
	}
	for _, digit := range cvr {
		if digit < '0' || digit > '9' {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "CVR must contain exactly 8 digits",
				"data":    gin.H{},
			})
			return
		}
	}

	userValue, exists := c.Get("userID")
	userID, valid := userValue.(string)
	if !exists || !valid || userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Authentication required",
			"data":    gin.H{},
		})
		return
	}

	tx, err := database.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not create company",
			"data":    gin.H{},
		})
		return
	}
	defer tx.Rollback()

	var companyID string
	err = tx.QueryRowContext(
		c.Request.Context(),
		`INSERT INTO companies (name, cvr, address)
		 VALUES ($1, $2, $3)
		 RETURNING id::text`,
		name,
		cvr,
		address,
	).Scan(&companyID)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "A company with this CVR already exists",
				"data":    gin.H{},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not create company",
			"data":    gin.H{},
		})
		return
	}

	_, err = tx.ExecContext(
		c.Request.Context(),
		`INSERT INTO company_memberships (company_id, user_id, role)
		 VALUES ($1::uuid, $2::uuid, 'leder')`,
		companyID,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not add company owner",
			"data":    gin.H{},
		})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not complete company creation",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Company created successfully",
		"data": gin.H{
			"id":      companyID,
			"name":    name,
			"cvr":     cvr,
			"address": address,
			"role":    "leder",
		},
	})
}
