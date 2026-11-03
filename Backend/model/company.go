package model

import "time"

type Company struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	CVR       string    `json:"cvr"`
	CreatedAt time.Time `json:"created_at"`
}

type CompanyMembership struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	CompanyID string    `json:"company_id"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}
