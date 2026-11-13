import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronRight, Minus, Plus } from 'lucide-react-native';
import { SheetBody, SheetFooter } from './InventorySheet';
import useItemImageSource from './useItemImageSource';
import styles, { inventoryColors } from '../../styles/inventoryStyles';
import { formatNumber, formatUnit } from '../../utils/inventoryUtils';

export const UNIT_OPTIONS = ['stk', 'kg', 'L', 'pakke'];
export const MIN_QUANTITY_FLOOR = 1;

export const IMAGE_CHANGE = {
    NEW: 'new',
    REMOVE: 'remove',
};

const PICKER_OPTIONS = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
};

export const FORM_MODES = {
    CREATE: 'create',
    EDIT: 'edit',
};

const DEFAULT_UNIT = 'stk';

// Screen 5 (Opret vare) and 2b (Rediger vare): name, image, category, unit and minimum.
// Stock is only changed through Brug / Modtag, so it is not part of the form.
// categoryOptions: from buildCategoryOptions() — a standard category may not exist in the backend yet (id null).
// onSave(changes, imageChange) — imageChange is null, { type: 'new', asset } or { type: 'remove' }.
export default function ItemForm({ mode = FORM_MODES.EDIT, item = null, categoryOptions, onCancel, onSave, onCreateCategory }) {
    const isCreate = mode === FORM_MODES.CREATE;
    const savedImageSource = useItemImageSource(item?.imageUrl);

    // The new picture is only uploaded when the user saves
    const [imageChange, setImageChange] = useState(null);

    const [name, setName] = useState(item?.name ?? '');
    // Selected by name, because a standard category gets its id the first time it is used
    const [categoryName, setCategoryName] = useState(item?.category || null);
    const [unit, setUnit] = useState(item?.unit ?? DEFAULT_UNIT);
    const [minQuantity, setMinQuantity] = useState(Math.max(MIN_QUANTITY_FLOOR, Number(item?.minQuantity) || 0));
    const [nameError, setNameError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryError, setCategoryError] = useState('');
    const [isSavingCategory, setIsSavingCategory] = useState(false);


    // Keep a unit that is not one of the standard options, so existing items are not changed by accident
    const unitOptions = !item || UNIT_OPTIONS.includes(item.unit) ? UNIT_OPTIONS : [...UNIT_OPTIONS, item.unit];
    const atFloor = minQuantity <= MIN_QUANTITY_FLOOR;

    const previewSource = imageChange?.type === IMAGE_CHANGE.NEW
        ? { uri: imageChange.asset.uri }
        : imageChange?.type === IMAGE_CHANGE.REMOVE ? null : savedImageSource;

    async function pickImage(fromCamera) {
        try {
            const permission = fromCamera
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    'Adgang nægtet',
                    fromCamera
                        ? 'Giv appen adgang til kameraet i indstillingerne for at tage et billede.'
                        : 'Giv appen adgang til dine billeder i indstillingerne for at vælge et billede.',
                );
                return;
            }

            const result = fromCamera
                ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
                : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);

            if (!result.canceled && result.assets?.length) {
                setImageChange({ type: IMAGE_CHANGE.NEW, asset: result.assets[0] });
            }
        } catch (error) {
            console.error('Could not pick image:', error);
            Alert.alert('Fejl', 'Billedet kunne ikke åbnes. Prøv igen.');
        }
    }

    function chooseImage() {
        const options = [
            { text: 'Tag billede', onPress: () => pickImage(true) },
            { text: 'Vælg fra galleri', onPress: () => pickImage(false) },
        ];
        if (previewSource) {
            options.push({ text: 'Fjern billede', style: 'destructive', onPress: () => setImageChange({ type: IMAGE_CHANGE.REMOVE }) });
        }
        options.push({ text: 'Annuller', style: 'cancel' });

        Alert.alert(previewSource ? 'Skift billede' : 'Tilføj billede', undefined, options);
    }

    async function addCategory() {
        const trimmed = newCategoryName.trim();
        if (!trimmed) {
            setCategoryError('Skriv et navn til kategorien.');
            return;
        }
        const existing = categoryOptions.find((option) => option.name.toLowerCase() === trimmed.toLowerCase());
        if (existing) {
            // Just select it instead of showing an error
            setCategoryName(existing.name);
            setNewCategoryName('');
            setIsAddingCategory(false);
            setCategoryError('');
            return;
        }

        setIsSavingCategory(true);
        try {
            const category = await onCreateCategory(trimmed);
            setCategoryName(category.name);
            setNewCategoryName('');
            setIsAddingCategory(false);
            setCategoryError('');
        } catch (error) {
            setCategoryError(error.message || 'Kategorien kunne ikke oprettes.');
        } finally {
            setIsSavingCategory(false);
        }
    }

    async function save() {
        const trimmedName = name.trim();
        // Show every missing field at once, so the user can fix them in one go
        const missingName = !trimmedName;
        // A new item must have a category
        const missingCategory = isCreate && !categoryName;

        if (missingName) setNameError('Varen skal have et navn.');
        if (missingCategory) setCategoryError('Vælg en kategori.');
        if (missingName || missingCategory) return;

        setIsSaving(true);
        try {
            let categoryId = null;
            if (categoryName) {
                const option = categoryOptions.find((entry) => entry.name === categoryName);
                // A standard category that has not been used before is created now
                categoryId = option?.id ?? (await onCreateCategory(categoryName)).id;
            }

            await onSave({
                name: trimmedName,
                unit,
                minQuantity,
                ...(categoryId ? { categoryId } : {}),
            }, imageChange);
        } catch (error) {
            setCategoryError(error.message || 'Kategorien kunne ikke oprettes.');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <>
            <SheetBody withFooter>
                <View style={styles.sheetNavBar}>
                    <View style={styles.sheetNavSide}>
                        <Pressable onPress={onCancel} disabled={isSaving} accessibilityRole="button" style={styles.textButton}>
                            <Text style={styles.textButtonLabel}>Annuller</Text>
                        </Pressable>
                    </View>
                    <Text style={styles.sheetNavTitle} accessibilityRole="header">{isCreate ? 'Opret vare' : 'Rediger vare'}</Text>
                    <View style={styles.sheetNavSide} />
                </View>

                <View style={styles.field}>
                    <Text style={styles.fieldLabel} nativeID="item-name-label">Navn</Text>
                    <TextInput
                        value={name}
                        onChangeText={(text) => {
                            setName(text);
                            setNameError('');
                        }}
                        placeholder={isCreate ? 'Fx Tomater' : undefined}
                        placeholderTextColor={inventoryColors.muted}
                        style={[styles.input, nameError && styles.inputError]}
                        accessibilityLabelledBy="item-name-label"
                        accessibilityLabel="Navn"
                        autoFocus={isCreate}
                        returnKeyType="done"
                    />
                    {nameError ? <Text style={styles.fieldError}>{nameError}</Text> : null}
                </View>

                <View style={styles.field}>
                    <Text style={styles.fieldLabel}>
                        Billede <Text style={styles.fieldLabelOptional}>(valgfrit)</Text>
                    </Text>
                    <Pressable
                        onPress={chooseImage}
                        accessibilityRole="button"
                        accessibilityLabel={previewSource ? 'Skift billede' : 'Tilføj billede, valgfrit'}
                        style={({ pressed }) => [styles.imageButton, pressed && styles.pressed]}>
                        {previewSource ? (
                            <Image source={previewSource} style={styles.thumbnail} contentFit="cover" accessibilityIgnoresInvertColors />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Camera size={20} color={inventoryColors.muted} />
                            </View>
                        )}
                        <Text style={styles.imageButtonText}>{previewSource ? 'Skift billede' : 'Tilføj billede'}</Text>
                        {previewSource
                            ? <ChevronRight size={18} color={inventoryColors.disabled} />
                            : <Text style={styles.imageButtonHint}>Kamera eller galleri</Text>}
                    </Pressable>
                </View>

                <View style={styles.field}>
                    <Text style={styles.fieldLabel}>
                        Kategori{isCreate ? <Text style={{ color: inventoryColors.red }}> *</Text> : null}
                    </Text>
                    <View style={styles.chipWrap}>
                        {categoryOptions.map((category) => {
                            const isActive = categoryName === category.name;
                            return (
                                <Pressable
                                    key={category.name}
                                    onPress={() => {
                                        setCategoryName(isActive ? null : category.name);
                                        setCategoryError('');
                                    }}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: isActive }}
                                    style={[styles.formChip, isActive && styles.chipActive]}>
                                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{category.name}</Text>
                                </Pressable>
                            );
                        })}
                        {!isAddingCategory && (
                            <Pressable
                                onPress={() => setIsAddingCategory(true)}
                                accessibilityRole="button"
                                style={({ pressed }) => [styles.newChip, pressed && styles.pressed]}>
                                <Plus size={16} strokeWidth={2.6} color={inventoryColors.primary} />
                                <Text style={styles.newChipText}>Ny kategori</Text>
                            </Pressable>
                        )}
                    </View>

                    {isAddingCategory && (
                        <View style={styles.inlineAddRow}>
                            <TextInput
                                value={newCategoryName}
                                onChangeText={(text) => {
                                    setNewCategoryName(text);
                                    setCategoryError('');
                                }}
                                placeholder="Fx Desserter"
                                placeholderTextColor={inventoryColors.muted}
                                style={styles.inlineAddInput}
                                accessibilityLabel="Navn på ny kategori"
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={addCategory}
                            />
                            <Pressable
                                onPress={addCategory}
                                disabled={isSavingCategory}
                                accessibilityRole="button"
                                style={({ pressed }) => [styles.inlineAddButton, pressed && styles.pressed]}>
                                {isSavingCategory
                                    ? <ActivityIndicator color="#FFFFFF" />
                                    : <Text style={styles.primaryButtonText}>Tilføj</Text>}
                            </Pressable>
                        </View>
                    )}
                    {categoryError ? <Text style={styles.fieldError}>{categoryError}</Text> : null}
                </View>

                <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Enhed</Text>
                    <View style={styles.segmented} accessibilityRole="radiogroup">
                        {unitOptions.map((option) => {
                            const isActive = unit === option;
                            return (
                                <Pressable
                                    key={option}
                                    onPress={() => setUnit(option)}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: isActive }}
                                    style={[styles.segment, isActive && styles.tabActive]}>
                                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{option}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Minimum på lager</Text>
                    <View style={styles.stepper}>
                        <Pressable
                            onPress={() => setMinQuantity((value) => Math.max(MIN_QUANTITY_FLOOR, value - 1))}
                            disabled={atFloor}
                            accessibilityRole="button"
                            accessibilityLabel="Lavere minimum"
                            accessibilityState={{ disabled: atFloor }}
                            style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}>
                            <Minus size={22} strokeWidth={2.6} color={atFloor ? inventoryColors.disabled : inventoryColors.text} />
                        </Pressable>
                        <Text style={styles.stepperValue} accessibilityLiveRegion="polite">
                            {formatNumber(minQuantity)}
                            <Text style={styles.stepperUnit}>{` ${formatUnit(unit, minQuantity)}`}</Text>
                        </Text>
                        <Pressable
                            onPress={() => setMinQuantity((value) => value + 1)}
                            accessibilityRole="button"
                            accessibilityLabel="Højere minimum"
                            style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}>
                            <Plus size={22} strokeWidth={2.6} color={inventoryColors.primary} />
                        </Pressable>
                    </View>
                    <Text style={styles.fieldHint}>
                        {isCreate
                            ? 'Mindst 1. Varen markeres som lav, når beholdningen når minimum.'
                            : 'Mindst 1. Beholdning ændres via Brug og Modtag.'}
                    </Text>
                </View>

            </SheetBody>

            <SheetFooter>
                <Pressable
                    onPress={save}
                    disabled={isSaving}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                    {isSaving
                        ? <ActivityIndicator color="#FFFFFF" />
                        : <Text style={styles.primaryButtonText}>{isCreate ? 'Gem vare' : 'Gem ændringer'}</Text>}
                </Pressable>
            </SheetFooter>
        </>
    );
}
