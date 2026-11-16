import { useEffect, useState } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';


const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function useSlideUpSheet(visible, onClose) {
    const [translateY] = useState(() => new Animated.Value(SCREEN_HEIGHT));


    useEffect(() => {
        if (visible) {
            translateY.setValue(SCREEN_HEIGHT);
            Animated.timing(translateY, {
                toValue: 0,
                duration: 280,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        }
    }, [visible, translateY]);

    const close = () => {
        Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 220,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(() => onClose());
    };

    return { translateY, close };
}