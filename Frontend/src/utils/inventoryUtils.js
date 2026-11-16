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

// Days from today until a 'YYYY-MM-DD' date (negative = in the past), or null without a date
export function getDaysUntilDate(dateString) {
    if (!dateString) {
        return null;
    }

    const [year, month, day] = dateString.split('-').map(Number);
    const expiry = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Math.round((expiry - today) / MS_PER_DAY);
}

export const getDaysUntilExpiry = (item) => getDaysUntilDate(item.nextExpiryDate);

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

// Standard categories every restaurant gets. They are only created in the backend the first time
// they are used (POST /categories returns the existing one if the name is taken, so it is safe).
export const DEFAULT_CATEGORIES = ['Kød', 'Frugt og grønt', 'Frostvarer'];

const isDefaultCategory = (name) => DEFAULT_CATEGORIES.some((entry) => entry.toLowerCase() === name.toLowerCase());

// Category choices for the forms: the standard ones first (id is null until used), then the company's own.
// Each entry: { id, name, isDefault }
export function buildCategoryOptions(categories) {
    const byName = new Map(categories.map((category) => [category.name.toLowerCase(), category]));

    const defaults = DEFAULT_CATEGORIES.map((name) => ({
        id: byName.get(name.toLowerCase())?.id ?? null,
        name,
        isDefault: true,
    }));

    const custom = categories
        .filter((category) => !isDefaultCategory(category.name))
        .map((category) => ({ id: category.id, name: category.name, isDefault: false }))
        .sort((a, b) => a.name.localeCompare(b.name, 'da'));

    return [...defaults, ...custom];
}

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

const MONTHS = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];

// "15. nov." for a 'YYYY-MM-DD' date
export function formatShortDate(dateString) {
    const [, month, day] = dateString.split('-').map(Number);
    return `${day}. ${MONTHS[month - 1]}`;
}

// "15. nov. · om 3 dage" for a 'YYYY-MM-DD' expiry date; null without a date
export function formatExpiryDate(dateString) {
    const days = getDaysUntilDate(dateString);
    if (days === null) return null;

    const date = formatShortDate(dateString);

    if (days < -1) return `${date} · udløbet for ${-days} dage siden`;
    if (days === -1) return `${date} · udløbet i går`;
    if (days === 0) return `${date} · i dag`;
    if (days === 1) return `${date} · i morgen`;
    return `${date} · om ${days} dage`;
}

// The item's next expiry date, formatted as above (item details)
export const formatExpiry = (item) => formatExpiryDate(item.nextExpiryDate);

// Colour for an expiry date: red today/tomorrow/expired, violet within EXPIRY_WARNING_DAYS
export function getExpiryTone(dateString) {
    const days = getDaysUntilDate(dateString);
    if (days === null) return STATUS_TONES.NONE;
    if (days <= 1) return STATUS_TONES.RED;
    if (days <= EXPIRY_WARNING_DAYS) return STATUS_TONES.VIOLET;
    return STATUS_TONES.NONE;
}
export function getInventoryCounts(items) {
    return {
        [FILTERS.LOW]: items.filter(isLowStock).length,
        [FILTERS.OUT]: items.filter(isOutOfStock).length,
        [FILTERS.SHOPPING]: items.filter(needsPurchase).length,
        [FILTERS.EXPIRING]: items.filter(isExpiringSoon).length,
    };
}
