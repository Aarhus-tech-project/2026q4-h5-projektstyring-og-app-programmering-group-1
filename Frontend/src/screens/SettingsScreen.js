import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import styles from '../styles/settingsStyles';

const comingSoon = () => Alert.alert('Kommer snart', 'Denne funktion er ikke klar endnu.');

export default function SettingsScreen({ navigation }) {

    const goBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Home');
        }
    };

    const logout = () => {
        navigation.navigate('Home');
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
                    <SettingsRow label="Din profil" onPress={comingSoon} />
                    <SettingsRow label="Virksomheder" onPress={comingSoon} />
                    <SettingsRow label="Notifikationer & påmindelser" onPress={comingSoon} isLast />
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
            </ScrollView>
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
