package model

import "time"

const (
	RoleEjer        = "ejer"
	RoleLeder       = "leder"
	RoleMedarbejder = "medarbejder"
)

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

type CompanyInvitation struct {
	ID        string    `json:"id"`
	CompanyID string    `json:"company_id"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

type ReceivedInvitation struct {
	ID            string    `json:"id"`
	CompanyID     string    `json:"company_id"`
	CompanyName   string    `json:"company_name"`
	Role          string    `json:"role"`
	InvitedByName string    `json:"invited_by_name"`
	ExpiresAt     time.Time `json:"expires_at"`
}

type CompanyMember struct {
	UserID   string    `json:"user_id"`
	Name     string    `json:"name"`
	Email    string    `json:"email"`
	Role     string    `json:"role"`
	JoinedAt time.Time `json:"joined_at"`
}

type PendingInvitation struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	Role          string    `json:"role"`
	InvitedByName string    `json:"invited_by_name"`
	CreatedAt     time.Time `json:"created_at"`
	ExpiresAt     time.Time `json:"expires_at"`
}
