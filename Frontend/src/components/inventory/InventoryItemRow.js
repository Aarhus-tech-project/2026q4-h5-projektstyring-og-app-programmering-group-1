import { Pressable, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import InventoryItemMarker from './InventoryItemMarker';
import styles, { inventoryColors, toneColors } from '../../styles/inventoryStyles';
import { STATUS_TONES, formatNumber, formatUnit, getItemStatus } from '../../utils/inventoryUtils';

// One row in the Varer tab: name, status, "stock / min." and the Brug / Modtag buttons.
// Tapping anywhere outside the two buttons opens the item.
export default function InventoryItemRow({ item, isFirst, isLast, onOpen, onUse, onReceive }) {
    const status = getItemStatus(item);
    const canUse = item.quantity > 0;
    const hasStatus = status.tone !== STATUS_TONES.NONE;

    return (
        <Pressable
            onPress={() => onOpen(item)}
            // The row itself is not a screen-reader element; the top part below is, so Brug / Modtag stay reachable
            accessible={false}
            style={({ pressed }) => [
                styles.groupRow,
                styles.itemRow,
                isFirst && styles.groupRowFirst,
                isLast && styles.groupRowLast,
                !isFirst && styles.groupRowDivider,
                pressed && styles.pressed,
            ]}>
            <View
                style={styles.itemTop}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, ${status.text}`}
                accessibilityActions={[{ name: 'activate' }]}
                onAccessibilityAction={() => onOpen(item)}>
                {item.imageUrl ? (
                    <InventoryItemMarker imageUrl={item.imageUrl} tone={status.tone} />
                ) : (
                    <View style={styles.itemDotSlot}>
                        <InventoryItemMarker tone={status.tone} />
                    </View>
                )}

                <View style={styles.itemText}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text
                        style={[styles.itemStatus, hasStatus && styles.itemStatusStrong, { color: toneColors[status.tone] }]}
                        numberOfLines={1}>
                        {status.text}
                    </Text>
                </View>

                <Text
                    style={styles.quantity}
                    accessibilityLabel={`${formatNumber(item.quantity)} ${formatUnit(item.unit, item.quantity)} på lager, minimum ${formatNumber(item.minQuantity)} ${formatUnit(item.unit, item.minQuantity)}`}>
                    <Text style={[styles.quantityValue, { color: canUse ? inventoryColors.text : inventoryColors.red }]}>
                        {formatNumber(item.quantity)}
                    </Text>
                    <Text style={styles.quantityMin}>
                        {` / min. ${formatNumber(item.minQuantity)} ${formatUnit(item.unit, item.minQuantity)}`}
                    </Text>
                </Text>
            </View>

            <View style={[styles.itemActions, { paddingLeft: item.imageUrl ? 54 : 18 }]}>
                <Pressable
                    onPress={() => onUse(item)}
                    disabled={!canUse}
                    accessibilityRole="button"
                    accessibilityLabel={`Brug 1 ${formatUnit(item.unit, 1)} ${item.name}`}
                    accessibilityState={{ disabled: !canUse }}
                    style={({ pressed }) => [styles.actionButton, styles.useButton, pressed && styles.pressed]}>
                    <Minus size={18} strokeWidth={2.6} color={canUse ? inventoryColors.text : inventoryColors.disabled} />
                    <Text style={[styles.actionText, { color: canUse ? inventoryColors.text : inventoryColors.disabled }]}>Brug</Text>
                </Pressable>

                <Pressable
                    onPress={() => onReceive(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Modtag ${item.name}`}
                    style={({ pressed }) => [styles.actionButton, styles.receiveButton, pressed && styles.pressed]}>
                    <Plus size={18} strokeWidth={2.6} color={inventoryColors.primary} />
                    <Text style={[styles.actionText, { color: inventoryColors.primary }]}>Modtag</Text>
                </Pressable>
            </View>
        </Pressable>
    );
}
