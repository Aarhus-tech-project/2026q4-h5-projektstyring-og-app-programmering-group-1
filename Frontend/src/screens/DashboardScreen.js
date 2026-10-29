import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import {
    ChevronRight,
    Layers,
    Package,
    Plus,
    Store,
    TrendingDown,
    TriangleAlert,
    Settings,
} from 'lucide-react-native';
import styles, { dashboardColors } from '../styles/dashboardStyles';
import mockCompanies from '../data/mockCompanies';

// Set to true to preview the empty state during development
const SHOW_EMPTY_STATE = false;

const getInitials = (name) =>
    name
        .split(' ')
        .filter((word) => /^[A-Za-zÆØÅæøå]/.test(word))
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('');

export default function DashboardScreen({ navigation }) {

    const companies = SHOW_EMPTY_STATE ? [] : mockCompanies;
    const hasCompanies = companies.length > 0;

    const totalItems = companies.reduce((sum, c) => sum + c.itemCount, 0);
    const totalWarnings = companies.reduce((sum, c) => sum + c.expiringSoonCount + c.lowStockCount, 0);

    const openCompany = (company) => {
        // TODO: navigate to the company's inventory dashboard when it exists
        Alert.alert(company.name, 'Lageroversigten kommer snart.');
    };

    const addCompany = () => navigation.navigate('CompanySignup');

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <View style={styles.topBar}>
                <View style={styles.brandMark}>
                    <Text style={styles.brandMarkText}>W</Text>
                </View>

                <View style={styles.header}>
                    <Text style={styles.title} numberOfLines={1}>Mine virksomheder</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>Vælg en virksomhed for at se dit lager</Text>
                </View>

                <Pressable style={styles.avatar} onPress={() => navigation.navigate('Settings')}>
                    <Settings size={22} color={dashboardColors.text} />
                </Pressable>
            </View>

            {hasCompanies ? (
                <>
                    <ScrollView
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}>

                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Dit overblik</Text>
                            <View style={styles.summaryMain}>
                                <Layers size={34} color="#FFFFFF" />
                                <Text style={styles.summaryCount}>{companies.length}</Text>
                                <Text style={styles.summaryCountLabel}>
                                    {companies.length === 1 ? 'virksomhed' : 'virksomheder'}
                                </Text>
                            </View>

                            <View style={styles.summaryStats}>
                                <View style={styles.summaryStat}>
                                    <Package size={26} color="#FFFFFF" />
                                    <View>
                                        <Text style={styles.summaryStatValue}>{totalItems}</Text>
                                        <Text style={styles.summaryStatLabel}>varer</Text>
                                    </View>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryStat}>
                                    <TriangleAlert size={26} color="#FECACA" />
                                    <View>
                                        <Text style={styles.summaryStatValue}>{totalWarnings}</Text>
                                        <Text style={styles.summaryStatLabel}>advarsler</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.companyGrid}>
                            {companies.map((company, index) => (
                                <CompanyCard
                                    key={company.id}
                                    company={company}
                                    // An odd last card fills the whole row
                                    isFullWidth={companies.length % 2 === 1 && index === companies.length - 1}
                                    onPress={() => openCompany(company)}
                                />
                            ))}
                        </View>
                    </ScrollView>

                    <Pressable
                        style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
                        onPress={addCompany}
                        accessibilityRole="button"
                        accessibilityLabel="Tilføj virksomhed">
                        <Plus size={28} color="#FFFFFF" />
                    </Pressable>
                </>
            ) : (
                <View style={styles.emptyState}>
                    <StorefrontIllustration />
                    <Text style={styles.emptyTitle}>Ingen virksomheder endnu</Text>
                    <Text style={styles.emptyDescription}>
                        Tilføj din første virksomhed og få styr på dit lager.
                    </Text>
                    <AddCompanyButton onPress={addCompany} />
                </View>
            )}
        </SafeAreaView>
    );
}

function CompanyCard({ company, isFullWidth, onPress }) {
    const hasWarnings = company.expiringSoonCount > 0 || company.lowStockCount > 0;

    return (
        <Pressable
            style={({ pressed }) => [styles.companyCard, isFullWidth && styles.companyCardFull, pressed && styles.pressed]}
            onPress={onPress}>
            <View style={styles.companyHeader}>
                <View style={styles.initials}>
                    <Text style={styles.initialsText}>{getInitials(company.name)}</Text>
                </View>
                <ChevronRight size={20} color={dashboardColors.muted} />
            </View>

            <View>
                <Text style={styles.companyName} numberOfLines={1}>{company.name}</Text>
                <Text style={styles.companyMeta} numberOfLines={1}>{company.city} · {company.role}</Text>
            </View>

            <View style={[styles.chips, isFullWidth && styles.chipsRow]}>
                <View style={styles.chip}>
                    <Package size={18} color={dashboardColors.black} />
                    <View>
                        <Text style={styles.chipValue}>{company.itemCount}</Text>
                        <Text style={styles.chipLabel}>varer</Text>
                    </View>
                </View>

                {company.expiringSoonCount > 0 && (
                    <View style={[styles.chip, styles.warningChip]}>
                        <TriangleAlert size={18} color={dashboardColors.red} />
                        <View>
                            <Text style={[styles.chipValue, styles.warningText]}>{company.expiringSoonCount}</Text>
                            <Text style={[styles.chipLabel, styles.warningText]}>udløber snart</Text>
                        </View>
                    </View>
                )}

                {company.lowStockCount > 0 && (
                    <View style={[styles.chip, styles.warningChip]}>
                        <TrendingDown size={18} color={dashboardColors.red} />
                        <View>
                            <Text style={[styles.chipValue, styles.warningText]}>{company.lowStockCount}</Text>
                            <Text style={[styles.chipLabel, styles.warningText]}>lav beholdning</Text>
                        </View>
                    </View>
                )}

                {!hasWarnings && (
                    <View style={styles.chip}>
                        <Text style={styles.chipLabel}>Ingen advarsler</Text>
                    </View>
                )}
            </View>
        </Pressable>
    );
}

function AddCompanyButton({ onPress }) {
    return (
        <Pressable style={({ pressed }) => [styles.addButton, pressed && styles.pressed]} onPress={onPress}>
            <Plus size={22} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Tilføj virksomhed</Text>
        </Pressable>
    );
}

function StorefrontIllustration() {
    return (
        <View style={styles.illustration}>
            <View style={styles.illustrationBlob} />
            <View style={styles.sparks}>
                <View style={[styles.spark, styles.sparkLeft]} />
                <View style={styles.spark} />
                <View style={[styles.spark, styles.sparkRight]} />
            </View>
            <Store size={110} color={dashboardColors.black} strokeWidth={1.5} />
            <View style={styles.illustrationGround} />
        </View>
    );
}
