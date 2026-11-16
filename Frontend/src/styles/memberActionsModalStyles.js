import { StyleSheet } from 'react-native';
import { companiesColors } from './companiesStyles';

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 16,
        gap: 12,
    },

    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },

    actionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },

    actionIconPromote: {
        backgroundColor: companiesColors.blueSoft,
    },

    actionIconDanger: {
        backgroundColor: '#FEE2E2',
    },

    actionBody: {
        flex: 1,
        gap: 2,
    },

    actionLabel: {
        color: companiesColors.text,
        fontSize: 15,
        fontWeight: '600',
    },

    actionLabelDanger: {
        color: companiesColors.red,
    },

    actionDescription: {
        color: companiesColors.muted,
        fontSize: 13,
    },
});

export default styles;
