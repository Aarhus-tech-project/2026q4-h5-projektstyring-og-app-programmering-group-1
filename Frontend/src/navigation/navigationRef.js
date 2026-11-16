import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function resetTo(screenName) {
    if (navigationRef.isReady()) {
        navigationRef.resetRoot({
            index: 0,
            routes: [{ name: screenName }],
        });
    }
}
