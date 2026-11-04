import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { CalendarClock, ChevronLeft, PackageX, Search, ShoppingCart, TrendingDown, X } from 'lucide-react-native';
import InventoryItemRow from '../components/inventory/InventoryItemRow';
import InventorySummaryCard from '../components/inventory/InventorySummaryCard';
import { getInventoryItems, updateItemQuantity } from '../services/inventoryService';
import styles, { inventoryColors } from '../styles/inventoryStyles';
import { FILTERS, getInventoryCounts, getVisibleItems } from '../utils/inventoryUtils';


const TABLET_WIDTH = 768;
const PIN_DURATION = 5000;

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
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [activeFilter, setActiveFilter] = useState(FILTERS.ALL);
    const [search, setSearch] = useState('');
    const [pinnedIds, setPinnedIds] = useState([]);
    const pinTimers = useRef({});

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

    async function changeQuantity(item, change) {
        pinItem(item.id);

        const quantity = Math.max(0, item.quantity + change);

        setItems((current) =>
            current.map((other) => (other.id === item.id ? { ...other, quantity } : other))
        );

        try {
            await updateItemQuantity(companyId, item.id, quantity);
        } catch (error) {
            console.error('Could not update item quantity: ', error);
            loadItems();
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
                        count={counts[card.filter]}
                        color={card.color}
                        softColor={card.softColor}
                        isActive={activeFilter === card.filter}
                        isTablet={isTablet}
                        onPress={() => toggleFilter(card.filter)}
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
                        <InventoryItemRow item={item} isTablet={isTablet} onChangeQuantity={changeQuantity} />
                    )}
                />
            )}
        </SafeAreaView>
    );
}