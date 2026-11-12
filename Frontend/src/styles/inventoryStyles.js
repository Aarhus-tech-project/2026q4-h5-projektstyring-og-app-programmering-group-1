import { StyleSheet } from 'react-native';
import colors from '../constants/colors';

export const inventoryColors = {
    background: '#F2F2F5',
    card: '#FFFFFF',
    text: '#111111',
    textSecondary: '#3F444B',
    muted: '#6B6F76',
    subtle: '#9AA1AC',
    disabled: '#C4C6CC',
    divider: '#ECECF0',
    control: '#E4E4E9',
    controlSoft: '#F2F2F5',
    // Darker than colors.primary so white text on it passes WCAG AA (4.5:1)
    primary: '#177A4F',
    primarySoft: '#E6F4EC',
    red: '#B42318',
    redSoft: '#FDECEA',
    amber: '#A15C00',
    amberSoft: '#FEF3E2',
    violet: '#6D28D9',
    violetSoft: '#EFE9FD',
    blue: colors.alternatives.blue,
};

// Colour per status tone from getItemStatus()
export const toneColors = {
    none: inventoryColors.muted,
    red: inventoryColors.red,
    amber: inventoryColors.amber,
    violet: inventoryColors.violet,
};

const CONTENT_MAX_WIDTH = 720;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: inventoryColors.background,
    },

    // Header
    header: {
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH,
        alignSelf: 'center',
        paddingTop: 4,
        paddingBottom: 12,
        gap: 12,
    },

    backButton: {
        width: 44,
        height: 44,
        marginLeft: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    titleBlock: {
        paddingHorizontal: 20,
        gap: 2,
    },

    title: {
        color: inventoryColors.text,
        fontSize: 32,
        lineHeight: 38,
        fontWeight: '700',
        letterSpacing: -0.5,
    },

    subtitle: {
        color: inventoryColors.muted,
        fontSize: 15,
    },

    subtitleAlert: {
        color: inventoryColors.red,
        fontWeight: '600',
    },

    // Overblik / Varer switch
    tabs: {
        flexDirection: 'row',
        marginHorizontal: 16,
        padding: 3,
        gap: 2,
        borderRadius: 12,
        backgroundColor: inventoryColors.control,
    },

    tab: {
        flex: 1,
        height: 40,
        borderRadius: 9,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },

    tabActive: {
        backgroundColor: inventoryColors.card,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },

    tabText: {
        color: inventoryColors.text,
        fontSize: 15,
        fontWeight: '500',
    },

    tabTextActive: {
        fontWeight: '600',
    },

    tabCount: {
        color: inventoryColors.muted,
        fontSize: 13,
    },

    // Search + category chips (Varer tab)
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 44,
        marginHorizontal: 16,
        paddingLeft: 12,
        borderRadius: 12,
        backgroundColor: inventoryColors.control,
    },

    searchInput: {
        flex: 1,
        height: 44,
        color: inventoryColors.text,
        fontSize: 17,
    },

    clearSearchButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    chipRow: {
        paddingHorizontal: 16,
        gap: 8,
    },

    chip: {
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        justifyContent: 'center',
        backgroundColor: inventoryColors.card,
    },

    chipActive: {
        backgroundColor: inventoryColors.text,
    },

    chipText: {
        color: inventoryColors.text,
        fontSize: 15,
        fontWeight: '600',
    },

    chipTextActive: {
        color: inventoryColors.card,
    },

    // Scroll content
    content: {
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 120,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 28,
        marginHorizontal: 4,
        marginBottom: 6,
    },

    sectionTitle: {
        color: inventoryColors.muted,
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    sectionSpacing: {
        height: 22,
    },

    sectionLink: {
        color: inventoryColors.primary,
        fontSize: 15,
        fontWeight: '600',
    },

    // Grouped white block (rows share one card with thin dividers)
    group: {
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: inventoryColors.card,
    },

    groupRow: {
        backgroundColor: inventoryColors.card,
    },

    groupRowFirst: {
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
    },

    groupRowLast: {
        borderBottomLeftRadius: 14,
        borderBottomRightRadius: 14,
    },

    groupRowDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: inventoryColors.divider,
    },

    // Overblik cards
    cardGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
        marginBottom: 22,
    },

    summaryCard: {
        width: '48.3%',
        minHeight: 124,
        padding: 12,
        gap: 6,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: inventoryColors.card,
        backgroundColor: inventoryColors.card,
    },

    summaryCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    summaryIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },

    summaryCount: {
        marginTop: 2,
        fontSize: 30,
        lineHeight: 34,
        fontWeight: '700',
    },

    summaryLabel: {
        color: inventoryColors.text,
        fontSize: 15,
        fontWeight: '600',
    },

    // Item rows
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },

    thumbnail: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: inventoryColors.controlSoft,
    },

    thumbnailSmall: {
        width: 40,
        height: 40,
    },

    thumbnailDot: {
        position: 'absolute',
        top: -3,
        right: -3,
        width: 13,
        height: 13,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: inventoryColors.card,
    },

    itemRow: {
        paddingVertical: 12,
        paddingLeft: 14,
        paddingRight: 12,
        gap: 10,
    },

    itemTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },

    itemDotSlot: {
        width: 8,
        paddingTop: 7,
    },

    itemText: {
        flex: 1,
        minWidth: 0,
        gap: 1,
    },

    itemName: {
        color: inventoryColors.text,
        fontSize: 16,
        lineHeight: 21,
        fontWeight: '600',
    },

    itemStatus: {
        fontSize: 14,
        lineHeight: 18,
    },

    itemStatusStrong: {
        fontWeight: '600',
    },

    quantity: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },

    quantityValue: {
        fontSize: 18,
        lineHeight: 21,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },

    quantityMin: {
        color: inventoryColors.muted,
        fontSize: 13,
        fontWeight: '500',
    },

    itemActions: {
        flexDirection: 'row',
        gap: 8,
    },

    actionButton: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },

    useButton: {
        backgroundColor: inventoryColors.controlSoft,
    },

    receiveButton: {
        backgroundColor: inventoryColors.primarySoft,
    },

    actionText: {
        fontSize: 15,
        fontWeight: '600',
    },

    // Compact rows in the Overblik list
    overviewRow: {
        minHeight: 60,
        paddingVertical: 8,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    overviewAmount: {
        fontSize: 16,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },

    // Floating "Opret vare" button
    fab: {
        position: 'absolute',
        right: 16,
        height: 56,
        paddingLeft: 18,
        paddingRight: 22,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: inventoryColors.primary,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 9,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },

    fabText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },

    // Loading / error / empty states
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 12,
    },

    emptyBlock: {
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 4,
    },

    messageTitle: {
        color: inventoryColors.text,
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
    },

    messageText: {
        color: inventoryColors.muted,
        fontSize: 15,
        textAlign: 'center',
    },

    retryText: {
        color: inventoryColors.primary,
        fontSize: 16,
        fontWeight: '700',
    },

    pressed: {
        opacity: 0.7,
    },
});

export default styles;
