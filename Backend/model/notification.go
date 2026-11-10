package model

import "time"

// Notification is the payload sent to a user's devices as a push notification.
type Notification struct {
	UserID string `json:"user_id"`
	Title  string `json:"title"`
	Body   string `json:"body"`
}

// UserNotification is a row from the notifications table, as shown in the app's notification list.
type UserNotification struct {
	ID          string     `json:"id"`
	CompanyID   string     `json:"company_id"`
	CompanyName string     `json:"company_name"`
	ItemID      *string    `json:"item_id"`
	ItemName    *string    `json:"item_name"`
	BatchID     *string    `json:"batch_id"`
	Type        string     `json:"type"`
	Message     string     `json:"message"`
	SentAt      time.Time  `json:"sent_at"`
	ReadAt      *time.Time `json:"read_at"`
}
