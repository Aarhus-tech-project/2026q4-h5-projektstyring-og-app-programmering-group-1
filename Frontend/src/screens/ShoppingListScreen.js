import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Check, ChevronLeft, Lock, Minus, Plus, X } from 'lucide-react-native';
import { useAuth } from '../AuthContext/AuthContext';
import { getErrorMessage } from '../../http/http';
import { deleteShoppingListItem, getShoppingList, updateShoppingListItem } from '../services/inventoryService';
import styles, { inventoryColors } from '../styles/inventoryStyles';
import { isCompanyManager } from '../utils/companyRoles';
import { formatAmount } from '../utils/inventoryUtils';

// How long "Fortryd" is offered after removing a line; the line is only deleted on the server afterwards
const UNDO_DELAY = 5000;

const MONTHS = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];

// "i dag 09:12", "i går 21:40" or "10. nov."
function formatAddedAt(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / (24 * 60 * 60 * 1000));
    const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    if (days === 0) return `i dag ${time}`;
    if (days === 1) return `i går ${time}`;
    return `${date.getDate()}. ${MONTHS[date.getMonth()]}`;
}

function getInitials(name) {
    const words = name.trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map((word) => word[0].toUpperCase()).join('') || '?';
}

// Screen 6: the shared shopping list.
// Everyone can remove a line (✕) — e.g. if it was added by mistake.
// Only ejer and leder can mark lines as bought.
export default function ShoppingListScreen({ navigation, route }) {
    const { companyId, companyName } = route.params;
    const { user, companies } = useAuth();
    const insets = useSafeAreaInsets();

    const role = companies.find((company) => company.id === companyId)?.role;
    const canMarkBought = isCompanyManager(role);

    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [checkedIds, setCheckedIds] = useState([]);
    const [isMarkingBought, setIsMarkingBought] = useState(false);
    // Lines removed with ✕ that are hidden while "Fortryd" is still possible
    const [hiddenIds, setHiddenIds] = useState([]);
    const [toast, setToast] = useState(null); // { text, undoId? }
    const pendingRemoval = useRef(null); // { id, timer }
    const toastTimer = useRef(null);

    const loadShoppingList = useCallback(async () => {
        try {
            const result = await getShoppingList(companyId);
            setCategories(Array.isArray(result) ? result : []);
            setErrorMessage('');
        } catch (error) {
            setErrorMessage(getErrorMessage(error, { fallback: 'Indkøbslisten kunne ikke hentes.' }));
        } finally {
            setIsLoading(false);
        }
    }, [companyId]);

    // Load when the screen is shown (and again when coming back to it)
    useFocusEffect(
        useCallback(() => {
            loadShoppingList();
        }, [loadShoppingList])
    );

    function showToast(text, undoId = null) {
        clearTimeout(toastTimer.current);
        setToast({ text, undoId });
        toastTimer.current = setTimeout(() => setToast(null), UNDO_DELAY);
    }

    // Actually delete a line that was removed with ✕ (after the undo time ran out)
    const commitRemoval = useCallback(async (id) => {
        try {
            await deleteShoppingListItem(companyId, id);
        } catch (error) {
            setHiddenIds((current) => current.filter((hidden) => hidden !== id));
            showToast(getErrorMessage(error, { fallback: 'Varen kunne ikke fjernes fra listen.' }));
        }
        loadShoppingList();
    }, [companyId, loadShoppingList]);

    // If the user leaves the screen during the undo time, the removal still happens
    useEffect(() => () => {
        clearTimeout(toastTimer.current);
        if (pendingRemoval.current) {
            clearTimeout(pendingRemoval.current.timer);
            deleteShoppingListItem(companyId, pendingRemoval.current.id).catch(() => {});
        }
    }, [companyId]);

    function removeLine(entry) {
        // Only one removal can be undone at a time; finish the previous one now
        if (pendingRemoval.current) {
            clearTimeout(pendingRemoval.current.timer);
            commitRemoval(pendingRemoval.current.id);
        }

        setHiddenIds((current) => [...current, entry.id]);
        setCheckedIds((current) => current.filter((id) => id !== entry.id));
        pendingRemoval.current = {
            id: entry.id,
            timer: setTimeout(() => {
                pendingRemoval.current = null;
                commitRemoval(entry.id);
            }, UNDO_DELAY),
        };
        showToast(`${entry.name} fjernet fra listen`, entry.id);
    }

    function undoRemoval() {
        const pending = pendingRemoval.current;
        if (!pending) return;

        clearTimeout(pending.timer);
        pendingRemoval.current = null;
        setHiddenIds((current) => current.filter((id) => id !== pending.id));
        clearTimeout(toastTimer.current);
        setToast(null);
    }

    async function markCheckedAsBought() {
        const ids = [...checkedIds];
        setIsMarkingBought(true);

        const results = await Promise.allSettled(ids.map((id) => deleteShoppingListItem(companyId, id)));
        const failed = results.filter((result) => result.status === 'rejected').length;

        setCheckedIds([]);
        setIsMarkingBought(false);
        await loadShoppingList();

        if (failed > 0) {
            showToast(`${failed} ${failed === 1 ? 'vare' : 'varer'} kunne ikke markeres. Prøv igen.`);
        } else {
            showToast(`${ids.length} ${ids.length === 1 ? 'vare' : 'varer'} markeret som købt`);
        }
    }

    async function refresh() {
        setIsRefreshing(true);
        await loadShoppingList();
        setIsRefreshing(false);
    }

    // Hide lines that are waiting for "Fortryd", and drop empty categories
    const visibleCategories = useMemo(
        () => categories
            .map((category) => ({
                ...category,
                items: (category.items || []).filter((entry) => !hiddenIds.includes(entry.id)),
            }))
            .filter((category) => category.items.length > 0),
        [categories, hiddenIds]
    );

    const visibleIds = visibleCategories.flatMap((category) => category.items.map((entry) => entry.id));
    const lineCount = visibleIds.length;
    const checkedCount = checkedIds.filter((id) => visibleIds.includes(id)).length;
    const allChecked = lineCount > 0 && checkedCount === lineCount;

    // − / + on a line: update the number straight away, and reload if the server says no
    async function changeLineQuantity(entry, quantity) {
        if (quantity < 1) return;

        setCategories((current) => current.map((category) => ({
            ...category,
            items: (category.items || []).map((other) => (other.id === entry.id ? { ...other, quantity } : other)),
        })));

        try {
            await updateShoppingListItem(companyId, entry.id, quantity);
        } catch (error) {
            showToast(getErrorMessage(error, { fallback: 'Antallet kunne ikke ændres.' }));
            loadShoppingList();
        }
    }

    function toggleLine(id) {
        setCheckedIds((current) => (current.includes(id) ? current.filter((other) => other !== id) : [...current, id]));
    }

    function toggleAll() {
        setCheckedIds(allChecked ? [] : visibleIds);
    }

    function renderAddedBy(entry) {
        if (!entry.addedByName && !entry.addedById) return null;

        const isMe = entry.addedById === user?.id;
        const name = isMe ? 'Dig' : entry.addedByName || 'Ukendt';
        const when = formatAddedAt(entry.addedAt);

        return (
            <View style={styles.addedByRow}>
                <View style={[styles.avatar, isMe && styles.avatarMe]}>
                    <Text style={[styles.avatarText, isMe && styles.avatarTextMe]}>{isMe ? 'DIG' : getInitials(name)}</Text>
                </View>
                <Text style={styles.addedByText} numberOfLines={1}>
                    {'Tilføjet af '}
                    <Text style={styles.addedByName}>{name}</Text>
                    {when ? ` · ${when}` : ''}
                </Text>
            </View>
        );
    }

    function renderLine(entry, index) {
        const isChecked = checkedIds.includes(entry.id);
        const amount = formatAmount(entry.quantity, entry.unit);
        const addedLabel = entry.addedByName ? `, tilføjet af ${entry.addedById === user?.id ? 'dig' : entry.addedByName}` : '';

        const content = (
            <View style={styles.itemText}>
                <Text style={[styles.itemName, isChecked && styles.lineChecked]} numberOfLines={1}>{entry.name}</Text>
                {renderAddedBy(entry)}
            </View>
        );

        const quantity = Number(entry.quantity);
        // The amount never goes below 1 here; removing the line is what ✕ is for
        const canDecrease = quantity > 1;

        return (
            <View key={entry.id} style={[styles.shoppingLine, index > 0 && styles.groupRowDivider]}>
                {canMarkBought ? (
                    <Pressable
                        onPress={() => toggleLine(entry.id)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isChecked }}
                        accessibilityLabel={`Marker ${entry.name} som købt, ${amount}${addedLabel}`}
                        style={({ pressed }) => [styles.shoppingLineMain, pressed && styles.pressed]}>
                        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                            {isChecked && <Check size={15} strokeWidth={3.2} color="#FFFFFF" />}
                        </View>
                        {content}
                    </Pressable>
                ) : (
                    <View style={[styles.shoppingLineMain, styles.shoppingLineReadOnly]} accessible accessibilityLabel={`${entry.name}, ${amount}${addedLabel}`}>
                        {content}
                    </View>
                )}
                {/* − / + change the amount to buy (outside the checkbox area, so they don't tick the line) */}
                <View style={styles.lineStepper}>
                    <Pressable
                        onPress={() => changeLineQuantity(entry, quantity - 1)}
                        disabled={!canDecrease}
                        accessibilityRole="button"
                        accessibilityLabel={`Køb færre ${entry.name}`}
                        accessibilityState={{ disabled: !canDecrease }}
                        hitSlop={4}
                        style={({ pressed }) => [styles.lineStepperButton, pressed && styles.pressed]}>
                        <Minus size={16} strokeWidth={2.6} color={canDecrease ? inventoryColors.text : inventoryColors.disabled} />
                    </Pressable>
                    <Text
                        style={[styles.lineStepperValue, isChecked && { color: inventoryColors.subtle }]}
                        accessibilityLabel={`${amount} ${entry.name} på listen`}
                        accessibilityLiveRegion="polite">
                        {amount}
                    </Text>
                    <Pressable
                        onPress={() => changeLineQuantity(entry, quantity + 1)}
                        accessibilityRole="button"
                        accessibilityLabel={`Køb flere ${entry.name}`}
                        hitSlop={4}
                        style={({ pressed }) => [styles.lineStepperButton, pressed && styles.pressed]}>
                        <Plus size={16} strokeWidth={2.6} color={inventoryColors.primary} />
                    </Pressable>
                </View>
                <Pressable
                    onPress={() => removeLine(entry)}
                    accessibilityRole="button"
                    accessibilityLabel={`Fjern ${entry.name} fra listen`}
                    hitSlop={4}
                    style={({ pressed }) => [styles.removeLineButton, pressed && styles.pressed]}>
                    <X size={18} strokeWidth={2.4} color={inventoryColors.subtle} />
                </Pressable>
            </View>
        );
    }

    const subtitle = lineCount === 0
        ? companyName
        : `${lineCount} ${lineCount === 1 ? 'vare' : 'varer'}${checkedCount ? ` · ${checkedCount} markeret` : ''}`;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Pressable
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        accessibilityRole="button"
                        accessibilityLabel="Tilbage til lageret">
                        <ChevronLeft size={26} color={inventoryColors.primary} />
                    </Pressable>
                    <View style={styles.titleBlock}>
                        <Text style={styles.title} accessibilityRole="header">Indkøbsliste</Text>
                        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
                    </View>
                    {canMarkBought && lineCount > 0 && (
                        <Pressable onPress={toggleAll} accessibilityRole="button" style={styles.textButton} hitSlop={8}>
                            <Text style={[styles.textButtonLabel, styles.textButtonStrong]}>
                                {allChecked ? 'Fravælg alle' : 'Vælg alle'}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={inventoryColors.primary} />
                </View>
            ) : errorMessage ? (
                <View style={styles.centered}>
                    <Text style={styles.messageTitle}>{errorMessage}</Text>
                    <Pressable onPress={loadShoppingList} accessibilityRole="button" hitSlop={8}>
                        <Text style={styles.retryText}>Prøv igen</Text>
                    </Pressable>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={[styles.content, styles.shoppingContent]}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={inventoryColors.primary} colors={[inventoryColors.primary]} />
                    }>
                    {visibleCategories.length === 0 ? (
                        <View style={styles.emptyBlock}>
                            <Check size={40} color={inventoryColors.subtle} />
                            <Text style={styles.messageTitle}>Indkøbslisten er tom</Text>
                            <Text style={styles.messageText}>Der er intet at købe lige nu.</Text>
                        </View>
                    ) : (
                        visibleCategories.map((category) => (
                            <View key={category.categoryId || category.categoryName} style={styles.shoppingSection}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle} accessibilityRole="header">{category.categoryName}</Text>
                                </View>
                                <View style={styles.group}>
                                    {category.items.map((entry, index) => renderLine(entry, index))}
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}

            {!isLoading && !errorMessage && (
                <View style={[styles.sheetFooter, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
                    {toast && (
                        <View style={styles.toast} accessibilityLiveRegion="polite" accessibilityRole="alert">
                            <Text style={styles.toastText} numberOfLines={2}>{toast.text}</Text>
                            {toast.undoId && (
                                <Pressable onPress={undoRemoval} accessibilityRole="button" hitSlop={8} style={styles.toastButton}>
                                    <Text style={styles.toastButtonText}>Fortryd</Text>
                                </Pressable>
                            )}
                        </View>
                    )}

                    {lineCount > 0 && (canMarkBought ? (
                        checkedCount > 0 ? (
                            <Pressable
                                onPress={markCheckedAsBought}
                                disabled={isMarkingBought}
                                accessibilityRole="button"
                                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                                {isMarkingBought ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Check size={20} strokeWidth={2.8} color="#FFFFFF" />
                                        <Text style={styles.primaryButtonText}>{`Marker ${checkedCount} som købt`}</Text>
                                    </>
                                )}
                            </Pressable>
                        ) : (
                            <Text style={styles.footerHint}>Sæt flueben ved det, der er købt</Text>
                        )
                    ) : (
                        <View style={styles.footerNote}>
                            <Lock size={16} color={inventoryColors.muted} />
                            <Text style={styles.footerHint}>Kun ejer og leder kan markere varer som købt</Text>
                        </View>
                    ))}
                </View>
            )}
        </SafeAreaView>
    );
}
