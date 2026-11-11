package routers

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"lagerklar/backend/database"
	"lagerklar/backend/email"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
)

// WelcomeMailer sends an email. *email.Service implements it.
type WelcomeMailer interface {
	Send(ctx context.Context, msg email.Message) error
}

var welcomeMailer WelcomeMailer

// SetWelcomeMailer sets the mailer used for welcome emails after registration.
// If it is never set (or set to nil), registration works but no email is sent.
func SetWelcomeMailer(m WelcomeMailer) {
	welcomeMailer = m
}

// sendWelcomeEmail runs in the background so a slow or failing SMTP server
// never delays or breaks a registration that has already succeeded.
func sendWelcomeEmail(recipientEmail, name string) {
	mailer := welcomeMailer
	if mailer == nil {
		fmt.Println("No welcome mailer configured; skipping welcome email")
		return
	}
	go func() {
		msg, err := email.BuildWelcomeEmail(email.WelcomeEmail{
			RecipientEmail: recipientEmail,
			RecipientName:  name,
		})
		if err != nil {
			log.Println("Welcome email build error:", err)
			return
		}
		if err := mailer.Send(context.Background(), msg); err != nil {
			log.Println("Welcome email send error:", err)
		}
	}()
}

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
		log.Println("Create user database error:", err)
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

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not complete account registration",
			"data":    gin.H{},
		})
		return
	}

	sendWelcomeEmail(email, name)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Registration completed. Please log in.",
		"data":    gin.H{},
	})
}
