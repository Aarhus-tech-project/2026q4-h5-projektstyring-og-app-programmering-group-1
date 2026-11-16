import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { PackageCheck } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/splashStyles';
import { ONBOARDING_KEY } from './OnboardingScreen';
const MODE = process.env.EXPO_PUBLIC_MODE || 'development';

const SPLASH_DURATION = 2000;

export default function SplashScreen({ navigation }) {

    useEffect(() => {
        const timer = setTimeout(async () => {
            let hasSeenOnboarding = null;
            try {
                hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
                hasSeenOnboarding = MODE === 'development' ? false : hasSeenOnboarding === 'true';
            } catch (error) {
                console.error('Could not load onboarding state;', error);
            }
            navigation.replace(hasSeenOnboarding ? 'Home' : 'Onboarding');
        }, SPLASH_DURATION);
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
