import { StyleSheet } from 'react-native';
import colors from '../constants/colors';
import baseStyles from './editProfileModalStyles';

// Genbruger layoutet fra "Rediger profil"-modalen og tilføjer rollevælgeren
const styles = StyleSheet.create({
    ...baseStyles,

    roleToggle: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },

    roleOption: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
    },

    roleOptionSelected: {
        borderColor: colors.primary,
        backgroundColor: '#ECFDF5',
    },

    roleOptionText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text.secondary,
    },

    roleOptionTextSelected: {
        color: colors.primary,
    },

    roleHint: {
        fontSize: 15,
        color: colors.text.primary,
        marginBottom: 10,
    },

    helpText: {
        fontSize: 12,
        color: colors.text.secondary,
        marginBottom: 14,
    },
});

export default styles;
