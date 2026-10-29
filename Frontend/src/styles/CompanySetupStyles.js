import { StyleSheet } from 'react-native';
import colors from '../constants/colors';

const styles = StyleSheet.create({
    keyboardContainer: {
        flex: 1,
    },

    safeArea: {
        flex: 1,
        backgroundColor: '#F3F6FC',
    },

    container: {
        flexGrow: 1,
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
        padding: 24,
        paddingBottom: 40,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
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

    companyCard: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,

        shadowColor: '#111827',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },

    logo: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E6F4EC',
        marginBottom: 16,
    },

    logoText: {
        color: colors.primary,
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: 1,
    },

    fieldLabel: {
        color: colors.text.muted,
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 6,
    },

    companyName: {
        color: colors.text.primary,
        fontSize: 26,
        fontWeight: '700',
        textAlign: 'center',
    },

    placeholderText: {
        color: '#9CA3AF',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },

    divider: {
        alignSelf: 'stretch',
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 18,
    },

    addressText: {
        color: colors.text.primary,
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'center',
    },

    title: {
        color: colors.text.primary,
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 34,
        marginBottom: 6,
    },

    description: {
        color: colors.text.muted,
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 24,
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
        marginBottom: 14,
    },

    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 52,
        borderWidth: 1.5,
        borderColor: colors.primary,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },

    secondaryButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '700',
    },

    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 52,
        backgroundColor: colors.primary,
        borderRadius: 12,
        marginTop: 32,
    },

    primaryButtonDisabled: {
        opacity: 0.4,
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default styles;
