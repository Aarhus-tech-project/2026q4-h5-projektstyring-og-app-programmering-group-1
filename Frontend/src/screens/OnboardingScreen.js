import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useRef, useState } from 'react';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/onboardingStyles';

export const ONBOARDING_KEY = 'hasSeenOnboarding';

const slides = [
    {
        id: 'overview',
        animation: require('../../assets/lottieFiles/Get things done.json'),
        eyebrow: 'OVERBLIK',
        title: 'Styr på dit lager',
        description: 'Se alle dine varer ét sted, og hold styr på hvad der er på lager.',
    },
    {
        id: 'sync',
        animation: require('../../assets/lottieFiles/Order Sync Loading.json'),
        eyebrow: 'BESTILLINGER',
        title: 'Altid synkroniseret',
        description: 'Dine ordrer og lagertal opdateres automatisk på tværs af hele virksomheden.',
    },
    {
        id: 'ready',
        animation: require('../../assets/lottieFiles/loading.json'),
        eyebrow: 'KOM I GANG',
        title: 'Klar på få sekunder',
        description: 'Opret din konto, tilknyt din virksomhed, og begynd at styre dit lager.',
    },
];

export default function OnboardingScreen({ navigation }) {
    const { width } = useWindowDimensions();
    const listRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const isLastSlide = currentIndex === slides.length - 1;

    async function finishOnboarding() {
        try {
            await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        } catch (error) {
            console.error('Could not save onboarding state;', error);
        }
        navigation.replace('Home');
    }

    function handleNext() {
        if (isLastSlide) {
            finishOnboarding();
            return;
        }
        listRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }

    function handleScrollEnd(event) {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                {!isLastSlide && (
                    <Pressable onPress={finishOnboarding} hitSlop={12}>
                        <Text style={styles.skipText}>Spring over</Text>
                    </Pressable>
                )}
            </View>

            <FlatList
                ref={listRef}
                data={slides}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                bounces={false}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScrollEnd}
                getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                renderItem={({ item, index }) => (
                    <View style={[styles.slide, { width }]}>
                        <LottieView
                            source={item.animation}
                            autoPlay={index === currentIndex}
                            loop
                            style={styles.animation}
                        />
                        <Text style={styles.eyebrow}>{item.eyebrow}</Text>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.description}>{item.description}</Text>
                    </View>
                )}
            />

            <View style={styles.footer}>
                <View style={styles.dots}>
                    {slides.map((slide, index) => (
                        <View
                            key={slide.id}
                            style={[styles.dot, index === currentIndex && styles.dotActive]}
                        />
                    ))}
                </View>

                <Pressable style={styles.primaryButton} onPress={handleNext}>
                    <Text style={styles.primaryButtonText}>
                        {isLastSlide ? 'Kom i gang' : 'Næste'}
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
