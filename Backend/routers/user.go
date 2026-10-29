package routers

import (
	"database/sql"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"lagerklar/backend/database"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type CompanyAccess struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	CVR     string `json:"cvr"`
	Address string `json:"address"`
	Role    string `json:"role"`
}

func Login(c *gin.Context) {
	var request LoginRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid login data",
			"data":    gin.H{},
		})
		return
	}

	email := strings.ToLower(strings.TrimSpace(request.Email))

	var userID string
	var name string
	var storedPassword string
	var isActive bool

	err := database.DB.QueryRowContext(
		c.Request.Context(),
		`SELECT id::text, name, password, is_active
		 FROM users
		 WHERE email = $1`,
		email,
	).Scan(&userID, &name, &storedPassword, &isActive)

	if errors.Is(err, sql.ErrNoRows) {
		writeInvalidLogin(c)
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not check login",
			"data":    gin.H{},
		})
		return
	}

	if !isActive || bcrypt.CompareHashAndPassword(
		[]byte(storedPassword),
		[]byte(request.Password),
	) != nil {
		writeInvalidLogin(c)
		return
	}

	rows, err := database.DB.QueryContext(
		c.Request.Context(),
		`SELECT c.id::text, c.name, COALESCE(c.cvr, ''), COALESCE(c.address, ''), cm.role
		 FROM company_memberships cm
		 JOIN companies c ON c.id = cm.company_id
		 WHERE cm.user_id = $1::uuid
		 ORDER BY c.name`,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not load company memberships",
			"data":    gin.H{},
		})
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

	secret := os.Getenv("JWT_SECRET")
	if len(secret) < 32 {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Authentication is not configured",
			"data":    gin.H{},
		})
		return
	}

	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   userID,
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(15 * time.Minute)),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not create login token",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Login successful",
		"data": gin.H{
			"token": tokenString,
			"user": gin.H{
				"id":    userID,
				"name":  name,
				"email": email,
			},
			"companies": companies,
		},
	})
}

func writeInvalidLogin(c *gin.Context) {
	c.JSON(http.StatusUnauthorized, gin.H{
		"success": false,
		"message": "Invalid email or password",
		"data":    gin.H{},
	})
}
