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
import http from "../../http/http";
import { useAuth } from '../AuthContext/AuthContext';
import { useNavigation, CommonActions } from "@react-navigation/native";
import LoadingModal from '../components/LoadingModal';


import colors from '../constants/colors';
import styles from '../styles/CompanySetupStyles';



function getInitials(name) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('');
}


export default function CompanySetupScreen() {
    const navigation = useNavigation();
    const [cvrNumber, setCvrNumber] = useState('');
    const { user, setCompanies } = useAuth();
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
            const res = await http.get(`/cvr=${cvrNumber}/userID=${user.id}`);
            if(res.data.success) {
                setCompany(res.data.data || null);
            }
        } catch (error) {
            Alert.alert(
                'Virksomhed ikke fundet',
                'Vi kunne ikke finde en virksomhed med det CVR-nummer.'
            );
        } finally {
            setIsSearching(false);
        }
    }

    async function handleCreateCompany() {
        if (!company) {
            return;
        }
        setIsSearching(true);
        try{
            // The backend takes the owner from the auth token, so only the company is sent
            const res = await http.post('/company', {
                company: {
                    cvr: company.cvr,
                    name: company.name,
                    address: company.address,
                    zipcode: company.zipcode,
                    city: company.city,
                },
            })
            if(res.data.success){
                setCompanies(res.data.data);
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'Dashboard' }],
                    })
                );
            }
        }
        catch(error){
            if (error.response?.status === 409) {
                Alert.alert(
                    'Virksomhed findes allerede',
                    'Der er allerede oprettet en virksomhed med dette CVR-nummer.'
                );
            } else {
                Alert.alert(
                    'Fejl ved oprettelse',
                    'Der opstod en fejl under oprettelsen af virksomheden.'
                );
            }
        }
        finally{
            setIsSearching(false);
        }
    
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
                                <Text style={styles.addressText}>{company.address}, {company.zipcode}</Text>
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


            <LoadingModal visible={isSearching}/>
        </KeyboardAvoidingView>
    );
}
