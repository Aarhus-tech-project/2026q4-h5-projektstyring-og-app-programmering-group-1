package routers

import (
	"testing"

	"lagerklar/backend/model"
)

func TestCanInviteRole(t *testing.T) {
	tests := []struct {
		inviter string
		invited string
		allowed bool
	}{
		{model.RoleEjer, model.RoleLeder, true},
		{model.RoleEjer, model.RoleMedarbejder, true},
		{model.RoleEjer, model.RoleEjer, false},
		{model.RoleLeder, model.RoleMedarbejder, true},
		{model.RoleLeder, model.RoleLeder, false},
		{model.RoleLeder, model.RoleEjer, false},
		{model.RoleMedarbejder, model.RoleMedarbejder, false},
		{model.RoleMedarbejder, model.RoleLeder, false},
		{model.RoleMedarbejder, model.RoleEjer, false},
		{"", model.RoleMedarbejder, false},
	}

	for _, test := range tests {
		got := canInviteRole(test.inviter, test.invited)
		if got != test.allowed {
			t.Errorf("canInviteRole(%q, %q) = %v, want %v", test.inviter, test.invited, got, test.allowed)
		}
	}
}
