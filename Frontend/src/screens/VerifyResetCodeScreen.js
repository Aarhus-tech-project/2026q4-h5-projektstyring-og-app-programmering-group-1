import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react-native';
import styles from '../styles/loginStyles';
import resetStyles from '../styles/passwordResetStyles';
import { requestResetCode, verifyResetCode, getResetError } from '../services/passwordResetService';
import { CODE_LENGTH, formatCountdown, sanitizeCode } from '../utils/passwordResetUtils';

export default function VerifyResetCodeScreen({ navigation, route }) {
    const { email } = route.params;

    const inputRef = useRef(null);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    // Efter for mange forkerte forsøg er koden ugyldig, indtil en ny er sendt
    const [isLocked, setIsLocked] = useState(false);
    const [isFocused, setIsFocused] = useState(true);

    // Tiderne regnes fra da koden blev sendt (sentAt kommer fra ForgotPasswordScreen)
    const [now, setNow] = useState(() => Date.now());
    const [expiresAt, setExpiresAt] = useState(
        () => (route.params.sentAt ?? Date.now()) + (route.params.expiresIn ?? 600) * 1000
    );
    const [resendAvailableAt, setResendAvailableAt] = useState(
        () => (route.params.sentAt ?? Date.now()) + (route.params.resendAfter ?? 60) * 1000
    );

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const secondsUntilExpiry = Math.max(0, (expiresAt - now) / 1000);
    const secondsUntilResend = Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));
    const isExpired = secondsUntilExpiry <= 0;
    const isBusy = isVerifying || isResending;
    const canVerify = code.length === CODE_LENGTH && !isBusy && !isLocked && !isExpired;
    const canResend = secondsUntilResend === 0 && !isBusy;

    async function handleVerify(codeToVerify = code) {
        if (isBusy) return;

        if (codeToVerify.length !== CODE_LENGTH) {
            setError(`Indtast alle ${CODE_LENGTH} cifre i koden.`);
            return;
        }
        if (isExpired) {
            setError('Koden er udløbet. Send en ny kode.');
            return;
        }
        if (isLocked) {
            setError('For mange forkerte forsøg. Send en ny kode og prøv igen.');
            return;
        }

        setError('');
        setInfo('');
        setIsVerifying(true);

        try {
            const result = await verifyResetCode(email, codeToVerify);

            // replace, så tilbage-knappen ikke fører til en kode der allerede er brugt
            navigation.replace('ResetPassword', {
                email,
                resetToken: result.reset_token,
                fromSettings: route.params.fromSettings ?? false,
            });
        } catch (verifyError) {
            const { code: errorCode, message } = getResetError(verifyError, 'Kunne ikke bekræfte koden. Prøv igen.');

            if (errorCode === 'too_many_attempts') {
                setIsLocked(true);
            }
            setError(message);
            setCode('');
            inputRef.current?.focus();
        } finally {
            setIsVerifying(false);
        }
    }

    function handleChangeCode(text) {
        const digits = sanitizeCode(text);
        setCode(digits);
        if (error && !isLocked) setError('');

        // Bekræft automatisk når hele koden er skrevet eller indsat
        if (digits.length === CODE_LENGTH && !isLocked && !isExpired) {
            handleVerify(digits);
        }
    }

    async function handleResend() {
        if (!canResend) return;

        setError('');
        setInfo('');
        setIsResending(true);

        try {
            const result = await requestResetCode(email);
            const sentAt = Date.now();

            setExpiresAt(sentAt + (result?.expires_in_seconds ?? 600) * 1000);
            setResendAvailableAt(sentAt + (result?.resend_after_seconds ?? 60) * 1000);
            setNow(sentAt);
            setCode('');
            setIsLocked(false);
            setInfo('Vi har sendt en ny kode. Den tidligere kode virker ikke længere.');
            inputRef.current?.focus();
        } catch (resendError) {
            const { retryAfter, message } = getResetError(resendError, 'Kunne ikke sende en ny kode. Prøv igen.');

            if (retryAfter) {
                setResendAvailableAt(Date.now() + retryAfter * 1000);
            }
            setError(message);
        } finally {
            setIsResending(false);
        }
    }

    const hasError = Boolean(error);

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
                            disabled={isBusy}
                        >
                            <ChevronLeft size={30} />
                        </Pressable>

                        <Text style={styles.brand}>LAGERKLAR</Text>
                        <Text style={styles.title}>Indtast koden</Text>

                        <Text style={resetStyles.description}>
                            Hvis der findes en konto med <Text style={resetStyles.emailHighlight}>{email}</Text>, har vi sendt en 6-cifret kode dertil. Tjek også din spam-mappe.
                        </Text>

                        <Text style={styles.label}>Kode</Text>
                        <View style={resetStyles.codeContainer}>
                            <View style={resetStyles.codeBoxes} pointerEvents="none">
                                {Array.from({ length: CODE_LENGTH }, (_, index) => {
                                    const isActive = isFocused && index === Math.min(code.length, CODE_LENGTH - 1);
                                    return (
                                        <View
                                            key={index}
                                            style={[
                                                resetStyles.codeBox,
                                                isActive && resetStyles.codeBoxActive,
                                                hasError && resetStyles.codeBoxError,
                                            ]}
                                        >
                                            <Text style={resetStyles.codeDigit}>{code[index] ?? ''}</Text>
                                        </View>
                                    );
                                })}
                            </View>

                            <TextInput
                                ref={inputRef}
                                style={resetStyles.hiddenCodeInput}
                                value={code}
                                onChangeText={handleChangeCode}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                keyboardType="number-pad"
                                textContentType="oneTimeCode"
                                autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                                autoFocus
                                caretHidden
                                contextMenuHidden={false}
                                editable={!isVerifying}
                                accessibilityLabel={`Kode på ${CODE_LENGTH} cifre`}
                            />
                        </View>

                        <Text style={[resetStyles.hint, isExpired && resetStyles.hintExpired]}>
                            {isExpired
                                ? 'Koden er udløbet. Send en ny kode.'
                                : `Koden udløber om ${formatCountdown(secondsUntilExpiry)}. Du kan også indsætte hele koden.`}
                        </Text>

                        {error ? (
                            <View style={resetStyles.errorBox} accessibilityLiveRegion="polite">
                                <Text style={resetStyles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        {info ? (
                            <Text style={resetStyles.hint} accessibilityLiveRegion="polite">{info}</Text>
                        ) : null}

                        <Pressable
                            style={[styles.loginButton, !canVerify && resetStyles.buttonDisabled]}
                            onPress={() => handleVerify()}
                            disabled={!canVerify}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: !canVerify, busy: isVerifying }}
                        >
                            <View style={resetStyles.buttonContent}>
                                {isVerifying ? <ActivityIndicator color="#FFFFFF" /> : null}
                                <Text style={styles.loginButtonText}>
                                    {isVerifying ? 'Bekræfter...' : 'Bekræft kode'}
                                </Text>
                            </View>
                        </Pressable>

                        <View style={resetStyles.resendRow}>
                            <Text style={resetStyles.resendText}>Fik du ingen kode?</Text>
                            <Pressable
                                onPress={handleResend}
                                disabled={!canResend}
                                accessibilityRole="button"
                                accessibilityState={{ disabled: !canResend, busy: isResending }}
                                hitSlop={8}
                            >
                                <Text style={[resetStyles.resendLink, !canResend && resetStyles.resendLinkDisabled]}>
                                    {isResending
                                        ? 'Sender...'
                                        : secondsUntilResend > 0
                                            ? `Send igen om ${secondsUntilResend} s`
                                            : 'Send koden igen'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}
