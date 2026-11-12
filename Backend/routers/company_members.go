package routers

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"time"

	"lagerklar/backend/database"
	"lagerklar/backend/model"

	"github.com/gin-gonic/gin"
)

// Only an ejer or leder may view a company's details and members; a medarbejder only works with the inventory.
func canManageCompany(role string) bool {
	return role == model.RoleEjer || role == model.RoleLeder
}

type ManagedCompany struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	CVR         string    `json:"cvr"`
	Address     string    `json:"address"`
	Role        string    `json:"role"`
	MemberCount int       `json:"member_count"`
	CreatedAt   time.Time `json:"created_at"`
}

type CompanyMember struct {
	UserID   string    `json:"user_id"`
	Name     string    `json:"name"`
	Email    string    `json:"email"`
	Role     string    `json:"role"`
	IsActive bool      `json:"is_active"`
	JoinedAt time.Time `json:"joined_at"`
}

// GET /v1/companies
// Lists the companies where the logged-in user is ejer or leder.
// Companies where the user is only medarbejder are left out.
func HandleGetManagedCompanies(c *gin.Context) {
	userID := c.GetString("userID")

	rows, err := database.DB.QueryContext(
		c.Request.Context(),
		`SELECT c.id::text, c.name, COALESCE(c.cvr, ''), COALESCE(c.address, ''), cm.role, c.created_at,
		        (SELECT count(*) FROM company_memberships m WHERE m.company_id = c.id)
		 FROM company_memberships cm
		 JOIN companies c ON c.id = cm.company_id
		 WHERE cm.user_id = $1::uuid
		   AND cm.role IN ($2, $3)
		 ORDER BY c.name`,
		userID,
		model.RoleEjer,
		model.RoleLeder,
	)
	if err != nil {
		log.Println("Get managed companies database error:", err)
		writeCompanyLoadFailed(c)
		return
	}
	defer rows.Close()

	companies := make([]ManagedCompany, 0)
	for rows.Next() {
		var company ManagedCompany
		if err := rows.Scan(
			&company.ID,
			&company.Name,
			&company.CVR,
			&company.Address,
			&company.Role,
			&company.CreatedAt,
			&company.MemberCount,
		); err != nil {
			log.Println("Get managed companies scan error:", err)
			writeCompanyLoadFailed(c)
			return
		}
		companies = append(companies, company)
	}
	if err := rows.Err(); err != nil {
		log.Println("Get managed companies rows error:", err)
		writeCompanyLoadFailed(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Companies loaded",
		"data":    companies,
	})
}

// GET /v1/companies/:companyID
// Returns the company's details and all its members.
// 404 if the user isn't a member (so company IDs can't be probed), 403 if the user isn't ejer or leder.
func HandleGetCompanyDetails(c *gin.Context) {
	userID := c.GetString("userID")
	companyID := c.Param("companyID")

	if !inventoryIDPattern.MatchString(companyID) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid company ID",
			"data":    gin.H{},
		})
		return
	}

	ctx := c.Request.Context()

	var company ManagedCompany
	err := database.DB.QueryRowContext(
		ctx,
		`SELECT c.id::text, c.name, COALESCE(c.cvr, ''), COALESCE(c.address, ''), cm.role, c.created_at
		 FROM company_memberships cm
		 JOIN companies c ON c.id = cm.company_id
		 WHERE cm.company_id = $1::uuid AND cm.user_id = $2::uuid`,
		companyID,
		userID,
	).Scan(&company.ID, &company.Name, &company.CVR, &company.Address, &company.Role, &company.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		writeCompanyNotFound(c)
		return
	}
	if err != nil {
		log.Println("Get company details database error:", err)
		writeCompanyLoadFailed(c)
		return
	}

	if !canManageCompany(company.Role) {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "Only an ejer or leder can view company details",
			"data":    gin.H{},
		})
		return
	}

	// Leaders first, then employees; alphabetically within each role
	rows, err := database.DB.QueryContext(
		ctx,
		`SELECT u.id::text, u.name, u.email, cm.role, u.is_active, cm.created_at
		 FROM company_memberships cm
		 JOIN users u ON u.id = cm.user_id
		 WHERE cm.company_id = $1::uuid
		 ORDER BY CASE cm.role WHEN 'ejer' THEN 0 WHEN 'leder' THEN 1 ELSE 2 END,
		          lower(u.name)`,
		companyID,
	)
	if err != nil {
		log.Println("Get company members database error:", err)
		writeCompanyLoadFailed(c)
		return
	}
	defer rows.Close()

	members := make([]CompanyMember, 0)
	for rows.Next() {
		var member CompanyMember
		if err := rows.Scan(
			&member.UserID,
			&member.Name,
			&member.Email,
			&member.Role,
			&member.IsActive,
			&member.JoinedAt,
		); err != nil {
			log.Println("Get company members scan error:", err)
			writeCompanyLoadFailed(c)
			return
		}
		members = append(members, member)
	}
	if err := rows.Err(); err != nil {
		log.Println("Get company members rows error:", err)
		writeCompanyLoadFailed(c)
		return
	}

	company.MemberCount = len(members)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Company loaded",
		"data": gin.H{
			"company": company,
			"members": members,
		},
	})
}

func writeCompanyNotFound(c *gin.Context) {
	c.JSON(http.StatusNotFound, gin.H{
		"success": false,
		"message": "Company not found",
		"data":    gin.H{},
	})
}

func writeCompanyLoadFailed(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, gin.H{
		"success": false,
		"message": "Could not load company",
		"data":    gin.H{},
	})
}
