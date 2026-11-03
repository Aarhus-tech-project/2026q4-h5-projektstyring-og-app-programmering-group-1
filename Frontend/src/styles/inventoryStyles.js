import { StyleSheet } from 'react-native';
import colors from '../constants/colors';
import { dashboardColors } from './dashboardStyles';

export const inventoryColors = {
    ...dashboardColors,
    warning: '#B45309',
    warningSoft: '#FEF3C7',
    blue: colors.alternatives.blue,
    blueSoft: '#DBEAFE',
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: inventoryColors.background,
    },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 12,
    },

    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    title: {
        color: inventoryColors.text,
        fontSize: 22,
        fontWeight: '800',
    },

    subtitle: {
        color: inventoryColors.muted,
        fontSize: 13,
    },

    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 12,
    },

    emptyList: {
        alignItems: 'center',
        padding: 32,
        gap: 8,
    },

    messageTitle: {
        color: inventoryColors.text,
        fontSize: 17,
        fontWeight: '700',
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

    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
        gap: 12,
    },

    column: {
        gap: 12,
    },

    listHeader: {
        gap: 16,
    },

    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
    },

    summaryCard: {
        width: '48.5%',
        minHeight: 96,
        backgroundColor: inventoryColors.card,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: inventoryColors.card,
        padding: 12,
        gap: 8,
    },

    summaryCardTablet: {
        width: '23.5%',
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
        fontSize: 26,
        fontWeight: '800',
    },

    summaryLabel: {
        color: inventoryColors.text,
        fontSize: 14,
        fontWeight: '600',
    },

    pressed: {
        opacity: 0.8,
    },

    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 48,
        backgroundColor: inventoryColors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: inventoryColors.border,
        paddingLeft: 12,
    },

    searchInput: {
        flex: 1,
        color: inventoryColors.text,
        fontSize: 16,
        paddingVertical: 10,
    },

    clearSearchButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    listTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 32,
    },

    listTitle: {
        color: inventoryColors.text,
        fontSize: 18,
        fontWeight: '700',
    },

    showAllText: {
        color: inventoryColors.primary,
        fontSize: 15,
        fontWeight: '700',
    },

    itemRow: {
        backgroundColor: inventoryColors.card,
        borderRadius: 14,
        padding: 14,
        gap: 4,
    },

    itemRowTablet: {
        flex: 1,
        maxWidth: '49.2%',
    },

    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },

    itemName: {
        flex: 1,
        color: inventoryColors.text,
        fontSize: 17,
        fontWeight: '700',
    },

    statusBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },

    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },

    itemMeta: {
        color: inventoryColors.muted,
        fontSize: 14,
    },

    itemFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 6,
    },

    itemNotes: {
        flex: 1,
        gap: 2,
    },

    purchaseText: {
        color: inventoryColors.blue,
        fontSize: 13,
        fontWeight: '600',
    },

    expiryText: {
        color: inventoryColors.warning,
        fontSize: 13,
        fontWeight: '600',
    },

    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },

    stepperButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: inventoryColors.primarySoft,
    },

    stepperButtonDisabled: {
        backgroundColor: inventoryColors.chip,
    },

    quantityText: {
        minWidth: 56,
        color: inventoryColors.text,
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
});

export default styles;
