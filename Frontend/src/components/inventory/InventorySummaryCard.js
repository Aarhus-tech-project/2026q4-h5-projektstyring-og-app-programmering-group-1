import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import styles, { inventoryColors } from '../../styles/inventoryStyles';

// One of the Overblik cards. The selected card decides which items the list below shows.
// opensScreen: the card navigates to another screen instead (shown with a ›), so it is never "selected".
// wide: a full-width card with icon, count and label on one line (used for the odd card at the bottom).
export default function InventorySummaryCard({ icon: Icon, label, count, color, softColor, isSelected, opensScreen = false, wide = false, onPress }) {
    const icon = (
        <View style={[styles.summaryIcon, { backgroundColor: isSelected ? inventoryColors.card : softColor }]}>
            <Icon size={20} color={color} />
        </View>
    );
    const countText = (
        <Text style={[styles.summaryCount, wide && styles.summaryCountWide, { color: count > 0 ? color : inventoryColors.text }]}>
            {count}
        </Text>
    );

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${count} varer`}
            accessibilityHint={opensScreen ? `Åbner ${label.toLowerCase()}` : undefined}
            accessibilityState={opensScreen ? undefined : { selected: isSelected }}
            style={({ pressed }) => [
                styles.summaryCard,
                wide && styles.summaryCardWide,
                isSelected && { borderColor: color, backgroundColor: softColor },
                pressed && styles.pressed,
            ]}>
            {wide ? (
                <>
                    {icon}
                    {countText}
                    <Text style={[styles.summaryLabel, styles.summaryLabelWide]}>{label}</Text>
                    {opensScreen && <ChevronRight size={20} color={inventoryColors.disabled} />}
                </>
            ) : (
                <>
                    <View style={styles.summaryCardTop}>
                        {icon}
                        {opensScreen && <ChevronRight size={20} color={inventoryColors.disabled} />}
                    </View>
                    {countText}
                    <Text style={styles.summaryLabel}>{label}</Text>
                </>
            )}
        </Pressable>
    );
}
