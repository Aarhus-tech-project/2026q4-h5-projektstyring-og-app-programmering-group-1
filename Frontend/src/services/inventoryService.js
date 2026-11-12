import http from '../../http/http';



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

// asset comes from expo-image-picker. Sent as multipart and stored as a blob in the database (like the avatar).
export async function uploadItemImage(companyId, itemId, asset) {
    const mimeType = asset.mimeType || 'image/jpeg';
    const extension = mimeType.split('/')[1] || 'jpg';

    const formData = new FormData();
    formData.append('image', {
        uri: asset.uri,
        name: asset.fileName || `item.${extension}`,
        type: mimeType,
    });

    const response = await http.put(`/companies/${companyId}/items/${itemId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
    });
    return getResponseData(response);
}

export async function deleteItemImage(companyId, itemId) {
    const response = await http.delete(`/companies/${companyId}/items/${itemId}/image`);
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
