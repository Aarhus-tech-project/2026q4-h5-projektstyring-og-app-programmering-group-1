import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Check, Minus, Plus } from 'lucide-react-native';
import { SheetBody, SheetFooter } from './InventorySheet';
import styles, { inventoryColors, toneColors } from '../../styles/inventoryStyles';
import {
    STATUS_TONES,
    formatAmount,
    formatExpiryDate,
    formatNumber,
    formatShortDate,
    formatUnit,
    getExpiryTone,
} from '../../utils/inventoryUtils';

const QUICK_AMOUNTS = [1, 2, 5];

const parseAmount = (text) => Number(String(text).replace(',', '.'));

// "Brugt": take stock out of an item. The amount starts at 1 and can be changed with − / +,
// typed (e.g. 2,5 kg) or picked with a quick button. With more than one batch the user also
// chooses which batch it comes from (the one that expires first is selected and on top).
// onUse({ quantity, batchId }) — batchId is null when there is only one batch.
export default function UseForm({ item, loadBatches, onCancel, onUse }) {
    const [batches, setBatches] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [amountText, setAmountText] = useState('1');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let isActive = true;

        loadBatches()
            .then((result) => {
                if (!isActive) return;
                const list = Array.isArray(result) ? result : [];
                setBatches(list);
                setSelectedBatchId(list[0]?.id ?? null);
            })
            .catch((fetchError) => {
                if (isActive) setLoadError(fetchError.message || 'Partierne kunne ikke hentes.');
            });

        return () => {
            isActive = false;
        };
    }, [loadBatches]);

    const hasChoice = (batches?.length ?? 0) > 1;
    const selectedBatch = hasChoice ? batches.find((batch) => batch.id === selectedBatchId) : null;
    // How much can be taken: from the chosen batch, or from the whole item when there is nothing to choose
    const available = selectedBatch ? Number(selectedBatch.remainingQuantity) : Number(item.quantity);

    const amount = parseAmount(amountText);
    const amountIsValid = Number.isFinite(amount) && amount > 0;
    const tooMuch = amountIsValid && amount > available;
    const canSave = amountIsValid && !tooMuch && batches !== null && !isSaving;

    function step(change) {
        const current = amountIsValid ? amount : 0;
        const next = Math.min(available, Math.max(1, current + change));
        setAmountText(formatNumber(next));
        setError('');
    }

    async function save() {
        if (!canSave) return;

        setError('');
        setIsSaving(true);
        try {
            await onUse({ quantity: amount, batchId: hasChoice ? selectedBatchId : null });
        } catch (saveError) {
            setError(saveError.message || 'Lagerbeholdningen kunne ikke opdateres.');
        } finally {
            setIsSaving(false);
        }
    }

    const saveLabel = !amountIsValid
        ? 'Indtast et antal'
        : tooMuch ? `Der er kun ${formatAmount(available, item.unit)}` : `Brugt ${formatAmount(amount, item.unit)}`;

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
                        <Text style={styles.sheetNavTitle} accessibilityRole="header">{`Brugt ${item.name}`}</Text>
                        <Text style={styles.sheetNavSubtitle} numberOfLines={1}>
                            {`${formatAmount(item.quantity, item.unit)} på lager`}
                        </Text>
                    </View>
                    <View style={styles.sheetNavSide} />
                </View>

                <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Antal</Text>
                    <View style={styles.group}>
                        <View style={styles.receiveStepper}>
                            <Pressable
                                onPress={() => step(-1)}
                                accessibilityRole="button"
                                accessibilityLabel="Færre"
                                style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}>
                                <Minus size={22} strokeWidth={2.6} color={inventoryColors.text} />
                            </Pressable>
                            <View style={styles.receiveQuantity}>
                                <TextInput
                                    value={amountText}
                                    onChangeText={(text) => {
                                        setAmountText(text);
                                        setError('');
                                    }}
                                    keyboardType="decimal-pad"
                                    selectTextOnFocus
                                    style={[styles.receiveQuantityInput, tooMuch && { color: inventoryColors.red }]}
                                    accessibilityLabel={`Antal i ${formatUnit(item.unit, 2)}`}
                                />
                                <Text style={styles.stepperUnit}>{formatUnit(item.unit, amountIsValid ? amount : 2)}</Text>
                            </View>
                            <Pressable
                                onPress={() => step(1)}
                                accessibilityRole="button"
                                accessibilityLabel="Flere"
                                style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}>
                                <Plus size={22} strokeWidth={2.6} color={inventoryColors.primary} />
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.quickAmounts}>
                        {QUICK_AMOUNTS.map((value) => {
                            const isActive = amountIsValid && amount === value;
                            const isDisabled = value > available;
                            return (
                                <Pressable
                                    key={value}
                                    onPress={() => {
                                        setAmountText(formatNumber(value));
                                        setError('');
                                    }}
                                    disabled={isDisabled}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: isActive, disabled: isDisabled }}
                                    style={[styles.quickAmount, isActive && styles.chipActive, isDisabled && styles.quickAmountDisabled]}>
                                    <Text style={[styles.chipText, isActive && styles.chipTextActive, isDisabled && styles.quickAmountTextDisabled]}>
                                        {formatNumber(value)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                        <Pressable
                            onPress={() => {
                                setAmountText(formatNumber(available));
                                setError('');
                            }}
                            disabled={available <= 0}
                            accessibilityRole="button"
                            accessibilityLabel={`Alt, ${formatAmount(available, item.unit)}`}
                            accessibilityState={{ selected: amountIsValid && amount === available }}
                            style={[styles.quickAmount, amountIsValid && amount === available && styles.chipActive]}>
                            <Text style={[styles.chipText, amountIsValid && amount === available && styles.chipTextActive]}>Alt</Text>
                        </Pressable>
                    </View>
                </View>

                {batches === null && !loadError && (
                    <View style={styles.emptyBlock}>
                        <ActivityIndicator color={inventoryColors.primary} />
                    </View>
                )}
                {loadError ? <Text style={styles.fieldError}>{loadError}</Text> : null}

                {hasChoice && (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Parti</Text>
                        <View style={styles.group} accessibilityRole="radiogroup">
                            {batches.map((batch, index) => {
                                const isSelected = batch.id === selectedBatchId;
                                const tone = getExpiryTone(batch.expiryDate);
                                const expiry = formatExpiryDate(batch.expiryDate);
                                const batchAmount = formatAmount(batch.remainingQuantity, item.unit);

                                return (
                                    <Pressable
                                        key={batch.id}
                                        onPress={() => {
                                            setSelectedBatchId(batch.id);
                                            setError('');
                                        }}
                                        accessibilityRole="radio"
                                        accessibilityState={{ checked: isSelected }}
                                        accessibilityLabel={`Partiet der udløber ${expiry}, ${batchAmount}`}
                                        style={({ pressed }) => [styles.batchRow, index > 0 && styles.groupRowDivider, pressed && styles.pressed]}>
                                        <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                            {isSelected && <Check size={14} strokeWidth={3.2} color="#FFFFFF" />}
                                        </View>
                                        <View style={styles.itemText}>
                                            <Text
                                                style={[styles.batchExpiry, tone !== STATUS_TONES.NONE && { color: toneColors[tone] }]}
                                                numberOfLines={1}>
                                                {`Udløber ${expiry}`}
                                            </Text>
                                            <Text style={styles.batchMeta}>{`Modtaget ${formatShortDate(batch.purchaseDate)}`}</Text>
                                        </View>
                                        <Text style={styles.batchAmount}>{batchAmount}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        <Text style={styles.fieldHint}>Det der udløber først, står øverst.</Text>
                    </View>
                )}

                {error ? <Text style={styles.fieldError} accessibilityLiveRegion="polite">{error}</Text> : null}
            </SheetBody>

            <SheetFooter>
                <Pressable
                    onPress={save}
                    disabled={!canSave}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canSave }}
                    style={({ pressed }) => [styles.primaryButton, !canSave && styles.primaryButtonDisabled, pressed && canSave && styles.pressed]}>
                    {isSaving
                        ? <ActivityIndicator color="#FFFFFF" />
                        : <Text style={[styles.primaryButtonText, !canSave && styles.primaryButtonTextDisabled]}>{saveLabel}</Text>}
                </Pressable>
            </SheetFooter>
        </>
    );
}
