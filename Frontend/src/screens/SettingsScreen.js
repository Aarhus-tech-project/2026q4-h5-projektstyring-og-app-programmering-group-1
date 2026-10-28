import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react-native';
import styles from '../styles/settingsStyles';
import colors from '../constants/colors';

// Demo data until the backend has settings endpoints
const demoSettings = {
    businesses: [
        { id: '1', name: 'Restaurant Havnen' },
        { id: '2', name: 'Café Aarhus' },
        { id: '3', name: 'Pizzeria Bella' },
    ],
    activeBusinessId: '1',
    notificationsEnabled: true,
    reminderDaysBeforeExpiry: 3,
    dailyCheckEnabled: true,
    dailyCheckHour: 8,
    lowStockAlerts: true,
    name: 'Minh Lu',
    email: 'minh@lagerklar.dk',
    role: 'Leder',
};

const PAGE_TITLES = {
    profile: 'Din profil',
    business: 'Virksomheder',
    notifications: 'Notifikationer',
};

const comingSoon = () => Alert.alert('Kommer snart', 'Denne funktion er ikke klar endnu.');

export default function SettingsScreen({ navigation }) {

    const [page, setPage] = useState(null);
    const [settings, setSettings] = useState(demoSettings);
    const [newBusinessName, setNewBusinessName] = useState('');
    const [isSaved, setIsSaved] = useState(true);

    const update = (changes) => {
        setSettings((current) => ({ ...current, ...changes }));
        setIsSaved(false);
    };

    const saveSettings = () => {
        // TODO: send settings to the backend when it is ready
        setIsSaved(true);
        Alert.alert('Gemt', 'Dine indstillinger er gemt.');
    };

    const goBack = () => {
        if (page) {
            setPage(null);
        } else if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Home');
        }
    };

    const addBusiness = () => {
        const name = newBusinessName.trim();
        if (!name) return;

        const business = { id: Date.now().toString(), name };
        update({
            businesses: [...settings.businesses, business],
            activeBusinessId: business.id,
        });
        setNewBusinessName('');
    };

    const renameActiveBusiness = (name) => {
        update({
            businesses: settings.businesses.map((business) =>
                business.id === settings.activeBusinessId ? { ...business, name } : business
            ),
        });
    };

    const logout = () => {
        navigation.navigate('Home');
    };

    const activeBusiness = settings.businesses.find((b) => b.id === settings.activeBusinessId);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={goBack}>
                    <ChevronLeft size={28} />
                </Pressable>
                <Text style={styles.title}>{page ? PAGE_TITLES[page] : 'Indstillinger'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {!page && (
                    <>
                        <SettingsGroup title="Profil">
                            <SettingsRow label="Din profil" onPress={() => setPage('profile')} />
                            <SettingsRow
                                label="Virksomheder"
                                value={activeBusiness?.name}
                                onPress={() => setPage('business')}
                            />
                            <SettingsRow label="Notifikationer & påmindelser" onPress={() => setPage('notifications')} isLast />
                        </SettingsGroup>

                        <SettingsGroup title="Privatliv & sikkerhed">
                            <SettingsRow label="Skift adgangskode" onPress={comingSoon} isLast />
                        </SettingsGroup>

                        <SettingsGroup title="Support">
                            <SettingsRow label="Kontakt support" onPress={comingSoon} />
                            <SettingsRow
                                label="Om LagerKlar"
                                onPress={() => Alert.alert('LagerKlar', 'Version 1.0.0')}
                            />
                            <SettingsRow label="Vilkår & privatlivspolitik" onPress={comingSoon} isLast />
                        </SettingsGroup>

                        <Pressable style={styles.logoutButton} onPress={logout}>
                            <Text style={styles.logoutButtonText}>Log ud</Text>
                        </Pressable>
                    </>
                )}

                {page === 'profile' && (
                    <View style={styles.card}>
                        <Text style={styles.label}>Navn</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Dit navn"
                            placeholderTextColor="#9CA3AF"
                            value={settings.name}
                            onChangeText={(name) => update({ name })}
                        />

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#9CA3AF"
                            value={settings.email}
                            onChangeText={(email) => update({ email })}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <Text style={styles.label}>Rolle</Text>
                        <Text style={styles.settingTitle}>{settings.role}</Text>
                    </View>
                )}

                {page === 'business' && (
                    <>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Aktiv virksomhed</Text>
                            <Text style={styles.label}>Navn</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Virksomhedens navn"
                                placeholderTextColor="#9CA3AF"
                                value={activeBusiness?.name ?? ''}
                                onChangeText={renameActiveBusiness}
                            />
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Skift virksomhed</Text>
                            {settings.businesses.map((business) => {
                                const isActive = business.id === settings.activeBusinessId;
                                return (
                                    <Pressable
                                        key={business.id}
                                        style={[styles.businessRow, isActive && styles.businessRowActive]}
                                        onPress={() => update({ activeBusinessId: business.id })}>
                                        <Text style={styles.businessName}>{business.name || 'Uden navn'}</Text>
                                        {isActive && <Check size={20} color={colors.primary} />}
                                    </Pressable>
                                );
                            })}

                            <Text style={[styles.label, styles.spacedLabel]}>Tilføj virksomhed</Text>
                            <View style={styles.addRow}>
                                <TextInput
                                    style={[styles.input, styles.addInput]}
                                    placeholder="F.eks. Café Aarhus"
                                    placeholderTextColor="#9CA3AF"
                                    value={newBusinessName}
                                    onChangeText={setNewBusinessName}
                                />
                                <Pressable style={styles.addButton} onPress={addBusiness}>
                                    <Plus size={22} color="#FFFFFF" />
                                </Pressable>
                            </View>
                        </View>
                    </>
                )}

                {page === 'notifications' && (
                    <>
                        <View style={styles.card}>
                            <SettingSwitch
                                title="Påmindelser"
                                description="Få besked når varer snart udløber"
                                value={settings.notificationsEnabled}
                                onValueChange={(value) => update({ notificationsEnabled: value })}
                            />

                            <View style={[styles.settingRow, !settings.notificationsEnabled && styles.disabled]}>
                                <View style={styles.settingText}>
                                    <Text style={styles.settingTitle}>Dage før udløb</Text>
                                    <Text style={styles.settingDescription}>Hvornår påmindelsen sendes</Text>
                                </View>
                                <Stepper
                                    value={settings.reminderDaysBeforeExpiry}
                                    suffix={settings.reminderDaysBeforeExpiry === 1 ? ' dag' : ' dage'}
                                    min={1}
                                    max={30}
                                    disabled={!settings.notificationsEnabled}
                                    onChange={(value) => update({ reminderDaysBeforeExpiry: value })}
                                />
                            </View>

                            <SettingSwitch
                                title="Lav beholdning"
                                description="Få besked når en vare er under minimumsgrænsen"
                                value={settings.lowStockAlerts}
                                disabled={!settings.notificationsEnabled}
                                onValueChange={(value) => update({ lowStockAlerts: value })}
                            />
                        </View>

                        <View style={styles.card}>
                            <SettingSwitch
                                title="Daglig kontrol"
                                description="Tjek udløbsdatoer én gang om dagen"
                                value={settings.dailyCheckEnabled}
                                onValueChange={(value) => update({ dailyCheckEnabled: value })}
                            />

                            <View style={[styles.settingRow, !settings.dailyCheckEnabled && styles.disabled]}>
                                <View style={styles.settingText}>
                                    <Text style={styles.settingTitle}>Tidspunkt</Text>
                                    <Text style={styles.settingDescription}>Hvornår kontrollen kører</Text>
                                </View>
                                <Stepper
                                    value={settings.dailyCheckHour}
                                    format={(hour) => `kl. ${String(hour).padStart(2, '0')}:00`}
                                    min={0}
                                    max={23}
                                    disabled={!settings.dailyCheckEnabled}
                                    onChange={(value) => update({ dailyCheckHour: value })}
                                />
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            {page && (
                <View style={styles.footer}>
                    <Pressable
                        style={[styles.saveButton, isSaved && styles.saveButtonDisabled]}
                        disabled={isSaved}
                        onPress={saveSettings}>
                        <Text style={styles.saveButtonText}>{isSaved ? 'Gemt' : 'Gem ændringer'}</Text>
                    </Pressable>
                </View>
            )}
        </SafeAreaView>
    );
}

function SettingsGroup({ title, children }) {
    return (
        <View>
            <Text style={styles.groupTitle}>{title}</Text>
            <View style={styles.group}>{children}</View>
        </View>
    );
}

function SettingsRow({ label, value, onPress, isLast }) {
    return (
        <Pressable
            style={({ pressed }) => [styles.row, !isLast && styles.rowDivider, pressed && styles.rowPressed]}
            onPress={onPress}>
            <Text style={styles.rowLabel}>{label}</Text>
            <View style={styles.rowRight}>
                {value && <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>}
                <ChevronRight size={20} color="#9CA3AF" />
            </View>
        </Pressable>
    );
}

function SettingSwitch({ title, description, value, onValueChange, disabled }) {
    return (
        <View style={[styles.settingRow, disabled && styles.disabled]}>
            <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{title}</Text>
                <Text style={styles.settingDescription}>{description}</Text>
            </View>
            <Switch
                value={value}
                disabled={disabled}
                onValueChange={onValueChange}
                trackColor={{ false: '#D1D5DB', true: colors.primary }}
                thumbColor="#FFFFFF"
            />
        </View>
    );
}

function Stepper({ value, min, max, onChange, disabled, suffix = '', format }) {
    return (
        <View style={styles.stepper}>
            <Pressable
                style={styles.stepperButton}
                disabled={disabled || value <= min}
                onPress={() => onChange(value - 1)}>
                <Minus size={18} color={colors.text.primary} />
            </Pressable>
            <Text style={styles.stepperValue}>{format ? format(value) : `${value}${suffix}`}</Text>
            <Pressable
                style={styles.stepperButton}
                disabled={disabled || value >= max}
                onPress={() => onChange(value + 1)}>
                <Plus size={18} color={colors.text.primary} />
            </Pressable>
        </View>
    );
}
