import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Building2,
    ChevronRight,
    LogOut,
    Settings,
    UserRound,
} from 'lucide-react-native';

import colors from '../constants/colors';
import styles from '../styles/ProfileStyles';

function ProfileOption({ icon, title, onPress, danger = false }) {
    return (
        <Pressable style={styles.option} onPress={onPress}>
            <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                    {icon}
                </View>

                <Text style={danger ? styles.dangerText : styles.optionText}>
                    {title}
                </Text>
            </View>

            <ChevronRight
            size={20}
            color={danger ? '#FCA5A5' : '#9CA3AF'}
            />
        </Pressable>
    );
}


function TESTPROFILEBUTTON() {
    Alert.alert(
        'Rediger profil',
        'Rediger profil-knappen blev trykket.',
    );
}

function TESTPROFILEBUTTON2() {
    Alert.alert(
        'Virksomheder',
        'Virksomheder-knappen blev trykket.',
    );
}

function TESTPROFILEBUTTON3() {
    Alert.alert(
        'Indstillinger',
        'Indstillinger-knappen blev trykket.',
    );
}

function TESTPROFILEBUTTON4() {
    Alert.alert(
        'Log ud',
        'Log ud-knappen blev trykket.',
    );
}

export default function ProfileScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Pressable
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft
                        size={24}
                        color={colors.text.primary}
                        />
                    </Pressable>

                    <Text style={styles.headerTitle}>Profil</Text>

                    <View style={styles.headerButton}/>
                </View>

                <View style={styles.profileInfo}>
                    <View style={styles.avatar}>
                        <UserRound size={36} color="#FFFFFF"/>
                    </View>

                    <Text sttyle={styles.userName}>Brugernavn</Text>
                    <Text style={styles.userEmail}>
                        Email@Example.com
                    </Text>
                </View>

                <View style={styles.optionGroup}>
                        <ProfileOption
                            icon={
                                <UserRound
                                    size={18}
                                    color="#6B7280"
                                />
                            }
                            title="Rediger profil"
                            onPress={TESTPROFILEBUTTON}
                        />

                        <ProfileOption
                            icon={
                                <Building2
                                    size={18}
                                    color="#6B7280"
                                />
                            }
                            title="Virksomheder"
                            onPress={TESTPROFILEBUTTON2}
                        />
                    </View>

                    <View style={styles.optionGroup}>
                        <ProfileOption
                            icon={
                                <Settings
                                    size={18}
                                    color="#6B7280"
                                />
                            }
                            title="Indstillinger"
                            onPress={TESTPROFILEBUTTON3}
                        />
                    </View>

                    <View style={styles.logoutGroup}>
                        <ProfileOption
                            icon={
                                <LogOut
                                    size={18}
                                    color="#DC2626"
                                />
                            }
                            title="Log ud"
                            danger
                            onPress={TESTPROFILEBUTTON4}
                        />
                    </View>
            </ScrollView>
        </SafeAreaView>
    )
}