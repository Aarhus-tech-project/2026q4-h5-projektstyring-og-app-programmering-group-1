import { useState } from 'react';
import {
    ActivityIndicator,
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
import { ArrowLeft, ArrowRight, Building2 } from 'lucide-react-native';

import colors from '../constants/colors';
import styles from '../styles/CompanySetupStyles';


// PLACEHOLDER: skal erstattes med kald til backend CVR-opslag
async function lookupCompany(cvrNumber) {
    return {
        name: 'Nordic Bistro',
        street: 'Søndergade 12',
        city: '8700 Horsens',
        cvrNumber,
    };
}

function getInitials(name) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('');
}


export default function CompanySetupScreen({ navigation }) {
    const [cvrNumber, setCvrNumber] = useState('');
    const [company, setCompany] = useState(null);
    const [isSearching, setIsSearching] = useState(false);


    function handleCvrChange(text) {
        setCvrNumber(text.replace(/[^0-9]/g, ''));
        setCompany(null);
    }

    async function handleFindCompany() {
        if (cvrNumber.length !== 8) {
            Alert.alert(
                'Ugyldigt CVR-nummer',
                'Et CVR-nummer skal bestå af 8 cifre.'
            );
            return;
        }

        setIsSearching(true);
        try {
            const result = await lookupCompany(cvrNumber);
            setCompany(result);
        } catch (error) {
            Alert.alert(
                'Virksomhed ikke fundet',
                'Vi kunne ikke finde en virksomhed med det CVR-nummer.'
            );
        } finally {
            setIsSearching(false);
        }
    }

    function handleCreateCompany() {
        if (!company) {
            return;
        }

        console.log('Company data:', company);
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
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Pressable
                        style={styles.headerButton}
                        onPress={() => navigation.goBack()}
                        >
                            <ArrowLeft
                            size={24}
                            color={colors.text.primary}
                            />
                        </Pressable>

                        <Text style={styles.headerTitle}>Opret virksomhed</Text>

                        <View style={styles.headerButton}/>
                    </View>

                    <View style={styles.companyCard}>
                        <View style={styles.logo}>
                            {company ? (
                                <Text style={styles.logoText}>
                                    {getInitials(company.name)}
                                </Text>
                            ) : (
                                <Building2 size={36} color={colors.primary}/>
                            )}
                        </View>

                        <Text style={styles.fieldLabel}>Virksomhedsnavn</Text>
                        <Text style={company ? styles.companyName : styles.placeholderText}>
                            {company ? company.name : 'Ingen virksomhed valgt'}
                        </Text>

                        <View style={styles.divider}/>

                        <Text style={styles.fieldLabel}>Adresse</Text>
                        {company ? (
                            <>
                                <Text style={styles.addressText}>{company.street}</Text>
                                <Text style={styles.addressText}>{company.city}</Text>
                            </>
                        ) : (
                            <Text style={styles.placeholderText}>—</Text>
                        )}
                    </View>

                    <Text style={styles.title}>Find din virksomhed</Text>
                    <Text style={styles.description}>
                        Indtast virksomhedens CVR-nummer.
                    </Text>

                    <Text style={styles.label}>CVR-nummer</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="F.eks. 12345678"
                        placeholderTextColor="#9CA3AF"
                        value={cvrNumber}
                        onChangeText={handleCvrChange}
                        keyboardType='number-pad'
                        maxLength={8}
                        returnKeyType='search'
                        onSubmitEditing={handleFindCompany}
                    />

                    <Pressable
                    style={styles.secondaryButton}
                    onPress={handleFindCompany}
                    disabled={isSearching}
                    >
                        {isSearching ? (
                            <ActivityIndicator color={colors.primary}/>
                        ) : (
                            <>
                                <Text style={styles.secondaryButtonText}>
                                    Find virksomhed
                                </Text>
                                <ArrowRight size={20} color={colors.primary}/>
                            </>
                        )}
                    </Pressable>

                    <Pressable
                    style={[
                        styles.primaryButton,
                        !company && styles.primaryButtonDisabled,
                    ]}
                    onPress={handleCreateCompany}
                    disabled={!company}
                    >
                        <Text style={styles.primaryButtonText}>
                            Opret virksomhed
                        </Text>
                        <ArrowRight size={20} color="#FFFFFF"/>
                    </Pressable>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}
