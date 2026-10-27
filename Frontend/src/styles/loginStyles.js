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

    loginCard: {
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

    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 12,
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
        marginBottom: 32,
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
        color: '#111827',
        backgroundColor: '#FFFFFF',
        marginBottom: 18,
    },

    loginButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        backgroundColor: colors.primary,
        borderRadius: 12,
        marginTop: 10,
    },

    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    signUpRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },

    signUpText: {
        color: '#6B7280',
        fontSize: 14,
    },

    signUpLink: {
        color: '#57585a',
        fontSize: 14,
        fontWeight: '900',
    },

    signUpScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 24,
    },
});

export default styles;