import { View } from 'react-native';
import { Image } from 'expo-image';
import styles, { toneColors } from '../../styles/inventoryStyles';
import { STATUS_TONES } from '../../utils/inventoryUtils';

// Shows the item's photo (if it has one) with the status dot in the corner,
// otherwise just the small status dot. Items without a problem get no dot.
export default function InventoryItemMarker({ imageUrl, tone, small = false }) {
    const hasDot = tone !== STATUS_TONES.NONE;
    const dotColor = { backgroundColor: toneColors[tone] };

    if (imageUrl) {
        return (
            <View>
                <Image
                    source={{ uri: imageUrl }}
                    style={[styles.thumbnail, small && styles.thumbnailSmall]}
                    contentFit="cover"
                    accessibilityIgnoresInvertColors
                />
                {hasDot && <View style={[styles.thumbnailDot, dotColor]} />}
            </View>
        );
    }

    return <View style={[styles.statusDot, hasDot ? dotColor : null]} />;
}
