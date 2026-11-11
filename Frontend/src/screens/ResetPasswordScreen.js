import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRef, useState } from 'react';
import { Check, ChevronLeft, Circle, Eye, EyeOff } from 'lucide-react-native';
import colors from '../constants/colors';
import styles from '../styles/loginStyles';
import resetStyles, { resetColors } from '../styles/passwordResetStyles';
import { resetPassword, getResetError } from '../services/passwordResetService';
import { getPasswordRequirements, validateNewPassword } from '../utils/passwordResetUtils';

function PasswordInput({ value, onChangeText, placeholder, isVisible, onToggleVisible, hasError, inputRef, ...props }) {
    return (
        <View style={resetStyles.passwordField}>
            <TextInput
                ref={inputRef}
                style={[styles.input, resetStyles.passwordInput, hasError && resetStyles.inputError]}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={!isVisible}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={placeholder}
                {...props}
            />
            <Pressable
                style={resetStyles.visibilityToggle}
                onPress={onToggleVisible}
                accessibilityRole="button"
                accessibilityLabel={isVisible ? 'Skjul password' : 'Vis password'}
                hitSlop={6}
            >
                {isVisible ? <EyeOff size={22} color={resetColors.muted} /> : <Eye size={22} color={resetColors.muted} />}
            </Pressable>
        </View>
    );
}

export default function ResetPasswordScreen({ navigation, route }) {
    const { email, resetToken } = route.params;

    const confirmRef = useRef(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const requirements = getPasswordRequirements(password);
    const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

    function startOver() {
        navigation.popTo('ForgotPassword', { email });
    }

    async function handleSave() {
        const validationError = validateNewPassword(password, confirmPassword);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError('');
        setIsSaving(true);

        try {
            await resetPassword(resetToken, password, confirmPassword);

            Alert.alert(
                'Password ændret',
                'Dit password er nulstillet. Du kan nu logge ind med dit nye password.',
                [{ text: 'Gå til login', onPress: () => navigation.popTo('Login', { email, passwordResetAt: Date.now() }) }],
                { cancelable: false }
            );
        } catch (saveError) {
            const { code, message } = getResetError(saveError, 'Kunne ikke gemme dit nye password. Prøv igen.');

            if (code === 'invalid_reset_token') {
                Alert.alert('Sessionen er udløbet', message, [{ text: 'Start forfra', onPress: startOver }], { cancelable: false });
                return;
            }
            setError(message);
        } finally {
            setIsSaving(false);
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
                            disabled={isSaving}
                        >
                            <ChevronLeft size={30} />
                        </Pressable>

                        <Text style={styles.brand}>LAGERKLAR</Text>
                        <Text style={styles.title}>Vælg nyt password</Text>

                        <Text style={resetStyles.description}>
                            Koden er bekræftet. Vælg et nyt password til <Text style={resetStyles.emailHighlight}>{email}</Text>.
                        </Text>

                        <Text style={styles.label}>Nyt password</Text>
                        <PasswordInput
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                if (error) setError('');
                            }}
                            placeholder="Nyt password"
                            isVisible={showPassword}
                            onToggleVisible={() => setShowPassword((visible) => !visible)}
                            hasError={Boolean(error) && !confirmPassword}
                            autoComplete="new-password"
                            textContentType="newPassword"
                            returnKeyType="next"
                            onSubmitEditing={() => confirmRef.current?.focus()}
                            editable={!isSaving}
                            autoFocus
                        />

                        <View style={resetStyles.requirements}>
                            {requirements.map((requirement) => (
                                <View key={requirement.key} style={resetStyles.requirementRow}>
                                    {requirement.met
                                        ? <Check size={14} color={colors.primary} />
                                        : <Circle size={10} color={resetColors.muted} />}
                                    <Text style={[resetStyles.requirementText, requirement.met && resetStyles.requirementMet]}>
                                        {requirement.label}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <Text style={styles.label}>Bekræft nyt password</Text>
                        <PasswordInput
                            inputRef={confirmRef}
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                if (error) setError('');
                            }}
                            placeholder="Bekræft nyt password"
                            isVisible={showConfirm}
                            onToggleVisible={() => setShowConfirm((visible) => !visible)}
                            hasError={mismatch}
                            autoComplete="new-password"
                            textContentType="newPassword"
                            returnKeyType="done"
                            onSubmitEditing={handleSave}
                            editable={!isSaving}
                        />

                        {mismatch && !error ? (
                            <Text style={[resetStyles.errorText, { marginTop: -10, marginBottom: 14 }]}>
                                De to passwords er ikke ens.
                            </Text>
                        ) : null}

                        {error ? (
                            <View style={resetStyles.errorBox} accessibilityLiveRegion="polite">
                                <Text style={resetStyles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <Pressable
                            style={[styles.loginButton, isSaving && resetStyles.buttonDisabled]}
                            onPress={handleSave}
                            disabled={isSaving}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: isSaving, busy: isSaving }}
                        >
                            <View style={resetStyles.buttonContent}>
                                {isSaving ? <ActivityIndicator color="#FFFFFF" /> : null}
                                <Text style={styles.loginButtonText}>
                                    {isSaving ? 'Gemmer...' : 'Gem nyt password'}
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}
