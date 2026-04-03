/* ============================================
   SKIN'EPIL — Booking System
   Reads services from API, posts reservations to API
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    const API = {
        services: '/api/services',
        reservations: '/api/reservations'
    };

    // --- State ---
    let allServices = [];
    let selectedService = null;
    let selectedPrice = null;
    let selectedDuration = null;
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

    // --- Fallback services (used when API is unavailable) ---
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

    // --- Load services from API (fallback to local data) ---
    async function loadServices() {
        try {
            const res = await fetch(API.services);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    allServices = data;
                } else {
                    allServices = FALLBACK_SERVICES;
                }
            } else {
                allServices = FALLBACK_SERVICES;
            }
        } catch {
            allServices = FALLBACK_SERVICES;
        }
        buildServiceList();
    }

    // --- Build service list dynamically ---
    function buildServiceList() {
        const existing = step1Container.querySelectorAll('.service-select-category');
        existing.forEach(el => el.remove());

        const bookingNav = step1Container.querySelector('.booking-nav');

        allServices.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'service-select-category';

            let html = `<h3 class="service-select-title">${escHTML(cat.category)}</h3>`;
            cat.items.forEach(item => {
                html += `
                    <label class="service-select-item" data-service="${escAttr(item.name)}" data-price="${item.price}" data-duration="${item.duration}">
                        <input type="radio" name="service">
                        <span class="service-select-name">${escHTML(item.name)}</span>
                        <span class="service-select-price">${item.price}€</span>
                    </label>`;
            });

            div.innerHTML = html;
            step1Container.insertBefore(div, bookingNav);
        });

        // Bind clicks
        step1Container.querySelectorAll('.service-select-item').forEach(item => {
            item.addEventListener('click', () => {
                step1Container.querySelectorAll('.service-select-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                item.querySelector('input[type="radio"]').checked = true;
                selectedService = item.dataset.service;
                selectedPrice = item.dataset.price;
                selectedDuration = parseInt(item.dataset.duration) || 30;
                toStep2Btn.disabled = false;
            });
        });
    }

    function escHTML(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function escAttr(str) {
        return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Init
    loadServices();

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
        if (selectedService) { goToStep(2); renderCalendar(); }
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
            const isPast = date < today;
            const isSunday = date.getDay() === 0;
            const isToday = date.getTime() === today.getTime();
            const isSelected = selectedDate &&
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear();

            let classes = 'calendar-day';
            if (isPast || isSunday) classes += ' disabled';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';

            html += `<button class="${classes}" data-day="${d}" ${(isPast || isSunday) ? 'disabled' : ''}>${d}</button>`;
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

    // --- Time slots ---
    function showTimeSlots() {
        timeSlotsContainer.style.display = 'block';
        selectedTime = null;
        toStep3Btn.disabled = true;

        const duration = selectedDuration || 30;

        // Generate possible start times (9:00-19:00, every 30 min)
        const allSlots = [];
        for (let h = 9; h < 19; h++) {
            for (let m = 0; m < 60; m += 30) {
                const totalMin = h * 60 + m;
                if (totalMin >= 750 && totalMin < 840) continue; // skip 12:30-14:00 lunch
                if (totalMin + duration > 19 * 60) continue; // must fit before closing
                allSlots.push({
                    time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
                    startMin: totalMin
                });
            }
        }

        let html = '';
        if (allSlots.length === 0) {
            html = '<p style="text-align:center;color:var(--color-text-muted);padding:24px 0;">Aucun créneau disponible. Essayez une autre date.</p>';
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
    function formatDate(date) {
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return days[date.getDay()] + ' ' + date.getDate() + ' ' + MONTHS_FR[date.getMonth()] + ' ' + date.getFullYear();
    }

    function updateSummary() {
        document.getElementById('summaryService').textContent = selectedService;
        document.getElementById('summaryDate').textContent = formatDate(selectedDate);
        document.getElementById('summaryTime').textContent = selectedTime;
        document.getElementById('summaryPrice').textContent = selectedPrice + '€';
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
            service: selectedService,
            price: selectedPrice,
            duration: selectedDuration || 30,
            date: formatDate(selectedDate),
            rawDate: selectedDate.toISOString().split('T')[0],
            time: selectedTime,
            firstName,
            lastName,
            email,
            phone,
            notes: document.getElementById('notes').value.trim()
        };

        // Disable button during submission
        toStep4Btn.disabled = true;
        toStep4Btn.textContent = 'Envoi en cours...';

        try {
            const res = await fetch(API.reservations, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            if (res.ok) {
                document.getElementById('confService').textContent = selectedService;
                document.getElementById('confDate').textContent = formatDate(selectedDate);
                document.getElementById('confTime').textContent = selectedTime;
                document.getElementById('confPrice').textContent = selectedPrice + '€';
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
