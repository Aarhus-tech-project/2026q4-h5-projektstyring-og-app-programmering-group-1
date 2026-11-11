import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, FlatList, LayoutAnimation, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, ChevronLeft, Clock, Store, TrendingDown } from 'lucide-react-native';
import styles, { notificationColors } from '../styles/notificationsStyles';
import { deleteNotification, getNotifications, markNotificationRead } from '../services/notificationService';
import { getErrorMessage } from '../../http/http';
import SwipeToDelete from '../components/SwipeToDelete';

// Udseende pr. notifikationstype fra backend
const TYPE_CONFIG = {
    udloeb: {
        title: 'Udløber snart',
        Icon: Clock,
        color: notificationColors.red,
        background: notificationColors.redSoft,
    },
    lav_beholdning: {
        title: 'Lav beholdning',
        Icon: TrendingDown,
        color: notificationColors.orange,
        background: notificationColors.orangeSoft,
    },
};

const DEFAULT_TYPE = {
    title: 'Notifikation',
    Icon: Bell,
    color: notificationColors.primary,
    background: notificationColors.primarySoft,
};

const formatSentAt = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Lige nu';
    if (minutes < 60) return `${minutes} min. siden`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} t. siden`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'I går';
    if (days < 7) return `${days} dage siden`;

    return date.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
};

const setReadAt = (list, id, readAt) =>
    list.map((n) => (n.id === id ? { ...n, read_at: readAt } : n));

export default function NotificationsScreen({ navigation }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    // Lodret scroll låses mens man swiper en notifikation til siden
    const [scrollEnabled, setScrollEnabled] = useState(true);

    const unreadCount = notifications.filter((n) => !n.read_at).length;

    const loadNotifications = useCallback(async ({ isRefresh = false } = {}) => {
        if (isRefresh) setRefreshing(true);
        setError(null);
        try {
            const data = await getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(getErrorMessage(err, { fallback: 'Kunne ikke hente notifikationer.' }));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Hent igen hver gang skærmen kommer i fokus
    useFocusEffect(
        useCallback(() => {
            loadNotifications();
        }, [loadNotifications])
    );

    const goBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Dashboard');
        }
    };

    const markAsRead = async (notification) => {
        if (notification.read_at) return;

        // Markér som læst med det samme, og rul tilbage hvis serveren fejler
        setNotifications((prev) => setReadAt(prev, notification.id, new Date().toISOString()));
        try {
            await markNotificationRead(notification.id);
        } catch (err) {
            console.error('Error marking notification as read:', err);
            setNotifications((prev) => setReadAt(prev, notification.id, null));
        }
    };

    const openNotification = (notification) => {
        markAsRead(notification);

        // Åbn lageret for den virksomhed notifikationen handler om
        if (notification.company_id) {
            navigation.navigate('Inventory', {
                companyId: notification.company_id,
                companyName: notification.company_name,
            });
        }
    };

    const removeNotification = async (notification) => {
        const index = notifications.findIndex((n) => n.id === notification.id);
        if (index === -1) return;

        // Fjern med det samme, og sæt den tilbage på samme plads hvis serveren fejler
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
        try {
            await deleteNotification(notification.id);
        } catch (err) {
            console.error('Error deleting notification:', err);
            setNotifications((prev) => {
                if (prev.some((n) => n.id === notification.id)) return prev;
                const next = [...prev];
                next.splice(Math.min(index, next.length), 0, notification);
                return next;
            });
            Alert.alert('Kunne ikke slette', getErrorMessage(err, { fallback: 'Notifikationen kunne ikke slettes.' }));
        }
    };

    const retry = () => {
        setLoading(true);
        loadNotifications();
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={notificationColors.primary} />
                </View>
            );
        }

        if (error && notifications.length === 0) {
            return (
                <View style={styles.centered}>
                    <Text style={styles.emptyTitle}>Noget gik galt</Text>
                    <Text style={styles.emptyDescription}>{error}</Text>
                    <Pressable
                        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
                        onPress={retry}>
                        <Text style={styles.retryButtonText}>Prøv igen</Text>
                    </Pressable>
                </View>
            );
        }

        return (
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                scrollEnabled={scrollEnabled}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadNotifications({ isRefresh: true })}
                        tintColor={notificationColors.primary}
                        colors={[notificationColors.primary]}
                    />
                }
                renderItem={({ item }) => (
                    <SwipeToDelete
                        onDelete={() => removeNotification(item)}
                        onSwipeStart={() => setScrollEnabled(false)}
                        onSwipeEnd={() => setScrollEnabled(true)}>
                        <NotificationCard notification={item} onPress={() => openNotification(item)} />
                    </SwipeToDelete>
                )}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Bell size={48} color={notificationColors.muted} strokeWidth={1.5} />
                        <Text style={styles.emptyTitle}>Ingen notifikationer</Text>
                        <Text style={styles.emptyDescription}>
                            Du får besked her, når varer udløber snart eller har lav beholdning.
                        </Text>
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
                    <ChevronLeft size={28} color={notificationColors.text} />
                </Pressable>
                <Text style={styles.title}>Notifikationer</Text>
                {!loading && notifications.length > 0 && (
                    <Text style={styles.subtitle}>
                        {unreadCount > 0 ? `${unreadCount} ulæste` : 'Alle er læst'} • Swipe til venstre for at slette
                    </Text>
                )}
            </View>

            {renderContent()}
        </SafeAreaView>
    );
}

function NotificationCard({ notification, onPress }) {
    const config = TYPE_CONFIG[notification.type] ?? DEFAULT_TYPE;
    const { Icon } = config;
    const isUnread = !notification.read_at;
    const title = notification.item_name ? `${config.title}: ${notification.item_name}` : config.title;
    const sentAt = formatSentAt(notification.sent_at);
    const companyName = notification.company_name;

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${isUnread ? 'Ulæst. ' : ''}${companyName ? `${companyName}. ` : ''}${title}. ${notification.message ?? ''}`}>
            <View style={[styles.iconWrap, { backgroundColor: config.background }]}>
                <Icon size={20} color={config.color} />
            </View>

            <View style={styles.cardBody}>
                {/* Virksomheden står øverst, så man kan skelne når man har flere virksomheder */}
                {!!companyName && (
                    <View style={styles.companyLabel}>
                        <Store size={13} color={notificationColors.muted} />
                        <Text style={styles.companyLabelText} numberOfLines={1}>{companyName}</Text>
                    </View>
                )}
                <View style={styles.cardTop}>
                    <Text style={[styles.cardTitle, !isUnread && styles.cardTitleRead]} numberOfLines={1}>
                        {title}
                    </Text>
                    {isUnread && <View style={styles.unreadDot} />}
                </View>
                {!!notification.message && (
                    <Text style={styles.cardMessage}>{notification.message}</Text>
                )}
                {!!sentAt && <Text style={styles.cardMeta}>{sentAt}</Text>}
            </View>
        </Pressable>
    );
}
