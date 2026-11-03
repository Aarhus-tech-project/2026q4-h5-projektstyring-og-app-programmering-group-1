package routers

import (
	"encoding/json"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type CVRCompany struct {
	VAT          int    `json:"vat"`
	Name         string `json:"name"`
	Address      string `json:"address"`
	Zipcode      string `json:"zipcode"`
	City         string `json:"city"`
	Phone        string `json:"phone"`
	Email        string `json:"email"`
	IndustryDesc string `json:"industrydesc"`
	CompanyDesc  string `json:"companydesc"`
	Error        string `json:"error"`
}

var cvrPattern = regexp.MustCompile(`^\d{8}$`)

var cvrClient = &http.Client{Timeout: 10 * time.Second}

// GET /v1/cvr=:cvr/userID=:userID
func ResearchCVR(c *gin.Context) {
	userID := c.Param("userID")
	if authUserID, _ := c.Get("userID"); authUserID != userID {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "User ID does not match authenticated user",
			"data":    gin.H{},
		})
		return
	}

	cvr := strings.ReplaceAll(strings.TrimSpace(c.Param("cvr")), " ", "")
	if !cvrPattern.MatchString(cvr) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "CVR must be 8 digits",
			"data":    gin.H{},
		})
		return
	}

	apiURL := "https://cvrapi.dk/api?vat=" + url.QueryEscape(cvr) + "&country=dk"
	req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodGet, apiURL, nil)
	if err != nil {
		writeCVRLookupFailed(c)
		return
	}
	// cvrapi.dk rejects requests without a descriptive User-Agent
	req.Header.Set("User-Agent", "Lagerklar - CVR lookup")

	resp, err := cvrClient.Do(req)
	if err != nil {
		writeCVRLookupFailed(c)
		return
	}
	defer resp.Body.Close()

	var company CVRCompany
	if err := json.NewDecoder(resp.Body).Decode(&company); err != nil {
		writeCVRLookupFailed(c)
		return
	}

	if resp.StatusCode == http.StatusNotFound || company.Error == "NOT_FOUND" {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Company not found",
			"data":    gin.H{},
		})
		return
	}
	if resp.StatusCode != http.StatusOK || company.Error != "" {
		writeCVRLookupFailed(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Company found",
		"data": gin.H{
			"user_id":  userID,
			"cvr":      cvr,
			"name":     company.Name,
			"address":  company.Address,
			"zipcode":  company.Zipcode,
			"city":     company.City,
			"phone":    company.Phone,
			"email":    company.Email,
			"industry": company.IndustryDesc,
			"type":     company.CompanyDesc,
		},
	})
}

func writeCVRLookupFailed(c *gin.Context) {
	c.JSON(http.StatusBadGateway, gin.H{
		"success": false,
		"message": "Could not look up CVR",
		"data":    gin.H{},
	})
}
