import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    keyboardContainer: {
        flex: 1,
    },

    safeArea: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#F3F6FC',
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
        marginBottom: 28,
    },

    backButtonText: {
        color: '#2563EB',
        fontSize: 16,
        fontWeight: '600',
    },

    brand: {
        color: '#2563EB',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 36,
    },

    welcomeText: {
        color: '#4B5563',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },

    title: {
        color: '#111827',
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
        backgroundColor: '#2563EB',
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
        color: '#2563EB',
        fontSize: 14,
        fontWeight: '700',
    },

    signUpScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 24,
    },
});

export default styles;