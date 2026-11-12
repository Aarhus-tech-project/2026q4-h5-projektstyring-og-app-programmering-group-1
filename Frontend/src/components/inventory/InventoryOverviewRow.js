import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import InventoryItemMarker from './InventoryItemMarker';
import styles, { inventoryColors, toneColors } from '../../styles/inventoryStyles';
import { STATUS_TONES } from '../../utils/inventoryUtils';

// Compact row in the Overblik list. The caller decides the status line and the amount on the right.
// onPress is optional: a shopping list line whose item is archived cannot be opened.
export default function InventoryOverviewRow({ name, imageUrl, status, amount, amountColor, isFirst, onPress }) {
    const hasStatus = status.tone !== STATUS_TONES.NONE;

    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            accessibilityRole={onPress ? 'button' : undefined}
            accessibilityLabel={`${name}, ${status.text}, ${amount}`}
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

            <Text style={[styles.overviewAmount, { color: amountColor }]}>{amount}</Text>
            {onPress && <ChevronRight size={18} color={inventoryColors.disabled} style={styles.overviewChevron} />}
        </Pressable>
    );
}
