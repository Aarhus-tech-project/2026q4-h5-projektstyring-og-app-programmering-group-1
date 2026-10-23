import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    safeArea: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F6F7FB',
    },

    loginCard: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    },

    brand: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 40,
    },

    welcomeText: {
    color: '#374151',
    fontSize: 16,
    marginBottom: 8,
    },

    title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    },

    backButton: {
    alignSelf: 'flex-start',
    marginBottom: 24,
    },

    backButtonText: {
        color: '#2563EB',
        fontSize: 16,
        fontWeight: '600',
    }
});

export default styles;