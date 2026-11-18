import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { PackageCheck } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/splashStyles';
import { ONBOARDING_KEY } from './OnboardingScreen';
import { useAuth } from '../AuthContext/AuthContext';
const MODE = process.env.EXPO_PUBLIC_MODE || 'development';

// Minimum time the splash is shown, even if the session check is faster
const SPLASH_DURATION = 2000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function hasSeenOnboarding() {
    if (MODE === 'development') {
        return false;
    }
    try {
        return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
    } catch (error) {
        console.error('Could not load onboarding state;', error);
        return false;
    }
}

export default function SplashScreen({ navigation }) {
    const { restoreSession } = useAuth();

    useEffect(() => {
        let cancelled = false;

        async function decideStartScreen() {
            // The backend verifies the saved token (signature + expiry) while the splash is showing
            const [sessionStatus] = await Promise.all([restoreSession(), wait(SPLASH_DURATION)]);
            if (cancelled) {
                return;
            }

            if (sessionStatus === 'authenticated') {
                navigation.replace('Dashboard');
                return;
            }

            // 'missing', 'invalid' or 'unreachable': the user has to sign in.
            // First-time users see the onboarding before that.
            const seenOnboarding = await hasSeenOnboarding();
            if (!cancelled) {
                navigation.replace(seenOnboarding ? 'Login' : 'Onboarding');
            }
        }

        decideStartScreen();
        return () => {
            cancelled = true;
        };
        // restoreSession must only run once, when the app starts
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
