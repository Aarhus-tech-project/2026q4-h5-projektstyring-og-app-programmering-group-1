package database

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// DB is the shared database connection pool. Set by Init.
var DB *sql.DB

// Init opens the connection to PostgreSQL using DATABASE_URL
// and verifies it with a ping. Call it once at startup.
func Init() error {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return errors.New("DATABASE_URL is not set")
	}

	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return fmt.Errorf("open database: %w", err)
	}
	db.SetMaxOpenConns(10)
	db.SetConnMaxIdleTime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return fmt.Errorf("ping database: %w", err)
	}

	DB = db
	return nil
}

// Close closes the database connection pool.
func Close() {
	if DB != nil {
		DB.Close()
	}
}

// RunExec runs a query that doesn't return rows (INSERT, UPDATE, DELETE).
func RunExec(query string, args ...any) (sql.Result, error) {
	result, err := DB.Exec(query, args...)
	if err != nil {
		log.Println("Exec error:", err)
		return nil, err
	}
	return result, nil
}

// RunQuery runs a query that returns rows. The caller must close the rows.
func RunQuery(query string, args ...any) (*sql.Rows, error) {
	rows, err := DB.Query(query, args...)
	if err != nil {
		log.Println("Query error:", err)
		return nil, err
	}
	return rows, nil
}

// RunQueryRow runs a query that returns at most one row.
// Errors are returned when calling Scan on the result.
func RunQueryRow(query string, args ...any) *sql.Row {
	return DB.QueryRow(query, args...)
}
