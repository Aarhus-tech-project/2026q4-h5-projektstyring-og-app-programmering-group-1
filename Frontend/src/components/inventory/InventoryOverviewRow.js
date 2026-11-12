import { Text, View } from 'react-native';
import InventoryItemMarker from './InventoryItemMarker';
import styles, { toneColors } from '../../styles/inventoryStyles';
import { STATUS_TONES } from '../../utils/inventoryUtils';

// Compact row in the Overblik list. The caller decides the status line and the amount on the right.
export default function InventoryOverviewRow({ name, imageUrl, status, amount, amountColor, isFirst }) {
    const hasStatus = status.tone !== STATUS_TONES.NONE;

    return (
        <View style={[styles.overviewRow, !isFirst && styles.groupRowDivider]}>
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
        </View>
    );
}
