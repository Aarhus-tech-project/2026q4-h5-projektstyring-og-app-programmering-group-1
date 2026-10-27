package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	PORT        string
	ENVIRONMENT string
	SECRET_KEY  string
}

func Load() *Config {
	_ = godotenv.Load()
	return &Config{
		ENVIRONMENT: os.Getenv("ENVIRONMENT"),
		PORT:        os.Getenv("PORT"),
		SECRET_KEY:  os.Getenv("SECRET_KEY"),
	}
}
