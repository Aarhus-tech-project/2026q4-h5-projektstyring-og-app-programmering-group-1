package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	PORT        string
	ENVIRONMENT string
	JWT_SECRET  string
}

func Load() *Config {
	_ = godotenv.Load()
	return &Config{
		ENVIRONMENT: os.Getenv("ENVIRONMENT"),
		PORT:        os.Getenv("PORT"),
		JWT_SECRET:  os.Getenv("JWT_SECRET"),
	}
}
