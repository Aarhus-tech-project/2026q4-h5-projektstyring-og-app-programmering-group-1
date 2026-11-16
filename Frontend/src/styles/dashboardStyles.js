import { StyleSheet } from 'react-native';
import colors from '../constants/colors';

export const dashboardColors = {
    background: '#F3F4F6',
    card: '#FFFFFF',
    chip: '#F3F4F6',
    border: '#E5E7EB',
    primary: colors.primary,
    primarySoft: '#ECFDF5',
    black: colors.text.primary,
    red: '#DC2626',
    redSoft: '#FEE2E2',
    text: colors.text.primary,
    muted: '#6B7280',
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: dashboardColors.background,
    },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
    },

    brandMark: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: dashboardColors.primary,
    },

    brandMarkText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
    },

    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: dashboardColors.card,
        borderWidth: 1,
        borderColor: dashboardColors.border,
    },

    header: {
        flex: 1,
    },

    title: {
        color: dashboardColors.text,
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 2,
    },

    subtitle: {
        color: dashboardColors.muted,
        fontSize: 13,
    },

    listContent: {
        paddingHorizontal: 16,
        // Leaves room so the floating add button never covers the last card
        paddingBottom: 124,
        gap: 12,
    },

    summaryCard: {
        backgroundColor: dashboardColors.primary,
        borderRadius: 20,
        padding: 20,
    },

    summaryTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },

    summaryMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 8,
        marginBottom: 12,
    },

    summaryCount: {
        color: '#FFFFFF',
        fontSize: 44,
        fontWeight: '800',
    },

    summaryCountLabel: {
        color: '#FFFFFF',
        fontSize: 18,
        marginTop: 10,
    },

    summaryStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    summaryStat: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    summaryDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: 16,
    },

    summaryStatValue: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },

    summaryStatLabel: {
        color: '#FFFFFF',
        fontSize: 13,
    },

    companyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
    },

    companyCard: {
        width: '48.5%',
        backgroundColor: dashboardColors.card,
        borderRadius: 18,
        padding: 14,
        gap: 12,

        shadowColor: '#111827',
        shadowOffset: {
        width: 0,
        height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },

    companyCardFull: {
        width: '100%',
    },

    pressed: {
        opacity: 0.8,
    },

    companyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    initials: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: dashboardColors.primarySoft,
    },

    initialsText: {
        color: dashboardColors.primary,
        fontSize: 16,
        fontWeight: '700',
    },

    companyName: {
        color: dashboardColors.text,
        fontSize: 16,
        fontWeight: '700',
    },

    companyMeta: {
        color: dashboardColors.muted,
        fontSize: 13,
        marginTop: 2,
    },

    chips: {
        gap: 6,
    },

    chipsRow: {
        flexDirection: 'row',
    },

    chip: {
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: dashboardColors.chip,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        minHeight: 42,
    },

    warningChip: {
        backgroundColor: dashboardColors.redSoft,
    },

    chipValue: {
        color: dashboardColors.text,
        fontSize: 16,
        fontWeight: '700',
    },

    chipLabel: {
        color: dashboardColors.muted,
        fontSize: 12,
    },

    warningText: {
        color: dashboardColors.red,
    },

    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: dashboardColors.primary,
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 32,
    },

    fab: {
        position: 'absolute',
        right: 12,
        bottom: 48,
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: dashboardColors.primary,

        shadowColor: '#111827',
        shadowOffset: {
        width: 0,
        height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },

    addButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },

    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingBottom: 40,
    },

    illustration: {
        width: 220,
        height: 180,
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 28,
    },

    illustrationBlob: {
        position: 'absolute',
        bottom: 10,
        width: 170,
        height: 130,
        borderRadius: 65,
        backgroundColor: '#D1FAE5',
    },

    sparks: {
        position: 'absolute',
        top: 0,
        flexDirection: 'row',
        gap: 18,
        alignItems: 'flex-end',
    },

    spark: {
        width: 3,
        height: 18,
        borderRadius: 2,
        backgroundColor: dashboardColors.primary,
    },

    sparkLeft: {
        transform: [{ rotate: '-35deg' }],
    },

    sparkRight: {
        transform: [{ rotate: '35deg' }],
    },

    illustrationGround: {
        width: 210,
        height: 2,
        backgroundColor: dashboardColors.black,
        marginTop: -6,
    },

    emptyTitle: {
        color: dashboardColors.text,
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 10,
        textAlign: 'center',
    },

    emptyDescription: {
        color: dashboardColors.muted,
        fontSize: 16,
        lineHeight: 23,
        textAlign: 'center',
        marginBottom: 28,
    },
});

export default styles;
