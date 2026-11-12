import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, X } from 'lucide-react-native';
import styles from '../styles/invitationsModalStyles';
import listStyles, { companiesColors } from '../styles/companiesStyles';
import { formatDate, getRoleLabel } from '../utils/companyRoles';
import RoleBadge from './RoleBadge';


export default function InvitationModal({ visible, invitations, error, onClose }) {
    const insets = useSafeAreaInsets();


    return (
        <Modal 
            visible={visible}
            tranparent
            animationType="slide"
            statusBarTransLucent
            onReuqestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable
                style={StyleSheet.absoluteFill}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Luk"
                />

                <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
                    <View style={styles.handle} />

                    <View style={style.header}>
                        <Text style={styles.title} accessibilityRole="header">Afventende invitationer</Text>
                        <Pressable
                            style={styles.closeButton}
                            onPress={onClose}
                            hitslop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Luk">
                            <X size={20} color={companiesColors.text} />
                            </Pressable>
                    </View>

                    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                        <Invitationlist invitations={invitations} error={error} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}


function InvitationList({ invitations, error }) {
    if (error) {
        return (
            <View style={listStyles.memberGroup}>
                <View style={listStyles.emptyMember}>
                    <Text style={listStyle.emptyDescription}>{error}</Text>
                    <Text style={listStyles.emptyDescription}>Prøv at opdatere siden.</Text>
                </View>
            </View>
        );
    }

    if (invitations.length === 0) {
        return (
            <View style={listStyles.memberGroup}>
                <View style={listStyles.emptyMember}>
                    <Mail size={36} color={companiesColors.muted} strokeWidth={1.5} />
                    <Text style={listStyle.emptyTitle}>Ingen invitationer</Text>
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
                />
            ))}
        </View>
    );
}


function InvitationRow({ invitation, isLast }) {
    const expiresAt = formatDate(invitation.expiresAt);
    const details = [
        `Inviteret af ${invitation.invited_by_name}`,
        expiresAt && `udløber ${expiresAt}`,
    ]
    .filter(Boolean)
    .join(' • ');


    return (
        <View 
            style={[listStyles.memberRow, !isLast && listStyles.memberDivider]}
            accessible
            accessibilityLabel={`Invitation til ${invitation.email}, rolle: ${getRoleLabel(invitation.role)}. ${details}`}>
            <View style={[listStyles.memberAvatar, { backgroundColor: companiesColors.graySoft }]}>
                <Mail size={18} color={companiesColors.muted}/>
            </View>

            <View style={listStyles.memberBodu}>
                <Text style={listStyles.memberName} numberOfLines={1}>{invitation.email}</Text>
                <Text style={listStyles.memberEmail} numberOfLines={1}>{details}</Text>
            </View>

            <RoleBadge role={invitation.role} />
        </View>
    );
}