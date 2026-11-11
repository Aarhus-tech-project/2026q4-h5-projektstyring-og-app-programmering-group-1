package routers

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"lagerklar/backend/database"
	"lagerklar/backend/passwordreset"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgconn"
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
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CVR       string    `json:"cvr"`
	Address   string    `json:"address"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
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
	var avatarURL sql.NullString

	// avatar_url holds the image bytes (BYTEA), so we don't send them in the login response.
	// Instead we return the path to GET /v1/user/:userID/avatar, or NULL if there is no picture.
	err := database.DB.QueryRowContext(
		c.Request.Context(),
		`SELECT id::text, name, password, is_active,
		        CASE WHEN avatar_url IS NOT NULL
		             THEN '/user/' || id::text || '/avatar'
		        END
		 FROM users
		 WHERE email = $1`,
		email,
	).Scan(&userID, &name, &storedPassword, &isActive, &avatarURL)

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
		`SELECT c.id::text, c.name, COALESCE(c.cvr, ''), COALESCE(c.address, ''), cm.role, c.created_at
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
			&company.CreatedAt,
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
				// null when the user has no profile picture
				"avatar_url": nullStringOrNil(avatarURL),
			},
			"companies": companies,
		},
	})
}

type UpdateProfileRequest struct {
	Name        string  `json:"name" binding:"required,min=2"`
	Email       string  `json:"email" binding:"required,email"`
	PhoneNumber *string `json:"phone_number"`
}

// PUT /v1/user/:userID
// Updates the logged-in user's name, email and phone number.
func HandleUpdateProfile(c *gin.Context) {
	userID := c.GetString("userID")
	if c.Param("userID") != userID {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "You can only update your own profile",
			"data":    gin.H{},
		})
		return
	}

	var request UpdateProfileRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid profile data",
			"data":    gin.H{},
		})
		return
	}

	name := strings.TrimSpace(request.Name)
	email := strings.ToLower(strings.TrimSpace(request.Email))

	// An empty phone number is saved as NULL
	var phoneNumber *string
	if request.PhoneNumber != nil {
		if trimmed := strings.TrimSpace(*request.PhoneNumber); trimmed != "" {
			phoneNumber = &trimmed
		}
	}

	var savedPhone sql.NullString
	var avatarURL sql.NullString

	err := database.DB.QueryRowContext(
		c.Request.Context(),
		`UPDATE users
		 SET name = $1, email = $2, phone_number = $3
		 WHERE id = $4::uuid
		 RETURNING phone_number,
		           CASE WHEN avatar_url IS NOT NULL
		                THEN '/user/' || id::text || '/avatar'
		           END`,
		name,
		email,
		phoneNumber,
		userID,
	).Scan(&savedPhone, &avatarURL)

	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "User not found",
			"data":    gin.H{},
		})
		return
	}
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

		log.Println("Update profile error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not update profile",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Profile updated",
		"data": gin.H{
			"user": gin.H{
				"id":           userID,
				"name":         name,
				"email":        email,
				"phone_number": nullStringOrNil(savedPhone),
				"avatar_url":   nullStringOrNil(avatarURL),
			},
		},
	})
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
}

// PUT /v1/user/:userID/password
// Changes the logged-in user's password after checking the current one.
// A wrong current password returns 422 (not 401, so the app doesn't log the user out).
func HandleChangePassword(c *gin.Context) {
	userID := c.GetString("userID")
	if c.Param("userID") != userID {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "You can only change your own password",
			"data":    gin.H{},
		})
		return
	}

	var request ChangePasswordRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid password data",
			"data":    gin.H{},
		})
		return
	}

	if request.NewPassword != request.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Passwords do not match",
			"data":    gin.H{},
		})
		return
	}

	if err := passwordreset.ValidatePassword(request.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
			"data":    gin.H{},
		})
		return
	}

	ctx := c.Request.Context()

	var storedPassword string
	err := database.DB.QueryRowContext(
		ctx,
		`SELECT password FROM users WHERE id = $1::uuid AND is_active`,
		userID,
	).Scan(&storedPassword)
	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "User not found",
			"data":    gin.H{},
		})
		return
	}
	if err != nil {
		log.Println("Change password lookup error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not change password",
			"data":    gin.H{},
		})
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(storedPassword), []byte(request.CurrentPassword)) != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"success": false,
			"message": "Current password is incorrect",
			"data":    gin.H{},
		})
		return
	}

	if request.NewPassword == request.CurrentPassword {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "New password must be different from the current password",
			"data":    gin.H{},
		})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(request.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Println("Change password hash error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not change password",
			"data":    gin.H{},
		})
		return
	}

	if _, err := database.DB.ExecContext(
		ctx,
		`UPDATE users SET password = $1 WHERE id = $2::uuid`,
		string(hash),
		userID,
	); err != nil {
		log.Println("Change password update error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not change password",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Password changed",
		"data":    gin.H{},
	})
}

type deleteAccountMembership struct {
	companyID    string
	role         string
	otherMembers int
	otherLeaders int
}

// DELETE /v1/user/:userID
// Deletes the logged-in user's account.
//   - Blocks (409) if the user is the only leder of a company that still has other members.
//   - Deletes companies where the user is the only member.
//   - Deletes the user. If stock history (batches / stock movements) still points to the user,
//     the account is anonymized and deactivated instead, so the history stays valid.
func HandleDeleteAccount(c *gin.Context) {
	userID := c.GetString("userID")
	if c.Param("userID") != userID {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "You can only delete your own account",
			"data":    gin.H{},
		})
		return
	}

	ctx := c.Request.Context()
	writeDeleteError := func(logMessage string, err error) {
		log.Println(logMessage, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not delete account",
			"data":    gin.H{},
		})
	}

	tx, err := database.DB.BeginTx(ctx, nil)
	if err != nil {
		writeDeleteError("Delete account begin error:", err)
		return
	}
	defer tx.Rollback()

	rows, err := tx.QueryContext(
		ctx,
		`SELECT cm.company_id::text,
		        cm.role,
		        (SELECT count(*) FROM company_memberships o
		         WHERE o.company_id = cm.company_id AND o.user_id <> cm.user_id),
		        (SELECT count(*) FROM company_memberships o
		         WHERE o.company_id = cm.company_id AND o.user_id <> cm.user_id AND o.role = 'leder')
		 FROM company_memberships cm
		 WHERE cm.user_id = $1::uuid`,
		userID,
	)
	if err != nil {
		writeDeleteError("Delete account membership lookup error:", err)
		return
	}

	memberships := make([]deleteAccountMembership, 0)
	for rows.Next() {
		var m deleteAccountMembership
		if err := rows.Scan(&m.companyID, &m.role, &m.otherMembers, &m.otherLeaders); err != nil {
			rows.Close()
			writeDeleteError("Delete account membership scan error:", err)
			return
		}
		memberships = append(memberships, m)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		writeDeleteError("Delete account membership rows error:", err)
		return
	}

	for _, m := range memberships {
		if m.role == "leder" && m.otherMembers > 0 && m.otherLeaders == 0 {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "You are the only leder of a company with other members",
				"data":    gin.H{},
			})
			return
		}
	}

	// Companies where the user is the only member are deleted with the account.
	// If a company can't be deleted (e.g. stock history), it is kept and the user just leaves it.
	for _, m := range memberships {
		if m.otherMembers > 0 {
			continue
		}

		if _, err := tx.ExecContext(ctx, `SAVEPOINT delete_company`); err != nil {
			writeDeleteError("Delete account savepoint error:", err)
			return
		}
		if _, err := tx.ExecContext(ctx, `DELETE FROM companies WHERE id = $1::uuid`, m.companyID); err != nil {
			log.Println("Delete account: keeping company", m.companyID, "because:", err)
			if _, err := tx.ExecContext(ctx, `ROLLBACK TO SAVEPOINT delete_company`); err != nil {
				writeDeleteError("Delete account rollback savepoint error:", err)
				return
			}
		}
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM company_memberships WHERE user_id = $1::uuid`, userID); err != nil {
		writeDeleteError("Delete account memberships error:", err)
		return
	}

	if _, err := tx.ExecContext(
		ctx,
		`DELETE FROM company_invitations WHERE invited_by = $1::uuid AND status = 'pending'`,
		userID,
	); err != nil {
		writeDeleteError("Delete account invitations error:", err)
		return
	}

	if _, err := tx.ExecContext(ctx, `SAVEPOINT delete_user`); err != nil {
		writeDeleteError("Delete account savepoint error:", err)
		return
	}

	_, err = tx.ExecContext(ctx, `DELETE FROM users WHERE id = $1::uuid`, userID)

	var pgErr *pgconn.PgError
	if err != nil && errors.As(err, &pgErr) && pgErr.Code == "23503" {
		// Other rows (stock history) still point to the user, so anonymize instead of deleting
		if _, err := tx.ExecContext(ctx, `ROLLBACK TO SAVEPOINT delete_user`); err != nil {
			writeDeleteError("Delete account rollback savepoint error:", err)
			return
		}

		_, err = tx.ExecContext(
			ctx,
			`UPDATE users
			 SET name = 'Slettet bruger',
			     email = 'deleted-' || id::text || '@deleted.invalid',
			     password = '!',
			     phone_number = NULL,
			     avatar_url = NULL,
			     is_active = FALSE
			 WHERE id = $1::uuid`,
			userID,
		)
		if err != nil {
			writeDeleteError("Delete account anonymize error:", err)
			return
		}
	} else if err != nil {
		writeDeleteError("Delete account user error:", err)
		return
	}

	if err := tx.Commit(); err != nil {
		writeDeleteError("Delete account commit error:", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Account deleted",
		"data":    gin.H{},
	})
}

func nullStringOrNil(s sql.NullString) any {
	if !s.Valid {
		return nil
	}
	return s.String
}

func writeInvalidLogin(c *gin.Context) {
	c.JSON(http.StatusUnauthorized, gin.H{
		"success": false,
		"message": "Invalid email or password",
		"data":    gin.H{},
	})
}
