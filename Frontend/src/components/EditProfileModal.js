import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from 'react-native';
import { UserRound, X } from 'lucide-react-native';

import { getErrorMessage } from '../../http/http';
import styles from '../styles/editProfileModalStyles';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditProfileModal({ visible, user, onCancel, onSave }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Udfyld felterne med brugerens nuværende data, hver gang modalen åbnes
    function resetForm() {
        setName(user?.name ?? '');
        setEmail(user?.email ?? '');
        setPhoneNumber(user?.phone_number ?? '');
        setError('');
        setIsSaving(false);
    }

    async function handleSave() {
        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPhone = phoneNumber.trim();

        if (!trimmedName) {
            setError('Navn må ikke være tomt.');
            return;
        }

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            setError('Indtast en gyldig email.');
            return;
        }

        setError('');
        setIsSaving(true);

        try {
            await onSave({
                name: trimmedName,
                email: trimmedEmail,
                phone_number: trimmedPhone || null,
            });
        } catch (err) {
            setError(
                getErrorMessage(err, {
                    409: 'Der findes allerede en konto med denne email.',
                    fallback: 'Profilen kunne ikke opdateres. Prøv igen.',
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
            onRequestClose={onCancel}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Pressable style={styles.backdrop} onPress={isSaving ? undefined : onCancel}>
                    {/* Pressable her stopper tryk på kortet i at lukke modalen */}
                    <Pressable style={styles.card}>
                        <View style={styles.header}>
                            <View style={styles.iconWrapper}>
                                <UserRound size={22} color="#1E8A5A" />
                            </View>

                            <Text style={styles.title}>Rediger profil</Text>

                            <Pressable
                                style={styles.closeButton}
                                onPress={onCancel}
                                disabled={isSaving}
                                hitSlop={8}>
                                <X size={20} color="#6B7280" />
                            </Pressable>
                        </View>

                        <Text style={styles.label}>Navn</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Dit navn"
                            placeholderTextColor="#9CA3AF"
                            autoCapitalize="words"
                            editable={!isSaving}
                        />

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email@Example.com"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isSaving}
                        />

                        <Text style={styles.label}>Telefonnummer</Text>
                        <TextInput
                            style={styles.input}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            placeholder="Valgfrit"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="phone-pad"
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
                                onPress={handleSave}
                                disabled={isSaving}>
                                {isSaving ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Gem</Text>
                                )}
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
}
