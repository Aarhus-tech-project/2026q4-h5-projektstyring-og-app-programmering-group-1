import { Pressable, Text, View } from 'react-native';
import styles, { inventoryColors } from '../../styles/inventoryStyles';

// One of the four Overblik cards. The selected card decides which items the list below shows.
export default function InventorySummaryCard({ icon: Icon, label, count, color, softColor, isSelected, onPress }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${count} varer`}
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => [
                styles.summaryCard,
                isSelected && { borderColor: color, backgroundColor: softColor },
                pressed && styles.pressed,
            ]}>
            <View style={styles.summaryCardTop}>
                <View style={[styles.summaryIcon, { backgroundColor: isSelected ? inventoryColors.card : softColor }]}>
                    <Icon size={20} color={color} />
                </View>
            </View>

            <Text style={[styles.summaryCount, { color: count > 0 ? color : inventoryColors.text }]}>{count}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
        </Pressable>
    );
}
