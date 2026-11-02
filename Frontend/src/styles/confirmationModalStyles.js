import { StyleSheet } from 'react-native';

// Farver pr. variant: ikon-baggrund, ikon/accent, knap-baggrund, knap-tekst
export const variants = {
    danger: {
        iconBackground: '#FEE2E2',
        accent: '#DC2626',
        buttonBackground: '#DC2626',
        buttonText: '#FFFFFF',
    },
    warning: {
        iconBackground: '#FEF3C7',
        accent: '#D97706',
        buttonBackground: '#F59E0B',
        buttonText: '#111827',
    },
    status: {
        iconBackground: '#DCFCE7',
        accent: '#1E8A5A',
        buttonBackground: '#1E8A5A',
        buttonText: '#FFFFFF',
    },
    alert: {
        iconBackground: '#DBEAFE',
        accent: '#2563EB',
        buttonBackground: '#2563EB',
        buttonText: '#FFFFFF',
    },
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(17, 24, 39, 0.5)',
        padding: 24,
    },

    card: {
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderTopWidth: 4,
        paddingHorizontal: 20,
        paddingTop: 24,
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

    iconWrapper: {
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 28,
        marginBottom: 16,
    },

    title: {
        color: '#111827',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },

    message: {
        color: '#5F6368',
        fontSize: 15,
        lineHeight: 21,
        textAlign: 'center',
        marginBottom: 24,
    },

    actions: {
        width: '100%',
        flexDirection: 'row',
        gap: 12,
    },

    button: {
        flex: 1,
        alignItems: 'center',
        borderRadius: 12,
        paddingVertical: 14,
    },

    cancelButton: {
        backgroundColor: '#F3F4F6',
    },

    cancelButtonText: {
        color: '#1F2937',
        fontSize: 15,
        fontWeight: '600',
    },

    confirmButtonText: {
        fontSize: 15,
        fontWeight: '700',
    },

    buttonPressed: {
        opacity: 0.8,
    },
});

export default styles;
