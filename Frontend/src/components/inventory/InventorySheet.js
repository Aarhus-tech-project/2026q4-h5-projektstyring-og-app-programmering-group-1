import { useEffect, useMemo, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../../styles/inventoryStyles';

// How far (px) or how fast the handle must be dragged down before the sheet closes
const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 1;

// Bottom sheet used for item details, create/edit, receiving goods and categories.
// One sheet whose content changes, so we never stack two native modals on top of each other.
// Close it by tapping the dimmed area, the Android back button, or by dragging the handle down.
// onClose should be stable (useCallback), otherwise the drag handler is rebuilt on every render.
//
// Content is built from <SheetBody> (scrolls) and an optional <SheetFooter> (always visible at the bottom).
export default function InventorySheet({ visible, onClose, children }) {
    const [translateY] = useState(() => new Animated.Value(0));

    // Start at the normal position every time the sheet opens
    useEffect(() => {
        if (visible) translateY.setValue(0);
    }, [visible, translateY]);

    const panResponder = useMemo(() =>
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 4,
            onPanResponderMove: (_, gesture) => translateY.setValue(Math.max(0, gesture.dy)),
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dy > CLOSE_DISTANCE || gesture.vy > CLOSE_VELOCITY) {
                    Animated.timing(translateY, { toValue: 1000, duration: 180, useNativeDriver: true })
                        .start(() => onClose());
                } else {
                    Animated.spring(translateY, { toValue: 0, bounciness: 4, useNativeDriver: true }).start();
                }
            },
            onPanResponderTerminate: () => {
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
            },
        }), [translateY, onClose]);

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.sheetBackdrop}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Pressable
                    style={styles.sheetDismissArea}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Luk"
                />
                <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                    <View style={styles.sheetHandleArea} {...panResponder.panHandlers}>
                        <View style={styles.sheetGrabber} />
                    </View>
                    {children}
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// Scrolling part of the sheet. withFooter: a SheetFooter follows, so no safe-area padding is needed here.
export function SheetBody({ children, withFooter = false }) {
    const insets = useSafeAreaInsets();

    return (
        <ScrollView
            style={styles.sheetBody}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.sheetContent, { paddingBottom: withFooter ? 16 : insets.bottom + 20 }]}>
            {children}
        </ScrollView>
    );
}

// Buttons pinned to the bottom of the sheet, so "Gem" is always visible without scrolling
export function SheetFooter({ children }) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.sheetFooter, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
            {children}
        </View>
    );
}
