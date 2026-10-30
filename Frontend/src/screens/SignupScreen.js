import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { MoveLeft } from 'lucide-react-native';
import styles from '../styles/loginStyles';


export default function SignupScreen({ navigation }) {

    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSignUp() {
        const trimmedFirstName = firstName.trim();
        const trimmedLastName = lastName.trim();
        const trimmedEmail = email.trim().toLocaleLowerCase();

        if (!trimmedFirstName || !trimmedLastName) {
            Alert.alert(
                'Manglende navn',
                'Udfyld både fornavn of efternavn.'
            );
            return;
        }

        if (trimmedEmail !== confirmEmail.trim().toLocaleLowerCase()) {
            Alert.alert(
                'Email matcher ikke',
                'Sørg for at email og bekræft email matcher.'
            );
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(
                'Passwword matcher ikke',
                'Sørg for at password og bekræft password matcher.'
            );
            return;
        }

        if (password.length < 8) {
            Alert.alert(
                'Password er for kort',
                'Paasword skal være mindst 8 tegn langt.'
            );
            return;
        }

        setIsLoading(true);


        try {
            const response = await fetch('http://172.31.0.151:8080/v1/register', { // REPLACE THIS WHEN SERVER IS UP AND RUNNING
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: `${trimmedFirstName} ${trimmedLastName}`,
                    email: trimmedEmail,
                    password,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                Alert.alert(
                    'Kunne ikke oprette konto',
                    result.message || 'Der optod en fejl ved oprettelse of kontoen.'
                );
                return;
            }

            Alert.alert(
            'Konto oprettet',
            'Din konto er oprettet. Du kan nu logge ind.',
            [
                {
                    text: 'OK',
                    onPress: () => navigation.replace('Login'),
                },
            ]
        );
    } catch (error) {
        console.error('Registration request failed:', error);

        Alert.alert(
            'Forbindelsesfejl',
            'Kunne ikke få forbindelse til serveren. Tjek din internetforbindelse og prøv igen.'
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
                    <ScrollView
                        contentContainerStyle={styles.signUpScrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}>
                    <View style={styles.loginCard}>
                        <Pressable
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}>
                            <MoveLeft size={30} />
                        </Pressable>
                        
                        <Text style={styles.brand}>LAGERKLAR</Text>

                        <Text style={styles.welcomeText}>Opret en ny konto</Text>

                        <View style={styles.nameFieldsRow}>
                            <View style={styles.nameField}>
                                <Text style={styles.label}>Fornavn</Text>
                                <TextInput
                                style={styles.input}
                                placeholder="Fornavn"
                                placeholderTextColor="#9CA3AF"
                                value={firstName}
                                onChangeText={setFirstName}
                                autoCapitalize="none"
                                keyboardType="name-first"/>
                            </View>
                        
                            <View style={styles.nameField}>
                                <Text style={styles.label}>Efternavn</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Efternavn"
                                    placeholderTextColor="#9CA3AF"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    autoCapitalize="none"
                                    keyboardType="name-last"/>
                            </View>
                        </View>

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
                            

                        <Pressable
                        style={styles.loginButton}
                        onPress={handleSignUp}
                        disabled={isLoading}>
                            <Text
                            style={styles.loginButtonText}>
                                {isLoading ? 'Opretter konto...' : 'Opret konto'}
                                </Text>
                        </Pressable>

                        
                    </View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    )
}