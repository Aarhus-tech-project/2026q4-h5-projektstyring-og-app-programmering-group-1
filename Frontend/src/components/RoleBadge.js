import { Text, View } from 'react-native';
import styles, { roleColors } from '../styles/companiesStyles';
import { getRoleLabel } from '../utils/companyRoles';

export default function RoleBadge({ role }) {
    const colors = roleColors[role] ?? roleColors.medarbejder;

    return (
        <View style={[styles.roleBadge, { backgroundColor: colors.background }]}>
            <Text style={[styles.roleBadgeText, { color: colors.color }]}>{getRoleLabel(role)}</Text>
        </View>
    );
}
