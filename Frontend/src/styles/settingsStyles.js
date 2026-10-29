import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F6F8',
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
        color: '#111827',
        fontSize: 26,
        fontWeight: '600',
    },

    content: {
        padding: 16,
        gap: 20,
    },

    groupTitle: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
        marginLeft: 4,
    },

    group: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        overflow: 'hidden',

        shadowColor: '#111827',
        shadowOffset: {
        width: 0,
        height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 15,
    },

    rowDivider: {
        borderBottomWidth: 1,
        borderBottomColor: '#F0F1F3',
    },

    rowPressed: {
        backgroundColor: '#F9FAFB',
    },

    rowLabel: {
        color: '#1F2937',
        fontSize: 15,
    },

    logoutButton: {
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        paddingVertical: 16,
    },

    logoutButtonText: {
        color: '#B91C1C',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default styles;
