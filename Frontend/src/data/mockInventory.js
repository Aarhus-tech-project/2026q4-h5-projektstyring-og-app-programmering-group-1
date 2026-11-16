// Returns a local 'YYYY-MM-DD' date, so the demo data never goes out of date
function daysFromNow(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
}

// Demo data until the backend has inventory endpoints
const mockInventory = [
    { id: 'item-1', companyId: 'company-1', name: 'Sødmælk', category: 'Mejeri', quantity: 2, unit: 'L', minQuantity: 6, nextExpiryDate: daysFromNow(3) },
    { id: 'item-2', companyId: 'company-1', name: 'Smør', category: 'Mejeri', quantity: 8, unit: 'stk', minQuantity: 4, nextExpiryDate: daysFromNow(21) },
    { id: 'item-3', companyId: 'company-1', name: 'Piskefløde', category: 'Mejeri', quantity: 0, unit: 'L', minQuantity: 4, nextExpiryDate: null },
    { id: 'item-4', companyId: 'company-1', name: 'Yoghurt', category: 'Mejeri', quantity: 5, unit: 'L', minQuantity: 2, nextExpiryDate: daysFromNow(-1) },
    { id: 'item-5', companyId: 'company-1', name: 'Hvedemel', category: 'Tørvarer', quantity: 15, unit: 'kg', minQuantity: 5, nextExpiryDate: daysFromNow(120) },
    { id: 'item-6', companyId: 'company-1', name: 'Pasta', category: 'Tørvarer', quantity: 3, unit: 'kg', minQuantity: 5, nextExpiryDate: daysFromNow(200) },
    { id: 'item-7', companyId: 'company-1', name: 'Olivenolie', category: 'Tørvarer', quantity: 1, unit: 'L', minQuantity: 2, nextExpiryDate: daysFromNow(300) },
    { id: 'item-8', companyId: 'company-1', name: 'Kyllingebryst', category: 'Kød', quantity: 4, unit: 'kg', minQuantity: 3, nextExpiryDate: daysFromNow(1) },
    { id: 'item-9', companyId: 'company-1', name: 'Hakket oksekød', category: 'Kød', quantity: 0, unit: 'kg', minQuantity: 2, nextExpiryDate: null },
    { id: 'item-10', companyId: 'company-1', name: 'Laks', category: 'Fisk', quantity: 2, unit: 'kg', minQuantity: 2, nextExpiryDate: daysFromNow(0) },
    { id: 'item-11', companyId: 'company-1', name: 'Tomater', category: 'Grønt', quantity: 6, unit: 'kg', minQuantity: 3, nextExpiryDate: daysFromNow(5) },
    { id: 'item-12', companyId: 'company-1', name: 'Løg', category: 'Grønt', quantity: 10, unit: 'kg', minQuantity: 4, nextExpiryDate: daysFromNow(30) },
    { id: 'item-13', companyId: 'company-1', name: 'Kaffebønner', category: 'Drikkevarer', quantity: 7, unit: 'kg', minQuantity: 3, nextExpiryDate: daysFromNow(90) },
];

export default mockInventory;
