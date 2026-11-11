import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
    ArrowLeft,
    Camera,
    ChevronRight,
    Settings,
    Trash2,
    UserRound,
} from 'lucide-react-native';

import { useAuth } from '../AuthContext/AuthContext';
import { getErrorMessage } from '../../http/http';

import ConfirmationModal from '../components/ConfirmationModal';
import EditProfileModal from '../components/EditProfileModal';
import LoadingModal from '../components/LoadingModal';

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

function TESTPROFILEBUTTON3() {
    Alert.alert(
        'Indstillinger',
        'Indstillinger-knappen blev trykket.',
    );
}

export default function ProfileScreen({ navigation }) {

    const { user, updateProfile, deleteAccount, uploadAvatar, avatarSource } = useAuth();

    const [isEditVisible, setIsEditVisible] = useState(false);
    const [isDeleteVisible, setIsDeleteVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    // Gemmer den uri der fejlede, så et nyt billede (ny uri) prøves igen automatisk
    const [failedAvatarUri, setFailedAvatarUri] = useState(null);

    const pickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
    };

    async function pickAvatar(fromCamera) {
        try {
            const permission = fromCamera
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    'Adgang nægtet',
                    fromCamera
                        ? 'Giv appen adgang til kameraet i indstillingerne for at tage et billede.'
                        : 'Giv appen adgang til dine billeder i indstillingerne for at vælge et billede.',
                );
                return;
            }

            const result = fromCamera
                ? await ImagePicker.launchCameraAsync(pickerOptions)
                : await ImagePicker.launchImageLibraryAsync(pickerOptions);

            if (result.canceled || !result.assets?.length) {
                return;
            }

            setIsUploadingAvatar(true);
            await uploadAvatar(result.assets[0]);
        } catch (error) {
            Alert.alert(
                'Kunne ikke gemme billedet',
                getErrorMessage(error, {
                    413: 'Billedet er for stort. Vælg et billede under 5 MB.',
                    415: 'Billedet skal være JPEG, PNG eller WebP.',
                    fallback: 'Profilbilledet kunne ikke gemmes. Prøv igen senere.',
                }),
            );
        } finally {
            setIsUploadingAvatar(false);
        }
    }

    function handleAvatarPress() {
        Alert.alert('Skift profilbillede', undefined, [
            { text: 'Tag billede', onPress: () => pickAvatar(true) },
            { text: 'Vælg fra galleri', onPress: () => pickAvatar(false) },
            { text: 'Annuller', style: 'cancel' },
        ]);
    }

    const showAvatarImage = avatarSource && avatarSource.uri !== failedAvatarUri;

    async function handleSaveProfile(updates) {
        await updateProfile(updates);
        setIsEditVisible(false);
    }

    async function handleDeleteAccount() {
        setIsDeleteVisible(false);
        setIsDeleting(true);

        try {
            await deleteAccount();
            navigation.replace('Login');
        } catch (error) {
            Alert.alert(
                'Kunne ikke slette kontoen',
                getErrorMessage(error, {
                    409: 'Du er den eneste leder i en virksomhed med andre medlemmer. Gør en anden til leder, før du sletter din konto.',
                    fallback: 'Kontoen kunne ikke slettes. Prøv igen senere.',
                }),
            );
        } finally {
            setIsDeleting(false);
        }
    }

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
                    <Pressable
                    style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
                    onPress={handleAvatarPress}
                    disabled={isUploadingAvatar}
                    accessibilityRole="button"
                    accessibilityLabel="Skift profilbillede"
                    >
                        {showAvatarImage ? (
                            <Image
                            key={avatarSource.uri}
                            source={avatarSource}
                            style={styles.avatarImage}
                            contentFit="cover"
                            cachePolicy="memory"
                            onError={() => setFailedAvatarUri(avatarSource.uri)}
                            />
                        ) : (
                            <UserRound size={36} color="#FFFFFF"/>
                        )}

                        {/* Kamera-ikon i midten viser, at billedet kan skiftes */}
                        <View style={styles.avatarOverlay}>
                            {isUploadingAvatar ? (
                                <ActivityIndicator color="#FFFFFF"/>
                            ) : (
                                <Camera size={26} color="#FFFFFF"/>
                            )}
                        </View>
                    </Pressable>

                    <Text style={styles.userName}>
                        {user?.name || 'Bruger Navn'}
                        </Text>
                    <Text style={styles.userEmail}>
                        {user?.email || 'Email@Example.com'}
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
                            onPress={() => setIsEditVisible(true)}
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
                                <Trash2
                                    size={18}
                                    color="#DC2626"
                                />
                            }
                            title="Slet konto"
                            danger
                            onPress={() => setIsDeleteVisible(true)}
                        />
                    </View>
            </ScrollView>

            <EditProfileModal
                visible={isEditVisible}
                user={user}
                onCancel={() => setIsEditVisible(false)}
                onSave={handleSaveProfile}
            />

            <ConfirmationModal
                visible={isDeleteVisible}
                variant="danger"
                title="Slet konto"
                message="Er du sikker på, at du vil slette din konto? Dette kan ikke fortrydes."
                confirmText="Slet"
                onConfirm={handleDeleteAccount}
                onCancel={() => setIsDeleteVisible(false)}
            />

            <LoadingModal visible={isDeleting} />
        </SafeAreaView>
    )
}
