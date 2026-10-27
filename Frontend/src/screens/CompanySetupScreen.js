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

import styles from '../styles/CompanySetupStyles';


export default function CompanySetupScreen({ navigation }) {
    const [companyName, setCompanyName] = useState('');
    const [address, setAddress] = useState('');
    const [cvrNumber, setCvrNumber] = useState('');


    function handleCreateCompany() {
        if (!companyName.trim() || !address.trim() || !cvrNumber.trim()) {
            Alert.alert(
                'Manglede oplysninger',
                'Udfyld Firmanavn, Adresse og CVR-nummer for at fortætte.'
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




        const companyData = {
            name: companyName.trim(),
            address: address.trim(),
            cvrNumber: cvrNumber.trim(),
        };

        console.log('Company data:', companyData);
        Alert.alert(
            'Virksomhed oprettet',
            'Din virksomhed er blevet oprettet. PLACEHOLDER BACKEND NOT SETUP'
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
                            Opret din virksomhed
                        </Text>

                        <Text style={styles.description}>
                            Indtast oplysningerne om din virksomhed for at komme i gang
                        </Text>

                        <Text style={styles.label}>Virksomhedens navn</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="F.eks. Minh's mad hus"
                            placeholderTextColor="#9CA3AF"
                            value={companyName}
                            onChangeText={setCompanyName}
                            autoCapitalize='words'
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

                        <Text style={styles.label}>Adresse</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="F.eks. Øster Voldgade 4A, 1350 København"
                        placeholderTextColor="#9CA3AF"
                        value={address}
                        onChangeText={setAddress}
                        autoCapitalize="words"
                        />


                        <Pressable
                        style={styles.primaryButton}
                        onPress={handleCreateCompany}
                        >
                            <Text style={styles.primaryButtonText}>
                                Opret virksomhed
                            </Text>
                        </Pressable>
                            
                    </View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );




}