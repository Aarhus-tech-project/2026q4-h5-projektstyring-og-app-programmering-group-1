import { Modal, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import styles from '../styles/loadingModalStyles';

const loadingAnimation = require('../../assets/lottieFiles/loading.json');

export default function LoadingModal({ visible, message = 'Indlæser...' }) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            // Tom funktion: brugeren skal ikke kunne lukke loading med tilbage-knappen
            onRequestClose={() => {}}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <LottieView source={loadingAnimation} autoPlay loop style={styles.animation} />
                    {message ? <Text style={styles.message}>{message}</Text> : null}
                </View>
            </View>
        </Modal>
    );
}
