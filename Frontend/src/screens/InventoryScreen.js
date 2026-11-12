import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, SectionList, Text, TextInput, View } from 'react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, CircleX, Clock, PackageX, Plus, Search, ShoppingCart, TrendingDown } from 'lucide-react-native';
import InventoryItemRow from '../components/inventory/InventoryItemRow';
import InventoryOverviewRow from '../components/inventory/InventoryOverviewRow';
import InventorySummaryCard from '../components/inventory/InventorySummaryCard';
import ConfirmationModal from '../components/ConfirmationModal';
import { adjustInventoryStock, createInventoryCategory, createInventoryItem, deleteInventoryItem, getInventoryCategories, getInventoryItems, getShoppingList, receiveInventoryBatch } from '../services/inventoryService';
import styles, { inventoryColors } from '../styles/inventoryStyles';
import {
    STATUS_TONES,
    byUrgency,
    formatAmount,
    formatNumber,
    formatUnit,
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

const SUMMARY_CARDS = [
    { key: CARDS.SHOPPING, label: 'Indkøbsliste', icon: ShoppingCart, color: inventoryColors.primary, softColor: inventoryColors.primarySoft },
    { key: CARDS.LOW, label: 'Lav beholdning', icon: TrendingDown, color: inventoryColors.amber, softColor: inventoryColors.amberSoft },
    { key: CARDS.OUT, label: 'Ikke på lager', icon: PackageX, color: inventoryColors.red, softColor: inventoryColors.redSoft },
    { key: CARDS.EXPIRING, label: 'Udløber snart', icon: Clock, color: inventoryColors.violet, softColor: inventoryColors.violetSoft },
];

const LOW_STOCK_STATUS = { tone: STATUS_TONES.AMBER, text: 'Lav beholdning' };

function getLocalDateString() {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
}

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
    const [selectedCard, setSelectedCard] = useState(CARDS.SHOPPING);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [receivingItem, setReceivingItem] = useState(null);
    const [receiptQuantity, setReceiptQuantity] = useState('1');
    const [purchaseDate, setPurchaseDate] = useState(getLocalDateString());
    const [expiryDate, setExpiryDate] = useState('');
    const [isSavingReceipt, setIsSavingReceipt] = useState(false);
    const [isCreateItemModalVisible, setIsCreateItemModalVisible] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemUnit, setNewItemUnit] = useState('stk');
    const [newItemMinQuantity, setNewItemMinQuantity] = useState('0');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSavingItem, setIsSavingItem] = useState(false);
    const [isSavingCategory, setIsSavingCategory] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeletingItem, setIsDeletingItem] = useState(false);

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

    const attentionCount = useMemo(() => items.filter(needsAttention).length, [items]);

    const cardCounts = useMemo(() => ({
        [CARDS.SHOPPING]: shoppingItems.length,
        [CARDS.LOW]: items.filter(isLowStock).length,
        [CARDS.OUT]: items.filter(isOutOfStock).length,
        [CARDS.EXPIRING]: items.filter(isExpiringSoon).length,
    }), [items, shoppingItems]);

    // Rows shown under the cards for the selected card
    const overviewRows = useMemo(() => {
        if (selectedCard === CARDS.SHOPPING) {
            return shoppingItems
                .map((entry) => {
                    const item = itemsById[entry.itemId];
                    return {
                        key: entry.id,
                        name: entry.name,
                        imageUrl: item?.imageUrl,
                        status: item ? getItemStatus(item) : { tone: STATUS_TONES.NONE, text: entry.categoryName },
                        level: item ? getItemStatus(item).level : 0,
                        amount: `Køb ${formatAmount(entry.quantity, entry.unit)}`,
                        amountColor: inventoryColors.primary,
                    };
                })
                .sort((a, b) => (b.level - a.level) || a.name.localeCompare(b.name, 'da'));
        }

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
                name: item.name,
                imageUrl: item.imageUrl,
                status: selectedCard === CARDS.LOW ? LOW_STOCK_STATUS : getItemStatus(item),
                amount: `${formatNumber(item.quantity)} / min. ${formatAmount(item.minQuantity, item.unit)}`,
                amountColor: item.quantity > 0 ? inventoryColors.text : inventoryColors.red,
            }));
    }, [selectedCard, shoppingItems, items, itemsById]);

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
    async function takeOneFromStock(item) {
        const quantityToRemove = Math.min(item.quantity, 1);
        if (quantityToRemove <= 0) return;

        const quantity = item.quantity - quantityToRemove;
        setItems((current) => current.map((other) => (other.id === item.id ? { ...other, quantity } : other)));

        try {
            await adjustInventoryStock(companyId, item.id, {
                direction: 'minus',
                quantity: quantityToRemove,
            });
        } catch (error) {
            console.error('Could not adjust item quantity:', error);
            Alert.alert('Fejl', 'Lagerbeholdningen kunne ikke opdateres.');
            loadItems({ silent: true });
        }
    }

    function openReceiveDialog(item) {
        setReceivingItem(item);
        setReceiptQuantity('1');
        setPurchaseDate(getLocalDateString());
        setExpiryDate('');
    }

    async function saveReceivedBatch() {
        const quantity = Number(receiptQuantity.replace(',', '.'));
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;

        if (!Number.isFinite(quantity) || quantity <= 0) {
            Alert.alert('Ugyldigt antal', 'Indtast et antal, der er større end nul.');
            return;
        }

        if (!datePattern.test(purchaseDate) || !datePattern.test(expiryDate)) {
            Alert.alert('Ugyldig dato', 'Brug datoformatet ÅÅÅÅ-MM-DD.');
            return;
        }

        if (expiryDate < purchaseDate) {
            Alert.alert('Ugyldig dato', 'Udløbsdatoen må ikke ligge før købsdatoen.');
            return;
        }

        setIsSavingReceipt(true);

        try {
            await receiveInventoryBatch(companyId, receivingItem.id, {
                quantity,
                purchaseDate,
                expiryDate,
            });
            setReceivingItem(null);
            await loadItems({ silent: true });
        } catch (error) {
            console.error('Could not record received batch:', error);
            Alert.alert('Fejl', 'Varemodtagelsen kunne ikke registreres.');
        } finally {
            setIsSavingReceipt(false);
        }
    }

    function openCreateItemModal() {
        setNewItemName('');
        setNewItemUnit('stk');
        setNewItemMinQuantity('0');
        setNewCategoryName('');
        setSelectedCategoryId(categories[0]?.id ?? '');
        setIsCreateItemModalVisible(true);
        loadCategories();
    }

    async function saveNewCategory() {
        const name = newCategoryName.trim();
        if (!name) {
            Alert.alert('Fejl', 'Skriv et kategorinavn.');
            return;
        }

        setIsSavingCategory(true);
        try {
            const category = await createInventoryCategory(companyId, name);
            setCategories((current) => {
                const exists = current.some((entry) => entry.id === category.id);
                return exists ? current : [...current, category];
            });
            setSelectedCategoryId(category.id);
            setNewCategoryName('');
        } catch (error) {
            Alert.alert('Fejl', error.message || 'Kategorien kunne ikke oprettes.');
        } finally {
            setIsSavingCategory(false);
        }
    }

    async function saveNewItem() {
        const name = newItemName.trim();
        const unit = newItemUnit.trim();
        const minQuantity = Number(newItemMinQuantity.replace(',', '.'));

        if (!name || !unit || !selectedCategoryId || !Number.isFinite(minQuantity) || minQuantity < 0) {
            Alert.alert('Fejl', 'Udfyld varenavn, enhed, kategori og et gyldigt minimumsantal.');
            return;
        }

        setIsSavingItem(true);
        try {
            await createInventoryItem(companyId, {
                name,
                categoryId: selectedCategoryId,
                unit,
                minQuantity,
            });
            setIsCreateItemModalVisible(false);
            await loadItems({ silent: true });
            Alert.alert('Oprettet', `${name} er tilføjet til lageret.`);
        } catch (error) {
            Alert.alert('Fejl', error.message || 'Varen kunne ikke oprettes.');
        } finally {
            setIsSavingItem(false);
        }
    }

    async function confirmDeleteItem() {
        if (!itemToDelete || isDeletingItem) {
            return;
        }

        setIsDeletingItem(true);
        try {
            await deleteInventoryItem(companyId, itemToDelete.id);
            setItemToDelete(null);
            await Promise.all([loadItems({ silent: true }), loadShoppingList()]);
            Alert.alert('Arkiveret', `${itemToDelete.name} er fjernet fra lageret og indkøbslisten.`);
        } catch (error) {
            setItemToDelete(null);
            Alert.alert('Fejl', error.message || 'Varen kunne ikke arkiveres.');
        } finally {
            setIsDeletingItem(false);
        }
    }

    const selectedCardConfig = SUMMARY_CARDS.find((card) => card.key === selectedCard);
    const refreshControl = (
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={inventoryColors.primary} colors={[inventoryColors.primary]} />
    );

    function renderHeader() {
        return (
            <View style={styles.header}>
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
                            onPress={() => setSelectedCard(card.key)}
                        />
                    ))}
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle} accessibilityRole="header">
                        {`${selectedCardConfig.label} · ${overviewRows.length}`}
                    </Text>
                    {selectedCard === CARDS.SHOPPING && overviewRows.length > 0 && (
                        <Pressable
                            onPress={() => navigation.navigate('ShoppingList', { companyId, companyName })}
                            accessibilityRole="button"
                            hitSlop={8}>
                            <Text style={styles.sectionLink}>Marker som købt</Text>
                        </Pressable>
                    )}
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
                                amount={row.amount}
                                amountColor={row.amountColor}
                                isFirst={index === 0}
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
                        onUse={takeOneFromStock}
                        onReceive={openReceiveDialog}
                        onLongPress={setItemToDelete}
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
                onPress={openCreateItemModal}
                accessibilityRole="button"
                accessibilityLabel="Opret vare"
                style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 16 }, pressed && styles.pressed]}>
                <Plus size={22} strokeWidth={2.6} color="#FFFFFF" />
                <Text style={styles.fabText}>Opret vare</Text>
            </Pressable>

            <Modal
                visible={receivingItem !== null}
                transparent
                animationType="fade"
                onRequestClose={() => !isSavingReceipt && setReceivingItem(null)}>
                <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0, 0, 0, 0.45)' }}>
                    <View style={{ padding: 20, borderRadius: 16, backgroundColor: 'white' }}>
                        <Text style={{ marginBottom: 8, fontSize: 20, fontWeight: '700', color: inventoryColors.text }}>
                            Registrer varemodtagelse
                        </Text>
                        <Text style={{ marginBottom: 16, color: inventoryColors.muted }}>
                            {receivingItem?.name}
                        </Text>

                        <Text style={{ marginBottom: 4, color: inventoryColors.text }}>
                            {`Antal (${receivingItem ? formatUnit(receivingItem.unit, 2) : ''})`}
                        </Text>
                        <TextInput
                            value={receiptQuantity}
                            onChangeText={setReceiptQuantity}
                            keyboardType="decimal-pad"
                            style={{ marginBottom: 12, padding: 12, borderWidth: 1, borderColor: inventoryColors.muted, borderRadius: 8 }}
                        />

                        <Text style={{ marginBottom: 4, color: inventoryColors.text }}>Købsdato (ÅÅÅÅ-MM-DD)</Text>
                        <TextInput
                            value={purchaseDate}
                            onChangeText={setPurchaseDate}
                            placeholder="2026-11-05"
                            style={{ marginBottom: 12, padding: 12, borderWidth: 1, borderColor: inventoryColors.muted, borderRadius: 8 }}
                        />

                        <Text style={{ marginBottom: 4, color: inventoryColors.text }}>Udløbsdato (ÅÅÅÅ-MM-DD)</Text>
                        <TextInput
                            value={expiryDate}
                            onChangeText={setExpiryDate}
                            placeholder="2026-11-12"
                            style={{ marginBottom: 16, padding: 12, borderWidth: 1, borderColor: inventoryColors.muted, borderRadius: 8 }}
                        />

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                            <Pressable
                                disabled={isSavingReceipt}
                                onPress={() => setReceivingItem(null)}
                                style={{ padding: 12 }}>
                                <Text style={{ color: inventoryColors.muted }}>Annuller</Text>
                            </Pressable>
                            <Pressable
                                disabled={isSavingReceipt}
                                onPress={saveReceivedBatch}
                                style={{ padding: 12, borderRadius: 8, backgroundColor: inventoryColors.primary }}>
                                <Text style={{ color: 'white', fontWeight: '600' }}>
                                    {isSavingReceipt ? 'Gemmer…' : 'Gem varemodtagelse'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={isCreateItemModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => !isSavingItem && setIsCreateItemModalVisible(false)}>
                <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0, 0, 0, 0.45)' }}>
                    <View style={{ maxHeight: '90%', padding: 20, borderRadius: 16, backgroundColor: 'white' }}>
                        <ScrollView keyboardShouldPersistTaps="handled">
                            <Text style={{ marginBottom: 16, fontSize: 20, fontWeight: '700', color: inventoryColors.text }}>
                                Opret vare
                            </Text>

                            <Text style={{ marginBottom: 4, color: inventoryColors.text }}>Varenavn</Text>
                            <TextInput
                                value={newItemName}
                                onChangeText={setNewItemName}
                                placeholder="F.eks. Tomater"
                                style={{ marginBottom: 12, padding: 12, borderWidth: 1, borderColor: inventoryColors.muted, borderRadius: 8 }}
                            />

                            <Text style={{ marginBottom: 4, color: inventoryColors.text }}>Enhed</Text>
                            <TextInput
                                value={newItemUnit}
                                onChangeText={setNewItemUnit}
                                placeholder="stk, kg eller liter"
                                style={{ marginBottom: 12, padding: 12, borderWidth: 1, borderColor: inventoryColors.muted, borderRadius: 8 }}
                            />

                            <Text style={{ marginBottom: 4, color: inventoryColors.text }}>Minimumsantal</Text>
                            <TextInput
                                value={newItemMinQuantity}
                                onChangeText={setNewItemMinQuantity}
                                keyboardType="decimal-pad"
                                style={{ marginBottom: 16, padding: 12, borderWidth: 1, borderColor: inventoryColors.muted, borderRadius: 8 }}
                            />

                            <Text style={{ marginBottom: 8, color: inventoryColors.text, fontWeight: '600' }}>
                                Vælg kategori
                            </Text>

                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                                {categories.map((category) => (
                                    <Pressable
                                        key={category.id}
                                        onPress={() => setSelectedCategoryId(category.id)}
                                        style={{
                                            paddingHorizontal: 12,
                                            paddingVertical: 9,
                                            borderRadius: 18,
                                            backgroundColor: selectedCategoryId === category.id
                                                ? inventoryColors.primary
                                                : '#EEF1EF',
                                        }}>
                                        <Text style={{
                                            color: selectedCategoryId === category.id ? 'white' : inventoryColors.text,
                                            fontWeight: '600',
                                        }}>
                                            {category.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            <Text style={{ marginBottom: 4, color: inventoryColors.text }}>Opret ny kategori</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                                <TextInput
                                    value={newCategoryName}
                                    onChangeText={setNewCategoryName}
                                    placeholder="F.eks. Grøntsager eller Kød"
                                    style={{ flex: 1, padding: 12, borderWidth: 1, borderColor: inventoryColors.muted, borderRadius: 8 }}
                                />
                                <Pressable
                                    disabled={isSavingCategory}
                                    onPress={saveNewCategory}
                                    style={{ padding: 12, borderRadius: 8, backgroundColor: inventoryColors.blue }}>
                                    <Text style={{ color: 'white', fontWeight: '600' }}>
                                        {isSavingCategory ? 'Gemmer…' : 'Tilføj'}
                                    </Text>
                                </Pressable>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                                <Pressable
                                    disabled={isSavingItem}
                                    onPress={() => setIsCreateItemModalVisible(false)}
                                    style={{ padding: 12 }}>
                                    <Text style={{ color: inventoryColors.muted }}>Annuller</Text>
                                </Pressable>
                                <Pressable
                                    disabled={isSavingItem}
                                    onPress={saveNewItem}
                                    style={{ padding: 12, borderRadius: 8, backgroundColor: inventoryColors.primary }}>
                                    <Text style={{ color: 'white', fontWeight: '600' }}>
                                        {isSavingItem ? 'Gemmer…' : 'Gem vare'}
                                    </Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <ConfirmationModal
                visible={itemToDelete !== null}
                variant="danger"
                title="Arkivér vare?"
                message={itemToDelete
                    ? `Vil du arkivere ${itemToDelete.name}? Varen fjernes fra det aktive lager og indkøbslisten. Lagerhistorikken bevares.`
                    : ''}
                confirmText={isDeletingItem ? 'Arkiverer…' : 'Arkivér vare'}
                cancelText="Annuller"
                onConfirm={confirmDeleteItem}
                onCancel={() => !isDeletingItem && setItemToDelete(null)}
            />
        </SafeAreaView>
    );
}
