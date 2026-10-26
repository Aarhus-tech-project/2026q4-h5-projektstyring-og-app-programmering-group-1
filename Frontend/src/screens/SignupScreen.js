import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import styles from '../styles/loginStyles';


export default function SignupScreen({ navigation }) {

    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');


    function handleSignUp() {
        if (email !== confirmEmail) {
            Alert.alert('Email matcher ikke', 'Sørg for at email og bekræft email er ens.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Password matcher ikke', 'Sørg for at password og bekræft password er ens.');
            return;
        }

        Alert.alert('Konto oprettet', 'Din konto er blevet oprettet. Du kan nu logge ind. PLACEHOLDER BACKEND NOT SETUP');

        // BACKEND IS NOT ADDED YET, SO THIS IS JUST A PLACEHOLDER FOR NOW
    }

    return (
        <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <SafeAreaView style={styles.safeArea}>
                    <ScrollView
                        contentContainerStyle={styles.signUpScrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}>
                    <View style={styles.loginCard}>
                        <Pressable
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}>
                            <Text style={styles.backButtonText}>Tilbage</Text>
                        </Pressable>
                        
                        <Text style={styles.brand}>LAGERKLAR</Text>

                        <Text style={styles.welcomeText}>Opret en ny konto</Text>

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#9CA3AF"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"/>

                        <Text style={styles.label}>Bekræft email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Bekræft email"
                            placeholderTextColor="#9CA3AF"
                            value={confirmEmail}
                            onChangeText={setConfirmEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"/>


                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#9CA3AF"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={true}
                            autoCapitalize="none"/>

                        <Text style={styles.label}>Bekræft password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Bekræft password"
                            placeholderTextColor="#9CA3AF"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={true}
                            autoCapitalize="none"/>
                            

                        <Pressable style={styles.loginButton} onPress={handleSignUp}>
                            <Text style={styles.loginButtonText}>Opret konto</Text>
                        </Pressable>

                        
                    </View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    )
}