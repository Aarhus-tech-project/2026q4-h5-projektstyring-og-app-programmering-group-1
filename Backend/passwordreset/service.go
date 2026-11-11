// Package passwordreset implements "forgot password": a 6-digit code is emailed,
// the code is exchanged for a short-lived single-use reset token, and the token
// is exchanged for a new password.
//
// Security notes:
//   - Codes and tokens are never stored or logged in plain text, only as HMAC-SHA256
//     with a server-side key.
//   - Requesting a code gives the same answer whether or not the email has an
//     account, and the database work and email run in the background so the
//     response time does not reveal it either.
//   - An email address alone can never reset a password; only a reset token can,
//     and a token is only issued after the correct code was entered.
package passwordreset

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	"math/big"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"

	"lagerklar/backend/email"
)

const (
	CodeTTL         = 10 * time.Minute // how long an emailed code is valid
	TokenTTL        = 10 * time.Minute // how long a reset token is valid after verifying the code
	MaxAttempts     = 5                // wrong guesses before a code is invalidated
	ResendCooldown  = 60 * time.Second // minimum time between two codes for the same email
	MaxCodesPerHour = 5                // per email

	MinPasswordLength = 8
	MaxPasswordBytes  = 72 // bcrypt ignores everything after 72 bytes

	codeDigits     = 6
	tokenBytes     = 32
	maxTokenLength = 128
	backgroundWork = 45 * time.Second
)

var (
	ruleRequestPerEmail = rule{Limit: MaxCodesPerHour, Window: time.Hour, Cooldown: ResendCooldown}
	ruleRequestPerIP    = rule{Limit: 20, Window: time.Hour}
	ruleVerifyPerIP     = rule{Limit: 30, Window: 10 * time.Minute}
	ruleVerifyFailures  = rule{Limit: MaxAttempts, Window: CodeTTL}
	ruleResetPerIP      = rule{Limit: 20, Window: 10 * time.Minute}
)

var (
	// ErrInvalidCode means the code is wrong, expired, already used or there is no code.
	ErrInvalidCode = errors.New("invalid or expired code")
	// ErrTooManyAttempts means too many wrong codes; the user must request a new code.
	ErrTooManyAttempts = errors.New("too many attempts")
	// ErrInvalidToken means the reset token is unknown, expired or already used.
	ErrInvalidToken = errors.New("invalid or expired reset token")
	// ErrPasswordMismatch means password and confirm password differ.
	ErrPasswordMismatch = errors.New("passwords do not match")
	// ErrEmailNotFound means no active account uses the email, so no code is sent.
	ErrEmailNotFound = errors.New("no account with this email")
)

// RateLimitError is returned when a client sends requests too quickly.
type RateLimitError struct{ RetryAfter time.Duration }

func (e *RateLimitError) Error() string {
	return fmt.Sprintf("too many requests, retry after %s", e.RetryAfter.Round(time.Second))
}

// RetryAfterSeconds rounds up, so the client never retries too early.
func (e *RateLimitError) RetryAfterSeconds() int {
	return int((e.RetryAfter + time.Second - 1) / time.Second)
}

// WeakPasswordError explains why a new password was rejected.
type WeakPasswordError struct{ Reason string }

func (e *WeakPasswordError) Error() string { return "weak password: " + e.Reason }

// Mailer sends an email. *email.Service implements it.
type Mailer interface {
	Send(ctx context.Context, msg email.Message) error
}

// Service handles password resets. Create it with New.
type Service struct {
	db       *sql.DB
	mailer   Mailer
	codeKey  []byte
	tokenKey []byte
	limiter  *limiter

	bcryptCost    int
	runBackground func(func())
}

// New creates a Service. secret is the server secret (JWT_SECRET) from which
// separate HMAC keys for codes and tokens are derived. mailer may be nil, in
// which case no emails are sent (an error is logged instead).
func New(db *sql.DB, mailer Mailer, secret []byte) (*Service, error) {
	if db == nil {
		return nil, errors.New("passwordreset: db is required")
	}
	if len(secret) < 32 {
		return nil, errors.New("passwordreset: secret must be at least 32 bytes")
	}
	return &Service{
		db:            db,
		mailer:        mailer,
		codeKey:       deriveKey(secret, "lagerklar password reset code v1"),
		tokenKey:      deriveKey(secret, "lagerklar password reset token v1"),
		limiter:       newLimiter(time.Now),
		bcryptCost:    bcrypt.DefaultCost,
		runBackground: func(f func()) { go f() },
	}, nil
}

// deriveKey gives each use its own key, so a code hash can never be reused as a token hash.
func deriveKey(secret []byte, label string) []byte {
	m := hmac.New(sha256.New, secret)
	m.Write([]byte(label))
	return m.Sum(nil)
}

func (s *Service) mac(key []byte, parts ...string) []byte {
	m := hmac.New(sha256.New, key)
	m.Write([]byte(strings.Join(parts, "\x00")))
	return m.Sum(nil)
}

// NormalizeEmail matches how Register and Login store and look up emails.
func NormalizeEmail(e string) string { return strings.ToLower(strings.TrimSpace(e)) }

// ---------- 1. Request a code ----------

// RequestCode checks the rate limits, then checks that the email belongs to an active
// account (ErrEmailNotFound if not), and then creates and emails a code in the background.
//
// The account check runs after the rate limits on purpose, so they still limit how fast
// someone can probe which emails have an account.
func (s *Service) RequestCode(emailAddr, clientIP string) error {
	emailAddr = NormalizeEmail(emailAddr)

	if ok, wait := s.limiter.take("request-ip:"+clientIP, ruleRequestPerIP); !ok {
		return &RateLimitError{RetryAfter: wait}
	}
	if ok, wait := s.limiter.take("request-email:"+emailAddr, ruleRequestPerEmail); !ok {
		return &RateLimitError{RetryAfter: wait}
	}

	exists, err := s.activeAccountExists(emailAddr)
	if err != nil {
		return fmt.Errorf("check account: %w", err)
	}
	if !exists {
		return ErrEmailNotFound
	}
	// A new code gives a fresh set of attempts.
	s.limiter.reset("verify-fail:" + emailAddr)

	s.runBackground(func() {
		ctx, cancel := context.WithTimeout(context.Background(), backgroundWork)
		defer cancel()
		if err := s.issueCode(ctx, emailAddr); err != nil {
			// Never log the email, code or token here.
			log.Println("Password reset: could not issue code:", err)
		}
	})
	return nil
}

// activeAccountExists reports whether an active user has this (normalized) email.
func (s *Service) activeAccountExists(emailAddr string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var exists bool
	err := s.db.QueryRowContext(ctx,
		`SELECT EXISTS (SELECT 1 FROM users WHERE email = $1 AND is_active)`,
		emailAddr,
	).Scan(&exists)
	return exists, err
}

func (s *Service) issueCode(ctx context.Context, emailAddr string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Locking the user row makes concurrent requests for the same account run one at a time.
	var userID, name string
	err = tx.QueryRowContext(ctx,
		`SELECT id::text, name FROM users WHERE email = $1 AND is_active FOR UPDATE`,
		emailAddr,
	).Scan(&userID, &name)
	if errors.Is(err, sql.ErrNoRows) {
		return nil // no account: do nothing, the client already got the generic answer
	}
	if err != nil {
		return fmt.Errorf("find user: %w", err)
	}

	// Database limit as well, so a server restart does not reset the in-memory limiter.
	var recent int
	if err := tx.QueryRowContext(ctx,
		`SELECT count(*) FROM password_reset_codes
		 WHERE user_id = $1::uuid AND created_at > now() - interval '1 hour'`,
		userID,
	).Scan(&recent); err != nil {
		return fmt.Errorf("count recent codes: %w", err)
	}
	if recent >= MaxCodesPerHour {
		log.Println("Password reset: hourly code limit reached for user", userID)
		return nil
	}

	// A new code replaces every earlier code and any unused reset token.
	if err := invalidateOutstanding(ctx, tx, userID); err != nil {
		return err
	}

	code, err := generateCode()
	if err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO password_reset_codes (user_id, code_hash, expires_at)
		 VALUES ($1::uuid, $2, now() + make_interval(secs => $3))`,
		userID, s.mac(s.codeKey, userID, code), CodeTTL.Seconds(),
	); err != nil {
		return fmt.Errorf("save code: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit: %w", err)
	}

	if s.mailer == nil {
		return errors.New("email is not configured (GMAIL_EMAIL / GMAIL_APP_PASSWORD)")
	}
	msg, err := email.BuildPasswordResetEmail(email.PasswordResetEmail{
		RecipientEmail: emailAddr,
		RecipientName:  name,
		Code:           code,
		ExpiresIn:      CodeTTL,
	})
	if err != nil {
		return fmt.Errorf("build email: %w", err)
	}
	if err := s.mailer.Send(ctx, msg); err != nil {
		return fmt.Errorf("send email: %w", err)
	}
	return nil
}

func invalidateOutstanding(ctx context.Context, tx *sql.Tx, userID string) error {
	if _, err := tx.ExecContext(ctx,
		`UPDATE password_reset_codes SET invalidated_at = now()
		 WHERE user_id = $1::uuid AND used_at IS NULL AND invalidated_at IS NULL`,
		userID,
	); err != nil {
		return fmt.Errorf("invalidate codes: %w", err)
	}
	if _, err := tx.ExecContext(ctx,
		`UPDATE password_reset_tokens SET invalidated_at = now()
		 WHERE user_id = $1::uuid AND used_at IS NULL AND invalidated_at IS NULL`,
		userID,
	); err != nil {
		return fmt.Errorf("invalidate tokens: %w", err)
	}
	return nil
}

// generateCode returns a uniformly random 6-digit code as a string, so leading
// zeros ("004213") are kept.
func generateCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1_000_000))
	if err != nil {
		return "", fmt.Errorf("generate code: %w", err)
	}
	return formatCode(n.Int64()), nil
}

func formatCode(n int64) string { return fmt.Sprintf("%0*d", codeDigits, n) }

// IsValidCodeFormat reports whether s is exactly 6 ASCII digits.
func IsValidCodeFormat(s string) bool {
	if len(s) != codeDigits {
		return false
	}
	for i := 0; i < len(s); i++ {
		if s[i] < '0' || s[i] > '9' {
			return false
		}
	}
	return true
}

// ---------- 2. Verify the code ----------

// VerifyCode checks the code and, if it is correct, returns a single-use reset token.
// Wrong, expired and missing codes (and unknown emails) all give ErrInvalidCode.
func (s *Service) VerifyCode(ctx context.Context, emailAddr, code, clientIP string) (string, error) {
	emailAddr = NormalizeEmail(emailAddr)
	failKey := "verify-fail:" + emailAddr

	if ok, wait := s.limiter.take("verify-ip:"+clientIP, ruleVerifyPerIP); !ok {
		return "", &RateLimitError{RetryAfter: wait}
	}
	if blocked, _ := s.limiter.blocked(failKey, ruleVerifyFailures); blocked {
		return "", ErrTooManyAttempts
	}

	token, err := s.verifyCode(ctx, emailAddr, strings.TrimSpace(code))
	if errors.Is(err, ErrInvalidCode) || errors.Is(err, ErrTooManyAttempts) {
		// Counted per email for every email, so unknown emails behave exactly like real ones.
		if s.limiter.record(failKey, ruleVerifyFailures) >= MaxAttempts {
			return "", ErrTooManyAttempts
		}
		return "", err
	}
	if err != nil {
		return "", err
	}
	s.limiter.reset(failKey)
	return token, nil
}

func (s *Service) verifyCode(ctx context.Context, emailAddr, code string) (string, error) {
	if !IsValidCodeFormat(code) {
		return "", ErrInvalidCode
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return "", err
	}
	defer tx.Rollback()

	var userID string
	err = tx.QueryRowContext(ctx,
		`SELECT id::text FROM users WHERE email = $1 AND is_active`, emailAddr,
	).Scan(&userID)
	if errors.Is(err, sql.ErrNoRows) {
		s.mac(s.codeKey, "00000000-0000-0000-0000-000000000000", code) // similar work as a real check
		return "", ErrInvalidCode
	}
	if err != nil {
		return "", fmt.Errorf("find user: %w", err)
	}

	// Only the newest active code counts. FOR UPDATE makes parallel guesses wait
	// for each other, so the attempt counter cannot be bypassed.
	var codeID string
	var codeHash []byte
	var attempts int
	var expired bool
	err = tx.QueryRowContext(ctx,
		`SELECT id::text, code_hash, attempts, expires_at <= now()
		 FROM password_reset_codes
		 WHERE user_id = $1::uuid AND used_at IS NULL AND invalidated_at IS NULL
		 ORDER BY created_at DESC
		 LIMIT 1
		 FOR UPDATE`,
		userID,
	).Scan(&codeID, &codeHash, &attempts, &expired)
	if errors.Is(err, sql.ErrNoRows) {
		return "", ErrInvalidCode
	}
	if err != nil {
		return "", fmt.Errorf("find code: %w", err)
	}

	if expired || attempts >= MaxAttempts {
		if _, err := tx.ExecContext(ctx,
			`UPDATE password_reset_codes SET invalidated_at = now() WHERE id = $1::uuid`, codeID,
		); err != nil {
			return "", fmt.Errorf("invalidate code: %w", err)
		}
		if err := tx.Commit(); err != nil {
			return "", err
		}
		return "", ErrInvalidCode
	}

	if !hmac.Equal(codeHash, s.mac(s.codeKey, userID, code)) {
		attempts++
		if _, err := tx.ExecContext(ctx,
			`UPDATE password_reset_codes
			 SET attempts = $2::int,
			     invalidated_at = CASE WHEN $2::int >= $3::int THEN now() END
			 WHERE id = $1::uuid`,
			codeID, attempts, MaxAttempts,
		); err != nil {
			return "", fmt.Errorf("count attempt: %w", err)
		}
		if err := tx.Commit(); err != nil {
			return "", err
		}
		if attempts >= MaxAttempts {
			return "", ErrTooManyAttempts
		}
		return "", ErrInvalidCode
	}

	// Correct code: use it up and issue a reset token in its place.
	if _, err := tx.ExecContext(ctx,
		`UPDATE password_reset_codes SET used_at = now() WHERE id = $1::uuid`, codeID,
	); err != nil {
		return "", fmt.Errorf("use code: %w", err)
	}
	if _, err := tx.ExecContext(ctx,
		`UPDATE password_reset_tokens SET invalidated_at = now()
		 WHERE user_id = $1::uuid AND used_at IS NULL AND invalidated_at IS NULL`,
		userID,
	); err != nil {
		return "", fmt.Errorf("invalidate tokens: %w", err)
	}

	raw := make([]byte, tokenBytes)
	if _, err := rand.Read(raw); err != nil {
		return "", fmt.Errorf("generate token: %w", err)
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
		 VALUES ($1::uuid, $2, now() + make_interval(secs => $3))`,
		userID, s.mac(s.tokenKey, token), TokenTTL.Seconds(),
	); err != nil {
		return "", fmt.Errorf("save token: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return "", fmt.Errorf("commit: %w", err)
	}
	return token, nil
}

// ---------- 3. Set the new password ----------

// ValidatePassword checks the password rules shared with the app.
func ValidatePassword(password string) error {
	switch {
	case utf8.RuneCountInString(password) < MinPasswordLength:
		return &WeakPasswordError{Reason: fmt.Sprintf("must be at least %d characters", MinPasswordLength)}
	case len(password) > MaxPasswordBytes:
		return &WeakPasswordError{Reason: fmt.Sprintf("must be at most %d bytes", MaxPasswordBytes)}
	case strings.TrimSpace(password) != password:
		return &WeakPasswordError{Reason: "must not start or end with a space"}
	}
	var hasLetter, hasDigit bool
	for _, r := range password {
		switch {
		case unicode.IsLetter(r):
			hasLetter = true
		case unicode.IsDigit(r):
			hasDigit = true
		case unicode.IsControl(r):
			return &WeakPasswordError{Reason: "must not contain control characters"}
		}
	}
	if !hasLetter || !hasDigit {
		return &WeakPasswordError{Reason: "must contain at least one letter and one number"}
	}
	return nil
}

// ResetPassword sets a new password using a reset token from VerifyCode.
// Using the token, changing the password and invalidating every other code and
// token all happen in one transaction. Existing login tokens (stateless JWTs)
// are not revoked; they stay valid until they expire (15 minutes).
func (s *Service) ResetPassword(ctx context.Context, token, password, confirmPassword, clientIP string) error {
	if ok, wait := s.limiter.take("reset-ip:"+clientIP, ruleResetPerIP); !ok {
		return &RateLimitError{RetryAfter: wait}
	}
	// Validate first so a typo does not use up the token.
	if err := ValidatePassword(password); err != nil {
		return err
	}
	if password != confirmPassword {
		return ErrPasswordMismatch
	}
	token = strings.TrimSpace(token)
	if token == "" || len(token) > maxTokenLength {
		return ErrInvalidToken
	}

	// Same hashing as Register.
	hash, err := bcrypt.GenerateFromPassword([]byte(password), s.bcryptCost)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// The conditional UPDATE claims the token atomically: a second request with the
	// same token waits for this row lock and then finds used_at already set.
	var userID string
	err = tx.QueryRowContext(ctx,
		`UPDATE password_reset_tokens SET used_at = now()
		 WHERE token_hash = $1
		   AND used_at IS NULL AND invalidated_at IS NULL
		   AND expires_at > now()
		 RETURNING user_id::text`,
		s.mac(s.tokenKey, token),
	).Scan(&userID)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrInvalidToken
	}
	if err != nil {
		return fmt.Errorf("use token: %w", err)
	}

	res, err := tx.ExecContext(ctx,
		`UPDATE users
		 SET password = $2
		 WHERE id = $1::uuid AND is_active`,
		userID, string(hash),
	)
	if err != nil {
		return fmt.Errorf("update password: %w", err)
	}
	if n, _ := res.RowsAffected(); n != 1 {
		return ErrInvalidToken // account deleted or deactivated in the meantime
	}
	if err := invalidateOutstanding(ctx, tx, userID); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit: %w", err)
	}
	return nil
}
