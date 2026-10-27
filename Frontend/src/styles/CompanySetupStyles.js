import { StyleSheet } from 'react-native';
import colors from '../constants/colors';

const styles = StyleSheet.create({
    keyboardContainer: {
        flex: 1,
    },

    safeArea: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        backgroundColor: colors.background,
    },

    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 24,
    },

    card: {
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,

        shadowColor: '#111827',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 5,
    },

    brand: {
        color: colors.primary,
        fontSize: 23,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 10,
    },

    welcomeText: {
        color: colors.text.secondary,
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5,
    },

    title: {
        color: colors.text.primary,
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 34,
        marginBottom: 12,
    },

    description: {
        color: colors.text.muted,
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 28,
    },

    label: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },

    input: {
        width: '100%',
        height: 52,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 14,
        fontSize: 16,
        color: colors.text.primary,
        backgroundColor: '#FFFFFF',
        marginBottom: 18,
    },

    primaryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        backgroundColor: colors.primary,
        borderRadius: 12,
        marginTop: 10,
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default styles;