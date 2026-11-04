import mockInventory from '../data/mockInventory';

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
}
