import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Minus, Plus } from 'lucide-react-native';
import { SheetBody, SheetFooter } from './InventorySheet';
import styles, { inventoryColors } from '../../styles/inventoryStyles';
import { formatAmount, formatNumber, formatUnit } from '../../utils/inventoryUtils';

const MONTHS = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];

const startOfToday = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};

const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const addMonths = (date, months) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
};

// 'YYYY-MM-DD' in local time — the format the API expects
const toApiDate = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
};

const formatShortDate = (date) => `${date.getDate()}. ${MONTHS[date.getMonth()]}`;
const formatLongDate = (date) => `${formatShortDate(date)} ${date.getFullYear()}`;

const PURCHASE = {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    CUSTOM: 'custom',
};

// Shelf life counted from the day the goods were received
const EXPIRY_PRESETS = [
    { key: '2d', label: '2 dage', from: (date) => addDays(date, 2) },
    { key: '3d', label: '3 dage', from: (date) => addDays(date, 3) },
    { key: '1w', label: '1 uge', from: (date) => addDays(date, 7) },
    { key: '2w', label: '2 uger', from: (date) => addDays(date, 14) },
    { key: '1m', label: '1 måned', from: (date) => addMonths(date, 1) },
];
const CUSTOM_EXPIRY = 'custom';

const parseQuantity = (text) => Number(String(text).replace(',', '.'));

// Screen 3: register received goods. The expiry date is required and chosen with quick buttons or a date picker.
export default function ReceiveForm({ item, onCancel, onSave }) {
    const [quantityText, setQuantityText] = useState('1');
    const [purchaseChoice, setPurchaseChoice] = useState(PURCHASE.TODAY);
    const [customPurchaseDate, setCustomPurchaseDate] = useState(startOfToday());
    const [expiryChoice, setExpiryChoice] = useState(null);
    const [customExpiryDate, setCustomExpiryDate] = useState(null);
    // iOS shows the calendar inline in the sheet: 'purchase' | 'expiry' | null
    const [iosPicker, setIosPicker] = useState(null);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const today = startOfToday();
    const purchaseDate = purchaseChoice === PURCHASE.TODAY
        ? today
        : purchaseChoice === PURCHASE.YESTERDAY ? addDays(today, -1) : customPurchaseDate;

    const preset = EXPIRY_PRESETS.find((option) => option.key === expiryChoice);
    const expiryDate = preset ? preset.from(purchaseDate) : expiryChoice === CUSTOM_EXPIRY ? customExpiryDate : null;
    const expiryBeforePurchase = expiryDate !== null && expiryDate < purchaseDate;

    const quantity = parseQuantity(quantityText);
    const quantityIsValid = Number.isFinite(quantity) && quantity > 0;
    const canSave = quantityIsValid && expiryDate !== null && !expiryBeforePurchase;

    function changeQuantity(step) {
        const current = quantityIsValid ? quantity : 0;
        const next = Math.max(1, current + step);
        setQuantityText(formatNumber(next));
    }

    // Android opens the system date dialog; iOS shows an inline calendar in the sheet
    function openDatePicker(target) {
        const isPurchase = target === 'purchase';
        const value = isPurchase ? customPurchaseDate : (customExpiryDate ?? addDays(purchaseDate, 7));
        const limits = isPurchase ? { maximumDate: today } : { minimumDate: purchaseDate };

        const apply = (date) => {
            const picked = new Date(date);
            picked.setHours(0, 0, 0, 0);

            if (isPurchase) {
                setCustomPurchaseDate(picked);
                setPurchaseChoice(PURCHASE.CUSTOM);
            } else {
                setCustomExpiryDate(picked);
                setExpiryChoice(CUSTOM_EXPIRY);
            }
        };

        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value,
                mode: 'date',
                ...limits,
                onValueChange: (_, date) => apply(date),
            });
            return;
        }

        // Selecting the option immediately on iOS so the inline calendar shows what is chosen
        apply(value);
        setIosPicker(target);
    }

    async function save() {
        if (!canSave) return;

        setError('');
        setIsSaving(true);
        try {
            await onSave({
                quantity,
                purchaseDate: toApiDate(purchaseDate),
                expiryDate: toApiDate(expiryDate),
            });
        } catch (saveError) {
            setError(saveError.message || 'Varemodtagelsen kunne ikke registreres.');
        } finally {
            setIsSaving(false);
        }
    }

    const purchaseOptions = [
        { key: PURCHASE.TODAY, label: 'I dag' },
        { key: PURCHASE.YESTERDAY, label: 'I går' },
        { key: PURCHASE.CUSTOM, label: purchaseChoice === PURCHASE.CUSTOM ? formatShortDate(customPurchaseDate) : 'Andet' },
    ];

    const saveLabel = !quantityIsValid
        ? 'Indtast et antal'
        : expiryDate === null ? 'Vælg udløbsdato' : `Gem ${formatAmount(quantity, item.unit)}`;

    return (
        <>
            <SheetBody withFooter>
                <View style={styles.sheetNavBar}>
                    <View style={styles.sheetNavSide}>
                        <Pressable onPress={onCancel} disabled={isSaving} accessibilityRole="button" style={styles.textButton}>
                            <Text style={styles.textButtonLabel}>Annuller</Text>
                        </Pressable>
                    </View>
                    <View style={styles.itemText}>
                        <Text style={styles.sheetNavTitle} accessibilityRole="header">Modtag vare</Text>
                        <Text style={styles.sheetNavSubtitle} numberOfLines={1}>
                            {`${item.name} · ${formatAmount(item.quantity, item.unit)} på lager`}
                        </Text>
                    </View>
                    <View style={styles.sheetNavSide} />
                </View>

                <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Antal</Text>
                    <View style={styles.group}>
                        <View style={styles.receiveStepper}>
                            <Pressable
                                onPress={() => changeQuantity(-1)}
                                accessibilityRole="button"
                                accessibilityLabel="Færre"
                                style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}>
                                <Minus size={22} strokeWidth={2.6} color={inventoryColors.text} />
                            </Pressable>
                            <View style={styles.receiveQuantity}>
                                <TextInput
                                    value={quantityText}
                                    onChangeText={setQuantityText}
                                    keyboardType="decimal-pad"
                                    selectTextOnFocus
                                    style={styles.receiveQuantityInput}
                                    accessibilityLabel={`Antal i ${formatUnit(item.unit, 2)}`}
                                />
                                <Text style={styles.stepperUnit}>{formatUnit(item.unit, quantityIsValid ? quantity : 2)}</Text>
                            </View>
                            <Pressable
                                onPress={() => changeQuantity(1)}
                                accessibilityRole="button"
                                accessibilityLabel="Flere"
                                style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}>
                                <Plus size={22} strokeWidth={2.6} color={inventoryColors.primary} />
                            </Pressable>
                        </View>
                    </View>
                </View>

                <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Modtaget</Text>
                    <View style={styles.segmented} accessibilityRole="radiogroup">
                        {purchaseOptions.map((option) => {
                            const isActive = purchaseChoice === option.key;
                            return (
                                <Pressable
                                    key={option.key}
                                    onPress={() => {
                                        if (option.key === PURCHASE.CUSTOM) {
                                            openDatePicker('purchase');
                                        } else {
                                            setPurchaseChoice(option.key);
                                            setIosPicker(null);
                                        }
                                    }}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: isActive }}
                                    style={[styles.segment, isActive && styles.tabActive]}>
                                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{option.label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                    {Platform.OS === 'ios' && iosPicker === 'purchase' && (
                        <View style={styles.inlineCalendar}>
                            <DateTimePicker
                                value={customPurchaseDate}
                                mode="date"
                                display="inline"
                                locale="da-DK"
                                accentColor={inventoryColors.primary}
                                themeVariant="light"
                                maximumDate={today}
                                onValueChange={(_, date) => {
                                    const picked = new Date(date);
                                    picked.setHours(0, 0, 0, 0);
                                    setCustomPurchaseDate(picked);
                                }}
                            />
                        </View>
                    )}
                </View>

                <View style={styles.field}>
                    <View style={styles.receiveLabelRow}>
                        <Text style={styles.fieldLabel}>
                            Udløbsdato <Text style={{ color: inventoryColors.red }}>*</Text>
                        </Text>
                        <Text
                            style={[styles.receiveExpiryValue, { color: expiryDate ? inventoryColors.text : inventoryColors.red }]}
                            accessibilityLiveRegion="polite">
                            {expiryDate ? formatLongDate(expiryDate) : 'Påkrævet'}
                        </Text>
                    </View>
                    <View style={styles.expiryGrid}>
                        {EXPIRY_PRESETS.map((option) => {
                            const isActive = expiryChoice === option.key;
                            return (
                                <Pressable
                                    key={option.key}
                                    onPress={() => {
                                        setExpiryChoice(option.key);
                                        setIosPicker(null);
                                    }}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: isActive }}
                                    accessibilityLabel={`${option.label}, ${formatLongDate(option.from(purchaseDate))}`}
                                    style={[styles.expiryOption, isActive && styles.chipActive]}>
                                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{option.label}</Text>
                                </Pressable>
                            );
                        })}
                        <Pressable
                            onPress={() => openDatePicker('expiry')}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: expiryChoice === CUSTOM_EXPIRY }}
                            style={[styles.expiryOption, expiryChoice === CUSTOM_EXPIRY && styles.chipActive]}>
                            <Text style={[styles.chipText, expiryChoice === CUSTOM_EXPIRY && styles.chipTextActive]}>
                                {expiryChoice === CUSTOM_EXPIRY && customExpiryDate ? formatShortDate(customExpiryDate) : 'Vælg dato'}
                            </Text>
                        </Pressable>
                    </View>
                    {Platform.OS === 'ios' && iosPicker === 'expiry' && customExpiryDate && (
                        <View style={styles.inlineCalendar}>
                            <DateTimePicker
                                value={customExpiryDate}
                                mode="date"
                                display="inline"
                                locale="da-DK"
                                accentColor={inventoryColors.primary}
                                themeVariant="light"
                                minimumDate={purchaseDate}
                                onValueChange={(_, date) => {
                                    const picked = new Date(date);
                                    picked.setHours(0, 0, 0, 0);
                                    setCustomExpiryDate(picked);
                                }}
                            />
                        </View>
                    )}
                    {expiryBeforePurchase && (
                        <Text style={styles.fieldError}>Udløbsdatoen må ikke ligge før modtagelsesdatoen.</Text>
                    )}
                </View>

                {error ? <Text style={styles.fieldError} accessibilityLiveRegion="polite">{error}</Text> : null}
            </SheetBody>

            <SheetFooter>
                <Pressable
                    onPress={save}
                    disabled={!canSave || isSaving}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canSave || isSaving }}
                    style={({ pressed }) => [styles.primaryButton, !canSave && styles.primaryButtonDisabled, pressed && canSave && styles.pressed]}>
                    {isSaving
                        ? <ActivityIndicator color="#FFFFFF" />
                        : <Text style={[styles.primaryButtonText, !canSave && styles.primaryButtonTextDisabled]}>{saveLabel}</Text>}
                </Pressable>
            </SheetFooter>
        </>
    );
}
