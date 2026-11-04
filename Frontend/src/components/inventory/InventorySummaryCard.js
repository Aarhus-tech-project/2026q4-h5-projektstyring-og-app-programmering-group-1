import { Pressable, Text, View } from 'react-native';
import styles from '../../styles/inventoryStyles';

export default function InventorySummaryCard({ icon: Icon, label, count, color, softColor, isActive, isTablet, onPress }) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.summaryCard,
                isTablet && styles.summaryCardTablet,
                isActive && { borderColor: color },
                pressed && styles.pressed,
            ]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${count} varer`}
            accessibilityState={{ selected: isActive }}>
            <View style={styles.summaryCardTop}>
                <View style={[styles.summaryIcon, { backgroundColor: softColor }]}>
                    <Icon size={20} color={color} />
                </View>
                <Text style={[styles.summaryCount, { color }]}>{count}</Text>
            </View>

            <Text style={styles.summaryLabel}>{label}</Text>
        </Pressable>
    );
}
