import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Check, Minus, Pencil, Plus, ShoppingCart } from 'lucide-react-native';
import { SheetBody } from './InventorySheet';
import useItemImageSource from './useItemImageSource';
import styles, { inventoryColors, toneColors } from '../../styles/inventoryStyles';
import {
    STATUS_TONES,
    formatAmount,
    formatExpiry,
    getCategoryName,
    getDaysUntilExpiry,
    isLowStock,
    isOutOfStock,
} from '../../utils/inventoryUtils';

function getExpiryTone(item) {
    const days = getDaysUntilExpiry(item);
    if (days === null) return STATUS_TONES.NONE;
    if (days <= 1) return STATUS_TONES.RED;
    if (days <= 7) return STATUS_TONES.VIOLET;
    return STATUS_TONES.NONE;
}

// Screen 2: what you see after tapping an item.
// The minimum only decides when the item counts as "Lav beholdning"; it does not decide how much to buy.
// Adding to the shopping list starts at 1, and the amount is then adjusted with − / +.
export default function ItemDetails({ item, shoppingEntry, isAddingToList, onEdit, onReceive, onAddToShoppingList, onChangeShoppingQuantity }) {
    const expiry = formatExpiry(item);
    const expiryTone = getExpiryTone(item);
    const stockColor = isOutOfStock(item) ? inventoryColors.red : isLowStock(item) ? inventoryColors.amber : inventoryColors.text;
    const imageSource = useItemImageSource(item.imageUrl);
    const listQuantity = shoppingEntry ? Number(shoppingEntry.quantity) : 0;
    const canDecreaseList = listQuantity > 1;

    return (
        <SheetBody>
            <View style={styles.sheetTitleRow}>
                {imageSource && (
                    <Image source={imageSource} style={styles.sheetImage} contentFit="cover" accessibilityIgnoresInvertColors />
                )}
                <View style={styles.itemText}>
                    <Text style={styles.sheetTitle} accessibilityRole="header">{item.name}</Text>
                    <Text style={styles.subtitle}>{getCategoryName(item)}</Text>
                </View>
                <Pressable
                    onPress={onEdit}
                    accessibilityRole="button"
                    accessibilityLabel={`Rediger ${item.name}`}
                    style={({ pressed }) => [styles.editPill, pressed && styles.pressed]}>
                    <Pencil size={16} color={inventoryColors.primary} />
                    <Text style={styles.editPillText}>Rediger</Text>
                </Pressable>
            </View>

            <View style={styles.group}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>På lager</Text>
                    <Text style={[styles.infoValue, styles.infoValueLarge, { color: stockColor }]}>
                        {formatAmount(item.quantity, item.unit)}
                    </Text>
                </View>
                <View style={[styles.infoRow, styles.groupRowDivider]}>
                    <Text style={styles.infoLabel}>Minimum</Text>
                    <Text style={styles.infoValue}>{formatAmount(item.minQuantity, item.unit)}</Text>
                </View>
                {/* Expiry belongs to the goods in stock; it is set when goods are received (Modtag vare) */}
                {!isOutOfStock(item) && expiry && (
                    <View style={[styles.infoRow, styles.groupRowDivider]}>
                        <Text style={styles.infoLabel}>Udløber</Text>
                        <Text
                            style={[
                                styles.infoValue,
                                expiryTone !== STATUS_TONES.NONE && { color: toneColors[expiryTone], fontWeight: '600' },
                            ]}>
                            {expiry}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.buttonStack}>
                <Pressable
                    onPress={onReceive}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                    <Text style={styles.primaryButtonText}>Modtag vare</Text>
                </Pressable>

                {shoppingEntry ? (
                    <View style={styles.shoppingButton}>
                        <View style={styles.shoppingIcon}>
                            <Check size={22} color={inventoryColors.primary} />
                        </View>
                        <Text style={styles.shoppingLabel} numberOfLines={1}>På listen</Text>
                        <View style={styles.listStepper}>
                            <Pressable
                                onPress={() => onChangeShoppingQuantity(shoppingEntry, listQuantity - 1)}
                                disabled={!canDecreaseList}
                                accessibilityRole="button"
                                accessibilityLabel="Køb færre"
                                accessibilityState={{ disabled: !canDecreaseList }}
                                style={({ pressed }) => [styles.listStepperButton, pressed && styles.pressed]}>
                                <Minus size={18} strokeWidth={2.6} color={canDecreaseList ? inventoryColors.text : inventoryColors.disabled} />
                            </Pressable>
                            <Text
                                style={styles.listStepperValue}
                                accessibilityLabel={`${formatAmount(listQuantity, shoppingEntry.unit)} på indkøbslisten`}
                                accessibilityLiveRegion="polite">
                                {formatAmount(listQuantity, shoppingEntry.unit)}
                            </Text>
                            <Pressable
                                onPress={() => onChangeShoppingQuantity(shoppingEntry, listQuantity + 1)}
                                accessibilityRole="button"
                                accessibilityLabel="Køb flere"
                                style={({ pressed }) => [styles.listStepperButton, pressed && styles.pressed]}>
                                <Plus size={18} strokeWidth={2.6} color={inventoryColors.primary} />
                            </Pressable>
                        </View>
                    </View>
                ) : (
                    <Pressable
                        onPress={() => onAddToShoppingList(1)}
                        disabled={isAddingToList}
                        accessibilityRole="button"
                        accessibilityLabel={`Tilføj ${item.name} til indkøbslisten`}
                        style={({ pressed }) => [styles.shoppingButton, pressed && styles.pressed]}>
                        <View style={styles.shoppingIcon}>
                            <ShoppingCart size={22} color={inventoryColors.primary} />
                        </View>
                        <Text style={styles.shoppingLabel}>Indkøbsliste</Text>
                        {isAddingToList ? (
                            <ActivityIndicator color={inventoryColors.primary} />
                        ) : (
                            <View style={styles.shoppingTag}>
                                <Plus size={14} strokeWidth={3} color="#FFFFFF" />
                                <Text style={styles.shoppingTagText}>Tilføj</Text>
                            </View>
                        )}
                    </Pressable>
                )}
            </View>
        </SheetBody>
    );
}
