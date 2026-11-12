import http from '../../http/http';

function getResponseData(response) {
    const body = response.data;
    if (!body?.success) {
        throw new Error(body?.message || 'Anmodningen kunne ikke gennemføres.');
    }
    return body.data;
}

// Virksomheder hvor brugeren er leder
export async function getManagedCompanies() {
    const response = await http.get('/companies');
    const data = getResponseData(response);
    return Array.isArray(data) ? data : [];
}

// Virksomhedens oplysninger og alle dens medarbejdere: { company, members }
export async function getCompanyDetails(companyId) {
    const response = await http.get(`/companies/${companyId}`);
    const data = getResponseData(response);
    return {
        company: data?.company ?? null,
        members: Array.isArray(data?.members) ? data.members : [],
    };
}


export async function getCompanyInvitations(companyID){
    const response = await http.get(`/company/${companyID}/invitations`);
    const data = getResponseData(response);
    return Array.isArray(data) ? data : [];
}

export async function createInvitation(companyID, {email, role}) {
    const response = await http.post(`/company/${companyID}/invitations`, {
        email: email.trim().toLowerCase(),
        role,
    });
    return getResponseData(response);
}

export async function cancelInvitation(companyID, invitationID) {
    const response = await http.delete(`/company/${companyID}/invitations/${invitationID}`);
    return getResponseData(response);
}

export async function promoteMember(companyID, memberID) {
    const response = await http.post(`/company/${companyID}/members/${memberID}/promote`);
    return getResponseData(response);
}

export async function removeMember(companyID, memberID) {
    const response = await http.delete(`/company/${companyID}/members/${memberID}`);
    return getResponseData(response);
}
