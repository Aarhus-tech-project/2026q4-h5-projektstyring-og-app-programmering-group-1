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
