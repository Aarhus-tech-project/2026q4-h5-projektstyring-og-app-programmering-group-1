import http from '../../http/http';

// Every company gets its own copy of the demo items until the backend has inventory endpoints
const itemsByCompany = {};

function getCompanyItems(companyId) {
    if (!itemsByCompany[companyId]) {
        itemsByCompany[companyId] = mockInventory.map((item) => ({
            ...item,
            id: `${companyId}-${item.id}`,
            companyId,
        }));
    }

    return itemsByCompany[companyId];
}

export async function getInventoryItems(companyId) {
    return getCompanyItems(companyId);
}

export async function updateItemQuantity(companyId, itemId, quantity) {
    itemsByCompany[companyId] = getCompanyItems(companyId).map((item) =>
        item.id === itemId ? { ...item, quantity } : item
    );
function getResponseData(response) {
    const body = response.data;
    if (!body?.success) {
        throw new Error(body?.message || 'Anmodningen kunne ikke gennemføres.');
    }
    return body.data;
}

export async function getInventoryItems(companyId, search = '') {
    const response = await http.get(`/companies/${companyId}/items`, {
        params: search ? { search } : {},
    });
    return getResponseData(response);
}

export async function createInventoryItem(companyId, item) {
    const response = await http.post(`/companies/${companyId}/items`, item);
    return getResponseData(response);
}

export async function updateInventoryItem(companyId, itemId, changes) {
    const response = await http.patch(
        `/companies/${companyId}/items/${itemId}`,
        changes
    );
    return getResponseData(response);
}

export async function deleteInventoryItem(companyId, itemId) {
    const response = await http.delete(
        `/companies/${companyId}/items/${itemId}`
    );
    return getResponseData(response);
}

export async function receiveInventoryBatch(companyId, itemId, batch) {
    const response = await http.post(
        `/companies/${companyId}/items/${itemId}/batches`,
        batch
    );
    return getResponseData(response);
}

export async function adjustInventoryStock(companyId, itemId, adjustment) {
    const response = await http.patch(
        `/companies/${companyId}/items/${itemId}/stock`,
        adjustment
    );
    return getResponseData(response);
}

export async function getShoppingList(companyId) {
    const response = await http.get(
        `/companies/${companyId}/shopping-list`
    );
    return getResponseData(response);
}

export async function addShoppingListItem(companyId, itemId, quantity = 1) {
    const response = await http.post(
        `/companies/${companyId}/shopping-list/items`,
        { itemId, quantity }
    );
    return getResponseData(response);
}

export async function updateShoppingListItem(companyId, lineId, quantity) {
    const response = await http.patch(
        `/companies/${companyId}/shopping-list/items/${lineId}`,
        { quantity }
    );
    return getResponseData(response);
}

export async function deleteShoppingListItem(companyId, lineId) {
    const response = await http.delete(
        `/companies/${companyId}/shopping-list/items/${lineId}`
    );
    return getResponseData(response);
}

export async function getInventoryCategories(companyId) {
    const response = await http.get(`/companies/${companyId}/categories`);
    return getResponseData(response);
}

export async function createInventoryCategory(companyId, name) {
    const response = await http.post(
        `/companies/${companyId}/categories`,
        { name }
    );
    return getResponseData(response);
}
