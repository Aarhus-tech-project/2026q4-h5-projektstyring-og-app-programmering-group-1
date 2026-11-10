import { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import {
    ChevronRight,
    Layers,
    Package,
    Plus,
    Store,
    TrendingDown,
    TriangleAlert,
    Bell,
} from 'lucide-react-native';
import styles, { dashboardColors } from '../styles/dashboardStyles';
import { useAuth } from '../AuthContext/AuthContext';
import http from "../../http/http";
import { useNavigation } from "@react-navigation/native";
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

    // Inventory counts are not sent by the backend yet, so missing ones count as 0
    const totalItems = companies.reduce((sum, c) => sum + (c.itemCount ?? 0), 0);
    const totalWarnings = companies.reduce((sum, c) => sum + (c.expiringSoonCount ?? 0) + (c.lowStockCount ?? 0), 0);


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
                    accessibilityLabel="Notifikationer">
                    <Bell size={22} color={dashboardColors.text} />
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
        </SafeAreaView>
    );
}

function CompanyCard({ company, isFullWidth, onPress, onLongPress, onSelect }) {
    const hasWarnings = company.expiringSoonCount > 0 || company.lowStockCount > 0;

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
