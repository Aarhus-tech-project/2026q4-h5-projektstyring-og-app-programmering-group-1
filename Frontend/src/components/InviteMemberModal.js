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
import { UserPlus, X } from 'lucide-react-native';
import styles from '../styles/inviteMemberModalStyles';
import { ROLES, getInvitableRoles, getRoleLabel } from '../utils/companyRoles';
import { getErrorMessage } from '../../http/http';
import ConfirmationModal from './ConfirmationModal';


const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getInviteErrorMessage(err) {
    const backendMessage = err?.response?.data?.message ?? '';

    return getErrorMessage(err, {
        400: 'Indtast en gyldig e-mailadresse.',
        403: 'Du har ikke tilladelse til at invitere med denne rolle.',
        404: 'Der findes ingen bruger med den e-mail. Personen skal oprette en konto først.',
        409: backendMessage.includes('pending')
            ? 'Personen har allerede en afventende invitation.'
            : 'Personen er allerede medlem af virksomheden.',
        fallback: 'Invitationen kunne ikke sendes. Prøv igen.',
    });
}

export default function InviteMemberModal({ visible, myRole, onClose, onInvite }) {
    const roles = getInvitableRoles(myRole);
    const defaultRole = roles.includes(ROLES.EMPLOYEE) ? ROLES.EMPLOYEE : roles[0];

    const [email, setEmail] = useState('');
    const [role, setRole] = useState(defaultRole);
    const [sentTo, setSentTo] = useState('');
    const [error, setError] = useState('');
    const [isSending, setIsSending] = useState(false);

    function resetForm() {
        setEmail('');
        setRole(defaultRole);
        setError('');
        setIsSending(false);
        setSentTo('');
    }

    function handleEmailChange(text) {
        setEmail(text);
        if (error) setError('');
    }

    async function handleSubmit() {
        const trimmedEmail = email.trim();

        if (!EMAIL_PATTERN.test(trimmedEmail)) {
            setError('Indtast en gyldig e-mailadresse.');
            return;
        }

        setError('');
        setIsSending(true);

        try {
            await onInvite({ email: trimmedEmail, role });
            setSentTo(trimmedEmail);
        } catch (err) {
            setError(getInviteErrorMessage(err));
        } finally {
            setIsSending(false);
        }
    }

    const close = isSending ? undefined : onClose;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onShow={resetForm}
            onRequestClose={close}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Pressable style={styles.backdrop} onPress={close}>
                    {/* Pressable her stopper tryk på kortet i at lukke modalen */}
                    <Pressable style={styles.card}>
                        <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
                            <View style={styles.header}>
                                <View style={styles.iconWrapper}>
                                    <UserPlus size={22} color="#1E8A5A" />
                                </View>

                                <Text style={styles.title}>Inviter til virksomheden</Text>

                                <Pressable
                                    style={styles.closeButton}
                                    onPress={close}
                                    disabled={isSending}
                                    hitSlop={8}
                                    accessibilityRole="button"
                                    accessibilityLabel="Luk">
                                    <X size={20} color="#6B7280" />
                                </Pressable>
                            </View>

                            <Text style={styles.label}>E-mail</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={handleEmailChange}
                                placeholder="navn@firma.dk"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="email"
                                textContentType="emailAddress"
                                returnKeyType="send"
                                onSubmitEditing={handleSubmit}
                                editable={!isSending}
                            />

                            <Text style={styles.label}>Rolle</Text>
                            {roles.length > 1 ? (
                                <View style={styles.roleToggle} accessibilityRole="radiogroup">
                                    {roles.map((option) => {
                                        const isSelected = option === role;
                                        return (
                                            <Pressable
                                                key={option}
                                                style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                                                onPress={() => setRole(option)}
                                                disabled={isSending}
                                                accessibilityRole="radio"
                                                accessibilityState={{ checked: isSelected }}>
                                                <Text
                                                    style={[
                                                        styles.roleOptionText,
                                                        isSelected && styles.roleOptionTextSelected,
                                                    ]}>
                                                    {getRoleLabel(option)}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            ) : (
                                <Text style={styles.roleHint}>
                                    Inviteres som {getRoleLabel(role).toLowerCase()}
                                </Text>
                            )}

                            <Text style={styles.helpText}>Personen skal allerede have en konto i LagerKlar.</Text>

                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            <View style={styles.actions}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.button,
                                        styles.cancelButton,
                                        pressed && styles.buttonPressed,
                                    ]}
                                    onPress={close}
                                    disabled={isSending}>
                                    <Text style={styles.cancelButtonText}>Annuller</Text>
                                </Pressable>

                                <Pressable
                                    style={({ pressed }) => [
                                        styles.button,
                                        styles.saveButton,
                                        (pressed || isSending) && styles.buttonPressed,
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={isSending}
                                    accessibilityRole="button">
                                    {isSending ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Send invitation</Text>
                                    )}
                                </Pressable>
                            </View>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
            <ConfirmationModal
                visible={!!sentTo}
                variant="status"
                title="Invitation sendt"
                message={`${sentTo} er inviteret som ${getRoleLabel(role).toLowerCase()}.`}
                confirmText="OK"
                hideCancel
                onConfirm={onClose}
                onCancel={onClose}
            />
        </Modal>

    );
}