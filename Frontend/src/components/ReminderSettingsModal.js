import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Bell, Minus, Plus, X } from 'lucide-react-native';

import { getErrorMessage } from '../../http/http';
import { getManagedCompanies, getReminderSettings, updateReminderSettings } from '../services/companyService';
import styles from '../styles/reminderSettingsModalStyles';

const MIN_DAYS = 0;
const MAX_DAYS = 30; // samme grænse som backend

function daysLabel(days) {
    if (days === 0) return 'Samme dag';
    if (days === 1) return '1 dag før';
    return `${days} dage før`;
}

// "08:30" + 1 -> "09:30" (timen går rundt 23 -> 00)
function shiftHour(time, step) {
    const [hours, minutes] = time.split(':').map(Number);
    const newHours = (hours + step + 24) % 24;
    return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function Stepper({ value, onMinus, onPlus, minusDisabled, plusDisabled, disabled }) {
    return (
        <View style={styles.stepper}>
            <Pressable
                style={[styles.stepperButton, (minusDisabled || disabled) && styles.stepperButtonDisabled]}
                onPress={onMinus}
                disabled={minusDisabled || disabled}
                accessibilityLabel="Mindre"
                hitSlop={4}>
                <Minus size={20} color="#111827" />
            </Pressable>
            <Text style={styles.stepperValue}>{value}</Text>
            <Pressable
                style={[styles.stepperButton, (plusDisabled || disabled) && styles.stepperButtonDisabled]}
                onPress={onPlus}
                disabled={plusDisabled || disabled}
                accessibilityLabel="Mere"
                hitSlop={4}>
                <Plus size={20} color="#111827" />
            </Pressable>
        </View>
    );
}

// Påmindelser pr. virksomhed: hvor mange dage før udløb der sendes besked, og hvornår den
// daglige kontrol kører. Kun ejer og leder kan ændre dem (backend tjekker også rollen).
export default function ReminderSettingsModal({ visible, onClose, onSaved }) {
    const [companies, setCompanies] = useState([]);
    const [companyId, setCompanyId] = useState(null);
    const [days, setDays] = useState(7);
    const [checkTime, setCheckTime] = useState('08:00');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    async function loadSettings(id) {
        setCompanyId(id);
        setIsLoading(true);
        setError('');
        try {
            const settings = await getReminderSettings(id);
            setDays(settings.daysBeforeExpiry);
            setCheckTime(settings.dailyCheckTime);
        } catch (err) {
            setError(getErrorMessage(err, { fallback: 'Påmindelserne kunne ikke hentes. Prøv igen.' }));
        } finally {
            setIsLoading(false);
        }
    }

    // Hent virksomhederne hver gang modalen åbnes og vis den første
    async function handleShow() {
        setIsLoading(true);
        setIsSaving(false);
        setError('');
        try {
            const managed = await getManagedCompanies();
            setCompanies(managed);
            if (managed.length > 0) {
                await loadSettings(managed[0].id);
            } else {
                setCompanyId(null);
                setIsLoading(false);
            }
        } catch (err) {
            setError(getErrorMessage(err, { fallback: 'Virksomhederne kunne ikke hentes. Prøv igen.' }));
            setIsLoading(false);
        }
    }

    async function handleSave() {
        setIsSaving(true);
        setError('');
        try {
            await updateReminderSettings(companyId, { daysBeforeExpiry: days, dailyCheckTime: checkTime });
            onSaved?.();
        } catch (err) {
            setError(
                getErrorMessage(err, {
                    403: 'Kun ejere og ledere kan ændre påmindelser.',
                    fallback: 'Påmindelserne kunne ikke gemmes. Prøv igen.',
                })
            );
        } finally {
            setIsSaving(false);
        }
    }

    const hasCompany = companyId !== null;
    const isBusy = isLoading || isSaving;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onShow={handleShow}
            onRequestClose={isSaving ? undefined : onClose}>
            <Pressable style={styles.backdrop} onPress={isSaving ? undefined : onClose}>
                {/* Pressable her stopper tryk på kortet i at lukke modalen */}
                <Pressable style={styles.card}>
                    <ScrollView bounces={false}>
                        <View style={styles.header}>
                            <View style={styles.iconWrapper}>
                                <Bell size={22} color="#1E8A5A" />
                            </View>
                            <Text style={styles.title}>Påmindelser</Text>
                            <Pressable style={styles.closeButton} onPress={onClose} disabled={isSaving} hitSlop={8}>
                                <X size={20} color="#6B7280" />
                            </Pressable>
                        </View>

                        {isLoading && companies.length === 0 ? (
                            <View style={styles.loading}>
                                <ActivityIndicator color="#1E8A5A" />
                            </View>
                        ) : !hasCompany && !error ? (
                            <Text style={styles.infoText}>
                                Kun ejere og ledere kan ændre påmindelser for en virksomhed.
                            </Text>
                        ) : (
                            <>
                                {companies.length > 1 && (
                                    <>
                                        <Text style={styles.label}>Virksomhed</Text>
                                        <View style={styles.companyList}>
                                            {companies.map((company) => {
                                                const isActive = company.id === companyId;
                                                return (
                                                    <Pressable
                                                        key={company.id}
                                                        style={[styles.companyChip, isActive && styles.companyChipActive]}
                                                        onPress={() => !isActive && loadSettings(company.id)}
                                                        disabled={isBusy}
                                                        accessibilityRole="radio"
                                                        accessibilityState={{ checked: isActive }}>
                                                        <Text
                                                            style={[
                                                                styles.companyChipText,
                                                                isActive && styles.companyChipTextActive,
                                                            ]}>
                                                            {company.name}
                                                        </Text>
                                                    </Pressable>
                                                );
                                            })}
                                        </View>
                                    </>
                                )}

                                <Text style={styles.label}>Besked om udløb</Text>
                                <Stepper
                                    value={daysLabel(days)}
                                    onMinus={() => setDays((d) => d - 1)}
                                    onPlus={() => setDays((d) => d + 1)}
                                    minusDisabled={days <= MIN_DAYS}
                                    plusDisabled={days >= MAX_DAYS}
                                    disabled={isBusy}
                                />
                                <Text style={styles.hint}>
                                    Alle i virksomheden får en besked hver dag, fra varen har {days}{' '}
                                    {days === 1 ? 'dag' : 'dage'} tilbage, til den udløber.
                                </Text>

                                <Text style={styles.label}>Daglig påmindelse kl.</Text>
                                <Stepper
                                    value={checkTime}
                                    onMinus={() => setCheckTime((t) => shiftHour(t, -1))}
                                    onPlus={() => setCheckTime((t) => shiftHour(t, 1))}
                                    disabled={isBusy}
                                />
                                <Text style={styles.hint}>
                                    Hvornår påmindelser om udløb og lav beholdning sendes hver dag.
                                </Text>
                            </>
                        )}

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <View style={styles.actions}>
                            <Pressable
                                style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.buttonPressed]}
                                onPress={onClose}
                                disabled={isSaving}>
                                <Text style={styles.cancelButtonText}>{hasCompany ? 'Annuller' : 'Luk'}</Text>
                            </Pressable>

                            {hasCompany && (
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.button,
                                        styles.saveButton,
                                        (pressed || isBusy) && styles.buttonPressed,
                                    ]}
                                    onPress={handleSave}
                                    disabled={isBusy}>
                                    {isSaving ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Gem</Text>
                                    )}
                                </Pressable>
                            )}
                        </View>
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
