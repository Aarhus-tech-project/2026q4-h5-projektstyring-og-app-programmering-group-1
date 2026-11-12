import { StyleSheet } from 'react-native';
import colors from '../constants/colors';

export const companiesColors = {
    background: '#F5F6F8',
    card: '#FFFFFF',
    border: '#E5E7EB',
    primary: colors.primary,
    primarySoft: '#ECFDF5',
    blue: colors.alternatives.blue,
    blueSoft: '#EFF6FF',
    gray: '#4B5563',
    graySoft: '#F3F4F6',
    red: '#DC2626',
    text: '#111827',
    body: '#374151',
    muted: '#6B7280',
    chevron: '#9CA3AF',
};

// Farver pr. rolle til badges og avatarer
export const roleColors = {
    leder: { color: companiesColors.blue, background: companiesColors.blueSoft },
    medarbejder: { color: companiesColors.gray, background: companiesColors.graySoft },
};

const cardShadow = {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: companiesColors.background,
    },

    header: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 8,
    },

    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 8,
    },

    title: {
        color: companiesColors.text,
        fontSize: 26,
        fontWeight: '600',
    },

    subtitle: {
        color: companiesColors.muted,
        fontSize: 14,
        marginTop: 2,
    },

    listContent: {
        padding: 16,
        gap: 10,
        flexGrow: 1,
    },

    pressed: {
        opacity: 0.85,
    },

    // ----- Virksomhedskort i listen -----
    companyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: companiesColors.card,
        borderRadius: 14,
        padding: 14,
        ...cardShadow,
    },

    companyInitials: {
        width: 46,
        height: 46,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: companiesColors.primarySoft,
    },

    companyInitialsText: {
        color: companiesColors.primary,
        fontSize: 17,
        fontWeight: '800',
    },

    companyBody: {
        flex: 1,
        gap: 3,
    },

    companyName: {
        color: companiesColors.text,
        fontSize: 16,
        fontWeight: '700',
    },

    companyMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },

    companyMeta: {
        color: companiesColors.muted,
        fontSize: 13,
    },

    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },

    // ----- Rolle-badge -----
    roleBadge: {
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },

    roleBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },

    // ----- Detaljeskærm -----
    detailContent: {
        padding: 16,
        paddingBottom: 32,
        gap: 10,
        flexGrow: 1,
    },

    heroCard: {
        backgroundColor: companiesColors.card,
        borderRadius: 16,
        padding: 18,
        gap: 14,
        ...cardShadow,
    },

    heroTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },

    heroInitials: {
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: companiesColors.primary,
    },

    heroInitialsText: {
        color: '#FFFFFF',
        fontSize: 21,
        fontWeight: '800',
    },

    heroTitleWrap: {
        flex: 1,
        gap: 6,
    },

    heroName: {
        color: companiesColors.text,
        fontSize: 20,
        fontWeight: '700',
    },

    infoList: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: companiesColors.border,
        paddingTop: 12,
        gap: 10,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },

    infoLabel: {
        color: companiesColors.muted,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },

    infoValue: {
        color: companiesColors.body,
        fontSize: 15,
        marginTop: 1,
    },

    infoTextWrap: {
        flex: 1,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        marginBottom: 2,
        paddingHorizontal: 4,
    },

    sectionTitle: {
        color: companiesColors.text,
        fontSize: 18,
        fontWeight: '600',
    },

    sectionCount: {
        color: companiesColors.muted,
        fontSize: 14,
        fontWeight: '600',
    },

    memberGroup: {
        backgroundColor: companiesColors.card,
        borderRadius: 14,
        overflow: 'hidden',
        ...cardShadow,
    },

    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },

    memberDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: companiesColors.border,
    },

    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    memberAvatarText: {
        fontSize: 15,
        fontWeight: '700',
    },

    memberBody: {
        flex: 1,
        gap: 2,
    },

    memberNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    memberName: {
        flexShrink: 1,
        color: companiesColors.text,
        fontSize: 15,
        fontWeight: '600',
    },

    memberYou: {
        color: companiesColors.muted,
        fontSize: 13,
        fontWeight: '500',
    },

    memberEmail: {
        color: companiesColors.muted,
        fontSize: 13,
    },

    memberInactive: {
        color: companiesColors.red,
        fontSize: 12,
        fontWeight: '600',
    },

    emptyMembers: {
        alignItems: 'center',
        paddingVertical: 28,
        paddingHorizontal: 24,
        gap: 8,
    },

    // ----- Loading / tom / fejl -----
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 10,
    },

    emptyTitle: {
        color: companiesColors.text,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },

    emptyDescription: {
        color: companiesColors.muted,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },

    primaryButton: {
        marginTop: 6,
        backgroundColor: companiesColors.primary,
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },

    secondaryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },

    secondaryButtonText: {
        color: companiesColors.primary,
        fontSize: 15,
        fontWeight: '600',
    },

    // Skelet-kort mens listen hentes
    skeletonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: companiesColors.card,
        borderRadius: 14,
        padding: 14,
        ...cardShadow,
    },

    skeletonBlock: {
        backgroundColor: '#E5E7EB',
        borderRadius: 6,
    },
});

export default styles;
