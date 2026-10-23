import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, Text, View } from 'react-native';
import styles from '../styles/loginStyles';




export default function LoginScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.loginCard}>
                <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Tilbage</Text>
                </Pressable>

                <Text style={styles.brand}>LAGERKLAR</Text>

                <Text style={styles.welcomeText}>Velkommen tilbage</Text>

                <Text style={styles.title}> Log in på din konto</Text>
            </View>
        </SafeAreaView>
    );
}