import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Trash2 } from 'lucide-react-native';

// Hvor langt (andel af skærmbredden) man skal swipe, før rækken slettes
const DELETE_THRESHOLD = 0.35;
// Et hurtigt swipe sletter også, selvom det er kortere
const FLICK_VELOCITY = -0.8;
const FLICK_MIN_DISTANCE = 60;

/**
 * Wraps a row so it can be swiped from right to left to delete it.
 * Uses React Native's built-in PanResponder, so no extra native library is needed.
 *
 * onSwipeStart / onSwipeEnd let the parent lock vertical scrolling while swiping.
 */
export default function SwipeToDelete({
    children,
    onDelete,
    onSwipeStart,
    onSwipeEnd,
    deleteLabel = 'Slet',
    borderRadius = 14,
}) {
    const { width } = useWindowDimensions();
    const [translateX] = useState(() => new Animated.Value(0));

    // PanResponder is created once, so it reads the newest props through this ref
    const latest = useRef({ onDelete, onSwipeStart, onSwipeEnd, width });
    useEffect(() => {
        latest.current = { onDelete, onSwipeStart, onSwipeEnd, width };
    }, [onDelete, onSwipeStart, onSwipeEnd, width]);

    // `latest` is only read inside the gesture handlers below, never during render
    // eslint-disable-next-line react-hooks/refs
    const [panResponder] = useState(() => {
        const reset = () => {
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
        };

        // Only take over clearly horizontal swipes to the left, so vertical scrolling and taps still work
        const isHorizontalLeftSwipe = (_, g) => g.dx < -10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5;

        return PanResponder.create({
            onMoveShouldSetPanResponderCapture: isHorizontalLeftSwipe,
            onMoveShouldSetPanResponder: isHorizontalLeftSwipe,
            onPanResponderGrant: () => latest.current.onSwipeStart?.(),
            onPanResponderMove: (_, g) => translateX.setValue(Math.min(0, g.dx)),
            onPanResponderTerminationRequest: () => false,
            onPanResponderRelease: (_, g) => {
                const { width: screenWidth, onDelete: deleteRow, onSwipeEnd: swipeEnd } = latest.current;
                swipeEnd?.();

                const farEnough = g.dx < -screenWidth * DELETE_THRESHOLD;
                const flicked = g.vx < FLICK_VELOCITY && g.dx < -FLICK_MIN_DISTANCE;

                if (farEnough || flicked) {
                    // Slide the row out of the screen, then let the parent remove it
                    Animated.timing(translateX, {
                        toValue: -screenWidth,
                        duration: 180,
                        useNativeDriver: true,
                    }).start(() => deleteRow?.());
                } else {
                    reset();
                }
            },
            onPanResponderTerminate: () => {
                latest.current.onSwipeEnd?.();
                reset();
            },
        });
    });

    // The red background fades in as the row is dragged
    const backgroundOpacity = translateX.interpolate({
        inputRange: [-80, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    return (
        <View>
            <Animated.View style={[styles.deleteBackground, { borderRadius, opacity: backgroundOpacity }]}>
                <Trash2 size={20} color="#FFFFFF" />
                <Text style={styles.deleteText}>{deleteLabel}</Text>
            </Animated.View>

            <Animated.View
                style={{ transform: [{ translateX }] }}
                accessibilityActions={[{ name: 'delete', label: deleteLabel }]}
                onAccessibilityAction={(event) => {
                    if (event.nativeEvent.actionName === 'delete') onDelete?.();
                }}
                {...panResponder.panHandlers}>
                {children}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Ligger bag kortet og fylder præcis samme område
    // (StyleSheet.absoluteFillObject findes ikke længere i React Native 0.88)
    deleteBackground: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
        paddingHorizontal: 20,
        backgroundColor: '#DC2626',
    },

    deleteText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
});
