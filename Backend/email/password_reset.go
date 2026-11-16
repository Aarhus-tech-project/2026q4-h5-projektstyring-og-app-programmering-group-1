package email

import (
	"bytes"
	"embed"
	"fmt"
	htmltemplate "html/template"
	"regexp"
	"strings"
	texttemplate "text/template"
	"time"
)

// Embedded so the templates load no matter which directory the backend runs from.
//
//go:embed templates/reset_password.html templates/reset_password.txt
var templateFS embed.FS

var (
	resetPasswordHTML = htmltemplate.Must(htmltemplate.ParseFS(templateFS, "templates/reset_password.html"))
	resetPasswordText = texttemplate.Must(texttemplate.ParseFS(templateFS, "templates/reset_password.txt"))
	sixDigits         = regexp.MustCompile(`^[0-9]{6}$`)
)

// PasswordResetEmail is the data for the "forgot password" code email.
type PasswordResetEmail struct {
	RecipientEmail string // required
	RecipientName  string // optional
	Code           string // required, exactly 6 digits (leading zeros kept)
	ExpiresIn      time.Duration
}

type passwordResetView struct {
	RecipientName  string
	Code           string
	ExpiresMinutes int
	Year           int
}

// BuildPasswordResetEmail renders the password reset email into a Message.
func BuildPasswordResetEmail(p PasswordResetEmail) (Message, error) {
	to, err := ValidateAddress(p.RecipientEmail)
	if err != nil {
		return Message{}, fmt.Errorf("recipient: %w", err)
	}
	if !sixDigits.MatchString(p.Code) {
		return Message{}, fmt.Errorf("%w: code must be 6 digits", ErrInvalidMessage)
	}
	if p.ExpiresIn <= 0 {
		return Message{}, fmt.Errorf("%w: expiry must be positive", ErrInvalidMessage)
	}

	name := oneLine(strings.TrimSpace(p.RecipientName))
	view := passwordResetView{
		RecipientName:  name,
		Code:           p.Code,
		ExpiresMinutes: int(p.ExpiresIn.Round(time.Minute) / time.Minute),
		Year:           time.Now().Year(),
	}

	var html, text bytes.Buffer
	if err := resetPasswordHTML.Execute(&html, view); err != nil {
		return Message{}, fmt.Errorf("email: render HTML template: %w", err)
	}
	if err := resetPasswordText.Execute(&text, view); err != nil {
		return Message{}, fmt.Errorf("email: render text template: %w", err)
	}

	return Message{
		To:      to,
		ToName:  name,
		Subject: "Din kode til at nulstille dit password",
		Text:    text.String(),
		HTML:    html.String(),
	}, nil
}

// oneLine removes line breaks so values from the database can be used in headers.
func oneLine(s string) string {
	return strings.Join(strings.FieldsFunc(s, func(r rune) bool {
		return r == '\r' || r == '\n' || r == 0
	}), " ")
}
