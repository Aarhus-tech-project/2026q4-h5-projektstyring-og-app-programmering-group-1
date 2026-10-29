package routers

import (
	"lagerklar/backend/model"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CVRRequest struct {
	User model.User `json:"user" binding:"required"`
	CVR  string     `json:"cvr" binding:"required"`
}

func ResearchCVR(c *gin.Context) {
	var request LoginRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid login data",
			"data":    gin.H{},
		})
		return
	}
}
