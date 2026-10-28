package routers

import (
	"errors"
	"net/http"
	"strings"

	"lagerklar/backend/database"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var request RegisterRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid registration data",
			"data":    gin.H{},
		})
		return
	}

	name := strings.TrimSpace(request.Name)
	email := strings.ToLower(strings.TrimSpace(request.Email))

	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Name is required",
			"data":    gin.H{},
		})
		return
	}

	if len(request.Password) > 72 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Password is too long",
			"data":    gin.H{},
		})
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword(
		[]byte(request.Password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not process password",
			"data":    gin.H{},
		})
		return
	}

	tx, err := database.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not create account",
			"data":    gin.H{},
		})
		return
	}
	defer tx.Rollback()

	var userID string
	err = tx.QueryRowContext(
		c.Request.Context(),
		`INSERT INTO users (name, email, password)
		 VALUES ($1, $2, $3)
		 RETURNING id::text`,
		name,
		email,
		string(passwordHash),
	).Scan(&userID)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "An account with this email already exists",
				"data":    gin.H{},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not create account",
			"data":    gin.H{},
		})
		return
	}

	_, err = tx.ExecContext(
		c.Request.Context(),
		`INSERT INTO company_memberships (company_id, user_id, role)
		 SELECT company_id, $1, role
		 FROM company_invitations
		 WHERE lower(email) = $2
		   AND status = 'pending'
		   AND (expires_at IS NULL OR expires_at > now())
		 ON CONFLICT (company_id, user_id) DO NOTHING`,
		userID,
		email,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not link account to invited companies",
			"data":    gin.H{},
		})
		return
	}

	_, err = tx.ExecContext(
		c.Request.Context(),
		`UPDATE company_invitations
		 SET status = 'accepted', accepted_at = now()
		 WHERE lower(email) = $1
		   AND status = 'pending'
		   AND (expires_at IS NULL OR expires_at > now())`,
		email,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not complete account registration",
			"data":    gin.H{},
		})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not complete account registration",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Registration completed. Please log in.",
		"data":    gin.H{},
	})
}
