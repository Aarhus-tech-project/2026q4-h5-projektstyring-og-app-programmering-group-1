import { StyleSheet } from 'react-native';
import colors from '../constants/colors';

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },

    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(17, 24, 39, 0.5)',
        padding: 24,
    },

    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderTopWidth: 4,
        borderTopColor: colors.primary,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,

        shadowColor: '#111827',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },

    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DCFCE7',
        marginRight: 12,
    },

    title: {
        flex: 1,
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: '700',
    },

    closeButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },

    label: {
        color: colors.text.secondary,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },

    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        fontSize: 15,
        color: colors.text.primary,
        backgroundColor: '#F9FAFB',
        marginBottom: 14,
    },

    errorText: {
        color: '#DC2626',
        fontSize: 13,
        marginBottom: 12,
    },

    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 6,
    },

    button: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    cancelButton: {
        backgroundColor: '#F3F4F6',
    },

    saveButton: {
        backgroundColor: colors.primary,
    },

    buttonPressed: {
        opacity: 0.8,
    },

    cancelButtonText: {
        color: colors.text.primary,
        fontSize: 15,
        fontWeight: '600',
    },

    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default styles;
