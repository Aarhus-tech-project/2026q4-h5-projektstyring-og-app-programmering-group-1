import { StyleSheet } from 'react-native';
import { notificationColors } from './notificationsStyles';

const styles = StyleSheet.create({
    section: {
        gap: 10,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },

    sectionTitle: {
        color: notificationColors.text,
        fontSize: 16,
        fontWeight: '600',
    },

    sectionCount: {
        color: notificationColors.muted,
        fontSize: 14,
        fontWeight: '600',
    },

    notificationsLabel: {
        marginTop: 8,
        paddingHorizontal: 4,
    },

    acceptButton: {
        alignSelf: 'flex-start',
        marginTop: 8,
        backgroundColor: notificationColors.primary,
        borderRadius: 10,
        paddingHorizontal: 18,
        paddingVertical: 8,
    },

    acceptButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },

    errorText: {
        flex: 1,
        color: notificationColors.red,
        fontSize: 13,
    },
});

export default styles;
