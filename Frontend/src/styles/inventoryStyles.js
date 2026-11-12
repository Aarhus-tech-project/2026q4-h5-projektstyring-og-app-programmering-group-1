import { StyleSheet } from 'react-native';
import colors from '../constants/colors';

export const inventoryColors = {
    background: '#F2F2F5',
    card: '#FFFFFF',
    text: '#111111',
    textSecondary: '#3F444B',
    muted: '#6B6F76',
    subtle: '#9AA1AC',
    disabled: '#C4C6CC',
    divider: '#ECECF0',
    control: '#E4E4E9',
    controlSoft: '#F2F2F5',
    // Darker than colors.primary so white text on it passes WCAG AA (4.5:1)
    primary: '#177A4F',
    primarySoft: '#E6F4EC',
    red: '#B42318',
    redSoft: '#FDECEA',
    amber: '#A15C00',
    amberSoft: '#FEF3E2',
    violet: '#6D28D9',
    violetSoft: '#EFE9FD',
    blue: colors.alternatives.blue,
};

// Colour per status tone from getItemStatus()
export const toneColors = {
    none: inventoryColors.muted,
    red: inventoryColors.red,
    amber: inventoryColors.amber,
    violet: inventoryColors.violet,
};

const CONTENT_MAX_WIDTH = 720;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: inventoryColors.background,
    },

    // Header
    header: {
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH,
        alignSelf: 'center',
        paddingTop: 4,
        paddingBottom: 12,
        gap: 12,
    },

    // Back arrow, "Lager" and the subtitle share one row to save vertical space
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 4,
        paddingRight: 16,
    },

    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    titleBlock: {
        flex: 1,
        minWidth: 0,
    },

    title: {
        color: inventoryColors.text,
        fontSize: 22,
        lineHeight: 27,
        fontWeight: '700',
        letterSpacing: -0.3,
    },

    subtitle: {
        color: inventoryColors.muted,
        fontSize: 14,
    },

    subtitleAlert: {
        color: inventoryColors.red,
        fontWeight: '600',
    },

    // Overblik / Varer switch
    tabs: {
        flexDirection: 'row',
        marginHorizontal: 16,
        padding: 3,
        gap: 2,
        borderRadius: 12,
        backgroundColor: inventoryColors.control,
    },

    tab: {
        flex: 1,
        height: 40,
        borderRadius: 9,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },

    tabActive: {
        backgroundColor: inventoryColors.card,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },

    tabText: {
        color: inventoryColors.text,
        fontSize: 15,
        fontWeight: '500',
    },

    tabTextActive: {
        fontWeight: '600',
    },

    tabCount: {
        color: inventoryColors.muted,
        fontSize: 13,
    },

    // Search + category chips (Varer tab)
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 44,
        marginHorizontal: 16,
        paddingLeft: 12,
        borderRadius: 12,
        backgroundColor: inventoryColors.control,
    },

    searchInput: {
        flex: 1,
        height: 44,
        color: inventoryColors.text,
        fontSize: 17,
    },

    clearSearchButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    chipRow: {
        paddingHorizontal: 16,
        gap: 8,
    },

    chip: {
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        justifyContent: 'center',
        backgroundColor: inventoryColors.card,
    },

    chipActive: {
        backgroundColor: inventoryColors.text,
    },

    chipText: {
        color: inventoryColors.text,
        fontSize: 15,
        fontWeight: '600',
    },

    chipTextActive: {
        color: inventoryColors.card,
    },

    // Scroll content
    content: {
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 120,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 28,
        marginHorizontal: 4,
        marginBottom: 6,
    },

    sectionTitle: {
        color: inventoryColors.muted,
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    sectionSpacing: {
        height: 22,
    },

    sectionLink: {
        color: inventoryColors.primary,
        fontSize: 15,
        fontWeight: '600',
    },

    // Grouped white block (rows share one card with thin dividers)
    group: {
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: inventoryColors.card,
    },

    groupRow: {
        backgroundColor: inventoryColors.card,
    },

    groupRowFirst: {
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
    },

    groupRowLast: {
        borderBottomLeftRadius: 14,
        borderBottomRightRadius: 14,
    },

    groupRowDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: inventoryColors.divider,
    },

    // Overblik cards
    cardGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
        marginBottom: 22,
    },

    summaryCard: {
        width: '48.3%',
        minHeight: 124,
        padding: 12,
        gap: 6,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: inventoryColors.card,
        backgroundColor: inventoryColors.card,
    },

    summaryCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    summaryIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },

    summaryCount: {
        marginTop: 2,
        fontSize: 30,
        lineHeight: 34,
        fontWeight: '700',
    },

    summaryLabel: {
        color: inventoryColors.text,
        fontSize: 15,
        fontWeight: '600',
    },

    // Item rows
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },

    thumbnail: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: inventoryColors.controlSoft,
    },

    thumbnailSmall: {
        width: 40,
        height: 40,
    },

    thumbnailDot: {
        position: 'absolute',
        top: -3,
        right: -3,
        width: 13,
        height: 13,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: inventoryColors.card,
    },

    itemRow: {
        paddingVertical: 12,
        paddingLeft: 14,
        paddingRight: 12,
        gap: 10,
    },

    itemTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },

    itemDotSlot: {
        width: 8,
        paddingTop: 7,
    },

    itemText: {
        flex: 1,
        minWidth: 0,
        gap: 1,
    },

    itemName: {
        color: inventoryColors.text,
        fontSize: 16,
        lineHeight: 21,
        fontWeight: '600',
    },

    itemStatus: {
        fontSize: 14,
        lineHeight: 18,
    },

    itemStatusStrong: {
        fontWeight: '600',
    },

    quantity: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },

    quantityValue: {
        fontSize: 18,
        lineHeight: 21,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },

    quantityMin: {
        color: inventoryColors.muted,
        fontSize: 13,
        fontWeight: '500',
    },

    itemActions: {
        flexDirection: 'row',
        gap: 8,
    },

    actionButton: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },

    useButton: {
        backgroundColor: inventoryColors.controlSoft,
    },

    receiveButton: {
        backgroundColor: inventoryColors.primarySoft,
    },

    actionText: {
        fontSize: 15,
        fontWeight: '600',
    },

    // Compact rows in the Overblik list
    overviewRow: {
        minHeight: 60,
        paddingVertical: 8,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    overviewAmount: {
        fontSize: 16,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },

    // Floating "Opret vare" button
    fab: {
        position: 'absolute',
        right: 16,
        height: 56,
        paddingLeft: 18,
        paddingRight: 22,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: inventoryColors.primary,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 9,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },

    fabText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },

    // Loading / error / empty states
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 12,
    },

    emptyBlock: {
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 4,
    },

    messageTitle: {
        color: inventoryColors.text,
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
    },

    messageText: {
        color: inventoryColors.muted,
        fontSize: 15,
        textAlign: 'center',
    },

    retryText: {
        color: inventoryColors.primary,
        fontSize: 16,
        fontWeight: '700',
    },

    pressed: {
        opacity: 0.7,
    },

    // Indkøbsliste (screen 6)
    shoppingContent: {
        paddingBottom: 24,
    },

    shoppingSection: {
        marginBottom: 22,
    },

    shoppingLine: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 64,
        paddingRight: 4,
    },

    shoppingLineMain: {
        flex: 1,
        minWidth: 0,
        minHeight: 64,
        paddingVertical: 10,
        paddingLeft: 12,
        paddingRight: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    shoppingLineReadOnly: {
        paddingLeft: 16,
    },

    lineChecked: {
        color: inventoryColors.subtle,
        textDecorationLine: 'line-through',
    },

    checkbox: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: inventoryColors.disabled,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: inventoryColors.card,
    },

    checkboxChecked: {
        borderColor: inventoryColors.primary,
        backgroundColor: inventoryColors.primary,
    },

    removeLineButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },

    addedByRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },

    avatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: inventoryColors.primarySoft,
    },

    avatarMe: {
        backgroundColor: inventoryColors.text,
    },

    avatarText: {
        color: inventoryColors.primary,
        fontSize: 9,
        fontWeight: '700',
    },

    avatarTextMe: {
        color: inventoryColors.card,
    },

    addedByText: {
        flexShrink: 1,
        color: inventoryColors.muted,
        fontSize: 13,
    },

    addedByName: {
        color: inventoryColors.textSecondary,
        fontWeight: '600',
    },

    toast: {
        minHeight: 48,
        paddingLeft: 16,
        paddingRight: 6,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        backgroundColor: '#1F2328',
    },

    toastText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 15,
    },

    toastButton: {
        height: 40,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },

    toastButtonText: {
        color: '#7DD3A8',
        fontSize: 15,
        fontWeight: '700',
    },

    footerHint: {
        color: inventoryColors.muted,
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 54,
    },

    footerNote: {
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    overviewChevron: {
        marginLeft: -2,
    },

    // Bottom sheet (item details, edit, receive)
    sheetBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(17, 17, 17, 0.45)',
    },

    sheetDismissArea: {
        flex: 1,
    },

    sheet: {
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH,
        maxHeight: '92%',
        alignSelf: 'center',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        backgroundColor: inventoryColors.background,
    },

    sheetBody: {
        flexGrow: 0,
        flexShrink: 1,
    },

    sheetContent: {
        paddingHorizontal: 16,
        gap: 20,
    },

    sheetFooter: {
        paddingTop: 12,
        paddingHorizontal: 16,
        gap: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: inventoryColors.control,
        backgroundColor: inventoryColors.background,
    },

    // Drag this area down to close the sheet (taller than the grabber, so it is easy to hit)
    sheetHandleArea: {
        paddingTop: 8,
        paddingBottom: 14,
        alignItems: 'center',
    },

    sheetGrabber: {
        width: 36,
        height: 5,
        borderRadius: 3,
        backgroundColor: inventoryColors.disabled,
    },

    sheetTitleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        paddingHorizontal: 4,
    },

    sheetImage: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: inventoryColors.card,
    },

    sheetTitle: {
        color: inventoryColors.text,
        fontSize: 24,
        lineHeight: 30,
        fontWeight: '700',
    },

    sheetNavBar: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44,
    },

    sheetNavSide: {
        width: 88,
    },

    sheetNavTitle: {
        flex: 1,
        color: inventoryColors.text,
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
    },

    sheetNavSubtitle: {
        color: inventoryColors.muted,
        fontSize: 13,
        textAlign: 'center',
    },

    sheetNavSideEnd: {
        alignItems: 'flex-end',
    },

    textButton: {
        height: 44,
        justifyContent: 'center',
    },

    textButtonStrong: {
        fontWeight: '600',
    },

    categoryRowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    newTag: {
        color: inventoryColors.primary,
        fontSize: 13,
        fontWeight: '600',
    },

    addChip: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: inventoryColors.card,
    },

    textButtonLabel: {
        color: inventoryColors.primary,
        fontSize: 17,
    },

    editPill: {
        height: 40,
        paddingLeft: 12,
        paddingRight: 14,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: inventoryColors.card,
    },

    editPillText: {
        color: inventoryColors.primary,
        fontSize: 16,
        fontWeight: '600',
    },

    infoRow: {
        minHeight: 48,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },

    infoLabel: {
        color: inventoryColors.text,
        fontSize: 16,
    },

    infoValue: {
        flexShrink: 1,
        color: inventoryColors.muted,
        fontSize: 16,
        textAlign: 'right',
    },

    infoValueLarge: {
        fontSize: 20,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },

    buttonStack: {
        gap: 8,
    },

    primaryButton: {
        height: 54,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: inventoryColors.primary,
    },

    primaryButtonDisabled: {
        backgroundColor: inventoryColors.control,
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },

    primaryButtonTextDisabled: {
        color: inventoryColors.muted,
    },

    shoppingButton: {
        minHeight: 60,
        paddingLeft: 10,
        paddingRight: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: inventoryColors.card,
    },

    shoppingIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: inventoryColors.primarySoft,
    },

    shoppingLabel: {
        flex: 1,
        color: inventoryColors.text,
        fontSize: 17,
        fontWeight: '600',
    },

    shoppingTag: {
        height: 32,
        paddingHorizontal: 12,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: inventoryColors.primary,
    },

    shoppingTagText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    listStepper: {
        height: 44,
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: inventoryColors.controlSoft,
    },

    listStepperButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    listStepperValue: {
        minWidth: 48,
        color: inventoryColors.primary,
        fontSize: 16,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
    },

    // Forms inside the sheet
    field: {
        gap: 6,
    },

    fieldLabel: {
        marginHorizontal: 4,
        color: inventoryColors.muted,
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    fieldLabelOptional: {
        fontWeight: '500',
        letterSpacing: 0,
        textTransform: 'none',
    },

    imageButton: {
        minHeight: 60,
        paddingLeft: 8,
        paddingRight: 12,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: inventoryColors.card,
    },

    imagePlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 10,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: inventoryColors.subtle,
        alignItems: 'center',
        justifyContent: 'center',
    },

    imageButtonText: {
        flex: 1,
        color: inventoryColors.primary,
        fontSize: 16,
        fontWeight: '600',
    },

    imageButtonHint: {
        color: inventoryColors.muted,
        fontSize: 13,
    },

    fieldHint: {
        marginHorizontal: 4,
        color: inventoryColors.muted,
        fontSize: 13,
    },

    fieldError: {
        marginHorizontal: 4,
        color: inventoryColors.red,
        fontSize: 14,
    },

    input: {
        height: 52,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: inventoryColors.card,
        color: inventoryColors.text,
        fontSize: 17,
    },

    inputError: {
        borderWidth: 1.5,
        borderColor: inventoryColors.red,
    },

    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },

    formChip: {
        height: 40,
        paddingHorizontal: 14,
        borderRadius: 20,
        justifyContent: 'center',
        backgroundColor: inventoryColors.card,
    },

    newChip: {
        height: 40,
        paddingLeft: 10,
        paddingRight: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: inventoryColors.subtle,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },

    newChipText: {
        color: inventoryColors.primary,
        fontSize: 15,
        fontWeight: '600',
    },

    inlineAddRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 4,
        paddingLeft: 16,
        borderRadius: 14,
        backgroundColor: inventoryColors.card,
    },

    inlineAddInput: {
        flex: 1,
        height: 44,
        color: inventoryColors.text,
        fontSize: 17,
    },

    inlineAddButton: {
        height: 44,
        paddingHorizontal: 16,
        borderRadius: 10,
        justifyContent: 'center',
        backgroundColor: inventoryColors.primary,
    },

    segmented: {
        flexDirection: 'row',
        padding: 3,
        gap: 2,
        borderRadius: 12,
        backgroundColor: inventoryColors.control,
    },

    segment: {
        flex: 1,
        height: 40,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },

    stepper: {
        height: 72,
        paddingHorizontal: 12,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: inventoryColors.card,
    },

    stepperButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: inventoryColors.controlSoft,
    },

    stepperValue: {
        color: inventoryColors.text,
        fontSize: 30,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },

    stepperUnit: {
        color: inventoryColors.muted,
        fontSize: 18,
        fontWeight: '500',
    },

    // Modtag vare
    receiveStepper: {
        height: 72,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    receiveQuantity: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        gap: 6,
    },

    receiveQuantityInput: {
        minWidth: 56,
        paddingVertical: 4,
        color: inventoryColors.text,
        fontSize: 30,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
    },

    receiveLabelRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginRight: 4,
    },

    receiveExpiryValue: {
        fontSize: 15,
        fontWeight: '600',
    },

    expiryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 8,
    },

    expiryOption: {
        width: '32%',
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: inventoryColors.card,
    },

    inlineCalendar: {
        marginTop: 4,
        padding: 8,
        borderRadius: 14,
        backgroundColor: inventoryColors.card,
    },

});

export default styles;
