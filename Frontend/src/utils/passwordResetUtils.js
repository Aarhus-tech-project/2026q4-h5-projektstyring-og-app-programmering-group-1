// Regler der matcher backendens validering (passwordreset.ValidatePassword).

export const CODE_LENGTH = 6;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_BYTES = 72;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
    return EMAIL_PATTERN.test(email.trim());
}

// Fjerner alt andet end cifre, så en indsat kode som "123 456" eller "123-456" virker.
export function sanitizeCode(text) {
    return text.replace(/\D/g, '').slice(0, CODE_LENGTH);
}

// Antal bytes i UTF-8 (bcrypt på serveren bruger højst 72 bytes), fx "ø" = 2 bytes.
function byteLength(text) {
    let bytes = 0;
    for (const char of text) {
        const codePoint = char.codePointAt(0);
        bytes += codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : codePoint < 0x10000 ? 3 : 4;
    }
    return bytes;
}

// Returnerer en liste af krav, så skærmen kan vise hvilke der er opfyldt.
export function getPasswordRequirements(password) {
    return [
        { key: 'length', label: `Mindst ${MIN_PASSWORD_LENGTH} tegn`, met: [...password].length >= MIN_PASSWORD_LENGTH },
        { key: 'letter', label: 'Mindst ét bogstav', met: /\p{L}/u.test(password) },
        { key: 'digit', label: 'Mindst ét tal', met: /\p{Nd}/u.test(password) },
    ];
}

// Returnerer en fejlbesked, eller null hvis passwordet er gyldigt.
export function validateNewPassword(password, confirmPassword) {
    if (!password) {
        return 'Indtast et nyt password.';
    }
    if (getPasswordRequirements(password).some((requirement) => !requirement.met)) {
        return 'Password skal være mindst 8 tegn og indeholde både bogstaver og tal.';
    }
    if (byteLength(password) > MAX_PASSWORD_BYTES) {
        return 'Password er for langt.';
    }
    if (password.trim() !== password) {
        return 'Password må ikke starte eller slutte med mellemrum.';
    }
    if (password !== confirmPassword) {
        return 'De to passwords er ikke ens.';
    }
    return null;
}

// 75 -> "1:15"
export function formatCountdown(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(safe / 60);
    const rest = String(safe % 60).padStart(2, '0');
    return `${minutes}:${rest}`;
}
