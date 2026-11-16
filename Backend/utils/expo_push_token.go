package utils

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"lagerklar/backend/database"
	"lagerklar/backend/model"
)

const expoPushURL = "https://exp.host/--/api/v2/push/send"

// ErrDeviceNotRegistered means Expo no longer accepts the token (app uninstalled or
// notifications revoked), so the caller should delete it from push_tokens.
var ErrDeviceNotRegistered = errors.New("expo push token is no longer registered")

// ErrNoPushTokens means the user has no registered device to send a notification to.
var ErrNoPushTokens = errors.New("user has no registered push tokens")

var expoClient = &http.Client{Timeout: 10 * time.Second}

type expoPushMessage struct {
	To    string `json:"to"`
	Title string `json:"title"`
	Body  string `json:"body"`
	Sound string `json:"sound"`
}

// Expo returns a single ticket object when one message is sent
type expoPushResponse struct {
	Data struct {
		Status  string `json:"status"`
		Message string `json:"message"`
		Details struct {
			Error string `json:"error"`
		} `json:"details"`
	} `json:"data"`
	Errors []struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"errors"`
}

// GetExpoPushTokens returns every Expo push token saved for the user (one per device).
func GetExpoPushTokens(userID string) ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := database.DB.QueryContext(
		ctx,
		`SELECT expo_push_token FROM push_tokens WHERE user_id = $1::uuid`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("get push tokens: %w", err)
	}
	defer rows.Close()

	var tokens []string
	for rows.Next() {
		var token string
		if err := rows.Scan(&token); err != nil {
			return nil, fmt.Errorf("scan push token: %w", err)
		}
		tokens = append(tokens, token)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read push tokens: %w", err)
	}

	return tokens, nil
}

// SendNotification sends a push notification to every device the user is logged in on.
// Tokens Expo reports as no longer registered are removed from push_tokens.
func SendNotification(data model.Notification) error {
	tokens, err := GetExpoPushTokens(data.UserID)
	if err != nil {
		return err
	}
	if len(tokens) == 0 {
		return ErrNoPushTokens
	}

	sent := 0
	var errs []error
	for _, token := range tokens {
		err := PushNotification(token, data.Title, data.Body)
		if errors.Is(err, ErrDeviceNotRegistered) {
			errs = append(errs, err)
			if err := deletePushToken(token); err != nil {
				errs = append(errs, fmt.Errorf("delete push token: %w", err))
			}
			continue
		}
		if err != nil {
			errs = append(errs, err)
			continue
		}
		sent++
	}

	// One failing device should not stop the others; only report an error if no device got it
	if sent == 0 {
		return fmt.Errorf("could not send notification to any device: %w", errors.Join(errs...))
	}
	return nil
}

func deletePushToken(token string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := database.DB.ExecContext(
		ctx,
		`DELETE FROM push_tokens WHERE expo_push_token = $1`,
		token,
	)
	return err
}

// PushNotification sends a push notification to one device through the Expo push service.
func PushNotification(token string, title string, body string) error {
	payload, err := json.Marshal(expoPushMessage{
		To:    token,
		Title: title,
		Body:  body,
		Sound: "default",
	})
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost, expoPushURL, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	res, err := expoClient.Do(req)
	if err != nil {
		return fmt.Errorf("send push notification: %w", err)
	}
	defer res.Body.Close()

	var result expoPushResponse
	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		return fmt.Errorf("decode expo response (status %d): %w", res.StatusCode, err)
	}

	// Request-level errors (bad payload, rate limit, etc.)
	if len(result.Errors) > 0 {
		return fmt.Errorf("expo error %s: %s", result.Errors[0].Code, result.Errors[0].Message)
	}
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("expo returned status %d", res.StatusCode)
	}

	// Message-level errors
	if result.Data.Status == "error" {
		if result.Data.Details.Error == "DeviceNotRegistered" {
			return ErrDeviceNotRegistered
		}
		return fmt.Errorf("expo push failed: %s", result.Data.Message)
	}

	return nil
}
