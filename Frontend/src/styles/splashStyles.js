import { StyleSheet } from 'react-native';
import colors from '../constants/colors';

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },

    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    logoBox: {
        width: 120,
        height: 120,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        marginBottom: 28,
    },

    title: {
        color: colors.text.primary,
        fontSize: 40,
        fontWeight: '700',
        marginBottom: 8,
    },

    subtitle: {
        color: colors.text.secondary,
        fontSize: 17,
    },

    bottom: {
        alignItems: 'center',
        paddingBottom: 40,
        gap: 20,
    },

    dots: {
        flexDirection: 'row',
        gap: 10,
    },

    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
    },

    tagline: {
        color: colors.text.secondary,
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 1.2,
    },
});

export default styles;
