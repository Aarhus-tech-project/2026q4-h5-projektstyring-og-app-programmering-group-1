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
	"lagerklar/backend/email"
	"lagerklar/backend/middleware"
	"lagerklar/backend/model"

	"lagerklar/backend/passwordreset"
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

	// Email (Gmail SMTP). Without credentials the server still runs, but reset codes can't be emailed.
	var mailer passwordreset.Mailer
	if emailService, err := email.NewServiceFromEnv(); err != nil {
		log.Println("Email is disabled:", err)
	} else {
		mailer = emailService
		routers.SetWelcomeMailer(emailService)
	}

	resetService, err := passwordreset.New(database.DB, mailer, []byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		log.Fatal("Could not set up password reset: ", err)
	}
	passwordReset := routers.NewPasswordResetHandler(resetService)

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

		// Forgot password
		public.POST("/password-reset/request", passwordReset.RequestCode)
		public.POST("/password-reset/verify", passwordReset.VerifyCode)
		public.POST("/password-reset/reset", passwordReset.ResetPassword)
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
	protected.GET("/companies/:companyID/items/:itemID/image", routers.GetItemImage)
	protected.PUT("/companies/:companyID/items/:itemID/image", routers.UploadItemImage)
	protected.DELETE("/companies/:companyID/items/:itemID/image", routers.DeleteItemImage)
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
		protected.GET("/invitations", routers.HandleListMyInvitations)
		protected.GET("/company/:companyID/members", middleware.RequireCompanyRole(model.RoleEjer, model.RoleLeder), routers.HandleListMembers)
		protected.GET("/company/:companyID/invitations", middleware.RequireCompanyRole(model.RoleEjer, model.RoleLeder), routers.HandleListCompanyInvitations)
		protected.GET("/user/:userID/avatar", routers.HandleGetAvatar)
		protected.GET("/notifications", routers.HandleGetNotifications)
		protected.GET("/companies", routers.HandleGetManagedCompanies)
		protected.GET("/companies/:companyID", routers.HandleGetCompanyDetails)

		// PUT //
		protected.PUT("/user/:userID", routers.HandleUpdateProfile)
		protected.PUT("/user/:userID/avatar", routers.HandleUploadAvatar)
		protected.PUT("/user/:userID/password", routers.HandleChangePassword)

		// PATCH //
		protected.PATCH("/notifications/:notificationID/read", routers.HandleMarkNotificationRead)

		// POST //
		protected.POST("/company", routers.HandleCreateCompany)
		protected.POST("/expo-push-token", routers.HandleSavePushToken)

		// DELETE //
		protected.DELETE("/company/:companyID/userID=:userID", routers.HandleDeleteCompany)
		protected.DELETE("/company/:companyID/members/:memberID", middleware.RequireCompanyRole(model.RoleEjer, model.RoleLeder), routers.HandleRemoveMember)
		protected.DELETE("/company/:companyID/invitations/:invitationID", middleware.RequireCompanyRole(model.RoleEjer, model.RoleLeder), routers.HandleCancelInvitation)

		protected.POST("/company/:companyID/invitations", middleware.RequireCompanyRole(model.RoleEjer, model.RoleLeder), routers.HandleCreateInvitation)
		protected.POST("/invitations/:invitationID/accept", routers.HandleAcceptInvitation)
		protected.POST("/company/:companyID/members/:memberID/promote", middleware.RequireCompanyRole(model.RoleEjer), routers.HandlePromoteMember)

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
