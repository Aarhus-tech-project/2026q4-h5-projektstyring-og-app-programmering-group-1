import { StyleSheet } from 'react-native';
import colors from '../constants/colors';
import baseStyles from './editProfileModalStyles';

// Genbruger layoutet fra "Rediger profil"-modalen og tilføjer firmavalg og +/- vælgere
const styles = StyleSheet.create({
    ...baseStyles,

    loading: {
        paddingVertical: 32,
        alignItems: 'center',
    },

    infoText: {
        color: colors.text.secondary,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },

    companyList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 18,
    },

    companyChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },

    companyChipActive: {
        borderColor: colors.primary,
        backgroundColor: '#DCFCE7',
    },

    companyChipText: {
        color: colors.text.primary,
        fontSize: 14,
    },

    companyChipTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },

    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        marginBottom: 6,
    },

    stepperButton: {
        width: 48,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },

    stepperButtonDisabled: {
        opacity: 0.3,
    },

    stepperValue: {
        flex: 1,
        textAlign: 'center',
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: '600',
    },

    hint: {
        color: colors.text.muted,
        fontSize: 12,
        lineHeight: 17,
        marginBottom: 16,
    },
});

export default styles;
