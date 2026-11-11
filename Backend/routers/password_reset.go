package routers

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"lagerklar/backend/passwordreset"
)

// PasswordResetHandler serves the "forgot password" endpoints.
// Responses carry a machine-readable data.error so the app can show its own messages.
// None of these handlers ever log the email, code, token or password.
type PasswordResetHandler struct {
	svc *passwordreset.Service
}

func NewPasswordResetHandler(svc *passwordreset.Service) *PasswordResetHandler {
	return &PasswordResetHandler{svc: svc}
}

type passwordResetRequestBody struct {
	Email string `json:"email" binding:"required,email,max=254"`
}

type passwordResetVerifyBody struct {
	Email string `json:"email" binding:"required,email,max=254"`
	Code  string `json:"code" binding:"required,max=32"`
}

type passwordResetBody struct {
	ResetToken      string `json:"reset_token" binding:"required,max=128"`
	Password        string `json:"password" binding:"required"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
}

// POST /v1/password-reset/request
// Sends a code if the email belongs to an account; answers 404 email_not_found otherwise.
func (h *PasswordResetHandler) RequestCode(c *gin.Context) {
	var body passwordResetRequestBody
	if err := c.ShouldBindJSON(&body); err != nil {
		writeResetError(c, http.StatusBadRequest, "invalid_email", "A valid email is required")
		return
	}

	if err := h.svc.RequestCode(body.Email, c.ClientIP()); err != nil {
		h.writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "A verification code has been sent.",
		"data": gin.H{
			"expires_in_seconds":   int(passwordreset.CodeTTL.Seconds()),
			"resend_after_seconds": int(passwordreset.ResendCooldown.Seconds()),
		},
	})
}

// POST /v1/password-reset/verify
// Exchanges a correct code for a short-lived, single-use reset token.
func (h *PasswordResetHandler) VerifyCode(c *gin.Context) {
	var body passwordResetVerifyBody
	if err := c.ShouldBindJSON(&body); err != nil {
		writeResetError(c, http.StatusBadRequest, "invalid_code", "Email and a 6-digit code are required")
		return
	}

	token, err := h.svc.VerifyCode(c.Request.Context(), body.Email, body.Code, c.ClientIP())
	if err != nil {
		h.writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Code verified",
		"data": gin.H{
			"reset_token":        token,
			"expires_in_seconds": int(passwordreset.TokenTTL.Seconds()),
		},
	})
}

// POST /v1/password-reset/reset
// Sets the new password. Requires the reset token from /verify; an email alone is never enough.
func (h *PasswordResetHandler) ResetPassword(c *gin.Context) {
	var body passwordResetBody
	if err := c.ShouldBindJSON(&body); err != nil {
		writeResetError(c, http.StatusBadRequest, "invalid_request", "Reset token, password and confirmation are required")
		return
	}

	err := h.svc.ResetPassword(c.Request.Context(), body.ResetToken, body.Password, body.ConfirmPassword, c.ClientIP())
	if err != nil {
		h.writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Password has been reset. Please log in.",
		"data":    gin.H{},
	})
}

// Status codes avoid 401 on purpose: the app treats 401 as "session expired".
func (h *PasswordResetHandler) writeServiceError(c *gin.Context, err error) {
	var rateErr *passwordreset.RateLimitError
	var weakErr *passwordreset.WeakPasswordError

	switch {
	case errors.As(err, &rateErr):
		seconds := rateErr.RetryAfterSeconds()
		c.Header("Retry-After", strconv.Itoa(seconds))
		c.JSON(http.StatusTooManyRequests, gin.H{
			"success": false,
			"message": "Too many requests. Please wait and try again.",
			"data":    gin.H{"error": "rate_limited", "retry_after_seconds": seconds},
		})
	case errors.Is(err, passwordreset.ErrEmailNotFound):
		writeResetError(c, http.StatusNotFound, "email_not_found", "No account exists with this email")
	case errors.Is(err, passwordreset.ErrTooManyAttempts):
		writeResetError(c, http.StatusTooManyRequests, "too_many_attempts", "Too many incorrect attempts. Request a new code.")
	case errors.Is(err, passwordreset.ErrInvalidCode):
		writeResetError(c, http.StatusBadRequest, "invalid_code", "The code is incorrect or has expired")
	case errors.Is(err, passwordreset.ErrInvalidToken):
		writeResetError(c, http.StatusBadRequest, "invalid_reset_token", "The reset session has expired or was already used. Start again.")
	case errors.Is(err, passwordreset.ErrPasswordMismatch):
		writeResetError(c, http.StatusBadRequest, "password_mismatch", "The passwords do not match")
	case errors.As(err, &weakErr):
		writeResetError(c, http.StatusBadRequest, "weak_password", "Password "+weakErr.Reason)
	default:
		log.Println("Password reset error:", err)
		writeResetError(c, http.StatusInternalServerError, "server_error", "Could not process the request")
	}
}

func writeResetError(c *gin.Context, status int, code, message string) {
	c.JSON(status, gin.H{
		"success": false,
		"message": message,
		"data":    gin.H{"error": code},
	})
}
