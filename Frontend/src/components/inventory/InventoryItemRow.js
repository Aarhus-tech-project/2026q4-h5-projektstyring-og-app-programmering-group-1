import { Pressable, Text, View } from 'react-native';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react-native';
import styles, { inventoryColors } from '../../styles/inventoryStyles';
import { getExpiryText, isLowStock, isOutOfStock, needsPurchase } from '../../utils/inventoryUtils';

function getStatus(item) {
    if (isOutOfStock(item)) {
        return {
            label: 'Ikke på lager',
            color: inventoryColors.red,
            softColor: inventoryColors.redSoft,
        };
    }

    if (isLowStock(item)) {
        return {
            label: 'Lav beholdning',
            color: inventoryColors.warning,
            softColor: inventoryColors.warningSoft,
        };
    }

    return {
        label: 'På lager',
        color: inventoryColors.primary,
        softColor: inventoryColors.primarySoft,
    };
}

export default function InventoryItemRow({
    item,
    isTablet,
    onChangeQuantity,
    onAddToShoppingList,
    onDeleteItem,
}) {
    const status = getStatus(item);
    const expiryText = getExpiryText(item);
    const canDecrease = item.quantity > 0;

    return (
        <View style={[styles.itemRow, isTablet && styles.itemRowTablet]}>
            <View style={styles.itemHeader}>
                <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: status.softColor }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                    </Text>
                </View>
            </View>

            <Text style={styles.itemMeta}>
                {item.category} · min. {item.minQuantity} {item.unit}
            </Text>

            <View style={styles.itemFooter}>
                <View style={styles.itemNotes}>
                    {needsPurchase(item) && (
                        <Text style={styles.purchaseText}>
                            køb mindst {item.minQuantity - item.quantity} {item.unit}
                        </Text>
                    )}
                    {expiryText && (
                        <Text style={styles.expiryText}>{expiryText}</Text>
                    )}
                </View>

                <View style={styles.stepper}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.stepperButton,
                            !canDecrease && styles.stepperButtonDisabled,
                            pressed && styles.pressed,
                        ]}
                        onPress={() => onChangeQuantity(item, -1)}
                        disabled={!canDecrease}
                        accessibilityRole="button"
                        accessibilityLabel={`Fjern 1 ${item.unit} ${item.name}`}
                        accessibilityState={{ disabled: !canDecrease }}>
                        <Minus
                            size={20}
                            color={canDecrease ? inventoryColors.primary : inventoryColors.muted}
                        />
                    </Pressable>

                    <Text style={styles.quantityText}>
                        {item.quantity} {item.unit}
                    </Text>

                    <Pressable
                        style={({ pressed }) => [
                            styles.stepperButton,
                            pressed && styles.pressed,
                        ]}
                        onPress={() => onChangeQuantity(item, 1)}
                        accessibilityRole="button"
                        accessibilityLabel={`Tilføj 1 ${item.unit} ${item.name}`}>
                        <Plus size={20} color={inventoryColors.primary} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.stepperButton,
                            pressed && styles.pressed,
                        ]}
                        onPress={() => onAddToShoppingList(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`Tilføj ${item.name} til indkøbslisten`}>
                        <ShoppingCart size={18} color={inventoryColors.blue} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.stepperButton,
                            { backgroundColor: inventoryColors.redSoft },
                            pressed && styles.pressed,
                        ]}
                        onPress={() => onDeleteItem(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`Slet ${item.name} fra lageret`}>
                        <Trash2 size={18} color={inventoryColors.red} />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}
