import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoveLeft } from 'lucide-react-native';

import styles from '../styles/RestaurantSetupStyles';

export default function RestaurantSetupScreen({ navigation }) {
    const [restaurantName, setRestaurantName] = useState('');
    const [address, setAddress] = useState('');
    const [cvrNumber, setCvrNumber] = useState('');


    function handleCreateRestaurant() {
        if (!restaurantName.trim() || !address.trim() || !cvrNumber.trim()) {
            Alert.alert(
                'Manglede oplysninger',
                'Udfyld Restaurantnavn, Adresse og CVR-nummer for at fortætte.'
            );
            return;
        }

        if (cvrNumber.length !== 8) {
            Alert.alert(
                'ugyldigt CVR-nummer',
                'Et CVR-nummer skal bestå af 8 cifre.'
            );
            return;
        }



        const restaurantData = {
            name: restaurantName.trim(),
            address: address.trim(),
            cvrNumber: cvrNumber.trim(),
        };

        console.log('Restaurant data:', restaurantData);
        Alert.alert(
            'Restaurant oprettet',
            'Din restaurant er blevet oprettet. PLACEHOLDER BACKEND NOT SETUP'
        );
}

    return (
        <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
        >
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={false}
                >
                    <View style={styles.card}>
                        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                            <MoveLeft size={30} />
                        </Pressable>
                        <Text style={styles.brand}>LAGERKLAR</Text>

                        <Text style={styles.welcomeText}>
                            Kom godt i gang
                        </Text>

                        <Text style={styles.title}>
                            Opret din restaurant
                        </Text>

                        <Text style={styles.description}>
                            Indtast oplysningerne om din restaurant for at komme i gang
                        </Text>

                        <Text style={styles.label}>Restaurantens navn</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="F.eks. Minh's mad hus"
                            placeholderTextColor="#9CA3AF"
                            value={restaurantName}
                            onChangeText={setRestaurantName}
                            autoCapitalize='words'
                            />

                        <Text style={styles.label}>Adresse</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="F.eks. Øster Voldgade 4A, 1350 København"
                        placeholderTextColor="#9CA3AF"
                        value={address}
                        onChangeText={setAddress}
                        autoCapitalize="words"
                        />

                        <Text style={styles.label}>CVR-nummer</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="F.eks. 12345678"
                            placeholderTextColor="#9CA3AF"
                            value={cvrNumber}
                            onChangeText={setCvrNumber}
                            keyboardType='number-pad'
                            autoCapitalize="words"
                        />

                        <Pressable
                        style={styles.primaryButton}
                        onPress={handleCreateRestaurant}
                        >
                            <Text style={styles.primaryButtonText}>
                                Opret restaurant
                            </Text>
                        </Pressable>
                            
                    </View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );




}