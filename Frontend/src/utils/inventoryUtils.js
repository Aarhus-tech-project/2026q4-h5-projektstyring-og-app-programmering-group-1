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

// Status shown on each item row. Higher level = more urgent (used for sorting).
// tone maps to a colour in inventoryStyles (red = act now, violet = expires soon, amber = low stock).
export const STATUS_TONES = {
    NONE: 'none',
    RED: 'red',
    VIOLET: 'violet',
    AMBER: 'amber',
};

export function getItemStatus(item) {
    const days = getDaysUntilExpiry(item);

    if (isOutOfStock(item)) return { level: 3, tone: STATUS_TONES.RED, text: 'Ikke på lager' };
    if (days !== null && days < 0) return { level: 3, tone: STATUS_TONES.RED, text: 'Udløbet' };
    if (days === 0) return { level: 3, tone: STATUS_TONES.RED, text: 'Udløber i dag' };
    if (days === 1) return { level: 3, tone: STATUS_TONES.RED, text: 'Udløber i morgen' };
    if (days !== null && days <= EXPIRY_WARNING_DAYS) {
        return { level: 2, tone: STATUS_TONES.VIOLET, text: `Udløber om ${days} dage` };
    }
    if (isLowStock(item)) return { level: 1, tone: STATUS_TONES.AMBER, text: 'Lav beholdning' };

    return { level: 0, tone: STATUS_TONES.NONE, text: getCategoryName(item) };
}

export const getCategoryName = (item) => item.category || 'Uden kategori';

// Quantities come back as numbers that may have decimals (NUMERIC in the database).
export function formatNumber(value) {
    const number = Number(value) || 0;
    const rounded = Math.round(number * 1000) / 1000;
    return String(rounded).replace('.', ',');
}

// "pakke" is the only unit with a Danish plural form
export function formatUnit(unit, quantity) {
    if (unit === 'pakke' && Number(quantity) !== 1) return 'pakker';
    return unit;
}

export const formatAmount = (quantity, unit) => `${formatNumber(quantity)} ${formatUnit(unit, quantity)}`;

const byName = (a, b) => a.name.localeCompare(b.name, 'da');

// Most urgent first, then alphabetical
export const byUrgency = (a, b) => (getItemStatus(b).level - getItemStatus(a).level) || byName(a, b);

// Splits items into the "Kræver handling" and "På lager" sections of the Varer tab
export function getItemSections(items, category, search) {
    const query = search.trim().toLowerCase();

    const visible = items.filter((item) =>
        (category === null || getCategoryName(item) === category) &&
        (!query || item.name.toLowerCase().includes(query))
    );

    const urgent = visible.filter((item) => getItemStatus(item).level > 0).sort(byUrgency);
    const inStock = visible.filter((item) => getItemStatus(item).level === 0).sort(byName);

    return [
        { key: 'urgent', title: 'Kræver handling', data: urgent },
        { key: 'ok', title: 'På lager', data: inStock },
    ].filter((section) => section.data.length > 0);
}

export const needsAttention = (item) => getItemStatus(item).level > 0;

export function getInventoryCounts(items) {
    return {
        [FILTERS.LOW]: items.filter(isLowStock).length,
        [FILTERS.OUT]: items.filter(isOutOfStock).length,
        [FILTERS.SHOPPING]: items.filter(needsPurchase).length,
        [FILTERS.EXPIRING]: items.filter(isExpiringSoon).length,
    };
}
