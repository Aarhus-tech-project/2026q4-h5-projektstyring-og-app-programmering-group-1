package routers

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"lagerklar/backend/database"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
)

// CreateCompanyData matches the company object returned by the CVR lookup.
type CreateCompanyData struct {
	CVR     string `json:"cvr" binding:"required"`
	Name    string `json:"name" binding:"required"`
	Address string `json:"address" binding:"required"`
	Zipcode string `json:"zipcode"`
	City    string `json:"city"`
}

type GenCompanyReq struct {
	Company CreateCompanyData `json:"company" binding:"required"`
}

// POST /v1/company
// Creates the company and makes the authenticated user its leder.
func HandleCreateCompany(c *gin.Context) {
	var req GenCompanyReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
			"data":    gin.H{},
		})
		return
	}

	// The owner is always the logged-in user, never a user ID from the body
	userID := c.GetString("userID")

	cvr := strings.ReplaceAll(strings.TrimSpace(req.Company.CVR), " ", "")
	if !cvrPattern.MatchString(cvr) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "CVR must be 8 digits",
			"data":    gin.H{},
		})
		return
	}

	name := strings.TrimSpace(req.Company.Name)
	address := strings.TrimSpace(req.Company.Address)
	postal := strings.TrimSpace(req.Company.Zipcode + " " + req.Company.City)
	if postal != "" {
		address += ", " + postal
	}
	if name == "" || address == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Company name and address are required",
			"data":    gin.H{},
		})
		return
	}

	tx, err := database.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		writeCreateCompanyFailed(c)
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
		log.Println("Create company database error:", err)
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "A company with this CVR already exists",
				"data":    gin.H{},
			})
			return
		}
		writeCreateCompanyFailed(c)
		return
	}

	fmt.Println("Created company with ID:", companyID)

	_, err = tx.ExecContext(
		c.Request.Context(),
		`INSERT INTO company_memberships (company_id, user_id, role)
		 VALUES ($1::uuid, $2::uuid, 'leder')`,
		companyID,
		userID,
	)
	if err != nil {
		log.Println("Create company membership database error:", err)
		writeCreateCompanyFailed(c)
		return
	}

	fmt.Println("Created company membership for user:", userID, "as leder")

	// Return every company the user belongs to, including the new one
	rows, err := tx.QueryContext(
		c.Request.Context(),
		`SELECT c.id::text, c.name, COALESCE(c.cvr, ''), COALESCE(c.address, ''), cm.role
		 FROM company_memberships cm
		 JOIN companies c ON c.id = cm.company_id
		 WHERE cm.user_id = $1::uuid
		 ORDER BY c.name`,
		userID,
	)
	if err != nil {
		log.Println("Load company memberships database error:", err)
		writeCreateCompanyFailed(c)
		return
	}
	defer rows.Close()

	companies := make([]CompanyAccess, 0)
	for rows.Next() {
		var company CompanyAccess
		if err := rows.Scan(
			&company.ID,
			&company.Name,
			&company.CVR,
			&company.Address,
			&company.Role,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Could not load company memberships",
				"data":    gin.H{},
			})
			return
		}
		companies = append(companies, company)
	}
	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not load company memberships",
			"data":    gin.H{},
		})
		return
	}

	if err := tx.Commit(); err != nil {
		writeCreateCompanyFailed(c)
		return
	}

	fmt.Printf("Number of companies: %d\n", len(companies))

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Company created successfully",
		"data":    companies,
	})
}

func writeCreateCompanyFailed(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, gin.H{
		"success": false,
		"message": "Could not create company",
		"data":    gin.H{},
	})
}

func HandleDeleteCompany(c *gin.Context) {
	companyID := c.Param("companyID")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Company ID is required",
			"data":    gin.H{},
		})
		return
	}

	userID := c.GetString("userID")

	tx, err := database.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		writeDeleteCompanyFailed(c)
		return
	}
	defer tx.Rollback()

	// Only a leder of the company may delete it
	var role string
	err = tx.QueryRowContext(
		c.Request.Context(),
		`SELECT role
		 FROM company_memberships
		 WHERE company_id::text = $1 AND user_id = $2::uuid`,
		companyID,
		userID,
	).Scan(&role)
	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Company not found",
			"data":    gin.H{},
		})
		return
	}
	if err != nil {
		log.Println("Delete company role lookup database error:", err)
		writeDeleteCompanyFailed(c)
		return
	}
	if role != "leder" {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "Only a leder can delete the company",
			"data":    gin.H{},
		})
		return
	}

	_, err = tx.ExecContext(
		c.Request.Context(),
		`DELETE FROM company_memberships WHERE company_id = $1::uuid`,
		companyID,
	)
	if err != nil {
		log.Println("Delete company memberships database error:", err)
		writeDeleteCompanyFailed(c)
		return
	}

	_, err = tx.ExecContext(
		c.Request.Context(),
		`DELETE FROM companies WHERE id = $1::uuid`,
		companyID,
	)
	if err != nil {
		log.Println("Delete company database error:", err)
		writeDeleteCompanyFailed(c)
		return
	}

	fmt.Println("Deleted company with ID:", companyID)

	// Return the companies the user still belongs to
	rows, err := tx.QueryContext(
		c.Request.Context(),
		`SELECT c.id::text, c.name, COALESCE(c.cvr, ''), COALESCE(c.address, ''), cm.role, c.created_at
		 FROM company_memberships cm
		 JOIN companies c ON c.id = cm.company_id
		 WHERE cm.user_id = $1::uuid
		 ORDER BY c.name`,
		userID,
	)
	if err != nil {
		log.Println("Load company memberships database error:", err)
		writeDeleteCompanyFailed(c)
		return
	}
	defer rows.Close()

	companies := make([]CompanyAccess, 0)
	for rows.Next() {
		var company CompanyAccess
		if err := rows.Scan(
			&company.ID,
			&company.Name,
			&company.CVR,
			&company.Address,
			&company.Role,
			&company.CreatedAt,
		); err != nil {
			writeDeleteCompanyFailed(c)
			return
		}
		companies = append(companies, company)
	}
	if err := rows.Err(); err != nil {
		writeDeleteCompanyFailed(c)
		return
	}

	if err := tx.Commit(); err != nil {
		writeDeleteCompanyFailed(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Company deleted successfully",
		"data":    companies,
	})
}

func writeDeleteCompanyFailed(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, gin.H{
		"success": false,
		"message": "Could not delete company",
		"data":    gin.H{},
	})
}
