package email

import (
	"bytes"
	"embed"
	"fmt"
	htmltemplate "html/template"
	"strings"
	texttemplate "text/template"
	"time"
)

//go:embed templates/wellcome.html templates/wellcome.txt
var welcomeFS embed.FS

var (
	welcomeHTML = htmltemplate.Must(htmltemplate.ParseFS(welcomeFS, "templates/wellcome.html"))
	welcomeText = texttemplate.Must(texttemplate.ParseFS(welcomeFS, "templates/wellcome.txt"))
)

// WelcomeEmail is the data for the email sent after a successful registration.
type WelcomeEmail struct {
	RecipientEmail string // required
	RecipientName  string // optional
}

type welcomeView struct {
	RecipientName  string
	RecipientEmail string
	Year           int
}

// BuildWelcomeEmail renders the welcome email into a Message.
func BuildWelcomeEmail(w WelcomeEmail) (Message, error) {
	to, err := ValidateAddress(w.RecipientEmail)
	if err != nil {
		return Message{}, fmt.Errorf("recipient: %w", err)
	}

	name := oneLine(strings.TrimSpace(w.RecipientName))
	view := welcomeView{
		RecipientName:  name,
		RecipientEmail: to,
		Year:           time.Now().Year(),
	}

	var html, text bytes.Buffer
	if err := welcomeHTML.Execute(&html, view); err != nil {
		return Message{}, fmt.Errorf("email: render HTML template: %w", err)
	}
	if err := welcomeText.Execute(&text, view); err != nil {
		return Message{}, fmt.Errorf("email: render text template: %w", err)
	}

	return Message{
		To:      to,
		ToName:  name,
		Subject: "Velkommen til Lagerklar",
		Text:    text.String(),
		HTML:    html.String(),
	}, nil
}
