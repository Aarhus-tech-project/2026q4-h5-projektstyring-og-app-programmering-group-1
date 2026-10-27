import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Building2,
    ChevronRight,
    LogOut,
    Settings,
    UserRound,
} from 'lucide-react-native';

import colors from '../constants/colors';
import styles from '../styles/ProfileStyles';

function ProfileOption({ icon, title, onPress, danger = false }) {
    return (
        <Pressable style={styles.option} onPress={onPress}>
            <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                    {icon}
                </View>

                <Text style={danger ? styles.dangerText : styles.optionText}>
                    {title}
                </Text>
            </View>

            <ChevronRight
            size={20}
            color={danger ? '#FCA5A5' : '#9CA3AF'}
            />
        </Pressable>
    );
}

export default function ProfileScreen({ navigation }) {
    
}