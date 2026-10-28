import { StyleSheet } from 'react-native';
import colors from '../constants/colors';


const styles = StyleSheet.create({
    safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    },

    container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 40,
    },

    logoBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    marginBottom: 1,
    },

    eyebrow: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
    },

    title: {
    color: colors.text.primary,
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 12,
    },

    description: {
    color: '#6B7280',
    fontSize: 17,
    lineHeight: 24,
    },

    buttonContainer: {
        marginTop: 24,
        marginLeft: 10,
        marginRight: 10,
        gap: 8,
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

    secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    },

    secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    },

    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },

    modalCard: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        gap: 12,

        borderWidth: 1,
        borderColor: '#D1D5DB',

        shadowColor: '#000000',
        shadowOffset: {
        width: 0,
        height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
},

    modalTitle:{
        color: '#111827',
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },

    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 16,
    },

    cancelButton: {
        alignItems: 'center',
        paddingVertical: 14,
    },

    cancelButtonText: {
        color: '#2563EB',
        fontSize: 16,
        fontWeight: '600',
    }
});


export default styles;