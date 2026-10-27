package main

import (
	"log"
	"os"
	"time"

	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"lagerklar/backend/database"
	"lagerklar/backend/routers"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found")
	}

	if err := database.Init(); err != nil {
		log.Fatal("Could not connect to database: ", err)
	}
	defer database.Close()
	log.Println("Connected to PostgreSQL")

	server := gin.Default()
	server.SetTrustedProxies(nil)

	server.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	server.GET("/", func(c *gin.Context) {
		c.File("templates/index.html")
	})

	public := server.Group("/v1/")
	public.Use()
	{
		public.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status": "ok",
			})
		})

		public.POST("/login", routers.Login)
	}

	PORT := os.Getenv("PORT")
	if PORT == "" {
		PORT = "8080"
	}

	if err := server.Run(":" + PORT); err != nil {
		log.Fatal(err)
	}

}
