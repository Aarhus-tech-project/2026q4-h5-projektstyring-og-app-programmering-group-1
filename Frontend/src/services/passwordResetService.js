import http, { getErrorMessage } from '../../http/http';

// Al verificering sker på serveren. Appen sender kun email, kode og nyt password,
// og holder reset-tokenet i hukommelsen (navigation params), aldrig i AsyncStorage.

export async function requestResetCode(email) {
    const response = await http.post('/password-reset/request', {
        email: email.trim().toLowerCase(),
    });
    return response.data.data; // { expires_in_seconds, resend_after_seconds }
}

export async function verifyResetCode(email, code) {
    const response = await http.post('/password-reset/verify', {
        email: email.trim().toLowerCase(),
        code,
    });
    return response.data.data; // { reset_token, expires_in_seconds }
}

export async function resetPassword(resetToken, password, confirmPassword) {
    await http.post('/password-reset/reset', {
        reset_token: resetToken,
        password,
        confirm_password: confirmPassword,
    });
}

const RESET_ERROR_MESSAGES = {
    invalid_email: 'Indtast en gyldig email.',
    email_not_found: 'Der findes ingen konto med denne email. Tjek at den er stavet rigtigt.',
    invalid_code: 'Koden er forkert eller udløbet. Tjek koden og prøv igen.',
    too_many_attempts: 'For mange forkerte forsøg. Send en ny kode og prøv igen.',
    invalid_reset_token: 'Din session er udløbet. Start forfra for at nulstille dit password.',
    weak_password: 'Password skal være mindst 8 tegn og indeholde både bogstaver og tal.',
    password_mismatch: 'De to passwords er ikke ens.',
};

/**
 * Laver en fejl fra password-reset endpoints om til { code, message, retryAfter }.
 * code er serverens data.error (fx 'invalid_code'), så skærmene kan reagere på den.
 */
export function getResetError(error, fallback) {
    const data = error?.response?.data?.data;
    const code = data?.error ?? null;

    if (code === 'rate_limited') {
        const retryAfter = Number(data.retry_after_seconds) || 60;
        return {
            code,
            retryAfter,
            message: `For mange forsøg. Vent ${retryAfter} sekunder og prøv igen.`,
        };
    }

    if (code && RESET_ERROR_MESSAGES[code]) {
        return { code, message: RESET_ERROR_MESSAGES[code], retryAfter: 0 };
    }

    return { code, message: getErrorMessage(error, { fallback }), retryAfter: 0 };
}
