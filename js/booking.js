/* ============================================
   SKIN'EPIL — Booking System
   Multi-service cart + calendar + API
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    const API = {
        services: '/api/services',
        reservations: '/api/reservations',
        blockedSlots: '/api/blocked-slots'
    };

    // --- State ---
    let allServices = [];
    let blockedSlots = [];
    let cart = []; // { id, name, price, duration }
    let selectedDate = null;
    let selectedTime = null;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    // --- DOM ---
    const steps = document.querySelectorAll('.booking-step');
    const panels = document.querySelectorAll('.booking-panel');
    const step1Container = document.getElementById('step1');
    const toStep2Btn = document.getElementById('toStep2');
    const toStep3Btn = document.getElementById('toStep3');
    const toStep4Btn = document.getElementById('toStep4');
    const backToStep1Btn = document.getElementById('backToStep1');
    const backToStep2Btn = document.getElementById('backToStep2');
    const calPrev = document.getElementById('calPrev');
    const calNext = document.getElementById('calNext');
    const calMonth = document.getElementById('calMonth');
    const calDays = document.getElementById('calDays');
    const timeSlotsContainer = document.getElementById('timeSlots');
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');

    // Computed cart values
    function cartTotal() { return cart.reduce((s, i) => s + i.price, 0); }
    function cartDuration() { return cart.reduce((s, i) => s + i.duration, 0); }
    function cartNames() { return cart.map(i => i.name).join(' + '); }

    // --- Fallback services ---
    const FALLBACK_SERVICES = [
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

    // --- Load services ---
    async function loadServices() {
        try {
            const res = await fetch(API.services);
            if (res.ok) {
                const data = await res.json();
                allServices = (Array.isArray(data) && data.length > 0) ? data : FALLBACK_SERVICES;
            } else {
                allServices = FALLBACK_SERVICES;
            }
        } catch {
            allServices = FALLBACK_SERVICES;
        }
        buildServiceList();
    }

    // --- Build service list with checkboxes ---
    function buildServiceList() {
        const existing = step1Container.querySelectorAll('.service-select-category');
        existing.forEach(el => el.remove());
        const existingCart = step1Container.querySelector('.cart-summary');
        if (existingCart) existingCart.remove();

        const bookingNav = step1Container.querySelector('.booking-nav');

        allServices.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'service-select-category';

            let html = `<h3 class="service-select-title">${escHTML(cat.category)}</h3>`;
            cat.items.forEach(item => {
                const inCart = cart.some(c => c.id === item.id);
                html += `
                    <label class="service-select-item ${inCart ? 'selected' : ''}" data-id="${escAttr(item.id)}" data-service="${escAttr(item.name)}" data-price="${item.price}" data-duration="${item.duration}">
                        <input type="checkbox" name="service" ${inCart ? 'checked' : ''}>
                        <span class="service-select-check">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                        </span>
                        <span class="service-select-name">${escHTML(item.name)}</span>
                        <span class="service-select-price">${item.price}€</span>
                    </label>`;
            });

            div.innerHTML = html;
            step1Container.insertBefore(div, bookingNav);
        });

        // Insert cart summary before nav
        const cartDiv = document.createElement('div');
        cartDiv.className = 'cart-summary';
        cartDiv.id = 'cartSummary';
        step1Container.insertBefore(cartDiv, bookingNav);
        updateCartUI();

        // Bind clicks
        step1Container.querySelectorAll('.service-select-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const id = item.dataset.id;
                const idx = cart.findIndex(c => c.id === id);

                if (idx > -1) {
                    // Remove from cart
                    cart.splice(idx, 1);
                    item.classList.remove('selected');
                    item.querySelector('input').checked = false;
                } else {
                    // Add to cart
                    cart.push({
                        id: id,
                        name: item.dataset.service,
                        price: parseFloat(item.dataset.price),
                        duration: parseInt(item.dataset.duration) || 30
                    });
                    item.classList.add('selected');
                    item.querySelector('input').checked = true;
                }

                updateCartUI();
            });
        });
    }

    function updateCartUI() {
        const cartDiv = document.getElementById('cartSummary');
        if (!cartDiv) return;

        if (cart.length === 0) {
            cartDiv.style.display = 'none';
            toStep2Btn.disabled = true;
            return;
        }

        toStep2Btn.disabled = false;
        cartDiv.style.display = 'block';

        let html = `<div class="cart-header">
            <span class="cart-title">Votre sélection</span>
            <span class="cart-count">${cart.length} prestation${cart.length > 1 ? 's' : ''}</span>
        </div>
        <div class="cart-items">`;

        cart.forEach(item => {
            html += `
                <div class="cart-item">
                    <span class="cart-item-name">${escHTML(item.name)}</span>
                    <span class="cart-item-details">${item.duration} min — ${item.price}€</span>
                    <button class="cart-item-remove" data-id="${escAttr(item.id)}" title="Retirer">×</button>
                </div>`;
        });

        html += `</div>
        <div class="cart-footer">
            <div class="cart-total-row">
                <span>Durée totale</span>
                <span class="cart-total-value">${formatDuration(cartDuration())}</span>
            </div>
            <div class="cart-total-row">
                <span>Total</span>
                <span class="cart-total-value cart-total-price">${cartTotal()}€</span>
            </div>
        </div>`;

        cartDiv.innerHTML = html;

        // Bind remove buttons
        cartDiv.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                cart = cart.filter(c => c.id !== id);
                // Uncheck the item in the list
                const label = step1Container.querySelector(`.service-select-item[data-id="${id}"]`);
                if (label) {
                    label.classList.remove('selected');
                    label.querySelector('input').checked = false;
                }
                updateCartUI();
            });
        });
    }

    function formatDuration(min) {
        if (min < 60) return min + ' min';
        const h = Math.floor(min / 60);
        const m = min % 60;
        return m > 0 ? `${h}H${String(m).padStart(2, '0')}` : `${h}H`;
    }

    function escHTML(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function escAttr(str) {
        return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // --- Load blocked slots ---
    async function loadBlockedSlots() {
        try {
            const res = await fetch(API.blockedSlots);
            if (res.ok) {
                blockedSlots = await res.json();
            }
        } catch {
            blockedSlots = [];
        }
    }

    // Init
    loadServices();
    loadBlockedSlots();

    // --- Step navigation ---
    function goToStep(stepNum) {
        steps.forEach(s => {
            const sNum = parseInt(s.dataset.step);
            s.classList.remove('active', 'completed');
            if (sNum < stepNum) s.classList.add('completed');
            if (sNum === stepNum) s.classList.add('active');
        });
        panels.forEach(p => p.classList.remove('active'));
        document.getElementById('step' + stepNum).classList.add('active');
        window.scrollTo({ top: 300, behavior: 'smooth' });
    }

    toStep2Btn.addEventListener('click', () => {
        if (cart.length > 0) { goToStep(2); renderCalendar(); }
    });
    backToStep1Btn.addEventListener('click', () => goToStep(1));

    // --- Calendar ---
    const MONTHS_FR = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    function renderCalendar() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        calMonth.textContent = MONTHS_FR[currentMonth] + ' ' + currentYear;

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const startDay = firstDay === 0 ? 6 : firstDay - 1;
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        let html = '';
        for (let i = 0; i < startDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(currentYear, currentMonth, d);
            const dateStr = date.toISOString().split('T')[0];
            const isPast = date < today;
            const isSunday = date.getDay() === 0;
            const isToday = date.getTime() === today.getTime();
            const isSelected = selectedDate &&
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear();

            // Check if full day is blocked
            const isFullDayBlocked = blockedSlots.some(s => s.date === dateStr && s.type === 'full-day');

            let classes = 'calendar-day';
            if (isPast || isSunday || isFullDayBlocked) classes += ' disabled';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            if (isFullDayBlocked) classes += ' blocked';

            html += `<button class="${classes}" data-day="${d}" ${(isPast || isSunday || isFullDayBlocked) ? 'disabled' : ''}>${d}${isFullDayBlocked ? '<span style="display:block;font-size:8px;opacity:0.6">indispo.</span>' : ''}</button>`;
        }
        calDays.innerHTML = html;

        calDays.querySelectorAll('.calendar-day:not(.disabled):not(.empty)').forEach(btn => {
            btn.addEventListener('click', () => {
                calDays.querySelectorAll('.calendar-day').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedDate = new Date(currentYear, currentMonth, parseInt(btn.dataset.day));
                showTimeSlots();
            });
        });
    }

    calPrev.addEventListener('click', () => {
        const today = new Date();
        if (currentMonth === today.getMonth() && currentYear === today.getFullYear()) return;
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar();
    });

    calNext.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar();
    });

    // --- Time slots (uses total cart duration) ---
    function showTimeSlots() {
        timeSlotsContainer.style.display = 'block';
        selectedTime = null;
        toStep3Btn.disabled = true;

        const duration = cartDuration() || 30;

        // Get blocked time slots for the selected date
        const dateStr = selectedDate.toISOString().split('T')[0];
        const blockedTimes = blockedSlots
            .filter(s => s.date === dateStr && s.type === 'slot')
            .map(s => s.time);

        const allSlots = [];
        for (let h = 9; h < 19; h++) {
            for (let m = 0; m < 60; m += 30) {
                const totalMin = h * 60 + m;
                if (totalMin >= 750 && totalMin < 840) continue;
                if (totalMin + duration > 19 * 60) continue;
                const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                // Skip blocked time slots
                if (blockedTimes.includes(time)) continue;
                allSlots.push({ time, startMin: totalMin });
            }
        }

        let html = '';
        if (allSlots.length === 0) {
            html = '<p style="text-align:center;color:var(--color-text-muted);padding:24px 0;">Aucun créneau disponible pour cette durée. Essayez une autre date.</p>';
        } else {
            allSlots.forEach(slot => {
                html += `<button class="time-slot" data-time="${slot.time}">${slot.time}</button>`;
            });
        }
        timeSlotsGrid.innerHTML = html;

        timeSlotsGrid.querySelectorAll('.time-slot').forEach(btn => {
            btn.addEventListener('click', () => {
                timeSlotsGrid.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedTime = btn.dataset.time;
                toStep3Btn.disabled = false;
            });
        });
    }

    toStep3Btn.addEventListener('click', () => {
        if (selectedDate && selectedTime) { updateSummary(); goToStep(3); }
    });
    backToStep2Btn.addEventListener('click', () => goToStep(2));

    // --- Summary ---
    function formatDateStr(date) {
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return days[date.getDay()] + ' ' + date.getDate() + ' ' + MONTHS_FR[date.getMonth()] + ' ' + date.getFullYear();
    }

    function updateSummary() {
        document.getElementById('summaryService').textContent = cartNames();
        document.getElementById('summaryDate').textContent = formatDateStr(selectedDate);
        document.getElementById('summaryTime').textContent = selectedTime;
        document.getElementById('summaryPrice').textContent = cartTotal() + '€';
    }

    // --- Submit reservation ---
    toStep4Btn.addEventListener('click', async (e) => {
        e.preventDefault();

        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();

        if (!firstName || !lastName || !email || !phone) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Veuillez entrer une adresse email valide.');
            return;
        }

        const bookingData = {
            service: cartNames(),
            services: cart.map(c => ({ name: c.name, price: c.price, duration: c.duration })),
            price: cartTotal(),
            duration: cartDuration(),
            date: formatDateStr(selectedDate),
            rawDate: selectedDate.toISOString().split('T')[0],
            time: selectedTime,
            firstName,
            lastName,
            email,
            phone,
            notes: document.getElementById('notes').value.trim()
        };

        toStep4Btn.disabled = true;
        toStep4Btn.textContent = 'Envoi en cours...';

        try {
            const res = await fetch(API.reservations, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            if (res.ok) {
                document.getElementById('confService').textContent = cartNames();
                document.getElementById('confDate').textContent = formatDateStr(selectedDate);
                document.getElementById('confTime').textContent = selectedTime;
                document.getElementById('confPrice').textContent = cartTotal() + '€';
                goToStep(4);
            } else {
                alert('Une erreur est survenue. Veuillez réessayer.');
            }
        } catch {
            alert('Erreur de connexion. Vérifiez votre connexion internet.');
        }

        toStep4Btn.disabled = false;
        toStep4Btn.textContent = 'Confirmer la réservation';
    });

});
