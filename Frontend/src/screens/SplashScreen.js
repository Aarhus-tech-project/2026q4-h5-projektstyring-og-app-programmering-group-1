import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { PackageCheck } from 'lucide-react-native';
import styles from '../styles/splashStyles';

const SPLASH_DURATION = 2000;

export default function SplashScreen({ navigation }) {

    useEffect(() => {
        const timer = setTimeout(() => navigation.replace('Home'), SPLASH_DURATION);
        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.center}>
                <View style={styles.logoBox}>
                    <PackageCheck size={56} color="#FFFFFF" strokeWidth={2.2} />
                </View>
                <Text style={styles.title}>Lagerstyr</Text>
                <Text style={styles.subtitle}>Styr på lager</Text>
            </View>
        </SafeAreaView>
    );
}

function LoadingDots() {
    const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

    useEffect(() => {
        const animation = Animated.loop(
            Animated.stagger(200, dots.map((dot) =>
                Animated.sequence([
                    Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
                ])
            ))
        );
        animation.start();
        return () => animation.stop();
    }, []);

    return (
        <View style={styles.dots}>
            {dots.map((opacity, index) => (
                <Animated.View key={index} style={[styles.dot, { opacity }]} />
            ))}
        </View>
    );
}
