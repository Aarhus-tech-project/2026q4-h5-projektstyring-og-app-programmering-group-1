package middleware

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"
	"slices"

	"lagerklar/backend/database"

	"github.com/gin-gonic/gin"
)

func GetCompanyRole(ctx context.Context, companyID string, userID string) (string, error) {
	var role string
	err := database.DB.QueryRowContext(
		ctx,
		`SELECT cm.role
		FROM company_memberships cm
		JOIN users u ON u.id = cm.user_id
		WHERE cm.company_id::text = $1
			AND cm.user_id = $2::uuid
			AND u.is_active`,
		companyID,
		userID,
	).Scan(&role)
	return role, err
}

func RequireCompanyRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, err := GetCompanyRole(c.Request.Context(), c.Param("companyID"), c.GetString("userID"))

		if errors.Is(err, sql.ErrNoRows) {
			writeCompanyAccessError(c, http.StatusNotFound, "Company not found")
			return
		}
		if err != nil {
			log.Println("Company role lookup database error: ", err)
			writeCompanyAccessError(c, http.StatusInternalServerError, "Could not check company access")
			return
		}
		if !slices.Contains(allowedRoles, role) {
			writeCompanyAccessError(c, http.StatusForbidden, "You do not have permission to do this")
			return
		}

		c.Set("companyRole", role)
		c.Next()
	}
}

func writeCompanyAccessError(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{
		"success": false,
		"message": message,
		"data":    gin.H{},
	})
	c.Abort()
}
