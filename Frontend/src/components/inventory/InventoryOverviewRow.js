import { Pressable, Text, View } from 'react-native';
import { ChevronRight, ShoppingCart } from 'lucide-react-native';
import InventoryItemMarker from './InventoryItemMarker';
import styles, { inventoryColors, toneColors } from '../../styles/inventoryStyles';
import { STATUS_TONES, formatAmount } from '../../utils/inventoryUtils';

// Compact row in the Overblik list: name, status and "6 kg på lager" with "min. 2 kg" underneath.
// shoppingEntry: the item's line on the shopping list, if any. Then the row gets a green border
// and "På indkøbslisten · 2 kg", so staff can see it is already being bought.
export default function InventoryOverviewRow({ name, imageUrl, status, quantity, minQuantity, unit, shoppingEntry, isFirst, onPress }) {
    const hasStatus = status.tone !== STATUS_TONES.NONE;
    const stock = formatAmount(quantity, unit);
    const minimum = formatAmount(minQuantity, unit);
    const onList = Boolean(shoppingEntry);
    const listAmount = onList ? formatAmount(shoppingEntry.quantity, shoppingEntry.unit) : '';

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${name}, ${status.text}, ${stock} på lager, minimum ${minimum}${onList ? `, ${listAmount} på indkøbslisten` : ''}`}
            style={({ pressed }) => [
                styles.overviewRow,
                // A highlighted row has its own border, so it needs no divider line above it
                !isFirst && !onList && styles.groupRowDivider,
                onList && styles.overviewRowOnList,
                pressed && styles.pressed,
            ]}>
            <InventoryItemMarker imageUrl={imageUrl} tone={status.tone} small />

            <View style={styles.itemText}>
                <Text style={styles.itemName} numberOfLines={1}>{name}</Text>
                <Text
                    style={[styles.itemStatus, hasStatus && styles.itemStatusStrong, { color: toneColors[status.tone] }]}
                    numberOfLines={1}>
                    {status.text}
                </Text>
                {onList && (
                    <View style={styles.onListLine}>
                        <ShoppingCart size={13} strokeWidth={2.4} color={inventoryColors.primary} />
                        <Text style={styles.onListText} numberOfLines={1}>{`På indkøbslisten · ${listAmount}`}</Text>
                    </View>
                )}
            </View>

            <View style={styles.quantityBlock}>
                <Text style={styles.quantityLine}>
                    <Text style={[styles.quantityValue, { color: quantity > 0 ? inventoryColors.text : inventoryColors.red }]}>
                        {stock}
                    </Text>
                    <Text style={styles.quantityLabel}> på lager</Text>
                </Text>
                <Text style={styles.quantityMin}>{`min. ${minimum}`}</Text>
            </View>
            <ChevronRight size={18} color={inventoryColors.disabled} style={styles.overviewChevron} />
        </Pressable>
    );
}
