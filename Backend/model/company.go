package model

import (
	"time"

	"github.com/google/uuid"
)

type Company struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	CVR       string    `json:"cvr"`
	CreatedAt time.Time `json:"created_at"`
}
