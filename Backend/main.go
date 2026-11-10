package main

import (
	"context"
	"log"
	"os"
	"time"

	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"lagerklar/backend/database"
	"lagerklar/backend/middleware"
	"lagerklar/backend/routers"
	"lagerklar/backend/utils"
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

	// Creates expiry and low stock notifications in the background
	go utils.StartNotificationChecker(context.Background())

	server := gin.Default()
	server.SetTrustedProxies(nil)

	server.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",
			"http://localhost:8081",
			"http://localhost:8082",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	server.GET("/", func(c *gin.Context) {
		c.File("templates/index.html")
	})

	test := server.Group("/v1/")
	test.Use()
	{
		test.GET("/notification-test/user/:userID", routers.NotificationTest)
	}

	public := server.Group("/v1/")
	public.Use()
	{
		public.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status": "ok",
			})
		})

		public.POST("/register", routers.Register)
		public.POST("/login", routers.Login)
	}
	protected := server.Group("/v1")
	protected.Use(middleware.RequireAuth())
	protected.GET("/companies/:companyID/categories", routers.GetInventoryCategories)
	protected.POST("/companies/:companyID/categories", routers.CreateInventoryCategory)
	protected.GET("/companies/:companyID/items", routers.GetInventoryItems)
	protected.POST("/companies/:companyID/items", routers.CreateInventoryItem)
	protected.PATCH("/companies/:companyID/items/:itemID", routers.UpdateInventoryItem)
	protected.DELETE("/companies/:companyID/items/:itemID", routers.DeleteInventoryItem)
	protected.POST("/companies/:companyID/items/:itemID/batches", routers.ReceiveInventoryBatch)
	protected.PATCH("/companies/:companyID/items/:itemID/stock", routers.AdjustInventoryStock)
	protected.GET("/companies/:companyID/shopping-list", routers.GetShoppingList)
	protected.POST("/companies/:companyID/shopping-list/items", routers.AddShoppingListItem)
	protected.PATCH("/companies/:companyID/shopping-list/items/:lineID", routers.UpdateShoppingListItem)
	protected.DELETE("/companies/:companyID/shopping-list/items/:lineID", routers.DeleteShoppingListItem)
	{
		// GET //
		protected.GET("/me", func(c *gin.Context) {
			userID, _ := c.Get("userID")
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "Authenticated user",
				"data": gin.H{
					"user_id": userID,
				},
			})
		})
		protected.GET("/cvr=:cvr/userID=:userID", routers.ResearchCVR)
		protected.GET("/user/:userID/avatar", routers.HandleGetAvatar)
		protected.GET("/notifications", routers.HandleGetNotifications)

		// PUT //
		protected.PUT("/user/:userID", routers.HandleUpdateProfile)
		protected.PUT("/user/:userID/avatar", routers.HandleUploadAvatar)

		// PATCH //
		protected.PATCH("/notifications/:notificationID/read", routers.HandleMarkNotificationRead)

		// POST //
		protected.POST("/company", routers.HandleCreateCompany)
		protected.POST("/expo-push-token", routers.HandleSavePushToken)

		// DELETE //
		protected.DELETE("/company/:companyID/userID=:userID", routers.HandleDeleteCompany)
		protected.DELETE("/user/:userID", routers.HandleDeleteAccount)
		protected.DELETE("/notifications/:notificationID", routers.HandleDeleteNotification)
	}

	PORT := os.Getenv("PORT")
	if PORT == "" {
		PORT = "8080"
	}

	if err := server.Run(":" + PORT); err != nil {
		log.Fatal(err)
	}

}
