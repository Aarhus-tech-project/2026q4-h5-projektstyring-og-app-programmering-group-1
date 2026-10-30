package routers

import (
	"lagerklar/backend/model"
	"net/http"

	"github.com/gin-gonic/gin"
)

type GenCompanyReq struct {
	User    model.User `json:"user"`
	Company CVRCompany `json:"company"`
}

func CreateCompany(c *gin.Context) {
	var req GenCompanyReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
			"data":    gin.H{},
		})
		return
	}
	// Create company
	// create company membership
	// create user membership
	// create user intivation

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Company created successfully",
		"data":    gin.H{},
	})
}
