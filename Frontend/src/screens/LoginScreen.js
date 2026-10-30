import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View, Alert } from 'react-native';
import { useState } from 'react'
import { MoveLeft } from 'lucide-react-native';
import { useAuth } from '../AuthContext/AuthContext';
import styles from '../styles/loginStyles';




export default function LoginScreen({ navigation }) {

    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');


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

            navigation.replace('ProfileScreen');
        } catch (error) {
            console.error('Login failed: ' , error);

            Alert.alert(
                'Kunne ikke logge ind',
                error.message || 'Der optod en fejl under login'
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
                            <MoveLeft size={30} />
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