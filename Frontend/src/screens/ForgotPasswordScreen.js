import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react-native';
import styles from '../styles/loginStyles';
import resetStyles from '../styles/passwordResetStyles';
import { requestResetCode, getResetError } from '../services/passwordResetService';
import { isValidEmail } from '../utils/passwordResetUtils';

export default function ForgotPasswordScreen({ navigation, route }) {
    const [email, setEmail] = useState(route.params?.email ?? '');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSendCode() {
        const trimmedEmail = email.trim().toLowerCase();

        if (!isValidEmail(trimmedEmail)) {
            setError('Indtast en gyldig email, fx navn@firma.dk.');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const result = await requestResetCode(trimmedEmail);

            navigation.navigate('VerifyResetCode', {
                email: trimmedEmail,
                expiresIn: result?.expires_in_seconds ?? 600,
                resendAfter: result?.resend_after_seconds ?? 60,
                sentAt: Date.now(),
            });
        } catch (requestError) {
            const { message } = getResetError(requestError, 'Kunne ikke sende koden. Prøv igen.');
            setError(message);
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
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.loginCard}>
                        <Pressable
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            accessibilityRole="button"
                            accessibilityLabel="Tilbage"
                            disabled={isLoading}
                        >
                            <ChevronLeft size={30} />
                        </Pressable>

                        <Text style={styles.brand}>LAGERKLAR</Text>
                        <Text style={styles.title}>Glemt password?</Text>

                        <Text style={resetStyles.description}>
                            Indtast den email, du bruger til din konto. Vi sender dig en 6-cifret kode, så du kan vælge et nyt password.
                        </Text>

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, error ? resetStyles.inputError : null]}
                            placeholder="Email"
                            placeholderTextColor="#9CA3AF"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (error) setError('');
                            }}
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                            textContentType="emailAddress"
                            keyboardType="email-address"
                            returnKeyType="send"
                            onSubmitEditing={handleSendCode}
                            editable={!isLoading}
                            accessibilityLabel="Email"
                        />

                        {error ? (
                            <View style={resetStyles.errorBox} accessibilityLiveRegion="polite">
                                <Text style={resetStyles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <Pressable
                            style={[styles.loginButton, isLoading && resetStyles.buttonDisabled]}
                            onPress={handleSendCode}
                            disabled={isLoading}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: isLoading, busy: isLoading }}
                        >
                            <View style={resetStyles.buttonContent}>
                                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : null}
                                <Text style={styles.loginButtonText}>
                                    {isLoading ? 'Sender kode...' : 'Send kode'}
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}
