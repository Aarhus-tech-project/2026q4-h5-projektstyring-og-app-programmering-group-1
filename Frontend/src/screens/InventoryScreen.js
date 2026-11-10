import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { CalendarClock, ChevronLeft, PackageX, Plus, Search, ShoppingCart, TrendingDown, X } from 'lucide-react-native';
import InventoryItemRow from '../components/inventory/InventoryItemRow';
import InventorySummaryCard from '../components/inventory/InventorySummaryCard';
import ConfirmationModal from '../components/ConfirmationModal';
import { addShoppingListItem, adjustInventoryStock, createInventoryCategory, createInventoryItem, deleteInventoryItem, getInventoryCategories, getInventoryItems, getShoppingList, receiveInventoryBatch } from '../services/inventoryService';
import styles, { inventoryColors } from '../styles/inventoryStyles';
import { FILTERS, getInventoryCounts, getVisibleItems } from '../utils/inventoryUtils';


const TABLET_WIDTH = 768;
const PIN_DURATION = 5000;

function getLocalDateString() {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
}

const SUMMARY_CARDS = [
    { filter: FILTERS.LOW, label: 'Lav beholdning', icon: TrendingDown, color: inventoryColors.warning, softColor: inventoryColors.warningSoft },
    { filter: FILTERS.OUT, label: 'Ikke på lager', icon: PackageX, color: inventoryColors.red, softColor: inventoryColors.redSoft },
    { filter: FILTERS.SHOPPING, label: 'Indkøbsliste', icon: ShoppingCart, color: inventoryColors.blue, softColor: inventoryColors.blueSoft },
    { filter: FILTERS.EXPIRING, label: 'Udløber snart', icon: CalendarClock, color: inventoryColors.warning, softColor: inventoryColors.warningSoft },
];

const LIST_TITLES = {
    [FILTERS.ALL]: 'Alle varer',
    [FILTERS.LOW]: 'Lav beholdning',
    [FILTERS.OUT]: 'Ikke på lager',
    [FILTERS.SHOPPING]: 'Indkøbsliste',
    [FILTERS.EXPIRING]: 'Udløber snart',
};

export default function InventoryScreen({ navigation, route }) {
    const { companyId, companyName } = route.params;

    const { width } = useWindowDimensions();
    const isTablet = width >= TABLET_WIDTH;

    const [items, setItems] = useState([]);
    const [shoppingListCount, setShoppingListCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [activeFilter, setActiveFilter] = useState(FILTERS.ALL);
    const [search, setSearch] = useState('');
    const [pinnedIds, setPinnedIds] = useState([]);
    const pinTimers = useRef({});
    const [receivingItem, setReceivingItem] = useState(null);
    const [receiptQuantity, setReceiptQuantity] = useState('1');
    const [purchaseDate, setPurchaseDate] = useState(getLocalDateString());
    const [expiryDate, setExpiryDate] = useState('');
    const [isSavingReceipt, setIsSavingReceipt] = useState(false);
    const [isCreateItemModalVisible, setIsCreateItemModalVisible] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemUnit, setNewItemUnit] = useState('stk');
    const [newItemMinQuantity, setNewItemMinQuantity] = useState('0');
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSavingItem, setIsSavingItem] = useState(false);
    const [isSavingCategory, setIsSavingCategory] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeletingItem, setIsDeletingItem] = useState(false);

    const loadItems = useCallback(async () => {
        setIsLoading(true);
        setHasError(false);

        try {
            setItems(await getInventoryItems(companyId));
        } catch (error) {
            console.error('Could not load inventory: ', error);
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    useEffect(() => {
        return () => {
            Object.values(pinTimers.current).forEach((timer) => clearTimeout(timer));
            pinTimers.current = {};
            setPinnedIds([]);
        };
    }, [activeFilter]);

    const loadShoppingListCount = useCallback(async () => {
        try {
            const categories = await getShoppingList(companyId);
            const count = Array.isArray(categories)
                ? categories.reduce((total, category) => total + (category.items?.length || 0), 0)
                : 0;
            setShoppingListCount(count);
        } catch (error) {
            console.error('Could not load shopping list:', error);
        }
    }, [companyId]);

    useEffect(() => {
        loadShoppingListCount();
    }, [loadShoppingListCount]);

    async function addItemToShoppingList(item) {
        try {
            await addShoppingListItem(companyId, item.id, 1);
            await loadShoppingListCount();
            Alert.alert('Tilføjet', `${item.name} er tilføjet til indkøbslisten.`);
        } catch (error) {
            Alert.alert('Fejl', error.message || 'Varen kunne ikke tilføjes til indkøbslisten.');
        }
    }
    const counts = useMemo(() => getInventoryCounts(items), [items]);

    const visibleItems = useMemo(
        () => getVisibleItems(items, activeFilter, search, pinnedIds),
        [items, activeFilter, search, pinnedIds]
    );

    function toggleFilter(filter) {
        setActiveFilter(activeFilter === filter ? FILTERS.ALL : filter);
    }

    function pinItem(itemId) {
        clearTimeout(pinTimers.current[itemId]);

        pinTimers.current[itemId] = setTimeout(() => {
            delete pinTimers.current[itemId];
            setPinnedIds((current) => current.filter((id) => id !== itemId));
        }, PIN_DURATION);

        setPinnedIds((current) => (current.includes(itemId) ? current : [...current, itemId]));
    }

    function openReceiveDialog(item) {
        setReceivingItem(item);
        setReceiptQuantity('1');
        setPurchaseDate(getLocalDateString());
        setExpiryDate('');
    }

    async function changeQuantity(item, change) {
        if (change > 0) {
            openReceiveDialog(item);
            return;
        }

        const quantityToRemove = Math.min(item.quantity, Math.abs(change));
        if (quantityToRemove <= 0) return;

        pinItem(item.id);
        const quantity = Math.max(0, item.quantity - quantityToRemove);

        setItems((current) =>
            current.map((other) => (other.id === item.id ? { ...other, quantity } : other))
        );

        try {
            await adjustInventoryStock(companyId, item.id, {
                direction: 'minus',
                quantity: quantityToRemove,
            });
        } catch (error) {
            console.error('Could not adjust item quantity:', error);
            Alert.alert('Fejl', 'Lagerbeholdningen kunne ikke opdateres.');
            loadItems();
        }
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
            pinItem(receivingItem.id);
            await loadItems();
        } catch (error) {
            console.error('Could not record received batch:', error);
            Alert.alert('Fejl', 'Varemodtagelsen kunne ikke registreres.');
        } finally {
            setIsSavingReceipt(false);
        }
    }

    async function openCreateItemModal() {
        setNewItemName('');
        setNewItemUnit('stk');
        setNewItemMinQuantity('0');
        setNewCategoryName('');
        setSelectedCategoryId('');
        setIsCreateItemModalVisible(true);

        try {
            const loadedCategories = await getInventoryCategories(companyId);
            const categoryList = Array.isArray(loadedCategories) ? loadedCategories : [];
            setCategories(categoryList);
            if (categoryList.length > 0) {
                setSelectedCategoryId(categoryList[0].id);
            }
        } catch (error) {
            Alert.alert('Fejl', error.message || 'Kategorierne kunne ikke hentes.');
        }
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
            await loadItems();
            Alert.alert('Oprettet', `${name} er tilføjet til lageret.`);
        } catch (error) {
            Alert.alert('Fejl', error.message || 'Varen kunne ikke oprettes.');
        } finally {
            setIsSavingItem(false);
        }
    }
    function requestDeleteItem(item) {
        setItemToDelete(item);
    }

    async function confirmDeleteItem() {
        if (!itemToDelete || isDeletingItem) {
            return;
        }

        setIsDeletingItem(true);
        try {
            await deleteInventoryItem(companyId, itemToDelete.id);
            setItemToDelete(null);
            await loadItems();
            await loadShoppingListCount();
            Alert.alert('Arkiveret', `${itemToDelete.name} er fjernet fra lageret og indkøbslisten.`);
        } catch (error) {
            setItemToDelete(null);
            Alert.alert('Fejl', error.message || 'Varen kunne ikke arkiveres.');
        } finally {
            setIsDeletingItem(false);
        }
    }
    const listHeader = (
        <View style={styles.listHeader}>
            <View style={styles.summaryGrid}>
                {SUMMARY_CARDS.map((card) => (
                    <InventorySummaryCard
                        key={card.filter}
                        icon={card.icon}
                        label={card.label}
                        count={card.filter === FILTERS.SHOPPING ? shoppingListCount : counts[card.filter]}
                        color={card.color}
                        softColor={card.softColor}
                        isActive={card.filter !== FILTERS.SHOPPING && activeFilter === card.filter}
                        isTablet={isTablet}
                        onPress={() => card.filter === FILTERS.SHOPPING ? navigation.navigate('ShoppingList', { companyId, companyName }) : toggleFilter(card.filter)}
                    />
                ))}
            </View>

            <View style={styles.searchBox}>
                <Search size={20} color={inventoryColors.muted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Søg på navn eller kategori"
                    value={search}
                    onChangeText={setSearch}
                    autoCorrect={false}
                    returnKeyType="search"
                />
                {search.length > 0 && (
                    <Pressable
                        style={styles.clearSearchButton}
                        onPress={() => setSearch('')}
                        accessibilityRole="button"
                        accessibilityLabel="Ryd søgning">
                            <X size={20} color={inventoryColors.muted} />
                        </Pressable>

                )}
            </View>

            <View style={styles.listTitleRow}>
                <Text style={styles.listTitle}>
                    {LIST_TITLES[activeFilter]} ({visibleItems.length})
                </Text>
                {activeFilter !== FILTERS.ALL && (
                    <Pressable onPress={() => setActiveFilter(FILTERS.ALL)} accessibilityRole="button" hitSlop={8}>
                        <Text style={styles.showAllText}>Vis alle</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.topBar}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    accessibilityRole="button"
                    accessibilityLabel="Gå tilbage">
                        <ChevronLeft size={24} color={inventoryColors.text} />
                </Pressable>
                <View>
                    <Text style={styles.title}>Lager</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>{companyName}</Text>
                </View>
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={inventoryColors.primary} />
                </View>
            ) : hasError ? (
                <View style={styles.centered}>
                    <Text style={styles.messageTitle}>Kunne ikke hente lageret</Text>
                    <Pressable onPress={loadItems} accessibilityRole="button" hitSlop={8}>
                        <Text style={styles.retryText}>Prøv igen</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    key={isTablet ? 'tablet' : 'phone'}
                    data={visibleItems}
                    keyExtractor={(item) => item.id}
                    numColumns={isTablet ? 2 : 1}
                    columnWrapperStyle={isTablet ? styles.column : undefined}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    ListHeaderComponent={listHeader}
                    ListEmptyComponent={
                        <View style={styles.emptyList}>
                            <Text style={styles.messageTitle}>Ingen varer fundet</Text>
                            <Text style={styles.messageText}>
                                {items.length === 0 ? 'Der er ingen varer på lageret endnu.' : 'Prøv en anden søgning eller et andet filter.'}
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <InventoryItemRow item={item} isTablet={isTablet} onChangeQuantity={changeQuantity} onAddToShoppingList={addItemToShoppingList} onDeleteItem={requestDeleteItem} />
                    )}
                />
            )}
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

                    <Text style={{ marginBottom: 4, color: inventoryColors.text }}>Antal</Text>
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
        <Pressable
            onPress={openCreateItemModal}
            accessibilityRole="button"
            accessibilityLabel="Tilføj vare"
            style={{
                position: 'absolute',
                right: 24,
                bottom: 24,
                width: 58,
                height: 58,
                borderRadius: 29,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: inventoryColors.primary,
                elevation: 5,
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 5,
            }}>
            <Plus size={28} color="white" />
        </Pressable>

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
