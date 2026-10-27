import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useState } from 'react'
import { MoveLeft } from 'lucide-react-native';
import styles from '../styles/loginStyles';




export default function LoginScreen({ navigation }) {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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
                            onPress={() => console.log({ email, password })}>

                            <Text style={styles.loginButtonText}>Log ind</Text>
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