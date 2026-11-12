import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, SectionList, Text, TextInput, View } from 'react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, CircleX, Clock, PackageX, Plus, Search, ShoppingCart, TrendingDown } from 'lucide-react-native';
import CategoryManager from '../components/inventory/CategoryManager';
import InventoryItemRow from '../components/inventory/InventoryItemRow';
import InventoryOverviewRow from '../components/inventory/InventoryOverviewRow';
import InventorySheet from '../components/inventory/InventorySheet';
import InventorySummaryCard from '../components/inventory/InventorySummaryCard';
import ItemDetails from '../components/inventory/ItemDetails';
import ItemForm, { FORM_MODES, IMAGE_CHANGE } from '../components/inventory/ItemForm';
import ReceiveForm from '../components/inventory/ReceiveForm';
import UseForm from '../components/inventory/UseForm';
import { getErrorMessage } from '../../http/http';
import {
    addShoppingListItem,
    adjustInventoryStock,
    createInventoryCategory,
    createInventoryItem,
    deleteItemImage,
    getInventoryCategories,
    getInventoryItems,
    getItemBatches,
    getShoppingList,
    receiveInventoryBatch,
    updateInventoryItem,
    updateShoppingListItem,
    uploadItemImage,
} from '../services/inventoryService';
import styles, { inventoryColors } from '../styles/inventoryStyles';
import {
    STATUS_TONES,
    buildCategoryOptions,
    byUrgency,
    getCategoryName,
    getItemSections,
    getItemStatus,
    isExpiringSoon,
    isLowStock,
    isOutOfStock,
    needsAttention,
} from '../utils/inventoryUtils';

const TABS = {
    OVERVIEW: 'overview',
    ITEMS: 'items',
};

const CARDS = {
    SHOPPING: 'shopping',
    LOW: 'low',
    OUT: 'out',
    EXPIRING: 'expiring',
};

// The Indkøbsliste card opens the shopping list screen; the other cards filter the list under the cards
const SUMMARY_CARDS = [
    { key: CARDS.LOW, label: 'Lav beholdning', icon: TrendingDown, color: inventoryColors.amber, softColor: inventoryColors.amberSoft },
    { key: CARDS.SHOPPING, label: 'Indkøbsliste', icon: ShoppingCart, color: inventoryColors.primary, softColor: inventoryColors.primarySoft },
    { key: CARDS.OUT, label: 'Ikke på lager', icon: PackageX, color: inventoryColors.red, softColor: inventoryColors.redSoft },
    { key: CARDS.EXPIRING, label: 'Udløber snart', icon: Clock, color: inventoryColors.violet, softColor: inventoryColors.violetSoft },
];

const LOW_STOCK_STATUS = { tone: STATUS_TONES.AMBER, text: 'Lav beholdning' };

// What the bottom sheet is showing. DETAILS, EDIT and RECEIVE belong to one item; CREATE and CATEGORIES do not.
const SHEET_MODES = {
    DETAILS: 'details',
    EDIT: 'edit',
    RECEIVE: 'receive',
    USE: 'use',
    CREATE: 'create',
    CATEGORIES: 'categories',
};

const ITEM_SHEET_MODES = [SHEET_MODES.DETAILS, SHEET_MODES.EDIT, SHEET_MODES.RECEIVE, SHEET_MODES.USE];

// The shopping list endpoint groups lines by category; the overview needs one flat list
function flattenShoppingList(result) {
    if (!Array.isArray(result)) return [];

    return result.flatMap((category) =>
        (category.items || []).map((entry) => ({ ...entry, categoryName: category.categoryName }))
    );
}

export default function InventoryScreen({ navigation, route }) {
    const { companyId, companyName } = route.params;
    const insets = useSafeAreaInsets();

    const [items, setItems] = useState([]);
    const [shoppingItems, setShoppingItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasError, setHasError] = useState(false);
    const hasLoadedItems = useRef(false);

    const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);
    const [selectedCard, setSelectedCard] = useState(CARDS.LOW);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);

    // { itemId, mode, backToDetails } — backToDetails: return to the item details after receiving/editing
    const [sheet, setSheet] = useState(null);
    const [isAddingToList, setIsAddingToList] = useState(false);

    // silent = refresh in the background without replacing the screen with a spinner
    const loadItems = useCallback(async ({ silent = false } = {}) => {
        if (!silent) {
            setIsLoading(true);
            setHasError(false);
        }

        try {
            setItems(await getInventoryItems(companyId));
            hasLoadedItems.current = true;
            setHasError(false);
        } catch (error) {
            console.error('Could not load inventory: ', error);
            if (!silent) setHasError(true);
        } finally {
            setIsLoading(false);
        }
    }, [companyId]);

    const loadShoppingList = useCallback(async () => {
        try {
            setShoppingItems(flattenShoppingList(await getShoppingList(companyId)));
        } catch (error) {
            console.error('Could not load shopping list:', error);
        }
    }, [companyId]);

    const loadCategories = useCallback(async () => {
        try {
            const result = await getInventoryCategories(companyId);
            setCategories(Array.isArray(result) ? result : []);
        } catch (error) {
            console.error('Could not load categories:', error);
        }
    }, [companyId]);

    // Reload when the screen comes back into view, e.g. after the shopping list was changed
    useFocusEffect(
        useCallback(() => {
            loadItems({ silent: hasLoadedItems.current });
            loadShoppingList();
            loadCategories();
        }, [loadItems, loadShoppingList, loadCategories])
    );

    async function refresh() {
        setIsRefreshing(true);
        await Promise.all([loadItems({ silent: true }), loadShoppingList(), loadCategories()]);
        setIsRefreshing(false);
    }

    const itemsById = useMemo(
        () => Object.fromEntries(items.map((item) => [item.id, item])),
        [items]
    );

    const shoppingByItemId = useMemo(
        () => Object.fromEntries(shoppingItems.map((entry) => [entry.itemId, entry])),
        [shoppingItems]
    );

    // Always read the item from the latest list, so the sheet shows fresh numbers after Brug / Modtag
    const sheetItem = sheet?.itemId ? itemsById[sheet.itemId] : null;
    const isItemSheet = sheet !== null && ITEM_SHEET_MODES.includes(sheet.mode);
    // An item sheet closes by itself if the item disappears (e.g. archived on another phone)
    const isSheetVisible = sheet !== null && (!isItemSheet || sheetItem != null);

    const categoryOptions = useMemo(() => buildCategoryOptions(categories), [categories]);

    const itemCountByCategory = useMemo(() => {
        const counts = {};
        items.forEach((item) => {
            const name = getCategoryName(item);
            counts[name] = (counts[name] ?? 0) + 1;
        });
        return counts;
    }, [items]);

    const attentionCount = useMemo(() => items.filter(needsAttention).length, [items]);

    const cardCounts = useMemo(() => ({
        [CARDS.SHOPPING]: shoppingItems.length,
        [CARDS.LOW]: items.filter(isLowStock).length,
        [CARDS.OUT]: items.filter(isOutOfStock).length,
        [CARDS.EXPIRING]: items.filter(isExpiringSoon).length,
    }), [items, shoppingItems]);

    // Rows shown under the cards for the selected card
    const overviewRows = useMemo(() => {
        const matches = {
            [CARDS.LOW]: isLowStock,
            [CARDS.OUT]: isOutOfStock,
            [CARDS.EXPIRING]: isExpiringSoon,
        }[selectedCard];

        return items
            .filter(matches)
            .sort(byUrgency)
            .map((item) => ({
                key: item.id,
                itemId: item.id,
                name: item.name,
                imageUrl: item.imageUrl,
                status: selectedCard === CARDS.LOW ? LOW_STOCK_STATUS : getItemStatus(item),
                quantity: item.quantity,
                minQuantity: item.minQuantity,
                unit: item.unit,
            }));
    }, [selectedCard, items]);

    const categoryNames = useMemo(() => {
        const names = new Set(categories.map((category) => category.name));
        items.forEach((item) => names.add(getCategoryName(item)));
        return [...names].sort((a, b) => a.localeCompare(b, 'da'));
    }, [categories, items]);

    const sections = useMemo(
        () => getItemSections(items, selectedCategory, search),
        [items, selectedCategory, search]
    );

    // Brug: take one unit out of stock straight away (optimistic update)
    // "Brugt" opens a sheet where the amount (and the batch, with more than one) is chosen
    function openUse(item) {
        if (item.quantity <= 0) return;
        setSheet({ itemId: item.id, mode: SHEET_MODES.USE });
    }

    const sheetItemId = sheet?.itemId;
    const loadSheetBatches = useCallback(
        () => getItemBatches(companyId, sheetItemId),
        [companyId, sheetItemId]
    );

    // Save "Brugt". Without a batchId the backend takes from the batch that expires first.
    async function saveUse({ quantity, batchId }) {
        try {
            await adjustInventoryStock(companyId, sheet.itemId, {
                direction: 'minus',
                quantity,
                ...(batchId ? { batchId } : {}),
            });
        } catch (error) {
            // Shown in the form; reload in case the stock changed meanwhile (e.g. used on another phone)
            loadItems({ silent: true });
            throw new Error(getErrorMessage(error, {
                409: 'Der er ikke så meget på lager længere. Opdater og prøv igen.',
                404: 'Partiet er allerede brugt op.',
                fallback: 'Lagerbeholdningen kunne ikke opdateres.',
            }));
        }

        closeSheet();
        // The amount and the next expiry date may have changed
        await loadItems({ silent: true });
    }

    const openItem = (item) => setSheet({ itemId: item.id, mode: SHEET_MODES.DETAILS });
    // Stable so the sheet's drag handler is not rebuilt on every render
    const closeSheet = useCallback(() => setSheet(null), []);

    // From the row's "Modtag" button the sheet closes after saving; from the details it goes back to them
    const openReceive = (item, backToDetails = false) =>
        setSheet({ itemId: item.id, mode: SHEET_MODES.RECEIVE, backToDetails });

    const showDetails = () => setSheet((current) => current && { ...current, mode: SHEET_MODES.DETAILS });

    async function saveReceivedBatch(batch) {
        // The form shows the error itself, so let it throw
        await receiveInventoryBatch(companyId, sheet.itemId, batch);
        await loadItems({ silent: true });

        // Done: close the whole sheet (also when it was opened from the item details) and show the item list
        closeSheet();
        setActiveTab(TABS.ITEMS);
    }

    async function saveItemChanges(changes, imageChange) {
        const itemId = sheet.itemId;

        try {
            await updateInventoryItem(companyId, itemId, changes);
        } catch (error) {
            Alert.alert('Fejl', error.message || 'Ændringerne kunne ikke gemmes.');
            return;
        }

        try {
            if (imageChange?.type === IMAGE_CHANGE.NEW) {
                await uploadItemImage(companyId, itemId, imageChange.asset);
            } else if (imageChange?.type === IMAGE_CHANGE.REMOVE) {
                await deleteItemImage(companyId, itemId);
            }
        } catch (error) {
            Alert.alert(
                'Billedet blev ikke gemt',
                getErrorMessage(error, {
                    413: 'Ændringerne er gemt, men billedet er for stort. Vælg et billede under 5 MB.',
                    415: 'Ændringerne er gemt, men billedet skal være JPEG, PNG eller WebP.',
                    fallback: 'Ændringerne er gemt, men billedet kunne ikke gemmes. Prøv igen.',
                }),
            );
        }

        await Promise.all([loadItems({ silent: true }), loadShoppingList()]);
        showDetails();
    }

    async function createCategory(name) {
        const category = await createInventoryCategory(companyId, name);
        setCategories((current) =>
            current.some((entry) => entry.id === category.id) ? current : [...current, category]
        );
        return category;
    }

    // − / + on an item that is already on the shopping list (optimistic, reloads if the server says no)
    async function changeShoppingQuantity(entry, quantity) {
        if (quantity < 1) return;

        setShoppingItems((current) =>
            current.map((other) => (other.id === entry.id ? { ...other, quantity } : other))
        );

        try {
            await updateShoppingListItem(companyId, entry.id, quantity);
        } catch (error) {
            Alert.alert('Fejl', error.message || 'Antallet på indkøbslisten kunne ikke ændres.');
            loadShoppingList();
        }
    }

    async function addToShoppingList(quantity) {
        setIsAddingToList(true);
        try {
            await addShoppingListItem(companyId, sheet.itemId, quantity);
            await loadShoppingList();
        } catch (error) {
            Alert.alert('Fejl', error.message || 'Varen kunne ikke tilføjes til indkøbslisten.');
        } finally {
            setIsAddingToList(false);
        }
    }

    function openCreateItem() {
        setSheet({ mode: SHEET_MODES.CREATE });
        loadCategories();
    }

    const openCategories = () => setSheet({ mode: SHEET_MODES.CATEGORIES });

    const openShoppingList = () => navigation.navigate('ShoppingList', { companyId, companyName });

    // Screen 5: create the item, then upload the optional picture, then show the new item's details
    async function createItem(changes, imageChange) {
        let itemId;
        try {
            const created = await createInventoryItem(companyId, changes);
            itemId = created?.id;
        } catch (error) {
            Alert.alert('Fejl', error.message || 'Varen kunne ikke oprettes.');
            return;
        }

        if (itemId && imageChange?.type === IMAGE_CHANGE.NEW) {
            try {
                await uploadItemImage(companyId, itemId, imageChange.asset);
            } catch (error) {
                Alert.alert(
                    'Billedet blev ikke gemt',
                    getErrorMessage(error, {
                        413: 'Varen er oprettet, men billedet er for stort. Vælg et billede under 5 MB.',
                        415: 'Varen er oprettet, men billedet skal være JPEG, PNG eller WebP.',
                        fallback: 'Varen er oprettet, men billedet kunne ikke gemmes. Prøv igen under Rediger.',
                    }),
                );
            }
        }

        await loadItems({ silent: true });
        // Showing the new item confirms it was created and lets the user receive goods straight away
        setSheet(itemId ? { itemId, mode: SHEET_MODES.DETAILS } : null);
    }

    const selectedCardConfig = SUMMARY_CARDS.find((card) => card.key === selectedCard);
    const refreshControl = (
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={inventoryColors.primary} colors={[inventoryColors.primary]} />
    );

    function renderHeader() {
        return (
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Pressable
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        accessibilityRole="button"
                        accessibilityLabel="Gå tilbage">
                        <ChevronLeft size={26} color={inventoryColors.primary} />
                    </Pressable>

                    <View style={styles.titleBlock}>
                        <Text style={styles.title} accessibilityRole="header">Lager</Text>
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {`${items.length} varer`}
                            {attentionCount > 0 ? (
                                <>
                                    {' · '}
                                    <Text style={styles.subtitleAlert}>{`${attentionCount} kræver handling`}</Text>
                                </>
                            ) : ` · ${companyName}`}
                        </Text>
                    </View>
                </View>

                <View style={styles.tabs} accessibilityRole="tablist">
                    {[
                        { key: TABS.OVERVIEW, label: 'Overblik' },
                        { key: TABS.ITEMS, label: 'Varer', count: items.length },
                    ].map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <Pressable
                                key={tab.key}
                                onPress={() => setActiveTab(tab.key)}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: isActive }}
                                style={[styles.tab, isActive && styles.tabActive]}>
                                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                                {tab.count !== undefined && <Text style={styles.tabCount}>{tab.count}</Text>}
                            </Pressable>
                        );
                    })}
                </View>

                {activeTab === TABS.ITEMS && (
                    <>
                        <View style={styles.searchBox}>
                            <Search size={18} color={inventoryColors.muted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Søg"
                                placeholderTextColor={inventoryColors.muted}
                                value={search}
                                onChangeText={setSearch}
                                autoCorrect={false}
                                returnKeyType="search"
                                accessibilityLabel="Søg i lageret"
                            />
                            {search.length > 0 && (
                                <Pressable
                                    style={styles.clearSearchButton}
                                    onPress={() => setSearch('')}
                                    accessibilityRole="button"
                                    accessibilityLabel="Ryd søgning">
                                    <CircleX size={18} color={inventoryColors.muted} />
                                </Pressable>
                            )}
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.chipRow}
                            keyboardShouldPersistTaps="handled">
                            {[null, ...categoryNames].map((name) => {
                                const isActive = selectedCategory === name;
                                return (
                                    <Pressable
                                        key={name ?? 'all'}
                                        onPress={() => setSelectedCategory(name)}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: isActive }}
                                        style={[styles.chip, isActive && styles.chipActive]}>
                                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{name ?? 'Alle'}</Text>
                                    </Pressable>
                                );
                            })}
                            <Pressable
                                onPress={openCategories}
                                accessibilityRole="button"
                                accessibilityLabel="Administrer kategorier"
                                style={({ pressed }) => [styles.addChip, pressed && styles.pressed]}>
                                <Plus size={18} strokeWidth={2.4} color={inventoryColors.primary} />
                            </Pressable>
                        </ScrollView>
                    </>
                )}
            </View>
        );
    }

    function renderOverview() {
        return (
            <ScrollView contentContainerStyle={styles.content} refreshControl={refreshControl}>
                <View style={styles.cardGrid}>
                    {SUMMARY_CARDS.map((card) => (
                        <InventorySummaryCard
                            key={card.key}
                            icon={card.icon}
                            label={card.label}
                            count={cardCounts[card.key]}
                            color={card.color}
                            softColor={card.softColor}
                            isSelected={selectedCard === card.key}
                            onPress={card.key === CARDS.SHOPPING ? openShoppingList : () => setSelectedCard(card.key)}
                            opensScreen={card.key === CARDS.SHOPPING}
                        />
                    ))}
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle} accessibilityRole="header">
                        {`${selectedCardConfig.label} · ${overviewRows.length}`}
                    </Text>
                </View>

                <View style={styles.group}>
                    {overviewRows.length === 0 ? (
                        <View style={styles.emptyBlock}>
                            <Text style={styles.messageText}>Ingen varer – alt er i orden.</Text>
                        </View>
                    ) : (
                        overviewRows.map((row, index) => (
                            <InventoryOverviewRow
                                key={row.key}
                                name={row.name}
                                imageUrl={row.imageUrl}
                                status={row.status}
                                quantity={row.quantity}
                                minQuantity={row.minQuantity}
                                unit={row.unit}
                                isFirst={index === 0}
                                onPress={() => setSheet({ itemId: row.itemId, mode: SHEET_MODES.DETAILS })}
                            />
                        ))
                    )}
                </View>
            </ScrollView>
        );
    }

    function renderItems() {
        return (
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.content}
                stickySectionHeadersEnabled={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                refreshControl={refreshControl}
                renderSectionHeader={({ section }) => (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle} accessibilityRole="header">
                            {`${section.title} · ${section.data.length}`}
                        </Text>
                    </View>
                )}
                renderSectionFooter={() => <View style={styles.sectionSpacing} />}
                renderItem={({ item, index, section }) => (
                    <InventoryItemRow
                        item={item}
                        isFirst={index === 0}
                        isLast={index === section.data.length - 1}
                        onOpen={openItem}
                        onUse={openUse}
                        onReceive={openReceive}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyBlock}>
                        <Text style={styles.messageTitle}>
                            {items.length === 0 ? 'Der er ingen varer på lageret endnu' : 'Ingen varer fundet'}
                        </Text>
                        <Text style={styles.messageText}>
                            {items.length === 0 ? 'Tryk på "Opret vare" for at tilføje den første.' : 'Prøv en anden søgning eller kategori.'}
                        </Text>
                    </View>
                }
            />
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {renderHeader()}

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={inventoryColors.primary} />
                </View>
            ) : hasError ? (
                <View style={styles.centered}>
                    <Text style={styles.messageTitle}>Kunne ikke hente lageret</Text>
                    <Pressable onPress={() => loadItems()} accessibilityRole="button" hitSlop={8}>
                        <Text style={styles.retryText}>Prøv igen</Text>
                    </Pressable>
                </View>
            ) : activeTab === TABS.OVERVIEW ? (
                renderOverview()
            ) : (
                renderItems()
            )}

            <Pressable
                onPress={openCreateItem}
                accessibilityRole="button"
                accessibilityLabel="Opret vare"
                style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 16 }, pressed && styles.pressed]}>
                <Plus size={22} strokeWidth={2.6} color="#FFFFFF" />
                <Text style={styles.fabText}>Opret vare</Text>
            </Pressable>

            <InventorySheet visible={isSheetVisible} onClose={closeSheet}>
                {sheet?.mode === SHEET_MODES.CREATE && (
                    <ItemForm
                        mode={FORM_MODES.CREATE}
                        categoryOptions={categoryOptions}
                        onCancel={closeSheet}
                        onSave={createItem}
                        onCreateCategory={createCategory}
                    />
                )}
                {sheet?.mode === SHEET_MODES.CATEGORIES && (
                    <CategoryManager
                        categoryOptions={categoryOptions}
                        itemCounts={itemCountByCategory}
                        onCreateCategory={createCategory}
                        onDone={closeSheet}
                    />
                )}
                {sheetItem && sheet.mode === SHEET_MODES.DETAILS && (
                    <ItemDetails
                        item={sheetItem}
                        shoppingEntry={shoppingByItemId[sheetItem.id]}
                        isAddingToList={isAddingToList}
                        onEdit={() => setSheet({ ...sheet, mode: SHEET_MODES.EDIT })}
                        onReceive={() => openReceive(sheetItem, true)}
                        onAddToShoppingList={addToShoppingList}
                        onChangeShoppingQuantity={changeShoppingQuantity}
                    />
                )}
                {sheetItem && sheet.mode === SHEET_MODES.EDIT && (
                    <ItemForm
                        mode={FORM_MODES.EDIT}
                        item={sheetItem}
                        categoryOptions={categoryOptions}
                        onCancel={showDetails}
                        onSave={saveItemChanges}
                        onCreateCategory={createCategory}
                    />
                )}
                {sheetItem && sheet.mode === SHEET_MODES.RECEIVE && (
                    <ReceiveForm
                        item={sheetItem}
                        onCancel={sheet.backToDetails ? showDetails : closeSheet}
                        onSave={saveReceivedBatch}
                    />
                )}
                {sheetItem && sheet.mode === SHEET_MODES.USE && (
                    <UseForm
                        item={sheetItem}
                        loadBatches={loadSheetBatches}
                        onCancel={closeSheet}
                        onUse={saveUse}
                    />
                )}
            </InventorySheet>
        </SafeAreaView>
    );
}
