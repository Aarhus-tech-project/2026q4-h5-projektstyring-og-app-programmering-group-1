import { useMemo } from 'react';
import http from '../../../http/http';
import { useAuth } from '../../AuthContext/AuthContext';

// imageUrl from the API is a path like "/companies/<id>/items/<id>/image?v=123".
// The image endpoint needs the login token, so it is sent as a header (same as the avatar).
export default function useItemImageSource(imageUrl) {
    const { token } = useAuth();

    return useMemo(() => {
        if (!imageUrl || !token) return null;

        return {
            uri: `${http.defaults.baseURL}${imageUrl}`,
            headers: { Authorization: `Bearer ${token}` },
        };
    }, [imageUrl, token]);
}
