import { useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, UserMinus, X } from 'lucide-react-native';
import sheetStyles from '../styles/invitationsModalStyles';
import styles from '../styles/memberActionsModalStyles';
import listStyles, { companiesColors, roleColors } from '../styles/companiesStyles';
import { ROLES, canPromote, canRemove, getInitials } from '../utils/companyRoles';
import useSlideUpSheet from '../hooks/useSlideUpSheet';
import RoleBadge from './RoleBadge';
import ConfirmationModal from './ConfirmationModal';
import LoadingModal from './LoadingModal';
import { getErrorMessage } from '../../http/http';


const ERROR_TEXTS = {
    promote: {
        403: 'Kun ejeren kan forfremme medarbejdere.',
        404: 'Personen er ikke længere medlem af virksomheden.',
        409: 'Personen kan ikke forfremmes. Vedkommende er måske allerede leder.',
        fallback: 'Kunne ikke forfremme medarbejderen.',
    },
    remove: {
        403: 'Du har ikke tilladelse til at fjerne denne person.',
        404: 'Personen er ikke længere medlem af virksomheden.',
        fallback: 'Kunne ikke fjerne personen fra virksomheden.',
    },
};


export default function MemberActionsModal({ visible, member, myRole, onClose, onPromote, onRemove }){
    const insets = useSafeAreaInsets();
    const { translateY, close } = useSlideUpSheet(visible, onClose);

    const [pendingAction, setPendingAction] = useState(null);
    const [isConfrimVisible, setIsConfirmVisible] = useState(false);
    const [isWorking, setIsWorking] = useState(false);
    const [actionError, setActionError] = useState('');

    const name = member?.name ?? '';
    const colors = roleColors[member?.role] ?? roleColors.medarbejder;
    const showPromote = canPromote(myRole, member?.role);
    const showRemove = canRemove(myRole, member?.role);

    const confirmConfig = {
        promote: {
            varient: 'warning',
            title: `Forfrem ${name} til leder?`,
            message: `${name} får adgang til at invitere og fjerne medarbejdere.`,
            confirmText: 'Forfrem',
        },
        remove: {
            varient: 'danger',
            title: `Fjern ${name} fra virksomheden?`,
            message:
                member?.role === ROLES.MANAGER
                    ? `${name} mister adgang til virksomheden. Invitationer sendt af ${name} annulleres også.`
                    : `${name} mister adgang til virksomheden.`,
            confirmText: 'Fjern',
        },
    }[pendingAction];

    const askConfirm = (action) => {
        setPendingAction(action);
        setIsConfirmVisible(true);
    };

    const runAction = async () => {
        setIsConfirmVisible(false);
        setIsWorking(true);

        try {
            if (pendingAction === 'promote') {
                await onPromote(member);
            } else {
                await onRemove(member);
            }
            setIsWorking(false);
            close();
        } catch (err) {
            setIsWorking(false);
            setActionError(getErrorMessage(err, ERROR_TEXTS[pendingAction]));
        }
    };


    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={close}>
            <View style={sheetStyles.backdrop}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={close}
                    accessibilityRole="button"
                    accessibilityLabel="Luk"
                />

                <Animated.View
                    style={[
                        sheetStyles.sheet,
                        { paddingBottom: insets.bottom + 16, transform: [{ translateY }] },
                    ]}>

                    <View style={sheetStyles.handle} />

                    <View style={sheetStyles.header}>
                        <Text style={sheetStyles.title} accessibilityRole="header">Handlinger</Text>
                        <Pressable
                            style={sheetStyles.closeButton}
                            onPress={close}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Luk">
                            <X size={20} color={companiesColors.text} />
                        </Pressable>
                    </View>

                    <View style={styles.content}>
                        <View style={[listStyles.memberGroup, listStyles.memberRow]}>
                            <View style={[listStyles.memberAvatar, { backgroundColor: colors.background }]}>
                                <Text style={[listStyles.memberAvartarText, { color: colors.color }]}>
                                    {getInitials(name)}
                                </Text>
                            </View>
                            <RoleBadge role={member?.role} />
                        </View>

                        <View style={styles.memberGroup}>
                            {showPromote && (
                                <ActionRow
                                    Icon={ShieldCheck}
                                    label="Forfrem til leder"
                                    description="Kan invitere og fjerne medarbejdere"
                                    isLast={!showRemove}
                                    onPress={() => askConfirm('promote')}
                                />
                            )}
                            {showRemove && (
                                <ActionRow
                                    Icon={UserMinus}
                                    label="Fjern fra virksomheden"
                                    description="Mister adgang til virksomheden"
                                    danger
                                    isLast
                                    onPress={() => askConfirm('remove')}
                                />
                            )}
                        </View>
                    </View>
                </Animated.View>
            </View>

            <ConfirmationModal
                visible={isConfrimVisible}
                variant={confirmConfig?.varient}
                title={confirmConfig?.title}
                message={confirmConfig?.message}
                confirmText={confirmConfig?.confirmText}
                onConfirm={runAction}
                onCancel={() => setIsConfirmVisible(false)}
            />

            <LoadingModal
                visible={isWorking}
                message={pendingAction === 'promote' ? 'Forfremmer...' : 'Fjerener...'}
            />

            <ConfirmationModal
                visible={!!actionError}
                variant="alert"
                title="Noget gik galt"
                message={actionError}
                confirmText="Ok"
                hideCancel
                onConfirm={() => setActionError('')}
                onCancel={() => setActionError('')}
            />

            
        </Modal>
    );
}

function ActionRow({ Icon, label, description, onPress, danger = false, isLast }){
    const iconColor = danger ? companiesColors.red : companiesColors.blue;

    return ( 
        <Pressable
            style={({ pressed }) => [
                styles.actionRow,
                !isLast && listStyles.memberDivider,
                pressed && { backgroundColor: companiesColors.graySoft },
            ]}
            onPress={onPress}
            accessibilityRole="button"

            accessibilityLabel={label}
            accessibilityHint={description}>
            <View style={[styles.actionIcon, danger ? styles.actionIconDanger : styles.actionIconPromote]}>
                <Icon size={18} color={iconColor} />
            </View>
            <View style={styles.actionBody}>
                <Text style={[styles.actionLabel, danger && styles.actionLabelDanger]}>{label}</Text>
                <Text style={styles.actionDescription}>{description}</Text>
            </View>
            </Pressable>
    );
}