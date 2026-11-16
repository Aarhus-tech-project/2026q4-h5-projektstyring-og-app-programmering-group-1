// Package email sends emails from the backend through Gmail SMTP.
//
// Credentials are read from the GMAIL_EMAIL and GMAIL_APP_PASSWORD environment
// variables and never leave the backend. Every email is sent as
// multipart/alternative with a plain-text and an HTML version, encoded as UTF-8
// so Danish characters (æ, ø, å) survive.
package email

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/tls"
	"encoding/hex"
	"errors"
	"fmt"
	"mime"
	"mime/multipart"
	"mime/quotedprintable"
	"net"
	"net/mail"
	"net/smtp"
	"net/textproto"
	"os"
	"strings"
	"time"
)

const (
	gmailSMTPAddr   = "smtp.gmail.com:587"
	defaultFromName = "Lagerklar"
	defaultTimeout  = 30 * time.Second
	dialTimeout     = 10 * time.Second
	maxAddressLen   = 254
)

var (
	// ErrNotConfigured means GMAIL_EMAIL or GMAIL_APP_PASSWORD is missing.
	ErrNotConfigured = errors.New("email: GMAIL_EMAIL and GMAIL_APP_PASSWORD must be set")
	// ErrInvalidAddress means an email address is malformed or not a single plain address.
	ErrInvalidAddress = errors.New("email: invalid email address")
	// ErrInvalidHeader means a header value contains a line break (header injection attempt).
	ErrInvalidHeader = errors.New("email: header value must not contain line breaks")
	// ErrInvalidMessage means a required part of the message is missing.
	ErrInvalidMessage = errors.New("email: invalid message")
)

// Config holds the SMTP settings. Use ConfigFromEnv in production code.
type Config struct {
	// Username is the Gmail address. It is also used as the sender address,
	// because Gmail rewrites the From header to the authenticated account anyway.
	Username string
	// AppPassword is a 16-character Gmail App Password (not the normal password).
	AppPassword string
	// FromName is the display name shown to recipients. Defaults to "Lagerklar".
	FromName string
	// Addr is host:port of the SMTP server. Defaults to smtp.gmail.com:587.
	Addr string
	// Timeout limits the whole SMTP conversation. Defaults to 30 seconds.
	Timeout time.Duration
}

// String hides the password so a Config can never leak it through fmt/log.
func (c Config) String() string {
	return fmt.Sprintf("email.Config{Username: %q, AppPassword: [hidden], FromName: %q, Addr: %q, Timeout: %s}",
		c.Username, c.FromName, c.Addr, c.Timeout)
}

// GoString hides the password for %#v as well.
func (c Config) GoString() string { return c.String() }

// ConfigFromEnv reads GMAIL_EMAIL and GMAIL_APP_PASSWORD.
func ConfigFromEnv() (Config, error) {
	cfg := Config{
		Username: strings.TrimSpace(os.Getenv("GMAIL_EMAIL")),
		// Google shows app passwords as "abcd efgh ijkl mnop"; the spaces are not part of it.
		AppPassword: strings.ReplaceAll(strings.TrimSpace(os.Getenv("GMAIL_APP_PASSWORD")), " ", ""),
	}
	if cfg.Username == "" || cfg.AppPassword == "" {
		return Config{}, ErrNotConfigured
	}
	return cfg, nil
}

// Service sends emails. It is safe for concurrent use.
type Service struct {
	cfg  Config
	from mail.Address
	host string
	now  func() time.Time
}

// NewServiceFromEnv creates a Service configured from environment variables.
func NewServiceFromEnv() (*Service, error) {
	cfg, err := ConfigFromEnv()
	if err != nil {
		return nil, err
	}
	return NewService(cfg)
}

// NewService validates cfg, fills in defaults and returns a Service.
func NewService(cfg Config) (*Service, error) {
	if cfg.Username == "" || cfg.AppPassword == "" {
		return nil, ErrNotConfigured
	}
	username, err := ValidateAddress(cfg.Username)
	if err != nil {
		return nil, fmt.Errorf("GMAIL_EMAIL: %w", err)
	}
	cfg.Username = username
	if cfg.FromName == "" {
		cfg.FromName = defaultFromName
	}
	if hasLineBreak(cfg.FromName) {
		return nil, fmt.Errorf("from name: %w", ErrInvalidHeader)
	}
	if cfg.Addr == "" {
		cfg.Addr = gmailSMTPAddr
	}
	if cfg.Timeout <= 0 {
		cfg.Timeout = defaultTimeout
	}
	host, _, err := net.SplitHostPort(cfg.Addr)
	if err != nil {
		return nil, fmt.Errorf("email: invalid SMTP address %q: %w", cfg.Addr, err)
	}

	return &Service{
		cfg:  cfg,
		from: mail.Address{Name: cfg.FromName, Address: cfg.Username},
		host: host,
		now:  time.Now,
	}, nil
}

// Message is one email to one recipient.
type Message struct {
	To      string // plain address, e.g. "anna@example.com"
	ToName  string // optional display name
	Subject string
	Text    string // plain-text version (required)
	HTML    string // HTML version (required)
}

// ValidateAddress checks that s is exactly one plain email address
// ("anna@example.com", not "Anna <anna@example.com>") and returns it trimmed.
func ValidateAddress(s string) (string, error) {
	s = strings.TrimSpace(s)
	if s == "" || len(s) > maxAddressLen || hasLineBreak(s) {
		return "", ErrInvalidAddress
	}
	parsed, err := mail.ParseAddress(s)
	if err != nil || parsed.Name != "" || parsed.Address != s {
		return "", ErrInvalidAddress
	}
	at := strings.LastIndexByte(s, '@')
	domain := s[at+1:]
	if at < 1 || !strings.Contains(domain, ".") || strings.HasPrefix(domain, ".") || strings.HasSuffix(domain, ".") {
		return "", ErrInvalidAddress
	}
	return s, nil
}

// hasLineBreak reports whether s contains characters that could start a new header line.
func hasLineBreak(s string) bool {
	return strings.ContainsAny(s, "\r\n\x00")
}

// BuildMessage builds the raw RFC 5322 message (headers + multipart body) without sending it.
func (s *Service) BuildMessage(msg Message) ([]byte, error) {
	to, err := ValidateAddress(msg.To)
	if err != nil {
		return nil, fmt.Errorf("recipient: %w", err)
	}
	if hasLineBreak(msg.ToName) || hasLineBreak(msg.Subject) {
		return nil, ErrInvalidHeader
	}
	if strings.TrimSpace(msg.Subject) == "" || msg.Text == "" || msg.HTML == "" {
		return nil, fmt.Errorf("%w: subject, text and HTML are required", ErrInvalidMessage)
	}

	messageID, err := s.newMessageID()
	if err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)

	// mail.Address.String and mime.QEncoding encode non-ASCII text (æ, ø, å) as RFC 2047 words.
	headers := []struct{ key, value string }{
		{"From", s.from.String()},
		{"To", (&mail.Address{Name: strings.TrimSpace(msg.ToName), Address: to}).String()},
		{"Subject", mime.QEncoding.Encode("utf-8", strings.TrimSpace(msg.Subject))},
		{"Date", s.now().Format(time.RFC1123Z)},
		{"Message-ID", messageID},
		{"MIME-Version", "1.0"},
		{"Content-Type", mime.FormatMediaType("multipart/alternative", map[string]string{"boundary": mw.Boundary()})},
	}
	var raw bytes.Buffer
	for _, h := range headers {
		raw.WriteString(h.key + ": " + h.value + "\r\n")
	}
	raw.WriteString("\r\n")

	// Plain text first, HTML last: clients show the last part they can render.
	if err := writePart(mw, "text/plain; charset=UTF-8", msg.Text); err != nil {
		return nil, err
	}
	if err := writePart(mw, "text/html; charset=UTF-8", msg.HTML); err != nil {
		return nil, err
	}
	if err := mw.Close(); err != nil {
		return nil, err
	}

	raw.Write(buf.Bytes())
	return raw.Bytes(), nil
}

func writePart(mw *multipart.Writer, contentType, body string) error {
	pw, err := mw.CreatePart(textproto.MIMEHeader{
		"Content-Type":              {contentType},
		"Content-Transfer-Encoding": {"quoted-printable"},
	})
	if err != nil {
		return err
	}
	qp := quotedprintable.NewWriter(pw)
	if _, err := qp.Write([]byte(body)); err != nil {
		return err
	}
	return qp.Close()
}

func (s *Service) newMessageID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("email: generate message id: %w", err)
	}
	domain := s.cfg.Username[strings.LastIndexByte(s.cfg.Username, '@')+1:]
	return "<" + hex.EncodeToString(b) + "@" + domain + ">", nil
}

// Send builds msg and delivers it through Gmail SMTP using STARTTLS.
// It gives up when ctx is cancelled or the configured timeout is reached.
func (s *Service) Send(ctx context.Context, msg Message) error {
	raw, err := s.BuildMessage(msg)
	if err != nil {
		return err
	}
	to, _ := ValidateAddress(msg.To) // already validated by BuildMessage
	return s.deliver(ctx, to, raw)
}

func (s *Service) deliver(ctx context.Context, to string, raw []byte) error {
	ctx, cancel := context.WithTimeout(ctx, s.cfg.Timeout)
	defer cancel()

	dialer := net.Dialer{Timeout: dialTimeout}
	conn, err := dialer.DialContext(ctx, "tcp", s.cfg.Addr)
	if err != nil {
		return fmt.Errorf("email: connect to %s: %w", s.cfg.Addr, err)
	}
	// Every read/write must finish before the deadline, and cancelling ctx aborts a blocked call.
	if deadline, ok := ctx.Deadline(); ok {
		_ = conn.SetDeadline(deadline)
	}
	stop := context.AfterFunc(ctx, func() { _ = conn.SetDeadline(time.Now()) })
	defer stop()

	client, err := smtp.NewClient(conn, s.host)
	if err != nil {
		conn.Close()
		return fmt.Errorf("email: smtp greeting: %w", err)
	}
	defer client.Close()

	// Never send credentials over an unencrypted connection.
	if ok, _ := client.Extension("STARTTLS"); !ok {
		return errors.New("email: server does not support STARTTLS")
	}
	if err := client.StartTLS(&tls.Config{ServerName: s.host, MinVersion: tls.VersionTLS12}); err != nil {
		return fmt.Errorf("email: starttls: %w", err)
	}
	// The error from Gmail contains only the server's reply, never the password.
	if err := client.Auth(smtp.PlainAuth("", s.cfg.Username, s.cfg.AppPassword, s.host)); err != nil {
		return fmt.Errorf("email: authenticate: %w", err)
	}
	if err := client.Mail(s.cfg.Username); err != nil {
		return fmt.Errorf("email: MAIL FROM: %w", err)
	}
	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("email: RCPT TO: %w", err)
	}
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("email: DATA: %w", err)
	}
	if _, err := w.Write(raw); err != nil {
		return fmt.Errorf("email: write message: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("email: send message: %w", err)
	}
	if err := client.Quit(); err != nil {
		return fmt.Errorf("email: quit: %w", err)
	}
	return nil
}
