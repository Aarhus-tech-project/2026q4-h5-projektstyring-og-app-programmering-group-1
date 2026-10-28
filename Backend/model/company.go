package model

import "time"

type Company struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	Cvr       string    `json:"cvr"`
	CreatedAt time.Time `json:"created_at"`
}
