package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	PORT        string
	ENVIRONMENT string
}

func Load() *Config {
	_ = godotenv.Load()
	return &Config{
		ENVIRONMENT: os.Getenv("ENVIRONMENT"),
		PORT:        os.Getenv("PORT"),
	}
}
