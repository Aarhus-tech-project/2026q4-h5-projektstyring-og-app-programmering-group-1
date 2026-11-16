import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View, Alert } from 'react-native';
import { useState } from 'react'
import { ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../AuthContext/AuthContext';
import { getErrorMessage } from '../../http/http';
import styles from '../styles/loginStyles';
import resetStyles from '../styles/passwordResetStyles';


export default function LoginScreen({ navigation, route }) {

    const { login, user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState(route?.params?.email || user?.email || '');
    const [password, setPassword] = useState('');

    // Efter "Glemt password" sendes brugeren tilbage hertil med sin email udfyldt
    const passwordResetAt = route?.params?.passwordResetAt;
    const [handledResetAt, setHandledResetAt] = useState(passwordResetAt);
    if (passwordResetAt && passwordResetAt !== handledResetAt) {
        setHandledResetAt(passwordResetAt);
        setEmail(route.params.email || email);
        setPassword('');
    }


    async function handleLogin() {
        if (!email.trim() || !password) {
            Alert.alert(
                'Manglende oplysinger',
                'Indast både email og password'
            );
            return;
        }

        setIsLoading(true);

        try {
            const loginData = await login(email, password);

            console.log('Logged in user: ', loginData.user);
            console.log('User companies: ', loginData.companies);

            navigation.replace('Dashboard');
        } catch (error) {
            // console.log i stedet for console.error, så der ikke vises en rød fejl-overlay i appen
            console.log('Login failed:', error?.response?.status ?? error?.message);

            // Alert.alert(title, message) — the third argument must be a list of buttons, not text,
            // otherwise React Native throws "undefined is not a function"
            Alert.alert(
                'Kunne ikke logge ind',
                getErrorMessage(error, {
                    400: 'Indtast en gyldig email og password.',
                    401: 'Forkert email eller password.',
                    fallback: error?.message || 'Der opstod en fejl under login. Prøv igen.',
                })
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.loginCard}>
                        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                            <ChevronLeft size={30} />
                        </Pressable>

                        <Text style={styles.brand}>LAGERKLAR</Text>

                        <Text style={styles.welcomeText}>Velkommen tilbage</Text>

                        <Text style={styles.title}> Log in på din konto</Text>

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#9CA3AF"
                            value={email}
                            onChangeText={setEmail}
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
                            autoCapitalize="none"
                        />

                        <Pressable
                            style={resetStyles.forgotPasswordLink}
                            accessibilityRole="link"
                            onPress={() => navigation.navigate('ForgotPassword', { email: email.trim() })}
                            disabled={isLoading}
                            hitSlop={8}
                        >
                            <Text style={resetStyles.forgotPasswordText}>Glemt password?</Text>
                        </Pressable>

                        <Pressable
                            style={styles.loginButton}
                            onPress={handleLogin}
                            disabled={isLoading}
                            >

                            <Text style={styles.loginButtonText}>
                                {isLoading ? 'Logger ind...' : 'logind'}
                                </Text>
                        </Pressable>

                        <View Style={styles.signUpRow}>
                            <Text style={styles.signUpText}>Har du ikke en konto?</Text>

                            <Pressable
                                accessibilityRole="link"
                                onPress={() => navigation.navigate("SignUp")}>

                                <Text style={styles.signUpLink}>Opret en konto</Text>
                                
                            </Pressable>
                        </View>


                    </View>
                </SafeAreaView>
        </KeyboardAvoidingView>
    );
}