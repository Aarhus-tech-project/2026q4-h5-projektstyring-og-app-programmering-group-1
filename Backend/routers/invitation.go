package routers

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"strings"

	"lagerklar/backend/database"
	"lagerklar/backend/model"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
)

type CreateInvitationRequest struct {
	Email string `json:"email" binding:"required,email"`
	Role  string `json:"role" binding:"required,oneof=leder medarbejder"`
}

// canInviteRole decides which roles an inviter may give to the person they invite.
func canInviteRole(inviterRole string, invitedRole string) bool {
	switch inviterRole {
	case model.RoleEjer:
		return invitedRole == model.RoleLeder || invitedRole == model.RoleMedarbejder
	case model.RoleLeder:
		return invitedRole == model.RoleMedarbejder
	default:
		return false
	}
}

// POST /v1/company/:companyID/invitations
func HandleCreateInvitation(c *gin.Context) {
	var req CreateInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "A valid email and a role of leder or medarbejder are required",
			"data":    gin.H{},
		})
		return
	}

	companyID := c.Param("companyID")
	userID := c.GetString("userID")
	email := strings.ToLower(strings.TrimSpace(req.Email))

	if !canInviteRole(c.GetString("companyRole"), req.Role) {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "You are not allowed to invite someone with this role",
			"data":    gin.H{},
		})
		return
	}

	tx, err := database.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		writeCreateInvitationFailed(c)
		return
	}
	defer tx.Rollback()

	var isMember bool
	err = tx.QueryRowContext(
		c.Request.Context(),
		`SELECT EXISTS (
			SELECT 1
			FROM company_memberships cm
			WHERE cm.company_id = $1::uuid AND cm.user_id = u.id
		 )
		 FROM users u
		 WHERE lower(u.email) = $2 AND u.is_active`,
		companyID,
		email,
	).Scan(&isMember)
	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "No user with this email exists",
			"data":    gin.H{},
		})
		return
	}
	if err != nil {
		log.Println("Check invited user database error:", err)
		writeCreateInvitationFailed(c)
		return
	}
	if isMember {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"message": "This person is already a member of the company",
			"data":    gin.H{},
		})
		return
	}

	// An expired invitation must not stop the person from being invited again
	_, err = tx.ExecContext(
		c.Request.Context(),
		`UPDATE company_invitations
		 SET status = 'cancelled'
		 WHERE company_id = $1::uuid
		   AND lower(email) = $2
		   AND status = 'pending'
		   AND expires_at <= now()`,
		companyID,
		email,
	)
	if err != nil {
		log.Println("Cancel expired invitations database error:", err)
		writeCreateInvitationFailed(c)
		return
	}

	var invitation model.CompanyInvitation
	err = tx.QueryRowContext(
		c.Request.Context(),
		`INSERT INTO company_invitations (company_id, email, role, invited_by, expires_at)
		 VALUES ($1::uuid, $2, $3, $4::uuid, now() + INTERVAL '7 days')
		 RETURNING id::text, company_id::text, email, role, status, created_at, expires_at`,
		companyID,
		email,
		req.Role,
		userID,
	).Scan(
		&invitation.ID,
		&invitation.CompanyID,
		&invitation.Email,
		&invitation.Role,
		&invitation.Status,
		&invitation.CreatedAt,
		&invitation.ExpiresAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "This person already has a pending invitation",
				"data":    gin.H{},
			})
			return
		}
		log.Println("Create invitation database error:", err)
		writeCreateInvitationFailed(c)
		return
	}

	if err := tx.Commit(); err != nil {
		writeCreateInvitationFailed(c)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Invitation created successfully",
		"data":    invitation,
	})
}

func writeCreateInvitationFailed(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, gin.H{
		"success": false,
		"message": "Could not create invitation",
		"data":    gin.H{},
	})
}

func HandleListMyInvitations(c *gin.Context) {
	userID := c.GetString("userID")

	rows, err := database.DB.QueryContext(
		c.Request.Context(),
		`SELECT i.id::text, i.company_id::text, c.name, i.role, inviter.name, i.expires_at
		 FROM users u
		 JOIN company_invitations i ON lower(i.email) = lower(u.email)
		 JOIN companies c ON c.id = i.company_id
		 JOIN users inviter ON inviter.id = i.invited_by
		 WHERE u.id = $1::uuid
		   AND u.is_active
		   AND i.status = 'pending'
		   AND i.expires_at > now()
		 ORDER BY i.created_at`,
		userID,
	)
	if err != nil {
		log.Println("List invitations databsase error:", err)
		writeListInvitationsFailed(c)
		return
	}
	defer rows.Close()

	invitations := make([]model.ReceivedInvitation, 0)
	for rows.Next() {
		var invitation model.ReceivedInvitation
		if err := rows.Scan(
			&invitation.ID,
			&invitation.CompanyID,
			&invitation.CompanyName,
			&invitation.Role,
			&invitation.InvitedByName,
			&invitation.ExpiresAt,
		); err != nil {
			writeListInvitationsFailed(c)
			return
		}
		invitations = append(invitations, invitation)
	}
	if err := rows.Err(); err != nil {
		writeListInvitationsFailed(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Invitations loaded",
		"data":    invitations,
	})
}

func writeListInvitationsFailed(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, gin.H{
		"success": false,
		"message": "Could not load invitations",
		"data":    gin.H{},
	})
}

func HandleAcceptInvitation(c *gin.Context) {
	invitationID := c.Param("invitationID")
	userID := c.GetString("userID")

	tx, err := database.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		writeAcceptInvitationFailed(c)
		return
	}
	defer tx.Rollback()

	var companyID string
	var role string
	err = tx.QueryRowContext(
		c.Request.Context(),
		`UPDATE company_invitations i
		 SET status = 'accepted', accepted_at = now()
		 FROM users u
		 WHERE i.id::text = $1
		   AND u.id = $2::uuid
		   AND u.is_active
		   AND lower(i.email) = lower(u.email)
		   AND i.status = 'pending'
		   AND i.expires_at > now()
		 RETURNING i.company_id::text, i.role`,
		invitationID,
		userID,
	).Scan(&companyID, &role)
	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Invitation not found",
			"data":    gin.H{},
		})
		return
	}
	if err != nil {
		log.Println("Accept invitation databse error:", err)
		writeAcceptInvitationFailed(c)
		return
	}

	_, err = tx.ExecContext(
		c.Request.Context(),
		`INSERT INTO company_memberships (company_id, user_id, role)
			VALUES ($1::uuid, $2::uuid, $3)`,
		companyID,
		userID,
		role,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "You are already a member of this company",
				"data":    gin.H{},
			})
			return
		}
		log.Println("Create membership from invitation database:", err)
		writeAcceptInvitationFailed(c)
		return
	}

	rows, err := tx.QueryContext(
		c.Request.Context(),
		`SELECT c.id::text, c.name, COALESCE(c.cvr, ''), COALESCE(c.address, ''), cm.role, c.created_at
			FROM company_memberships cm
			JOIN companies c ON c.id = cm.company_id
			WHERE cm.user_id = $1::uuid
			ORDER BY c.name`,
		userID,
	)
	if err != nil {
		log.Println("Load Company memberships database error", err)
		writeAcceptInvitationFailed(c)
		return
	}
	defer rows.Close()

	companies := make([]CompanyAccess, 0)
	for rows.Next() {
		var company CompanyAccess
		if err := rows.Scan(
			&company.ID,
			&company.Name,
			&company.CVR,
			&company.Address,
			&company.Role,
			&company.CreatedAt,
		); err != nil {
			writeAcceptInvitationFailed(c)
			return
		}
		companies = append(companies, company)
	}
	if err := rows.Err(); err != nil {
		writeAcceptInvitationFailed(c)
		return
	}

	if err := tx.Commit(); err != nil {
		writeAcceptInvitationFailed(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Invitation accepted",
		"data":    companies,
	})
}

func writeAcceptInvitationFailed(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, gin.H{
		"success": false,
		"message": "Could not accept invitation",
		"data":    gin.H{},
	})
}
