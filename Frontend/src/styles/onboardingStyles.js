import { StyleSheet } from 'react-native';
import colors from '../constants/colors';

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },

    header: {
        height: 48,
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },

    skipText: {
        color: colors.text.secondary,
        fontSize: 15,
        fontWeight: '600',
    },

    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },

    animation: {
        width: '100%',
        height: 300,
        marginBottom: 32,
    },

    eyebrow: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
    },

    title: {
        color: colors.text.primary,
        fontSize: 30,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },

    description: {
        color: colors.text.secondary,
        fontSize: 17,
        lineHeight: 24,
        textAlign: 'center',
    },

    footer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        gap: 28,
    },

    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },

    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E5E7EB',
    },

    dotActive: {
        width: 24,
        backgroundColor: colors.primary,
    },

    primaryButton: {
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default styles;
