package routers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Login(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "login successfully.",
		"data":    "user data",
	})
}
