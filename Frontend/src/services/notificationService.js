import http from '../../http/http';

function getResponseData(response) {
    const body = response.data;
    if (!body?.success) {
        throw new Error(body?.message || 'Anmodningen kunne ikke gennemføres.');
    }
    return body.data;
}

export async function getNotifications() {
    const response = await http.get('/notifications');
    return getResponseData(response);
}

export async function deleteNotification(notificationId) {
    const response = await http.delete(`/notifications/${notificationId}`);
    return getResponseData(response);
}

// "Ryd alle": hides all of the user's notifications
export async function deleteAllNotifications() {
    const response = await http.delete('/notifications');
    return getResponseData(response);
}

export async function markNotificationRead(notificationId) {
    const response = await http.patch(`/notifications/${notificationId}/read`);
    return getResponseData(response);
}
