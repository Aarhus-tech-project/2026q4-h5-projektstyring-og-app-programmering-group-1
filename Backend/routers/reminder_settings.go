package routers

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"regexp"

	"lagerklar/backend/database"

	"github.com/gin-gonic/gin"
)

// Defaults used when a company has no reminder_settings row yet.
// Keep them the same as the COALESCE defaults in utils/notification_checker.go.
const (
	defaultDaysBeforeExpiry = 7
	defaultDailyCheckTime   = "08:00"
	maxDaysBeforeExpiry     = 30
)

var checkTimePattern = regexp.MustCompile(`^([01][0-9]|2[0-3]):[0-5][0-9]$`)

type ReminderSettings struct {
	DaysBeforeExpiry int    `json:"daysBeforeExpiry"`
	DailyCheckTime   string `json:"dailyCheckTime"` // "HH:MM", Europe/Copenhagen
}

// GET /v1/company/:companyID/reminder-settings (ejer/leder)
// Returns the company's reminder settings, or the defaults if none are saved.
func HandleGetReminderSettings(c *gin.Context) {
	settings := ReminderSettings{
		DaysBeforeExpiry: defaultDaysBeforeExpiry,
		DailyCheckTime:   defaultDailyCheckTime,
	}

	err := database.DB.QueryRowContext(
		c.Request.Context(),
		`SELECT days_before_expiry, to_char(daily_check_time, 'HH24:MI')
		 FROM reminder_settings
		 WHERE company_id = $1::uuid`,
		c.Param("companyID"),
	).Scan(&settings.DaysBeforeExpiry, &settings.DailyCheckTime)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		log.Println("Get reminder settings error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not load reminder settings",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Reminder settings loaded",
		"data":    settings,
	})
}

// PUT /v1/company/:companyID/reminder-settings (ejer/leder)
// Body: { "daysBeforeExpiry": 7, "dailyCheckTime": "08:00" }
func HandleUpdateReminderSettings(c *gin.Context) {
	var body ReminderSettings
	if err := c.ShouldBindJSON(&body); err != nil ||
		body.DaysBeforeExpiry < 0 || body.DaysBeforeExpiry > maxDaysBeforeExpiry ||
		!checkTimePattern.MatchString(body.DailyCheckTime) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "daysBeforeExpiry must be 0-30 and dailyCheckTime must be HH:MM",
			"data":    gin.H{},
		})
		return
	}

	_, err := database.DB.ExecContext(
		c.Request.Context(),
		`INSERT INTO reminder_settings (company_id, days_before_expiry, daily_check_time)
		 VALUES ($1::uuid, $2, $3::time)
		 ON CONFLICT (company_id) DO UPDATE
		 SET days_before_expiry = EXCLUDED.days_before_expiry,
		     daily_check_time   = EXCLUDED.daily_check_time`,
		c.Param("companyID"),
		body.DaysBeforeExpiry,
		body.DailyCheckTime,
	)
	if err != nil {
		log.Println("Update reminder settings error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Could not save reminder settings",
			"data":    gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Reminder settings saved",
		"data":    body,
	})
}
