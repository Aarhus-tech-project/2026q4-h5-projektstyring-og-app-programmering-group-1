import { Modal, Pressable, Text, View } from 'react-native';
import { AlertTriangle, CheckCircle2, Info, Trash2 } from 'lucide-react-native';
import styles, { variants } from '../styles/confirmationModalStyles';

const icons = {
    danger: Trash2,
    warning: AlertTriangle,
    status: CheckCircle2,
    alert: Info,
};

// variant: 'danger' | 'warning' | 'status' | 'alert'
export default function ConfirmationModal({
    visible,
    variant = 'alert',
    title,
    message,
    confirmText = 'Bekræft',
    cancelText = 'Annuller',
    onConfirm,
    onCancel,
    hideCancel = false,
}) {
    const theme = variants[variant] ?? variants.alert;
    const Icon = icons[variant] ?? icons.alert;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onCancel}>
            <Pressable style={styles.backdrop} onPress={onCancel}>
                {/* Pressable her stopper tryk på kortet i at lukke modalen */}
                <Pressable style={[styles.card, { borderTopColor: theme.accent }]}>
                    <View style={[styles.iconWrapper, { backgroundColor: theme.iconBackground }]}>
                        <Icon size={28} color={theme.accent} />
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    {message ? <Text style={styles.message}>{message}</Text> : null}

                    <View style={styles.actions}>
                        {!hideCancel && (
                            <Pressable
                                style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.buttonPressed]}
                                onPress={onCancel}>
                                <Text style={styles.cancelButtonText}>{cancelText}</Text>
                            </Pressable>
                        )}

                        <Pressable
                            style={({ pressed }) => [
                                styles.button,
                                { backgroundColor: theme.buttonBackground },
                                pressed && styles.buttonPressed,
                            ]}
                            onPress={onConfirm}>
                            <Text style={[styles.confirmButtonText, { color: theme.buttonText }]}>
                                {confirmText}
                            </Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
