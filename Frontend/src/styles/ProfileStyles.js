import { StyleSheet } from 'react-native';
import colors from '../constants/colors';

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F3F6FC',
    },

    container: {
        padding: 24,
        paddingBottom: 40,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
    },

    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTitle: {
        color: colors.text.primary,
        fontSize: 20,
        fontWeight: '700',
    },

    profileInfo: {
        alignItems: 'center',
        marginBottom: 32,
    },

    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        marginBottom: 12,
    },

    userName: {
        color: colors.text.primary,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },

    userEmail: {
        color: colors.text.secondary,
        fontSize: 14,
    },

    optionGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
    },

    option: {
        minHeight: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },

    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    optionIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        marginRight: 12,
    },

    optionText: {
        color: colors.text.primary,
        fontSize: 15,
        fontWeight: '500',
    },

    dangerText: {
        color: '#DC2626',
        fontSize: 15,
        fontWeight: '500',
    },

    logoutGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginTop: 8,
    },
});

export default styles;