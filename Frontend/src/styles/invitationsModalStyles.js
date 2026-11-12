import { StyleSheet } from 'react-native';
import { companiesColors } from './companiesStyles';

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(17, 24, 39, 0.5)',
    },

    sheet: {
        maxHeight: '80%',
        backgroundColor: companiesColors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 8,
    },

    handle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
        marginBottom: 8,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 12,
    },

    title: {
        color: companiesColors.text,
        fontSize: 18,
        fontWeight: '600',
    },

    closeButton: {
        padding: 4,
    },

    scroll: {
        flexGrow: 0,
    },

    content: {
        paddingHorizontal: 16,
    },
});

export default styles;
