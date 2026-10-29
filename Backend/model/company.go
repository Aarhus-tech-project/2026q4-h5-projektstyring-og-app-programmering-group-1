package model

import "time"

type Company struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	CVR       string    `json:"cvr"`
	CreatedAt time.Time `json:"created_at"`
}
