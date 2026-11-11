import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Check, Eye, EyeOff, KeyRound, X } from 'lucide-react-native';

import { getErrorMessage } from '../../http/http';
import { getPasswordRequirements, validateNewPassword } from '../utils/passwordResetUtils';
import ConfirmationModal from './ConfirmationModal';
import styles from '../styles/changePasswordModalStyles';

function PasswordField({ label, value, onChangeText, placeholder, editable }) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.passwordRow}>
                <TextInput
                    style={styles.passwordInput}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!isVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={editable}
                />
                <Pressable
                    style={styles.eyeButton}
                    onPress={() => setIsVisible((visible) => !visible)}
                    hitSlop={8}>
                    {isVisible ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
                </Pressable>
            </View>
        </>
    );
}

// onSave({ currentPassword, newPassword, confirmPassword }) skal kaste en fejl hvis det mislykkes
// onForgotPassword: valgfri - viser "Glemt adgangskode?" så brugeren kan nulstille via email i stedet
export default function ChangePasswordModal({ visible, onCancel, onSave, onForgotPassword }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);

    const requirements = getPasswordRequirements(newPassword);

    // Tøm felterne hver gang modalen åbnes
    function resetForm() {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setIsSaving(false);
        setIsConfirmVisible(false);
    }

    // Tjek felterne først, og spørg derefter brugeren om de er sikre
    function handleSubmit() {
        if (!currentPassword) {
            setError('Indtast din nuværende adgangskode.');
            return;
        }

        const validationError = validateNewPassword(newPassword, confirmPassword);
        if (validationError) {
            setError(validationError);
            return;
        }

        if (newPassword === currentPassword) {
            setError('Den nye adgangskode skal være forskellig fra den nuværende.');
            return;
        }

        setError('');
        setIsConfirmVisible(true);
    }

    async function handleConfirm() {
        setIsConfirmVisible(false);
        setIsSaving(true);

        try {
            await onSave({ currentPassword, newPassword, confirmPassword });
        } catch (err) {
            setError(
                getErrorMessage(err, {
                    422: 'Den nuværende adgangskode er forkert.',
                    400: 'Den nye adgangskode opfylder ikke kravene.',
                    fallback: 'Adgangskoden kunne ikke ændres. Prøv igen.',
                })
            );
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onShow={resetForm}
            onRequestClose={isSaving ? undefined : onCancel}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Pressable style={styles.backdrop} onPress={isSaving ? undefined : onCancel}>
                    {/* Pressable her stopper tryk på kortet i at lukke modalen */}
                    <Pressable style={styles.card}>
                        <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
                            <View style={styles.header}>
                                <View style={styles.iconWrapper}>
                                    <KeyRound size={22} color="#1E8A5A" />
                                </View>

                                <Text style={styles.title}>Skift adgangskode</Text>

                                <Pressable
                                    style={styles.closeButton}
                                    onPress={onCancel}
                                    disabled={isSaving}
                                    hitSlop={8}>
                                    <X size={20} color="#6B7280" />
                                </Pressable>
                            </View>

                            <PasswordField
                                label="Nuværende adgangskode"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Nuværende adgangskode"
                                editable={!isSaving}
                            />

                            {onForgotPassword ? (
                                <Pressable
                                    style={styles.forgotPasswordLink}
                                    onPress={onForgotPassword}
                                    disabled={isSaving}
                                    accessibilityRole="link"
                                    hitSlop={8}>
                                    <Text style={styles.forgotPasswordText}>Glemt adgangskode?</Text>
                                </Pressable>
                            ) : null}

                            <PasswordField
                                label="Ny adgangskode"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Ny adgangskode"
                                editable={!isSaving}
                            />

                            <View style={styles.requirements}>
                                {requirements.map((requirement) => (
                                    <View key={requirement.key} style={styles.requirementRow}>
                                        <Check size={14} color={requirement.met ? '#1E8A5A' : '#9CA3AF'} />
                                        <Text style={[styles.requirementText, requirement.met && styles.requirementMet]}>
                                            {requirement.label}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <PasswordField
                                label="Bekræft ny adgangskode"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Gentag ny adgangskode"
                                editable={!isSaving}
                            />

                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            <View style={styles.actions}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.button,
                                        styles.cancelButton,
                                        pressed && styles.buttonPressed,
                                    ]}
                                    onPress={onCancel}
                                    disabled={isSaving}>
                                    <Text style={styles.cancelButtonText}>Annuller</Text>
                                </Pressable>

                                <Pressable
                                    style={({ pressed }) => [
                                        styles.button,
                                        styles.saveButton,
                                        (pressed || isSaving) && styles.buttonPressed,
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={isSaving}>
                                    {isSaving ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Skift</Text>
                                    )}
                                </Pressable>
                            </View>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>

            {/* Ligger inde i denne Modal, så den vises ovenpå på både iOS og Android */}
            <ConfirmationModal
                visible={isConfirmVisible}
                variant="warning"
                title="Skift adgangskode?"
                message="Er du sikker på, at du vil skifte din adgangskode? Du skal bruge den nye adgangskode, næste gang du logger ind."
                confirmText="Ja, skift"
                onConfirm={handleConfirm}
                onCancel={() => setIsConfirmVisible(false)}
            />
        </Modal>
    );
}
