import { StyleSheet } from 'react-native';
import colors from '../constants/colors';
import baseStyles from './editProfileModalStyles';

// Genbruger layoutet fra "Rediger profil"-modalen og tilføjer felter til passwords
const styles = StyleSheet.create({
    ...baseStyles,

    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        marginBottom: 14,
        paddingLeft: 14,
    },

    passwordInput: {
        flex: 1,
        height: '100%',
        fontSize: 15,
        color: colors.text.primary,
    },

    eyeButton: {
        width: 44,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },

    forgotPasswordLink: {
        alignSelf: 'flex-end',
        marginTop: -8,
        marginBottom: 10,
        paddingVertical: 4,
    },

    forgotPasswordText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },

    requirements: {
        marginTop: -6,
        marginBottom: 14,
        gap: 4,
    },

    requirementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    requirementText: {
        fontSize: 12,
        color: colors.text.secondary,
    },

    requirementMet: {
        color: '#1E8A5A',
    },
});

export default styles;
