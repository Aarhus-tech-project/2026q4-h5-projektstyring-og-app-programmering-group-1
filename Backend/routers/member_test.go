package routers

import (
	"testing"

	"lagerklar/backend/model"
)

func TestCanRemoveRole(t *testing.T) {
	tests := []struct {
		remover string
		member  string
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
		got := canRemoveRole(test.remover, test.member)
		if got != test.allowed {
			t.Errorf("canRemoveRole(%q, %q) = %v, want %v", test.remover, test.member, got, test.allowed)
		}
	}
}
