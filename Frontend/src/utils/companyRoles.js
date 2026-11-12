// Roller i en virksomhed. Kun ejer og leder kan se virksomhedens detaljer og medarbejdere.
export const ROLES = {
    OWNER: 'ejer',
    MANAGER: 'leder',
    EMPLOYEE: 'medarbejder',
};

const ROLE_LABELS = {
    [ROLES.OWNER]: 'Ejer',
    [ROLES.MANAGER]: 'Leder',
    [ROLES.EMPLOYEE]: 'Medarbejder',
};

export const getRoleLabel = (role) => ROLE_LABELS[role] ?? role ?? '';

export const isCompanyManager = (role) => role === ROLES.OWNER || role === ROLES.MANAGER;

export const getInvitableRoles = (myRole) => {
    if (myRole === ROLES.OWNER) return [ROLES.MANAGER, ROLES.EMPLOYEE];
    if (myRole === ROLES.MANAGER) return [ROLES.EMPLOYEE];
    return [];
}

export const canPromote = (myRole, memberRole) =>
    myRole === ROLES.OWNER && memberRole === ROLES.EMPLOYEE;

export const canRemove = (myRole, memberRole) => {
    if (myRole === ROLES.OWNER) return memberRole === ROLES.MANAGER || memberRole === ROLES.EMPLOYEE;
    if (myRole === ROLES.MANAGER) return memberRole === ROLES.EMPLOYEE;
    return false;
}

export const getInitials = (name = '') =>
    name
        .split(' ')
        .filter((word) => /^[A-Za-zÆØÅæøå0-9]/.test(word))
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('') || '?';

export const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
};
