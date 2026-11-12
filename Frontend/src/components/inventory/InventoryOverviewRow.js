import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import InventoryItemMarker from './InventoryItemMarker';
import styles, { inventoryColors, toneColors } from '../../styles/inventoryStyles';
import { STATUS_TONES, formatAmount } from '../../utils/inventoryUtils';

// Compact row in the Overblik list: name, status and "6 kg på lager" with "min. 2 kg" underneath.
export default function InventoryOverviewRow({ name, imageUrl, status, quantity, minQuantity, unit, isFirst, onPress }) {
    const hasStatus = status.tone !== STATUS_TONES.NONE;
    const stock = formatAmount(quantity, unit);
    const minimum = formatAmount(minQuantity, unit);

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${name}, ${status.text}, ${stock} på lager, minimum ${minimum}`}
            style={({ pressed }) => [styles.overviewRow, !isFirst && styles.groupRowDivider, pressed && styles.pressed]}>
            <InventoryItemMarker imageUrl={imageUrl} tone={status.tone} small />

            <View style={styles.itemText}>
                <Text style={styles.itemName} numberOfLines={1}>{name}</Text>
                <Text
                    style={[styles.itemStatus, hasStatus && styles.itemStatusStrong, { color: toneColors[status.tone] }]}
                    numberOfLines={1}>
                    {status.text}
                </Text>
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
