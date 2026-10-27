import { SafeAreaView } from 'react-native-safe-area-context';
import {  Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import styles from '../styles/homeStyles';
import { Package } from 'lucide-react-native';
export default function HomeScreen({ navigation }) {

    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <View>
                        <View style={styles.logoBox}>
                            <Package size={64} color="#FFFFFF" strokeWidth={2.5} />
                        </View>
                        <Text style={styles.eyebrow}>LAGERKLAR</Text>
                        <Text style={styles.title}>velkommen</Text>
                        <Text style={styles.description}>
                            Hold øje med dit lager, og få besked når det er tid til at bestille mere.
                        </Text>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.primaryButtonText}>
                                Log in
                            </Text>
                        </Pressable>
                </View>

                <View style={styles.buttonContainer}>
                    <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Settings')}>
                            <Text style={styles.secondaryButtonText}>indstillinger</Text>
                    </Pressable>
                </View>
            </SafeAreaView>

        </>
    )
}