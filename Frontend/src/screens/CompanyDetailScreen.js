import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Building2, CalendarDays, ChevronLeft, ChevronRight, Lock, MapPin, SearchX, Users, Mail, UserPlus } from 'lucide-react-native';
import styles, { companiesColors, roleColors } from '../styles/companiesStyles';
import { getCompanyDetails, getCompanyInvitations, cancelInvitation, createInvitation, promoteMember, removeMember } from '../services/companyService';
import { getErrorMessage } from '../../http/http';
import { canPromote, canRemove, formatDate, getInitials, getRoleLabel } from '../utils/companyRoles';
import { useAuth } from '../AuthContext/AuthContext';
import RoleBadge from '../components/RoleBadge';
import InvitationModal from '../components/InvitationModal';
import MemberActionsModal from '../components/MemberActionsModal';
import InviteMemberModal from '../components/InviteMemberModal';




// Adgangsfejl får deres egen skærm, så brugeren ikke bare ser "prøv igen"
const ACCESS_ERRORS = {
    403: {
        Icon: Lock,
        title: 'Ingen adgang',
        description: 'Kun ledere kan se virksomhedens oplysninger og medarbejdere.',
    },
    404: {
        Icon: SearchX,
        title: 'Virksomheden blev ikke fundet',
        description: 'Virksomheden findes ikke længere, eller du er ikke medlem af den.',
    },
};

export default function CompanyDetailScreen({ navigation, route }) {
    const { companyId, companyName } = route.params ?? {};
    const { user } = useAuth();

    const [company, setCompany] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const [invitations, setInvitations] = useState([]);
    const [invitationsError, setInvitationsError] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [isInvitationsVisible, setIsInvitationsVisible] = useState(false);
    const [isInviteVisible, setIsInviteVisible] = useState(false);



    const loadDetails = useCallback(async ({ isRefresh = false } = {}) => {
        if (!companyId) {
            setError({ status: 404});
            setLoading(false);
            return;
        }

        if (isRefresh) setRefreshing(true);
        setError(null);

        const [detailsResult, invitationsResult] = await Promise.allSettled([
            getCompanyDetails(companyId),
            getCompanyInvitations(companyId)
        ]);


        if (detailsResult.status === 'fulfilled') {
            setCompany(detailsResult.value.company);
            setMembers(detailsResult.value.members);
        } else {
            const err = detailsResult.reason;
            setError({
                status: err?.response?.status,
                message: getErrorMessage(err, { fallback: 'Kunne ikke hente virksomheden.'}),
            });
        }

        if (invitationsResult.status === 'fulfilled') {
            setInvitations(invitationsResult.value);
            setInvitationsError(null);
        } else {
            setInvitationsError(
                getErrorMessage(invitationsResult.reason, { fallback: 'Kunne ikke hente invitationer.' })
            );
        }

        setLoading(false);
        setRefreshing(false);
    }, [companyId]);

    useFocusEffect(
        useCallback(() => {
            loadDetails();
        }, [loadDetails])
    );

    const goBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Companies');
        }
    };

    const retry = () => {
        setLoading(true);
        loadDetails();
    };

    const handleCancelInvitation = async (invitation) => {
        try {
            await cancelInvitation(companyId, invitation.id);
        } finally {
            await loadDetails();
        }
    };

    const handlePromoteMember = async (member) => {
        try {
            await promoteMember(companyId, member.user_id);
        } finally {
            await loadDetails();
        }
    };

    const handleRemoveMember = async (member) => {
        try {
            await removeMember(companyId, member.user_id);
        } finally {
            await loadDetails();
        }
    };

    const handleInvite = async ({ email, role }) => {
        await createInvitation(companyId, { email, role });
        await loadDetails();
    };


    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={companiesColors.primary} />
                    <Text style={styles.emptyDescription}>Henter virksomhed...</Text>
                </View>
            );
        }

        // Vis kun fejlskærmen hvis vi ikke har noget at vise; ellers beholdes de gamle data
        if (error && !company) {
            const accessError = ACCESS_ERRORS[error.status];
            if (accessError) {
                const { Icon } = accessError;
                return (
                    <View style={styles.centered}>
                        <Icon size={48} color={companiesColors.muted} strokeWidth={1.5} />
                        <Text style={styles.emptyTitle}>{accessError.title}</Text>
                        <Text style={styles.emptyDescription}>{accessError.description}</Text>
                        <Pressable
                            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                            onPress={goBack}
                            accessibilityRole="button">
                            <Text style={styles.primaryButtonText}>Tilbage til virksomheder</Text>
                        </Pressable>
                    </View>
                );
            }

            return (
                <View style={styles.centered}>
                    <Text style={styles.emptyTitle}>Noget gik galt</Text>
                    <Text style={styles.emptyDescription}>{error.message}</Text>
                    <Pressable
                        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                        onPress={retry}
                        accessibilityRole="button">
                        <Text style={styles.primaryButtonText}>Prøv igen</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={goBack} accessibilityRole="button">
                        <Text style={styles.secondaryButtonText}>Tilbage</Text>
                    </Pressable>
                </View>
            );
        }

        return (
            <ScrollView
                contentContainerStyle={styles.detailContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadDetails({ isRefresh: true })}
                        tintColor={companiesColors.primary}
                        colors={[companiesColors.primary]}
                    />
                }>
                <CompanyInfoCard company={company} />

                <View style={styles.actionRow}>
                    <Pressable
                        style={({ pressed }) => [styles.actionButton, styles.actionButtonPrimary, pressed && styles.pressed]}
                        onPress={() => setIsInviteVisible(true)}
                        accessibilityRole="button">
                            <UserPlus size={18} color="#FFFFFF" />
                            <Text style={styles.actionButtonTextPrimary}>Inviter</Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [styles.actionButton, styles.actionButtonSecondary, pressed && styles.pressed]}
                        onPress={() => setIsInvitationsVisible(true)}
                        accessibilityRole="button"
                        accessibilityLabel={
                            invitationsError ? 'Vis invitationer' : `Vis invitationer, ${invitations.length} afventende`
                        }>
                        <Mail size={18} color={companiesColors.text} />
                        <Text style={styles.actionButtonTextSecondary}>
                            {invitationsError ? 'Vis invitationer' : `Invitationer (${invitations.length})`}
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle} accessibilityRole="header">Medarbejdere</Text>
                    <Text style={styles.sectionCount}>{members.length}</Text>
                </View>

                <View style={styles.memberGroup}>
                    {members.length === 0 ? (
                        <View style={styles.emptyMembers}>
                            <Users size={36} color={companiesColors.muted} strokeWidth={1.5} />
                            <Text style={styles.emptyTitle}>Ingen medarbejdere endnu</Text>
                            <Text style={styles.emptyDescription}>
                                Medarbejdere, der tilknyttes virksomheden, vises her.
                            </Text>
                        </View>
                    ) : (
                        members.map((member, index) => {
                            const hasActions =
                                canPromote(company.role, member.role) || canRemove(company.role, member.role);

                            return (
                                <MemberRow
                                    key={member.user_id}
                                    member={member}
                                    isCurrentUser={member.user_id === user?.id}
                                    isLast={index === members.length - 1}
                                    onPress={hasActions ? () => setSelectedMember(member) : undefined}
                                />
                            );
                        })
                    )}
                </View>
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={goBack}
                    accessibilityRole="button"
                    accessibilityLabel="Tilbage">
                    <ChevronLeft size={28} color={companiesColors.text} />
                </Pressable>
                <Text style={styles.title} numberOfLines={1}>{company?.name ?? companyName ?? 'Virksomhed'}</Text>
                <Text style={styles.subtitle}>Oplysninger og medarbejdere</Text>
            </View>

            {renderContent()}

            <InvitationModal
                visible={isInvitationsVisible}
                invitations={invitations}
                error={invitationsError}
                onClose={() => setIsInvitationsVisible(false)}
                onCancelInvitation={handleCancelInvitation}
            />

            <MemberActionsModal
                visible={!!selectedMember}
                member={selectedMember}
                myRole={company?.role}
                onClose={() => setSelectedMember(null)}
                onPromote={handlePromoteMember}
                onRemove={handleRemoveMember}
            />

            <InviteMemberModal
                visible={isInviteVisible}
                myRole={company?.role}
                onClose={() => setIsInviteVisible(false)}

                onInvite={handleInvite}
            />
        </SafeAreaView>
    );
}

function CompanyInfoCard({ company }) {
    const createdAt = formatDate(company.created_at);

    return (
        <View style={styles.heroCard}>
            <View style={styles.heroTop}>
                <View style={styles.heroInitials}>
                    <Text style={styles.heroInitialsText}>{getInitials(company.name)}</Text>
                </View>
                <View style={styles.heroTitleWrap}>
                    <Text style={styles.heroName} numberOfLines={2}>{company.name}</Text>
                    <View style={styles.companyMetaRow}>
                        <Text style={styles.companyMeta}>Din rolle:</Text>
                        <RoleBadge role={company.role} />
                    </View>
                </View>
            </View>

            <View style={styles.infoList}>
                <InfoRow Icon={Building2} label="CVR-nummer" value={company.cvr || 'Ikke angivet'} />
                <InfoRow Icon={MapPin} label="Adresse" value={company.address || 'Ikke angivet'} />
                {!!createdAt && <InfoRow Icon={CalendarDays} label="Oprettet" value={createdAt} />}
            </View>
        </View>
    );
}

function InfoRow({ Icon, label, value }) {
    return (
        <View style={styles.infoRow} accessible accessibilityLabel={`${label}: ${value}`}>
            <Icon size={18} color={companiesColors.muted} style={{ marginTop: 2 }} />
            <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue} selectable>{value}</Text>
            </View>
        </View>
    );
}

function MemberRow({ member, isCurrentUser, isLast, onPress }) {
    const colors = roleColors[member.role] ?? roleColors.medarbejder;
    const label = `${member.name}${isCurrentUser ? ' (dig)' : ''}, ${member.email}, ${getRoleLabel(member.role)}`;

    return (
        <Pressable
            style={({ pressed }) => [
                styles.memberRow,
                !isLast && styles.memberDivider,
                pressed && onPress && { backgroundColor: companiesColors.graySoft },
            ]}
            onPress={onPress}
            disabled={!onPress}
            accessibilityRole={onPress ? 'button' : undefined}
            accessibilityLabel={label}
            accessibilityHint={onPress ? 'Åbner handlinger for medarbejderen' : undefined}>
            <View style={[styles.memberAvatar, { backgroundColor: colors.background }]}>
                <Text style={[styles.memberAvatarText, { color: colors.color }]}>{getInitials(member.name)}</Text>
            </View>

            <View style={styles.memberBody}>
                <View style={styles.memberNameRow}>
                    <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                    {isCurrentUser && <Text style={styles.memberYou}>(dig)</Text>}
                </View>
                <Text style={styles.memberEmail} numberOfLines={1}>{member.email}</Text>
                {!member.is_active && <Text style={styles.memberInactive}>Deaktiveret konto</Text>}
            </View>

            <RoleBadge role={member.role} />
            {onPress && <ChevronRight size={18} color={companiesColors.chevron} />}
        </Pressable>
    );
}
