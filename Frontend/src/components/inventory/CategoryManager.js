import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SheetBody } from './InventorySheet';
import styles, { inventoryColors } from '../../styles/inventoryStyles';

const countText = (count) => (count === 1 ? '1 vare' : `${count} varer`);

// Screen 4: the company's own categories and the standard ones, and a field to create a new one.
// categoryOptions: from buildCategoryOptions(). itemCounts: { [categoryName]: number }.
export default function CategoryManager({ categoryOptions, itemCounts, onCreateCategory, onDone }) {
    const [draft, setDraft] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    // Names created while the screen is open get a "Ny" tag
    const [createdNames, setCreatedNames] = useState([]);

    const custom = categoryOptions.filter((option) => !option.isDefault);
    const defaults = categoryOptions.filter((option) => option.isDefault);

    async function addCategory() {
        const name = draft.trim();
        if (!name) {
            setError('Skriv et navn til kategorien.');
            return;
        }
        if (name.length > 80) {
            setError('Navnet må højst være 80 tegn.');
            return;
        }
        if (categoryOptions.some((option) => option.name.toLowerCase() === name.toLowerCase())) {
            setError(`"${name}" findes allerede.`);
            return;
        }

        setIsSaving(true);
        try {
            const category = await onCreateCategory(name);
            setCreatedNames((current) => [...current, category.name]);
            setDraft('');
            setError('');
        } catch (createError) {
            setError(createError.message || 'Kategorien kunne ikke oprettes.');
        } finally {
            setIsSaving(false);
        }
    }

    function renderRows(options) {
        return options.map((option, index) => (
            <View
                key={option.name}
                style={[styles.infoRow, index > 0 && styles.groupRowDivider]}
                accessible
                accessibilityLabel={`${option.name}, ${countText(itemCounts[option.name] ?? 0)}`}>
                <Text style={styles.infoLabel}>{option.name}</Text>
                <View style={styles.categoryRowRight}>
                    {createdNames.includes(option.name) && <Text style={styles.newTag}>Ny</Text>}
                    <Text style={styles.infoValue}>{itemCounts[option.name] ?? 0}</Text>
                </View>
            </View>
        ));
    }

    return (
        <SheetBody>
            <View style={styles.sheetNavBar}>
                <View style={styles.sheetNavSide} />
                <Text style={styles.sheetNavTitle} accessibilityRole="header">Kategorier</Text>
                <View style={[styles.sheetNavSide, styles.sheetNavSideEnd]}>
                    <Pressable onPress={onDone} accessibilityRole="button" style={styles.textButton}>
                        <Text style={[styles.textButtonLabel, styles.textButtonStrong]}>Færdig</Text>
                    </Pressable>
                </View>
            </View>

            <View style={styles.field}>
                <Text style={styles.fieldLabel} nativeID="new-category-label">Ny kategori</Text>
                <View style={[styles.inlineAddRow, error && styles.inputError]}>
                    <TextInput
                        value={draft}
                        onChangeText={(text) => {
                            setDraft(text);
                            setError('');
                        }}
                        placeholder="Fx Desserter"
                        placeholderTextColor={inventoryColors.muted}
                        style={styles.inlineAddInput}
                        accessibilityLabelledBy="new-category-label"
                        accessibilityLabel="Ny kategori"
                        returnKeyType="done"
                        onSubmitEditing={addCategory}
                    />
                    <Pressable
                        onPress={addCategory}
                        disabled={isSaving}
                        accessibilityRole="button"
                        style={({ pressed }) => [styles.inlineAddButton, pressed && styles.pressed]}>
                        {isSaving
                            ? <ActivityIndicator color="#FFFFFF" />
                            : <Text style={styles.primaryButtonText}>Tilføj</Text>}
                    </Pressable>
                </View>
                {error ? <Text style={styles.fieldError} accessibilityLiveRegion="polite">{error}</Text> : null}
            </View>

            <View style={styles.field}>
                <Text style={styles.fieldLabel}>Egne kategorier</Text>
                <View style={styles.group}>
                    {custom.length > 0 ? renderRows(custom) : (
                        <View style={styles.emptyBlock}>
                            <Text style={styles.messageText}>Ingen egne kategorier endnu.</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.field}>
                <Text style={styles.fieldLabel}>Standard</Text>
                <View style={styles.group}>{renderRows(defaults)}</View>
                <Text style={styles.fieldHint}>Standardkategorier er altid tilgængelige.</Text>
            </View>
        </SheetBody>
    );
}
