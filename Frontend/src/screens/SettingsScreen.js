import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { CommonActions } from "@react-navigation/native";
import styles from '../styles/settingsStyles';
import { useAuth } from '../AuthContext/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import ConfirmationModal from '../components/ConfirmationModal';

const comingSoon = () => Alert.alert('Kommer snart', 'Denne funktion er ikke klar endnu.');

export default function SettingsScreen({ navigation }) {
    const { changePassword, user, logout: logoutUser } = useAuth();
    const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);
    const [isPasswordChangedVisible, setIsPasswordChangedVisible] = useState(false);

    // Fejl kastes videre til modalen, så den kan vise beskeden
    async function handleChangePassword(passwords) {
        await changePassword(passwords);
        setIsChangePasswordVisible(false);
        setIsPasswordChangedVisible(true);
    }

    // Brugeren kan ikke huske sin nuværende adgangskode -> nulstil via email-kode i stedet
    function handleForgotPassword() {
        setIsChangePasswordVisible(false);
        navigation.navigate('ForgotPassword', { email: user?.email ?? '', fromSettings: true });
    }

    const goBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Home');
        }
    };

    // Really log out (clears the saved login and stops this device's push notifications),
    // then go to the login screen. Before, this only navigated and the user stayed logged in.
    const logout = async () => {
        await logoutUser();
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            })
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={goBack}>
                    <ChevronLeft size={28} />
                </Pressable>
                <Text style={styles.title}>Indstillinger</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <SettingsGroup title="Profil">
                    <SettingsRow label="Din profil" onPress={() => navigation.navigate('ProfileScreen')} />
                    <SettingsRow label="Virksomheder" onPress={() => navigation.navigate('Companies')} />
                    <SettingsRow label="Notifikationer & påmindelser" onPress={() => navigation.navigate('Notifications')} isLast />
                </SettingsGroup>

                <SettingsGroup title="Privatliv & sikkerhed">
                    <SettingsRow label="Skift adgangskode" onPress={() => setIsChangePasswordVisible(true)} isLast />
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
            </ScrollView>

            <ChangePasswordModal
                visible={isChangePasswordVisible}
                onCancel={() => setIsChangePasswordVisible(false)}
                onSave={handleChangePassword}
                onForgotPassword={handleForgotPassword}
            />

            <ConfirmationModal
                visible={isPasswordChangedVisible}
                variant="status"
                title="Adgangskode ændret"
                message="Din adgangskode er blevet opdateret."
                confirmText="OK"
                hideCancel
                onConfirm={() => setIsPasswordChangedVisible(false)}
                onCancel={() => setIsPasswordChangedVisible(false)}
            />
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

function SettingsRow({ label, onPress, isLast }) {
    return (
        <Pressable
            style={({ pressed }) => [styles.row, !isLast && styles.rowDivider, pressed && styles.rowPressed]}
            onPress={onPress}>
            <Text style={styles.rowLabel}>{label}</Text>
            <ChevronRight size={20} color="#9CA3AF" />
        </Pressable>
    );
}
