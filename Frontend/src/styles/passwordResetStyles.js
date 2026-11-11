import { StyleSheet } from 'react-native';
import colors from '../constants/colors';

// Bruges sammen med loginStyles (kort, labels, inputs og knap), så skærmene ligner login.
const resetColors = {
    error: '#DC2626',
    errorSoft: '#FEF2F2',
    border: '#D1D5DB',
    muted: '#6B7280',
    disabled: '#9CA3AF',
};

const styles = StyleSheet.create({
    description: {
        color: colors.text.secondary,
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 24,
    },

    emailHighlight: {
        color: colors.text.primary,
        fontWeight: '700',
    },

    inputError: {
        borderColor: resetColors.error,
    },

    errorBox: {
        backgroundColor: resetColors.errorSoft,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 14,
    },

    errorText: {
        color: resetColors.error,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },

    buttonDisabled: {
        opacity: 0.6,
    },

    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    // ---------- Kodefelt ----------
    codeContainer: {
        marginBottom: 12,
    },

    codeBoxes: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },

    codeBox: {
        flex: 1,
        maxWidth: 52,
        height: 58,
        borderWidth: 1,
        borderColor: resetColors.border,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },

    codeBoxActive: {
        borderColor: colors.primary,
        borderWidth: 2,
    },

    codeBoxError: {
        borderColor: resetColors.error,
    },

    codeDigit: {
        color: colors.text.primary,
        fontSize: 24,
        fontWeight: '700',
    },

    // Det rigtige TextInput ligger usynligt oven på boksene, så tastatur,
    // indsæt og iOS/Android "one-time code" autofill virker.
    hiddenCodeInput: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.02,
        color: 'transparent',
        fontSize: 1,
    },

    hint: {
        color: resetColors.muted,
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
    },

    hintExpired: {
        color: resetColors.error,
        fontWeight: '600',
    },

    resendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        gap: 4,
    },

    resendText: {
        color: resetColors.muted,
        fontSize: 14,
    },

    resendLink: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },

    resendLinkDisabled: {
        color: resetColors.disabled,
    },

    // ---------- Password ----------
    passwordField: {
        position: 'relative',
        justifyContent: 'center',
    },

    passwordInput: {
        paddingRight: 52,
    },

    visibilityToggle: {
        position: 'absolute',
        right: 4,
        top: 0,
        height: 52,
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    requirements: {
        marginTop: -8,
        marginBottom: 18,
        gap: 4,
    },

    requirementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    requirementText: {
        color: resetColors.muted,
        fontSize: 13,
    },

    requirementMet: {
        color: colors.primary,
    },

    forgotPasswordLink: {
        alignSelf: 'flex-end',
        marginTop: -8,
        marginBottom: 8,
        paddingVertical: 4,
    },

    forgotPasswordText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});

export { resetColors };
export default styles;
