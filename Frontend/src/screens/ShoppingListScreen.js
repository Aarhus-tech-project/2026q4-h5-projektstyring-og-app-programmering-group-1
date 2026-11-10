import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronLeft, Minus, Plus, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    deleteShoppingListItem,
    getShoppingList,
    updateShoppingListItem,
} from '../services/inventoryService';

const colors = {
    background: '#F3F4F6',
    card: '#FFFFFF',
    text: '#171717',
    muted: '#6B7280',
    primary: '#4B8B62',
    border: '#E5E7EB',
    danger: '#D43F3A',
};

export default function ShoppingListScreen({ navigation, route }) {
    const { companyId, companyName } = route.params;
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const loadShoppingList = useCallback(async () => {
        setErrorMessage('');

        try {
            const result = await getShoppingList(companyId);
            setCategories(Array.isArray(result) ? result : []);
        } catch (error) {
            setErrorMessage(error.message || 'Indkøbslisten kunne ikke hentes.');
        } finally {
            setIsLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        loadShoppingList();
    }, [loadShoppingList]);

    async function changeQuantity(item, quantity) {
        setIsUpdating(true);

        try {
            if (quantity <= 0) {
                await deleteShoppingListItem(companyId, item.id);
            } else {
                await updateShoppingListItem(companyId, item.id, quantity);
            }

            await loadShoppingList();
        } catch (error) {
            Alert.alert('Fejl', error.message || 'Indkøbslisten kunne ikke opdateres.');
        } finally {
            setIsUpdating(false);
        }
    }

    const itemCount = categories.reduce(
        (total, category) => total + (category.items?.length || 0),
        0
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    accessibilityRole="button"
                    accessibilityLabel="Tilbage">
                    <ChevronLeft size={26} color={colors.text} />
                </Pressable>

                <View style={{ marginLeft: 12 }}>
                    <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
                        Indkøbsliste
                    </Text>
                    <Text style={{ color: colors.muted }}>{companyName}</Text>
                </View>
            </View>

            {isLoading ? (
                <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
            ) : errorMessage ? (
                <View style={{ padding: 20 }}>
                    <Text style={{ color: colors.danger }}>{errorMessage}</Text>
                    <Pressable onPress={loadShoppingList} style={{ marginTop: 12 }}>
                        <Text style={{ color: colors.primary, fontWeight: '600' }}>Prøv igen</Text>
                    </Pressable>
                </View>
            ) : itemCount === 0 ? (
                <View style={{ alignItems: 'center', marginTop: 80, padding: 24 }}>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
                        Indkøbslisten er tom
                    </Text>
                    <Text style={{ color: colors.muted, marginTop: 8, textAlign: 'center' }}>
                        Tilføj varer fra lageret, så vises de her efter kategori.
                    </Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
                    {categories.map((category) => (
                        <View key={category.categoryId || category.categoryName}>
                            <Text
                                style={{
                                    color: colors.text,
                                    fontSize: 18,
                                    fontWeight: '700',
                                    marginBottom: 8,
                                }}>
                                {category.categoryName}
                            </Text>

                            <View
                                style={{
                                    backgroundColor: colors.card,
                                    borderRadius: 14,
                                    paddingHorizontal: 14,
                                }}>
                                {(category.items || []).map((item, index) => (
                                    <View
                                        key={item.id}
                                        style={{
                                            minHeight: 64,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            borderBottomWidth:
                                                index === category.items.length - 1 ? 0 : 1,
                                            borderBottomColor: colors.border,
                                            gap: 12,
                                        }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: colors.text, fontWeight: '600' }}>
                                                {item.name}
                                            </Text>
                                            <Text style={{ color: colors.muted, marginTop: 3 }}>
                                                {item.quantity} {item.unit}
                                            </Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Pressable
                                                disabled={isUpdating}
                                                onPress={() => changeQuantity(item, item.quantity - 1)}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Fjern én ${item.unit} ${item.name}`}
                                                style={{ padding: 8 }}>
                                                <Minus size={18} color={colors.primary} />
                                            </Pressable>

                                            <Text style={{ minWidth: 24, textAlign: 'center', color: colors.text }}>
                                                {item.quantity}
                                            </Text>

                                            <Pressable
                                                disabled={isUpdating}
                                                onPress={() => changeQuantity(item, item.quantity + 1)}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Tilføj én ${item.unit} ${item.name}`}
                                                style={{ padding: 8 }}>
                                                <Plus size={18} color={colors.primary} />
                                            </Pressable>

                                            <Pressable
                                                disabled={isUpdating}
                                                onPress={() => changeQuantity(item, 0)}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Fjern ${item.name} fra indkøbslisten`}
                                                style={{ padding: 8 }}>
                                                <Trash2 size={18} color={colors.danger} />
                                            </Pressable>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
