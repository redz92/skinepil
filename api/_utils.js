const crypto = require('crypto');

const AUTH_SECRET = process.env.AUTH_SECRET || 'skinepil-secret-key-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'skinepil2026';

/**
 * Create a token from the admin password
 */
function createToken() {
    return crypto.createHmac('sha256', AUTH_SECRET).update(ADMIN_PASSWORD).digest('hex');
}

/**
 * Verify the Bearer token from request headers
 */
function verifyAuth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.substring(7);
    return token === createToken();
}

/**
 * Check password and return token
 */
function login(password) {
    if (password === ADMIN_PASSWORD) {
        return createToken();
    }
    return null;
}

/**
 * Default services data
 */
const DEFAULT_SERVICES = [
    { category: "Épilation — Visage (hors sourcils)", items: [
        { id: "levre-sup", name: "Lèvre supérieure", price: 5, duration: 10 },
        { id: "menton", name: "Menton", price: 5, duration: 10 },
        { id: "joues-pattes", name: "Joues / Pattes", price: 10, duration: 20 },
        { id: "cou", name: "Cou", price: 10, duration: 20 },
    ]},
    { category: "Épilation — Bras & Mains", items: [
        { id: "aisselles", name: "Aisselles", price: 10, duration: 20 },
        { id: "avant-bras", name: "Avant-bras", price: 12, duration: 15 },
        { id: "bras-complet", name: "Bras complet", price: 15, duration: 30 },
        { id: "mains-doigts", name: "Mains / Doigts", price: 5, duration: 5 },
    ]},
    { category: "Épilation — Jambes & Pieds", items: [
        { id: "demi-jambes", name: "Demi-jambes", price: 10, duration: 20 },
        { id: "jambes-completes", name: "Jambes complètes", price: 20, duration: 30 },
        { id: "cuisses", name: "Cuisses", price: 10, duration: 20 },
        { id: "pieds-orteils", name: "Pieds / Orteils", price: 5, duration: 5 },
    ]},
    { category: "Épilation — Maillots", items: [
        { id: "maillot-simple", name: "Maillot simple", price: 10, duration: 10 },
        { id: "maillot-echancre", name: "Maillot échancré", price: 15, duration: 15 },
        { id: "maillot-integral", name: "Maillot intégral", price: 20, duration: 20 },
    ]},
    { category: "Épilation — Corps", items: [
        { id: "dos", name: "Dos", price: 15, duration: 15 },
        { id: "ventre", name: "Ventre", price: 5, duration: 5 },
        { id: "fesses", name: "Fesses", price: 10, duration: 10 },
        { id: "sif", name: "SIF — Sillon interfessier", price: 5, duration: 5 },
    ]},
    { category: "Forfaits Épilation", items: [
        { id: "forfait-visage", name: "Forfait visage complet (hors sourcils)", price: 20, duration: 30 },
        { id: "forfait-demi-jambes", name: "Demi-jambes + aisselles + maillot intégral + SIF", price: 35, duration: 45 },
        { id: "forfait-jambes-completes", name: "Jambes complètes + aisselles + maillot intégral + SIF", price: 40, duration: 60 },
    ]},
    { category: "Découverte Épilation", items: [
        { id: "decouverte-maillot", name: "Découverte maillot intégral + massage cuir chevelu", price: 40, duration: 90 },
    ]},
    { category: "Soins Intimes", items: [
        { id: "vajacial", name: "Vajacial", price: 50, duration: 30 },
        { id: "booty-facial", name: "Booty Facial", price: 50, duration: 30 },
        { id: "forfait-vajacial-booty", name: "Forfait Vajacial + Booty Facial", price: 90, duration: 60 },
    ]},
    { category: "Massages", items: [
        { id: "massage-30", name: "Massage relaxant (30min)", price: 30, duration: 30 },
        { id: "massage-60", name: "Massage relaxant (1H)", price: 60, duration: 60 },
        { id: "massage-cuir-chevelu", name: "Massage du cuir chevelu (30min)", price: 30, duration: 30 },
    ]},
    { category: "Soins du Visage", items: [
        { id: "clean-express", name: "Clean Express (30min)", price: 30, duration: 30 },
        { id: "hydraskin", name: "Hydraskin (1H)", price: 55, duration: 60 },
        { id: "skin-expert", name: "Skin Expert (1H)", price: 65, duration: 60 },
    ]},
    { category: "Forfait Mariée", items: [
        { id: "forfait-mariee", name: "Forfait Mariée complet", price: 170, duration: 210 },
    ]},
];

module.exports = { verifyAuth, login, createToken, DEFAULT_SERVICES };
