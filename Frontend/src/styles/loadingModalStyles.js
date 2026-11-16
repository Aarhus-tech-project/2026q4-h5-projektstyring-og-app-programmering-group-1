import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(17, 24, 39, 0.5)',
        padding: 24,
    },

    card: {
        minWidth: 160,
        maxWidth: 280,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 24,
        paddingVertical: 20,

        shadowColor: '#111827',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },

    animation: {
        width: 120,
        height: 120,
    },

    message: {
        color: '#5F6368',
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 4,
    },
});

export default styles;
