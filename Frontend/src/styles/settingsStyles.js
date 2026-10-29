import { StyleSheet } from 'react-native';
import colors from '../constants/colors';

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F6F8',
    },

    header: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 8,
    },

    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 8,
    },

    title: {
        color: '#111827',
        fontSize: 26,
        fontWeight: '600',
    },

    content: {
        padding: 16,
        gap: 20,
    },

    groupTitle: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
        marginLeft: 4,
    },

    group: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        overflow: 'hidden',

        shadowColor: '#111827',
        shadowOffset: {
        width: 0,
        height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 15,
    },

    rowDivider: {
        borderBottomWidth: 1,
        borderBottomColor: '#F0F1F3',
    },

    rowPressed: {
        backgroundColor: '#F9FAFB',
    },

    rowLabel: {
        color: '#1F2937',
        fontSize: 15,
    },

    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexShrink: 1,
        marginLeft: 12,
    },

    rowValue: {
        color: colors.text.muted,
        fontSize: 14,
        flexShrink: 1,
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,

        shadowColor: '#111827',
        shadowOffset: {
        width: 0,
        height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },

    cardTitle: {
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },

    label: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },

    spacedLabel: {
        marginTop: 16,
    },

    input: {
        width: '100%',
        height: 52,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 14,
        fontSize: 16,
        color: '#111827',
        backgroundColor: '#FFFFFF',
        marginBottom: 12,
    },

    businessRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        marginBottom: 8,
    },

    businessRowActive: {
        borderColor: colors.primary,
        backgroundColor: '#ECFDF5',
    },

    businessName: {
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: '600',
    },

    addRow: {
        flexDirection: 'row',
        gap: 8,
    },

    addInput: {
        flex: 1,
        width: undefined,
        marginBottom: 0,
    },

    addButton: {
        width: 52,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: 12,
    },

    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 12,
    },

    settingText: {
        flex: 1,
    },

    settingTitle: {
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: '600',
    },

    settingDescription: {
        color: colors.text.muted,
        fontSize: 13,
        marginTop: 2,
    },

    disabled: {
        opacity: 0.4,
    },

    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    stepperButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
    },

    stepperValue: {
        minWidth: 72,
        textAlign: 'center',
        color: colors.text.primary,
        fontSize: 15,
        fontWeight: '700',
    },

    logoutButton: {
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        paddingVertical: 16,
    },

    logoutButtonText: {
        color: '#B91C1C',
        fontSize: 16,
        fontWeight: '700',
    },

    footer: {
        padding: 16,
        backgroundColor: '#F5F6F8',
    },

    saveButton: {
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
    },

    saveButtonDisabled: {
        opacity: 0.5,
    },

    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default styles;
