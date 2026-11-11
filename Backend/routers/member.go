package routers

import (
	"database/sql"
	"errors"
	"log"
	"net/http"

	"lagerklar/backend/database"
	"lagerklar/backend/model"

	"github.com/gin-gonic/gin"
)

func canRemoveRole(removerRole string, memberRole string) bool {
	switch removerRole {
	case model.RoleEjer:
		return memberRole == model.RoleLeder || memberRole == model.RoleMedarbejder
	case model.RoleLeder:
		return memberRole == model.RoleMedarbejder
	default:
		return false
	}
}

func HandleListMembers(c *gin.Context) {
	companyID := c.Param("companyID")
	companyRole := c.GetString("companyRole")

	rows, err := database.DB.QueryContext(
		c.Request.Context(),
		`SELECT u.id::text, u.name, u.email, cm.role, cm.created_at
		 FROM company_memberships cm
		 JOIN users u ON u.id = cm.user_id
		 WHERE cm.company_id = $1::uuid
		   AND u.is_active
		   AND ($2 = 'ejer' OR cm.role = 'medarbejder')
		 ORDER BY u.name`,
		companyID,
		companyRole,
	)
	if err != nil {
		log.Println("List members database error:", err)
		writeListMembersFailed(c)
		return
	}
	defer rows.Close()

	members := make([]model.CompanyMember, 0)
	for rows.Next() {
		var member model.CompanyMember
		if err := rows.Scan(
			&member.UserID,
			&member.Name,
			&member.Email,
			&member.Role,
			&member.JoinedAt,
		); err != nil {
			writeListMembersFailed(c)
			return
		}
		members = append(members, member)
	}
	if err := rows.Err(); err != nil {
		writeListMembersFailed(c)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Members loaded",
		"data":    members,
	})
}

func writeListMembersFailed(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, gin.H{
		"success": false,
		"message": "Could not load members",
		"data":    gin.H{},
	})
}

func HandleRemoveMember(c *gin.Context) {
	companyID := c.Param("companyID")
	memberID := c.Param("memberID")
	companyRole := c.GetString("companyRole")

	tx, err := database.DB.BeginTx(c.Request.Context(), nil)
	if err != nil {
		writeRemoveMemberFailed(c)
		return
	}
	defer tx.Rollback()

	var memberRole string
	err = tx.QueryRowContext(
		c.Request.Context(),
		`SELECT role
			FROM company_memberships
			WHERE company_id = $1::uuid AND user_id::text = $2
			FOR UPDATE`,
		companyID,
		memberID,
	).Scan(&memberRole)
	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Member not found",
			"data":    gin.H{},
		})
		return
	}
	if err != nil {
		log.Println("Remove member database error:", err)
		writeRemoveMemberFailed(c)
		return
	}

	if !canRemoveRole(companyRole, memberRole) {
		c.JSON(http.StatusForbidden, gin.H{
			"sucess":  false,
			"message": "You do not have permission to remove this member",
			"data":    gin.H{},
		})
		return
	}

	_, err = tx.ExecContext(
		c.Request.Context(),
		`DELETE FROM company_memberships
		 WHERE company_id = $1::uuid AND user_id::text = $2`,
		companyID,
		memberID,
	)
	if err != nil {
		log.Println("Remove member database error:", err)
		writeRemoveMemberFailed(c)
		return
	}

	result, err := tx.ExecContext(
		c.Request.Context(),
		`UPDATE company_invitations
		 SET status = 'cancelled'
		 WHERE company_id = $1::uuid
		   AND invited_by::text = $2
		   AND status = 'pending'`,
		companyID,
		memberID,
	)
	if err != nil {
		log.Println("Cancel removed member invitation database error:", err)
		writeRemoveMemberFailed(c)
		return
	}
	cancelled, err := result.RowsAffected()
	if err != nil {
		writeRemoveMemberFailed(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Member removed",
		"data": gin.H{
			"user_id":               memberID,
			"cancelled_invitations": cancelled,
		},
	})
}

func writeRemoveMemberFailed(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, gin.H{
		"success": false,
		"message": "Could not remove member",
		"data":    gin.H{},
	})
}
