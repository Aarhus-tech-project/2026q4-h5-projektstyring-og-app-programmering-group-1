package middleware

import (
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func RequireAuth() gin.HandlerFunc {
	secret := []byte(os.Getenv("JWT_SECRET"))

	return func(c *gin.Context) {
		if len(secret) < 32 {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Authentication is not configured",
				"data":    gin.H{},
			})
			c.Abort()
			return
		}

		parts := strings.SplitN(c.GetHeader("Authorization"), " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || strings.TrimSpace(parts[1]) == "" {
			writeUnauthorized(c)
			return
		}

		claims := &jwt.RegisteredClaims{}
		token, err := jwt.ParseWithClaims(
			strings.TrimSpace(parts[1]),
			claims,
			func(token *jwt.Token) (any, error) {
				if token.Method != jwt.SigningMethodHS256 {
					return nil, errors.New("unexpected signing method")
				}
				return secret, nil
			},
			jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		)

		if err != nil || !token.Valid || claims.Subject == "" {
			writeUnauthorized(c)
			return
		}

		c.Set("userID", claims.Subject)
		c.Next()
	}
}

func writeUnauthorized(c *gin.Context) {
	c.JSON(http.StatusUnauthorized, gin.H{
		"success": false,
		"message": "Authentication required",
		"data":    gin.H{},
	})
	c.Abort()
}
