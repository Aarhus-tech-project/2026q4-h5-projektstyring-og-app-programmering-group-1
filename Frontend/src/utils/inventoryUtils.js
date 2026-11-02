const MS_PER_DAY = 24 * 60 * 60 * 1000; // Number of milliseconds in a day

export const EXPIRY_WARNING_DAYS = 7; //Should be changed to user settings later

export const FILTERS = {
    ALL: 'all',
    LOW: 'low',
    OUT: 'out',
    SHOPPING: 'shopping',
    EXPIRING: 'expiring',
};

export const isOutOfStock = (item) => item.quantity === 0;
export const isLowStock = (item) => item.quantity > 0 &&item.quantity <= item.minQuantity;
export const needsPurchase = (item) => item.quantity < item.minQuantity;

export function getDaysUntilExpiry(item) {
    if (!item.nextExpiryDate) {
        return null;
    }

    const [year, month, day] = item.nextExpiryDate.split('-').map(Number);
    const expiry = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Math.round((expiry - today) / MS_PER_DAY);
}

export function isExpiringSoon(item) {
    const days = getDaysUntilExpiry(item);

    return item.quantity > 0 && days !== null && days <= EXPIRY_WARNING_DAYS;
}

export function getExpiryText(item) {
    if (!isExpiringSoon(item)) {
        return null;
    }

    const days = getDaysUntilExpiry(item);

    if (days < 0) return 'Udløbt';
    if (days === 0) return 'Udløber i dag';
    if (days === 1) return 'Udløber i morgen';

    return `Udløber om ${days} dage`;
}

const FILTER_CHECKS = {
    [FILTERS.ALL]: () => true,
    [FILTERS.LOW]: isLowStock,
    [FILTERS.OUT]: isOutOfStock,
    [FILTERS.SHOPPING]: needsPurchase,
    [FILTERS.EXPIRING]: isExpiringSoon,
};

export function getInventoryCounts(items) {
    return {
        [FILTERS.LOW]: items.filter(isLowStock).length,
        [FILTERS.OUT]: items.filter(isOutOfStock).length,
        [FILTERS.SHOPPING]: items.filter(needsPurchase).length,
        [FILTERS.EXPIRING]: items.filter(isExpiringSoon).length,
    };
}

export function getVisibleItems(items, filter, search) {
    const query = search.trim().toLowerCase();

    return items
        .filter(FILTER_CHECKS[filter])
        .filter((item) =>
            item.name.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query)
        )
        .sort((a, b) => a.name.localeCompare(b.name, 'da'));
}
