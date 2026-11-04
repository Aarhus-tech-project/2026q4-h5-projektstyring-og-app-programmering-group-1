import mockInventory from '../data/mockInventory';

let items = mockInventory;

export async function getInventoryItems(companyId) {
    // sim of api change to real API later
    return items.filter((item) => item.companyId === companyId);
}

export async function updateItemQuantity(itemId, quantity) {
    //SIM FOR API CHANGE TO REAL API LATER
    items = items.map((item) => (item.id === itemId ? { ...item, quantity } : item));
}