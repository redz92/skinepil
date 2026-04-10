const { kv } = require('./_kv');
const { verifyAuth } = require('./_utils');

const KV_KEY = 'skinepil:reservations';

// Optional: Resend email notification
async function sendEmailNotification(booking) {
    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!apiKey || !adminEmail) return;

    try {
        const { Resend } = require('resend');
        const resend = new Resend(apiKey);

        await resend.emails.send({
            from: 'Skin\'Epil <onboarding@resend.dev>',
            to: adminEmail,
            subject: `Nouvelle réservation — ${booking.service}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #2C2C2C; border-bottom: 2px solid #B8977E; padding-bottom: 10px;">
                        Nouvelle réservation
                    </h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #888; width: 120px;">Client</td>
                            <td style="padding: 8px 0; font-weight: bold;">${booking.firstName} ${booking.lastName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #888;">Email</td>
                            <td style="padding: 8px 0;">${booking.email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #888;">Téléphone</td>
                            <td style="padding: 8px 0;">${booking.phone}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #888;">Prestation</td>
                            <td style="padding: 8px 0; font-weight: bold;">${booking.service}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #888;">Date</td>
                            <td style="padding: 8px 0;">${booking.date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #888;">Heure</td>
                            <td style="padding: 8px 0;">${booking.time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #888;">Prix</td>
                            <td style="padding: 8px 0; font-size: 18px; color: #B8977E;">${booking.price}€</td>
                        </tr>
                        ${booking.notes ? `<tr>
                            <td style="padding: 8px 0; color: #888;">Notes</td>
                            <td style="padding: 8px 0;">${booking.notes}</td>
                        </tr>` : ''}
                    </table>
                    <p style="margin-top: 20px; padding: 12px; background: #FFF8E1; border-radius: 6px; font-size: 14px;">
                        ⏳ Statut : <strong>En attente de confirmation</strong><br>
                        Connectez-vous au dashboard pour confirmer cette réservation.
                    </p>
                </div>
            `
        });
    } catch (err) {
        console.error('Email notification error:', err);
    }
}

module.exports = async function handler(req, res) {

    // GET — admin only: list all reservations
    if (req.method === 'GET') {
        if (!verifyAuth(req)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const reservations = await kv.get(KV_KEY) || [];
            return res.status(200).json(reservations);
        } catch (err) {
            console.error('GET reservations error:', err);
            return res.status(500).json({ error: 'Failed to load reservations' });
        }
    }

    // POST — public: create a new reservation
    if (req.method === 'POST') {
        try {
            const booking = req.body;

            // Validate required fields
            const required = ['service', 'price', 'date', 'rawDate', 'time', 'firstName', 'lastName', 'email', 'phone'];
            for (const field of required) {
                if (!booking[field]) {
                    return res.status(400).json({ error: `Missing field: ${field}` });
                }
            }

            // Add metadata
            booking.id = 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
            booking.status = 'pending';
            booking.createdAt = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

            // Save
            const reservations = await kv.get(KV_KEY) || [];
            reservations.push(booking);
            await kv.set(KV_KEY, reservations);

            // Send email notification (async, don't block response)
            sendEmailNotification(booking).catch(() => {});

            return res.status(201).json({ success: true, id: booking.id });
        } catch (err) {
            console.error('POST reservation error:', err);
            return res.status(500).json({ error: 'Failed to create reservation' });
        }
    }

    // PATCH — admin only: update reservation status
    if (req.method === 'PATCH') {
        if (!verifyAuth(req)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const { id, status } = req.body;

            if (!id || !status) {
                return res.status(400).json({ error: 'Missing id or status' });
            }

            const validStatuses = ['confirmed', 'pending', 'cancelled', 'done'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            const reservations = await kv.get(KV_KEY) || [];
            const reservation = reservations.find(r => r.id === id);

            if (!reservation) {
                return res.status(404).json({ error: 'Reservation not found' });
            }

            reservation.status = status;
            await kv.set(KV_KEY, reservations);

            return res.status(200).json({ success: true });
        } catch (err) {
            console.error('PATCH reservation error:', err);
            return res.status(500).json({ error: 'Failed to update reservation' });
        }
    }

    // DELETE — admin only: delete a reservation
    if (req.method === 'DELETE') {
        if (!verifyAuth(req)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const { id } = req.body;
            if (!id) {
                return res.status(400).json({ error: 'Missing id' });
            }

            let reservations = await kv.get(KV_KEY) || [];
            reservations = reservations.filter(r => r.id !== id);
            await kv.set(KV_KEY, reservations);

            return res.status(200).json({ success: true });
        } catch (err) {
            console.error('DELETE reservation error:', err);
            return res.status(500).json({ error: 'Failed to delete reservation' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
