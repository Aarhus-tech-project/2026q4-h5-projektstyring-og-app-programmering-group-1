import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, X } from 'lucide-react-native';
import styles from '../styles/invitationsModalStyles';
import listStyles, { companiesColors } from '../styles/companiesStyles';
import { formatDate, getRoleLabel } from '../utils/companyRoles';
import RoleBadge from './RoleBadge';
import LoadingModal from './LoadingModal';
import ConfirmationModal from './ConfirmationModal';
import { getErrorMessage } from '../../http/http';

const SCREEN_HEIGHT = Dimensions.get('window').height;


export default function InvitationModal({ visible, invitations, error, onClose, onCancelInvitation }) {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        if (visible) {
            translateY.setValue(SCREEN_HEIGHT);
            Animated.timing(translateY, {
                toValue: 0,
                duration: 280,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        }
    }, [visible, translateY]);

    const handleClose = () => {
        Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 220,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(() => onClose());
    };

    const [invitationToCancel, setInvitationToCancel] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelError, setCancelError] = useState('');

    const confirmCancel = async () => {
        const invitation = invitationToCancel;
        setInvitationToCancel(null);
        setIsCancelling(true);

        try {
            await onCancelInvitation(invitation);
        } catch (err) {
            setCancelError(
                getErrorMessage(err, {
                    404: 'Invitationen blev ikke fundet. Den kan være blevet annulleret allerede.',
                    fallback: 'Noget gik galt. Invitationen blev ikke annulleret.',
                })
            );
        } finally {
            setIsCancelling(false);
        }
    };


    return (
        <Modal 
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={handleClose}>
            <View style={styles.backdrop}>
                <Pressable
                style={StyleSheet.absoluteFill}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Luk"
                />

                <Animated.View
                    style={[
                        styles.sheet,
                        { paddingBottom: insets.bottom + 16, transform: [{ translateY }] },
                    ]}>
                    <View style={styles.handle} />

                    <View style={styles.header}>
                        <Text style={styles.title} accessibilityRole="header">Afventende invitationer</Text>
                        <Pressable
                            style={styles.closeButton}
                            onPress={handleClose}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Luk">
                            <X size={20} color={companiesColors.text} />
                            </Pressable>
                    </View>

                    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                        <InvitationList invitations={invitations} error={error} onCancel={setInvitationToCancel} />
                    </ScrollView>
                </Animated.View>
            </View>
            <ConfirmationModal
                visible={!!invitationToCancel}
                variant="danger"
                title={`Annuller invitationen til ${invitationToCancel?.email ?? ''}?`}
                message="Personen kan ikke længere acceptere den."
                confirmText="Annuller invitation"
                cancelText="Behold"
                onConfirm={confirmCancel}
                onCancel={() => setInvitationToCancel(null)}
                />

            <LoadingModal visible={isCancelling} message="Annullerer invitation..." />

            <ConfirmationModal
                visible={!!cancelError}
                variant="alert"
                title="Noget gik galt"
                message={cancelError}
                confirmText="Ok"
                hideCancel
                onConfirm={() => setCancelError('')}
                onCancel={() => setCancelError('')}
                />
        </Modal>
    );
}


function InvitationList({ invitations, error, onCancel }) {
    if (error) {
        return (
            <View style={listStyles.memberGroup}>
                <View style={listStyles.emptyMembers}>
                    <Text style={listStyles.emptyDescription}>{error}</Text>
                    <Text style={listStyles.emptyDescription}>Prøv at opdatere siden.</Text>
                </View>
            </View>
        );
    }

    if (invitations.length === 0) {
        return (
            <View style={listStyles.memberGroup}>
                <View style={listStyles.emptyMembers}>
                    <Mail size={36} color={companiesColors.muted} strokeWidth={1.5} />
                    <Text style={listStyles.emptyTitle}>Ingen invitationer</Text>
                    <Text style={listStyles.emptyDescription}>
                        Invitationer, der er send til andre brugere vises her
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={listStyles.memberGroup}>
            {invitations.map((invitation, index) => (
                <InvitationRow
                    key={invitation.id}
                    invitation={invitation}
                    isLast={index === invitations.length - 1}
                    onCancel={() => onCancel(invitation)}
                />
            ))}
        </View>
    );
}


function InvitationRow({ invitation, isLast, onCancel }) {
    const expiresAt = formatDate(invitation.expires_at);
    const details = [
        `Inviteret af ${invitation.invited_by_name}`,
        expiresAt && `udløber ${expiresAt}`,
    ]
        .filter(Boolean)
        .join(' • ');

        return(
            <View style={[listStyles.memberRow, !isLast && listStyles.memberDivider]}>
                <View
                    style={styles.invitationInfo}
                    accessibile
                    accessibilityLabel={`Invitation til ${invitation.email}, rolle: ${getRoleLabel(invitation.role)}. ${details}`}>
                    <View style={[listStyles.memberAvatar, { backgroundColor: companiesColors.graySoft }]}>
                        <Mail size={18} color={companiesColors.muted} />
                    </View>

                    <View style={listStyles.memberBody}>
                        <Text style={listStyles.memberName} numberOfLines={1}>{invitation.email}</Text>
                        <Text style={listStyles.memberEmail} numberOfLines={1}>{details}</Text>
                    </View>

                    <RoleBadge role={invitation.role} />
                </View>

                <Pressable
                    style={({ pressed }) => [styles.cancelButton, pressed && { backgroundColor: companiesColors.graySoft }]}
                    onPress={onCancel}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Annuller invitation til ${invitation.email}`}>
                    <X size={18} color={companiesColors.red} />
                </Pressable>
            </View>
        );
}