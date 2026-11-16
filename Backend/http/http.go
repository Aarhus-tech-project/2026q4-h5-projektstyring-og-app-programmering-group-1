package http

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	nethttp "net/http"
	"time"
)

// Client is a small wrapper around net/http for calling external APIs
// (fx CVR-opslag) and decoding JSON responses.
type Client struct {
	BaseURL   string
	UserAgent string
	Headers   map[string]string
	client    *nethttp.Client
}

// StatusError is returned when the external API answers with a non-2xx status.
type StatusError struct {
	StatusCode int
	Body       string
}

func (e *StatusError) Error() string {
	return fmt.Sprintf("http request failed with status %d: %s", e.StatusCode, e.Body)
}

var ErrNotFound = errors.New("resource not found")

func NewClient(baseURL string, timeout time.Duration) *Client {
	if timeout <= 0 {
		timeout = 10 * time.Second
	}

	return &Client{
		BaseURL:   baseURL,
		UserAgent: "Lagerklar-Backend/1.0",
		Headers:   map[string]string{},
		client:    &nethttp.Client{Timeout: timeout},
	}
}

func (c *Client) Get(ctx context.Context, path string, out any) error {
	return c.Do(ctx, nethttp.MethodGet, path, nil, out)
}

func (c *Client) Post(ctx context.Context, path string, body any, out any) error {
	return c.Do(ctx, nethttp.MethodPost, path, body, out)
}

// Do sends a request with an optional JSON body and decodes the JSON
// response into out (pass nil to ignore the response body).
func (c *Client) Do(ctx context.Context, method string, path string, body any, out any) error {
	var reader io.Reader
	if body != nil {
		payload, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("could not encode request body: %w", err)
		}
		reader = bytes.NewReader(payload)
	}

	req, err := nethttp.NewRequestWithContext(ctx, method, c.BaseURL+path, reader)
	if err != nil {
		return fmt.Errorf("could not create request: %w", err)
	}

	req.Header.Set("Accept", "application/json")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if c.UserAgent != "" {
		req.Header.Set("User-Agent", c.UserAgent)
	}
	for key, value := range c.Headers {
		req.Header.Set(key, value)
	}

	res, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode == nethttp.StatusNotFound {
		return ErrNotFound
	}

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		data, _ := io.ReadAll(io.LimitReader(res.Body, 1024))
		return &StatusError{StatusCode: res.StatusCode, Body: string(data)}
	}

	if out == nil {
		return nil
	}

	if err := json.NewDecoder(res.Body).Decode(out); err != nil {
		return fmt.Errorf("could not decode response: %w", err)
	}

	return nil
}
