import { StyleSheet } from 'react-native';
import colors from '../constants/colors';
import { inventoryColors } from './inventoryStyles';

// Status colours are shared with the Lager screen and the dashboard:
// violet = udløber snart, amber = lav beholdning, red = ikke på lager, green = indkøbsliste
export const notificationColors = {
    background: '#F5F6F8',
    card: '#FFFFFF',
    primary: inventoryColors.primary,
    primarySoft: inventoryColors.primarySoft,
    red: inventoryColors.red,
    redSoft: inventoryColors.redSoft,
    amber: inventoryColors.amber,
    amberSoft: inventoryColors.amberSoft,
    violet: inventoryColors.violet,
    violetSoft: inventoryColors.violetSoft,
    orange: colors.alternatives.orange,
    orangeSoft: '#FFF1E6',
    text: '#111827',
    body: '#374151',
    muted: '#6B7280',
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: notificationColors.background,
    },

    header: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 8,
    },

    // Back arrow on the left, "Ryd alle" on the right
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },

    backButton: {
        alignSelf: 'flex-start',
    },

    clearAllButton: {
        minHeight: 44,
        paddingHorizontal: 4,
        justifyContent: 'center',
    },

    clearAllText: {
        color: notificationColors.red,
        fontSize: 16,
        fontWeight: '600',
    },

    title: {
        color: notificationColors.text,
        fontSize: 26,
        fontWeight: '600',
    },

    subtitle: {
        color: notificationColors.muted,
        fontSize: 14,
        marginTop: 2,
    },

    listContent: {
        padding: 16,
        gap: 10,
        flexGrow: 1,
    },

    card: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: notificationColors.card,
        borderRadius: 14,
        padding: 14,

        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },

    pressed: {
        opacity: 0.85,
    },

    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    cardBody: {
        flex: 1,
        gap: 3,
    },

    companyLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 1,
    },

    companyLabelText: {
        flexShrink: 1,
        color: notificationColors.muted,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },

    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },

    cardTitle: {
        flex: 1,
        color: notificationColors.text,
        fontSize: 15,
        fontWeight: '700',
    },

    cardTitleRead: {
        fontWeight: '500',
    },

    unreadDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: notificationColors.primary,
    },

    cardMessage: {
        color: notificationColors.body,
        fontSize: 14,
        lineHeight: 19,
    },

    cardMeta: {
        color: notificationColors.muted,
        fontSize: 12,
        marginTop: 2,
    },

    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 10,
    },

    emptyTitle: {
        color: notificationColors.text,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },

    emptyDescription: {
        color: notificationColors.muted,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },

    retryButton: {
        marginTop: 6,
        backgroundColor: notificationColors.primary,
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },

    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default styles;
