import { useState, useEffect, useCallback, useRef } from "react";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import {
    ChevronRight,
    Clock,
    Layers,
    Package,
    PackageX,
    Plus,
    Store,
    TrendingDown,
    TriangleAlert,
    Bell,
} from 'lucide-react-native';
import styles, { dashboardColors } from '../styles/dashboardStyles';
import { useAuth } from '../AuthContext/AuthContext';
import http from "../../http/http";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getInventoryItems } from "../services/inventoryService";
import { FILTERS, getInventoryCounts } from "../utils/inventoryUtils";
import { getNotifications } from "../services/notificationService";
import { SaveExpoToken, getNotificationPermission } from "../utils/notificationUtils";

import ConfirmationModal from '../components/ConfirmationModal';
import LoadingModal from '../components/LoadingModal';

const getInitials = (name) =>
    name
        .split(' ')
        .filter((word) => /^[A-Za-zÆØÅæøå]/.test(word))
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('');

export default function DashboardScreen() {

    const { setCompanies, companies, user, avatarSource } = useAuth();
    // Gemmer den uri der fejlede, så et nyt billede (ny uri) prøves igen automatisk
    const [failedAvatarUri, setFailedAvatarUri] = useState(null);
    const showAvatarImage = avatarSource && avatarSource.uri !== failedAvatarUri;
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const hasCompanies = companies.length > 0;
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);

    const [askNotifications, setAskNotifications] = useState(false);

    // Lagertal pr. virksomhed, hentet fra databasen: { [companyId]: { itemCount, expiringSoonCount, lowStockCount, outOfStockCount } }
    const [stats, setStats] = useState({});
    const [loadingStats, setLoadingStats] = useState(false);
    const hasLoadedStats = useRef(false);

    const loadStats = useCallback(async () => {
        if (companies.length === 0) {
            setStats({});
            return;
        }

        // Loading-modal kun ved første hentning; senere opdateringer sker i baggrunden
        if (!hasLoadedStats.current) setLoadingStats(true);
        try {
            const results = await Promise.all(
                companies.map(async (company) => {
                    try {
                        const items = await getInventoryItems(company.id);
                        const counts = getInventoryCounts(items);
                        return [company.id, {
                            itemCount: items.length,
                            expiringSoonCount: counts[FILTERS.EXPIRING],
                            // Split like the Lager screen: low stock (amber) and out of stock (red)
                            lowStockCount: counts[FILTERS.LOW],
                            outOfStockCount: counts[FILTERS.OUT],
                        }];
                    } catch (error) {
                        console.error(`Error loading inventory for company ${company.id}:`, error);
                        return [company.id, null];
                    }
                })
            );
            setStats(Object.fromEntries(results.filter(([, value]) => value)));
            hasLoadedStats.current = true;
        } finally {
            setLoadingStats(false);
        }
    }, [companies]);

    // Hent igen hver gang dashboardet får fokus, så tallene er opdaterede efter ændringer i lageret
    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [loadStats])
    );

    // Antal ulæste notifikationer til badget på klokken
    const [unreadCount, setUnreadCount] = useState(0);

    const loadUnreadCount = useCallback(async () => {
        try {
            const data = await getNotifications();
            setUnreadCount(Array.isArray(data) ? data.filter((n) => !n.read_at).length : 0);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }, []);

    // Opdatér når man kommer tilbage fra notifikationsskærmen
    useFocusEffect(
        useCallback(() => {
            loadUnreadCount();
        }, [loadUnreadCount])
    );

    const companiesWithStats = companies.map((c) => ({ ...c, ...stats[c.id] }));
    const totalItems = companiesWithStats.reduce((sum, c) => sum + (c.itemCount ?? 0), 0);
    const totalWarnings = companiesWithStats.reduce(
        (sum, c) => sum + (c.expiringSoonCount ?? 0) + (c.lowStockCount ?? 0) + (c.outOfStockCount ?? 0),
        0
    );


    useEffect(() => {
        (async () => {
            const permission = await getNotificationPermission();
            if (permission === "granted") return SaveExpoToken(user?.id);
            if (permission === "undetermined") setAskNotifications(true);
        })();
    }, [user?.id]);


    const enableNotifications = useCallback(() => {
        setAskNotifications(false);
        SaveExpoToken(user?.id, { force: true });
    }, [user?.id]);


    const openCompany = (company) => {
        // TODO: navigate to the company's inventory dashboard when it exists
        if (!company) return;
        setSelectedCompany(company);
        navigation.navigate('Inventory', { companyId: company.id, companyName: company.name });
    };

    const addCompany = () => navigation.navigate('CompanySignup');



    const handleDeleteCompany = async () => {
        if (!selectedCompany) return;
        setLoading(true);
        try {
            const res = await http.delete(`/company/${selectedCompany.id}/userID=${user.id}`);
            if(res.data.success) {
                setCompanies(res.data.data);
                setModalVisible(false);
                setSelectedCompany(null);
            }

        } catch (error) {
            console.error('Error deleting company:', error);
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.brandMark} onPress={() => navigation.navigate('Settings')}
                    accessibilityRole="button"
                    accessibilityLabel="Indstillinger">
                    {showAvatarImage ? (
                        <Image
                            key={avatarSource.uri}
                            source={avatarSource}
                            style={styles.brandMarkImage}
                            contentFit="cover"
                            cachePolicy="memory"
                            onError={() => setFailedAvatarUri(avatarSource.uri)}
                        />
                    ) : (
                        <Text style={styles.brandMarkText}>{getInitials(user?.name || '')}</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title} numberOfLines={1}>Mine virksomheder</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>Vælg en virksomhed for at se dit lager</Text>
                </View>

                <Pressable
                    style={styles.avatar}
                    onPress={() => navigation.navigate('Notifications')}
                    accessibilityRole="button"
                    accessibilityLabel={unreadCount > 0 ? `Notifikationer, ${unreadCount} ulæste` : 'Notifikationer'}>
                    <Bell size={22} color={dashboardColors.text} />
                    {unreadCount > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationBadgeText}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {hasCompanies ? (
                <>
                    <ScrollView
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}>

                        <Pressable
                            style={({ pressed }) => [styles.summaryCard, pressed && styles.pressed]}
                            onPress={() => navigation.navigate('Companies')}
                            accessibilityRole="button"
                            accessibilityLabel={`Dit overblik: ${companies.length} ${companies.length === 1 ? 'virksomhed' : 'virksomheder'}, ${totalItems} varer, ${totalWarnings} advarsler. Åbn virksomheder`}>
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
                        </Pressable>

                        <View style={styles.companyGrid}>
                            {companiesWithStats.map((company, index) => (
                                <CompanyCard
                                    key={company.id}
                                    company={company}
                                    // An odd last card fills the whole row
                                    isFullWidth={companies.length % 2 === 1 && index === companies.length - 1}
                                    onPress={() => openCompany(company)}
                                    onLongPress={() => setModalVisible(true)}
                                    onSelect={() => setSelectedCompany(company)}
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
            

            <ConfirmationModal
                visible={modalVisible}
                variant="danger"
                title="Slet virksomhed"
                message="Er du sikker på, at du vil slette denne virksomhed? Denne handling kan ikke fortrydes."
                confirmText="Slet"
                cancelText="Annuller"
                onConfirm={() => {
                    handleDeleteCompany();
                }}
                onCancel={() => setModalVisible(false)}
            />

            <ConfirmationModal
                visible={askNotifications}
                title="Slå notifikationer til"
                message="Vil du have besked, når varer udløber snart eller har lav beholdning?"
                confirmText="Tillad"
                cancelText="Ikke nu"
                onConfirm={enableNotifications}
                onCancel={() => setAskNotifications(false)}
            />

            <LoadingModal visible={loading} message="Sletter virksomhed..." />
            <LoadingModal visible={loadingStats && !loading} message="Henter varer..." />
        </SafeAreaView>
    );
}

function CompanyCard({ company, isFullWidth, onPress, onLongPress, onSelect }) {
    const hasWarnings = company.expiringSoonCount > 0 || company.lowStockCount > 0 || company.outOfStockCount > 0;

    return (
        <Pressable
            style={({ pressed }) => [styles.companyCard, isFullWidth && styles.companyCardFull, pressed && styles.pressed]}
            onLongPress={onLongPress}
            onPress={onPress}
            onPressIn={onSelect}>
            <View style={styles.companyHeader}>
                <View style={styles.initials}>
                    <Text style={styles.initialsText}>{getInitials(company.name)}</Text>
                </View>
                <ChevronRight size={20} color={dashboardColors.muted} />
            </View>

            <View>
                <Text style={styles.companyName} numberOfLines={1}>{company.name}</Text>
                <Text style={styles.companyMeta} numberOfLines={1}>{company.role} • {company?.created_at ? new Date(company.created_at).toLocaleDateString() : ''}</Text>
            </View>

            <View style={[styles.chips, isFullWidth && styles.chipsRow]}>
                <View style={styles.chip}>
                    <Package size={18} color={dashboardColors.black} />
                    <View>
                        <Text style={styles.chipValue}>{company.itemCount ?? 0}</Text>
                        <Text style={styles.chipLabel}>varer</Text>
                    </View>
                </View>

                {/* Same colours and icons as the cards on the Lager screen */}
                {company.expiringSoonCount > 0 && (
                    <View style={[styles.chip, styles.expiringChip]}>
                        <Clock size={18} color={dashboardColors.violet} />
                        <View>
                            <Text style={[styles.chipValue, styles.expiringText]}>{company.expiringSoonCount}</Text>
                            <Text style={[styles.chipLabel, styles.expiringText]}>udløber snart</Text>
                        </View>
                    </View>
                )}

                {company.lowStockCount > 0 && (
                    <View style={[styles.chip, styles.lowStockChip]}>
                        <TrendingDown size={18} color={dashboardColors.amber} />
                        <View>
                            <Text style={[styles.chipValue, styles.lowStockText]}>{company.lowStockCount}</Text>
                            <Text style={[styles.chipLabel, styles.lowStockText]}>lav beholdning</Text>
                        </View>
                    </View>
                )}

                {company.outOfStockCount > 0 && (
                    <View style={[styles.chip, styles.outOfStockChip]}>
                        <PackageX size={18} color={dashboardColors.red} />
                        <View>
                            <Text style={[styles.chipValue, styles.outOfStockText]}>{company.outOfStockCount}</Text>
                            <Text style={[styles.chipLabel, styles.outOfStockText]}>ikke på lager</Text>
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
