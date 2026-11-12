import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Building2, ChevronLeft, ChevronRight, ShieldCheck, Users } from 'lucide-react-native';
import styles, { companiesColors } from '../styles/companiesStyles';
import { getManagedCompanies } from '../services/companyService';
import { getErrorMessage } from '../../http/http';
import { getInitials } from '../utils/companyRoles';
import RoleBadge from '../components/RoleBadge';

export default function CompaniesScreen({ navigation }) {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadCompanies = useCallback(async ({ isRefresh = false } = {}) => {
        if (isRefresh) setRefreshing(true);
        setError(null);
        try {
            setCompanies(await getManagedCompanies());
        } catch (err) {
            setError(getErrorMessage(err, { fallback: 'Kunne ikke hente virksomheder.' }));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Hent igen hver gang skærmen kommer i fokus, så listen altid er opdateret
    useFocusEffect(
        useCallback(() => {
            loadCompanies();
        }, [loadCompanies])
    );

    const goBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Dashboard');
        }
    };

    const retry = () => {
        setLoading(true);
        loadCompanies();
    };

    const openCompany = (company) => {
        navigation.navigate('CompanyDetail', { companyId: company.id, companyName: company.name });
    };

    const renderContent = () => {
        if (loading) {
            return <LoadingSkeleton />;
        }

        if (error && companies.length === 0) {
            return (
                <View style={styles.centered}>
                    <Text style={styles.emptyTitle}>Noget gik galt</Text>
                    <Text style={styles.emptyDescription}>{error}</Text>
                    <Pressable
                        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                        onPress={retry}
                        accessibilityRole="button">
                        <Text style={styles.primaryButtonText}>Prøv igen</Text>
                    </Pressable>
                </View>
            );
        }

        return (
            <FlatList
                data={companies}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadCompanies({ isRefresh: true })}
                        tintColor={companiesColors.primary}
                        colors={[companiesColors.primary]}
                    />
                }
                renderItem={({ item }) => <CompanyRow company={item} onPress={() => openCompany(item)} />}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <ShieldCheck size={48} color={companiesColors.muted} strokeWidth={1.5} />
                        <Text style={styles.emptyTitle}>Ingen virksomheder at administrere</Text>
                        <Text style={styles.emptyDescription}>
                            Kun ledere kan se virksomhedens oplysninger og medarbejdere. Opret en
                            virksomhed, eller bed en leder om at give dig rollen som leder.
                        </Text>
                        <Pressable
                            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                            onPress={() => navigation.navigate('CompanySignup')}
                            accessibilityRole="button">
                            <Text style={styles.primaryButtonText}>Opret virksomhed</Text>
                        </Pressable>
                    </View>
                }
            />
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={goBack}
                    accessibilityRole="button"
                    accessibilityLabel="Tilbage">
                    <ChevronLeft size={28} color={companiesColors.text} />
                </Pressable>
                <Text style={styles.title}>Virksomheder</Text>
                <Text style={styles.subtitle}>
                    {!loading && companies.length > 0
                        ? `${companies.length} ${companies.length === 1 ? 'virksomhed' : 'virksomheder'} du administrerer`
                        : 'Virksomheder hvor du er leder'}
                </Text>
            </View>

            {renderContent()}
        </SafeAreaView>
    );
}

function CompanyRow({ company, onPress }) {
    const memberLabel = `${company.member_count} ${company.member_count === 1 ? 'medarbejder' : 'medarbejdere'}`;

    return (
        <Pressable
            style={({ pressed }) => [styles.companyCard, pressed && styles.pressed]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${company.name}. ${memberLabel}. Åbn detaljer`}>
            <View style={styles.companyInitials}>
                <Text style={styles.companyInitialsText}>{getInitials(company.name)}</Text>
            </View>

            <View style={styles.companyBody}>
                <Text style={styles.companyName} numberOfLines={1}>{company.name}</Text>
                <View style={styles.companyMetaRow}>
                    <RoleBadge role={company.role} />
                    <View style={styles.metaItem}>
                        <Users size={14} color={companiesColors.muted} />
                        <Text style={styles.companyMeta}>{memberLabel}</Text>
                    </View>
                    {!!company.cvr && (
                        <View style={styles.metaItem}>
                            <Building2 size={14} color={companiesColors.muted} />
                            <Text style={styles.companyMeta}>CVR {company.cvr}</Text>
                        </View>
                    )}
                </View>
            </View>

            <ChevronRight size={20} color={companiesColors.chevron} />
        </Pressable>
    );
}

// Grå pladsholdere i samme form som kortene, mens listen hentes
function LoadingSkeleton() {
    return (
        <View
            style={styles.listContent}
            accessibilityLabel="Henter virksomheder"
            accessibilityState={{ busy: true }}>
            {[0, 1, 2].map((key) => (
                <View key={key} style={styles.skeletonCard}>
                    <View style={[styles.skeletonBlock, { width: 46, height: 46, borderRadius: 12 }]} />
                    <View style={{ flex: 1, gap: 8 }}>
                        <View style={[styles.skeletonBlock, { width: '60%', height: 14 }]} />
                        <View style={[styles.skeletonBlock, { width: '85%', height: 12 }]} />
                    </View>
                </View>
            ))}
        </View>
    );
}
