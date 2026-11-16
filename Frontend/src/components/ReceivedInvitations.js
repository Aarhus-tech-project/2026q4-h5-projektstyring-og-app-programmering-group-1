import { Pressable, Text, View } from 'react-native';
import { Mail, Store } from 'lucide-react-native';
import styles from '../styles/receivedInvitationsStyles';
import cardStyles, { notificationColors } from '../styles/notificationsStyles';
import { formatDate, getRoleLabel } from '../utils/companyRoles';
import RoleBadge from './RoleBadge';



export default function ReceivedInvitations({ invitations, error, onAccept, hasNotificationsBelow }) {
    if (!error && invitations.length === 0) return null;

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle} accessibilityRole="header">Invitationer</Text>
                {!error && <Text style={styles.sectionCount}>{invitations.length}</Text>}
            </View>

            {error ? (
                <View style={cardStyles.card}>
                    <Text style={styles.errorText}>{error} Træk ned for at prøve igen.</Text>
                </View>
            ) : (
                invitations.map((invitation) => (
                    <InvitationCard
                        key={invitation.id}
                        invitation={invitation}
                        onAccept={() => onAccept(invitation)}
                    />
                ))
            )}

            {hasNotificationsBelow && (
                <Text style={[styles.sectionTitle, styles.notificationsLabel]} accessibilityRole="header">
                    Notifikationer
                </Text>
            )}
        </View>
    );
}

function InvitationCard({ invitation, onAccept }) {
    const roleLabel = getRoleLabel(invitation.role);
    const expiresAt = formatDate(invitation.expires_at);
    const meta = [`Fra ${invitation.invited_by_name}`, expiresAt && `udløber ${expiresAt}`]
        .filter(Boolean)
        .join(' • ');

    return (
        <View style={cardStyles.card}>
            <View style={[cardStyles.iconWrap, { backgroundColor: notificationColors.primarySoft }]}>
                <Mail size={20} color={notificationColors.primary} />
            </View>

            <View style={cardStyles.cardBody}>
                <View
                    accessible
                    accessibilityLabel={`Invitation til ${invitation.company_name} som ${roleLabel}. ${meta}`}>
                    <View style={cardStyles.companyLabel}>
                        <Store size={13} color={notificationColors.muted} />
                        <Text style={cardStyles.companyLabelText} numberOfLines={1}>
                            {invitation.company_name}
                        </Text>
                    </View>

                    <View style={cardStyles.cardTop}>
                        <Text style={cardStyles.cardTitle} numberOfLines={1}>Ny invitation</Text>
                        <RoleBadge role={invitation.role} />
                    </View>

                    {!!meta && <Text style={cardStyles.cardMeta}>{meta}</Text>}
                </View>

                <Pressable
                    style={({ pressed }) => [styles.acceptButton, pressed && cardStyles.pressed]}
                    onPress={onAccept}
                    accessibilityRole="button"
                    accessibilityLabel={`Accepter invitation til ${invitation.company_name}`}>
                    <Text style={styles.acceptButtonText}>Accepter</Text>
                </Pressable>
            </View>
        </View>
    );
}
