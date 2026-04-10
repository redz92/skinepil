/* ============================================
   SKIN'EPIL — Admin Dashboard
   Uses Vercel API backend
   ============================================ */

(function () {

    const API = {
        auth: '/api/auth',
        services: '/api/services',
        reservations: '/api/reservations',
        blockedSlots: '/api/blocked-slots'
    };

    let authToken = null;

    function headers() {
        return {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        };
    }

    // ============================
    // Auth
    // ============================
    const loginPage = document.getElementById('loginPage');
    const dashboard = document.getElementById('dashboard');
    const loginBtn = document.getElementById('loginBtn');
    const loginPassword = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    function checkAuth() {
        const stored = sessionStorage.getItem('skinepil_token');
        if (stored) {
            authToken = stored;
            showDashboard();
        }
    }

    async function showDashboard() {
        loginPage.style.display = 'none';
        dashboard.style.display = 'grid';
        await Promise.all([loadReservations(), loadServices(), loadBlockedSlots()]);
    }

    loginBtn.addEventListener('click', doLogin);
    loginPassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doLogin();
    });

    async function doLogin() {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Connexion...';

        try {
            const res = await fetch(API.auth, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: loginPassword.value })
            });

            if (res.ok) {
                const data = await res.json();
                authToken = data.token;
                sessionStorage.setItem('skinepil_token', authToken);
                loginError.style.display = 'none';
                showDashboard();
            } else {
                loginError.style.display = 'block';
                loginPassword.value = '';
                loginPassword.focus();
            }
        } catch (err) {
            loginError.textContent = 'Erreur de connexion au serveur';
            loginError.style.display = 'block';
        }

        loginBtn.disabled = false;
        loginBtn.textContent = 'Se connecter';
    }

    logoutBtn.addEventListener('click', () => {
        authToken = null;
        sessionStorage.removeItem('skinepil_token');
        dashboard.style.display = 'none';
        loginPage.style.display = 'flex';
        loginPassword.value = '';
        loginPassword.focus();
    });

    // ============================
    // View Switching
    // ============================
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-view]');
    const viewTitle = document.getElementById('viewTitle');
    const VIEW_TITLES = { reservations: 'Réservations', agenda: 'Agenda', services: 'Prestations' };

    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            const view = link.dataset.view;
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.querySelectorAll('[id^="view-"]').forEach(v => v.style.display = 'none');
            document.getElementById('view-' + view).style.display = 'block';
            viewTitle.textContent = VIEW_TITLES[view] || '';
        });
    });

    // ============================
    // Reservations
    // ============================
    let allReservations = [];
    let currentFilter = 'all';
    const reservationsBody = document.getElementById('reservationsBody');
    const emptyReservations = document.getElementById('emptyReservations');
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderReservations();
        });
    });

    async function loadReservations() {
        try {
            const res = await fetch(API.reservations, { headers: headers() });
            if (res.ok) {
                allReservations = await res.json();
            } else {
                allReservations = [];
            }
        } catch {
            allReservations = [];
        }
        renderReservations();
        updateStats();
    }

    function renderReservations() {
        let filtered = [...allReservations];

        // Sort by date descending
        filtered.sort((a, b) => {
            const da = new Date(a.rawDate + 'T' + (a.time || '00:00'));
            const db = new Date(b.rawDate + 'T' + (b.time || '00:00'));
            return db - da;
        });

        if (currentFilter !== 'all') {
            filtered = filtered.filter(r => r.status === currentFilter);
        }

        if (filtered.length === 0) {
            reservationsBody.innerHTML = '';
            emptyReservations.style.display = 'block';
            document.querySelector('#view-reservations table').style.display = 'none';
            return;
        }

        emptyReservations.style.display = 'none';
        document.querySelector('#view-reservations table').style.display = 'table';

        const statusLabels = {
            confirmed: 'Confirmée',
            pending: 'En attente',
            cancelled: 'Annulée',
            done: 'Terminée'
        };

        reservationsBody.innerHTML = filtered.map(r => `
            <tr>
                <td>
                    <strong>${esc(r.firstName)} ${esc(r.lastName)}</strong><br>
                    <span style="font-size:12px;color:var(--color-text-muted)">${esc(r.email)}</span>
                </td>
                <td>${esc(r.service)}</td>
                <td>${esc(r.date)}</td>
                <td>${esc(r.time)}</td>
                <td style="font-family:var(--font-serif);font-size:18px">${esc(String(r.price))}€</td>
                <td><span class="badge badge-${r.status}">${statusLabels[r.status] || r.status}</span></td>
                <td>
                    <div class="td-actions">
                        <button class="action-btn" data-action="detail" data-id="${esc(r.id)}" title="Détails">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                        </button>
                        ${r.status === 'pending' ? `
                        <button class="action-btn confirm" data-action="confirm" data-id="${esc(r.id)}" title="Confirmer">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                        </button>` : ''}
                        ${r.status !== 'cancelled' ? `
                        <button class="action-btn danger" data-action="cancel" data-id="${esc(r.id)}" title="Annuler">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        // Bind action buttons
        reservationsBody.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const action = btn.dataset.action;
                if (action === 'detail') viewDetail(id);
                if (action === 'confirm') updateStatus(id, 'confirmed');
                if (action === 'cancel') {
                    if (confirm('Annuler cette réservation ?')) updateStatus(id, 'cancelled');
                }
            });
        });
    }

    // Escape HTML to prevent XSS
    function esc(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    async function updateStatus(id, status) {
        try {
            const res = await fetch(API.reservations, {
                method: 'PATCH',
                headers: headers(),
                body: JSON.stringify({ id, status })
            });
            if (res.ok) {
                const r = allReservations.find(x => x.id === id);
                if (r) r.status = status;
                renderReservations();
                updateStats();
            }
        } catch (err) {
            alert('Erreur lors de la mise à jour');
        }
    }

    function viewDetail(id) {
        const r = allReservations.find(x => x.id === id);
        if (!r) return;

        const statusLabels = {
            confirmed: 'Confirmée', pending: 'En attente',
            cancelled: 'Annulée', done: 'Terminée'
        };

        document.getElementById('modalBody').innerHTML = `
            <div class="detail-row"><span class="detail-label">Client</span><span class="detail-value">${esc(r.firstName)} ${esc(r.lastName)}</span></div>
            <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${esc(r.email)}</span></div>
            <div class="detail-row"><span class="detail-label">Téléphone</span><span class="detail-value">${esc(r.phone)}</span></div>
            <div class="detail-row"><span class="detail-label">Prestation</span><span class="detail-value">${esc(r.service)}</span></div>
            <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${esc(r.date)}</span></div>
            <div class="detail-row"><span class="detail-label">Heure</span><span class="detail-value">${esc(r.time)}</span></div>
            <div class="detail-row"><span class="detail-label">Prix</span><span class="detail-value" style="font-family:var(--font-serif);font-size:20px">${esc(String(r.price))}€</span></div>
            <div class="detail-row"><span class="detail-label">Statut</span><span class="detail-value"><span class="badge badge-${r.status}">${statusLabels[r.status]}</span></span></div>
            ${r.notes ? `<div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">${esc(r.notes)}</span></div>` : ''}
            <div class="detail-row"><span class="detail-label">Réservé le</span><span class="detail-value">${esc(r.createdAt || '—')}</span></div>
        `;

        let footerHTML = '';
        if (r.status === 'pending') {
            footerHTML += `<button class="btn btn-primary" style="padding:10px 24px;font-size:11px;background:#2E7D32;border-color:#2E7D32" data-modal-action="confirmed">Confirmer</button>`;
        }
        if (r.status === 'confirmed') {
            footerHTML += `<button class="btn btn-primary" style="padding:10px 24px;font-size:11px;" data-modal-action="done">Marquer terminée</button>`;
        }
        if (r.status !== 'cancelled') {
            footerHTML += `<button class="btn btn-outline" style="padding:10px 24px;font-size:11px;color:#C62828;border-color:#C62828" data-modal-action="cancelled">Annuler</button>`;
        }
        document.getElementById('modalFooter').innerHTML = footerHTML;

        // Bind modal action buttons
        document.querySelectorAll('[data-modal-action]').forEach(btn => {
            btn.addEventListener('click', async () => {
                await updateStatus(id, btn.dataset.modalAction);
                document.getElementById('modalOverlay').classList.remove('open');
            });
        });

        document.getElementById('modalOverlay').classList.add('open');
    }

    // Modal close
    document.getElementById('modalClose').addEventListener('click', () => {
        document.getElementById('modalOverlay').classList.remove('open');
    });
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
    });

    // ============================
    // Stats
    // ============================
    function updateStats() {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        const weekStartStr = weekStart.toISOString().split('T')[0];

        const active = allReservations.filter(r => r.status !== 'cancelled');
        const todayCount = active.filter(r => r.rawDate === today).length;
        const weekCount = active.filter(r => r.rawDate >= weekStartStr).length;
        const revenue = allReservations
            .filter(r => r.status === 'confirmed' || r.status === 'done')
            .reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0);

        document.getElementById('statToday').textContent = todayCount;
        document.getElementById('statWeek').textContent = weekCount;
        document.getElementById('statTotal').textContent = active.length;
        document.getElementById('statRevenue').textContent = revenue + '€';
    }

    // ============================
    // Services Management
    // ============================
    let currentServices = [];
    const servicesContainer = document.getElementById('servicesManagement');
    const saveBar = document.getElementById('saveBar');
    let hasUnsavedChanges = false;

    async function loadServices() {
        try {
            const res = await fetch(API.services);
            if (res.ok) {
                currentServices = await res.json();
            }
        } catch {
            currentServices = [];
        }
        renderServices();
    }

    function renderServices() {
        let html = '';

        currentServices.forEach((cat, catIdx) => {
            html += `<div class="service-mgmt-category">`;
            html += `<div class="service-mgmt-title">${esc(cat.category)}</div>`;
            cat.items.forEach((item, itemIdx) => {
                html += `
                    <div class="service-mgmt-row" data-cat="${catIdx}" data-item="${itemIdx}">
                        <span class="service-mgmt-name">${esc(item.name)}</span>
                        <input type="number" class="service-mgmt-input input-price" value="${item.price}" min="0" step="1" data-field="price" title="Prix (€)">
                        <input type="number" class="service-mgmt-input input-duration" value="${item.duration}" min="5" step="5" data-field="duration" title="Durée (min)">
                        <span style="font-size:11px;color:var(--color-text-muted);text-align:center;">min</span>
                    </div>
                `;
            });
            html += `</div>`;
        });

        servicesContainer.innerHTML = html;

        servicesContainer.querySelectorAll('.service-mgmt-input').forEach(input => {
            input.addEventListener('input', () => {
                input.classList.add('changed');
                hasUnsavedChanges = true;
                saveBar.classList.add('visible');
            });
        });
    }

    // Save
    document.getElementById('saveChanges').addEventListener('click', async () => {
        // Collect updated values
        servicesContainer.querySelectorAll('.service-mgmt-row').forEach(row => {
            const catIdx = parseInt(row.dataset.cat);
            const itemIdx = parseInt(row.dataset.item);
            const priceInput = row.querySelector('.input-price');
            const durationInput = row.querySelector('.input-duration');
            currentServices[catIdx].items[itemIdx].price = parseFloat(priceInput.value) || 0;
            currentServices[catIdx].items[itemIdx].duration = parseInt(durationInput.value) || 15;
        });

        // Send to API
        const saveBtn = document.getElementById('saveChanges');
        saveBtn.textContent = 'Enregistrement...';
        saveBtn.disabled = true;

        try {
            const res = await fetch(API.services, {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify(currentServices)
            });

            if (res.ok) {
                hasUnsavedChanges = false;
                saveBar.classList.remove('visible');
                servicesContainer.querySelectorAll('.changed').forEach(el => el.classList.remove('changed'));

                const text = document.querySelector('.save-bar-text');
                const orig = text.textContent;
                text.textContent = 'Enregistré avec succès !';
                setTimeout(() => { text.textContent = orig; }, 2000);
            } else {
                alert('Erreur lors de la sauvegarde');
            }
        } catch {
            alert('Erreur de connexion au serveur');
        }

        saveBtn.textContent = 'Enregistrer';
        saveBtn.disabled = false;
    });

    // Cancel
    document.getElementById('cancelChanges').addEventListener('click', () => {
        hasUnsavedChanges = false;
        saveBar.classList.remove('visible');
        renderServices();
    });

    // Warn on leave
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // ============================
    // Agenda — Blocked Slots
    // ============================
    let allBlockedSlots = [];
    let agendaMonth = new Date().getMonth();
    let agendaYear = new Date().getFullYear();
    let agendaSelectedDate = null;

    const MONTHS_FR = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    async function loadBlockedSlots() {
        try {
            const res = await fetch(API.blockedSlots, { headers: headers() });
            if (res.ok) {
                allBlockedSlots = await res.json();
            } else {
                allBlockedSlots = [];
            }
        } catch {
            allBlockedSlots = [];
        }
        renderAgendaCalendar();
        renderAllBlockedList();
    }

    function renderAgendaCalendar() {
        const calGrid = document.getElementById('agendaCalGrid');
        const calMonthEl = document.getElementById('agendaMonth');
        if (!calGrid || !calMonthEl) return;

        calMonthEl.textContent = MONTHS_FR[agendaMonth] + ' ' + agendaYear;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDay = new Date(agendaYear, agendaMonth, 1).getDay();
        const startDay = firstDay === 0 ? 6 : firstDay - 1;
        const daysInMonth = new Date(agendaYear, agendaMonth + 1, 0).getDate();

        let html = '';
        for (let i = 0; i < startDay; i++) {
            html += '<div class="agenda-day empty"></div>';
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(agendaYear, agendaMonth, d);
            const dateStr = date.toISOString().split('T')[0];
            const isPast = date < today;
            const isToday = date.getTime() === today.getTime();
            const isSelected = agendaSelectedDate === dateStr;

            // Count blocks for this day
            const dayBlocks = allBlockedSlots.filter(s => s.date === dateStr);
            const hasFullDay = dayBlocks.some(s => s.type === 'full-day');

            let classes = 'agenda-day';
            if (isPast) classes += ' past';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            if (hasFullDay) classes += ' blocked-full';
            else if (dayBlocks.length > 0) classes += ' blocked-partial';

            html += `<button class="${classes}" data-date="${dateStr}" ${isPast ? 'disabled' : ''}>
                <span class="agenda-day-num">${d}</span>
                ${dayBlocks.length > 0 ? `<span class="agenda-day-dot">${hasFullDay ? '🔒' : dayBlocks.length}</span>` : ''}
            </button>`;
        }

        calGrid.innerHTML = html;

        // Bind clicks
        calGrid.querySelectorAll('.agenda-day:not(.empty):not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                calGrid.querySelectorAll('.agenda-day').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                agendaSelectedDate = btn.dataset.date;
                showAgendaDayPanel(agendaSelectedDate);
            });
        });
    }

    function showAgendaDayPanel(dateStr) {
        const panel = document.getElementById('agendaDayPanel');
        panel.style.display = 'block';

        // Format date nicely
        const d = new Date(dateStr + 'T12:00:00');
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        document.getElementById('agendaDayTitle').textContent =
            days[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS_FR[d.getMonth()] + ' ' + d.getFullYear();

        // Populate time select
        const timeSelect = document.getElementById('agendaBlockTime');
        timeSelect.innerHTML = '<option value="">Choisir un créneau</option>';
        for (let h = 9; h < 19; h++) {
            for (let m = 0; m < 60; m += 30) {
                const totalMin = h * 60 + m;
                if (totalMin >= 750 && totalMin < 840) continue; // Skip lunch 12:30-14:00
                const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                timeSelect.innerHTML += `<option value="${time}">${time}</option>`;
            }
        }

        // Type change handler
        const typeSelect = document.getElementById('agendaBlockType');
        typeSelect.onchange = () => {
            timeSelect.disabled = typeSelect.value === 'full-day';
            if (typeSelect.value === 'full-day') timeSelect.value = '';
        };
        typeSelect.value = 'full-day';
        timeSelect.disabled = true;

        // Show existing blocks for this day
        renderDayBlocks(dateStr);
    }

    function renderDayBlocks(dateStr) {
        const list = document.getElementById('agendaBlocksList');
        const dayBlocks = allBlockedSlots.filter(s => s.date === dateStr);

        if (dayBlocks.length === 0) {
            list.innerHTML = '<p class="agenda-no-blocks">Aucun blocage pour cette date</p>';
            return;
        }

        let html = '<div class="agenda-blocks-title">Blocages actifs</div>';
        dayBlocks.forEach(slot => {
            html += `
                <div class="agenda-block-item">
                    <div class="agenda-block-info">
                        <span class="agenda-block-type">${slot.type === 'full-day' ? '🔒 Journée entière' : '⏰ ' + slot.time}</span>
                        ${slot.reason ? `<span class="agenda-block-reason">${esc(slot.reason)}</span>` : ''}
                    </div>
                    <button class="action-btn danger agenda-unblock-btn" data-id="${esc(slot.id)}" title="Débloquer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>`;
        });
        list.innerHTML = html;

        // Bind unblock buttons
        list.querySelectorAll('.agenda-unblock-btn').forEach(btn => {
            btn.addEventListener('click', () => removeBlockedSlot(btn.dataset.id));
        });
    }

    function renderAllBlockedList() {
        const container = document.getElementById('agendaAllBlocked');
        const emptyEl = document.getElementById('emptyBlocked');
        const countEl = document.getElementById('agendaBlockedCount');
        if (!container) return;

        // Filter to only show future blocks
        const today = new Date().toISOString().split('T')[0];
        const futureBlocks = allBlockedSlots
            .filter(s => s.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

        countEl.textContent = futureBlocks.length;

        if (futureBlocks.length === 0) {
            container.innerHTML = '';
            emptyEl.style.display = 'block';
            return;
        }

        emptyEl.style.display = 'none';

        let html = '';
        let currentDate = '';

        futureBlocks.forEach(slot => {
            if (slot.date !== currentDate) {
                currentDate = slot.date;
                const d = new Date(slot.date + 'T12:00:00');
                const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                const label = days[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS_FR[d.getMonth()];
                html += `<div class="agenda-list-date">${label}</div>`;
            }

            html += `
                <div class="agenda-list-item">
                    <div class="agenda-list-item-info">
                        <span class="badge ${slot.type === 'full-day' ? 'badge-cancelled' : 'badge-pending'}">
                            ${slot.type === 'full-day' ? 'Journée' : slot.time}
                        </span>
                        ${slot.reason ? `<span class="agenda-list-item-reason">${esc(slot.reason)}</span>` : ''}
                    </div>
                    <button class="action-btn danger" data-unblock-id="${esc(slot.id)}" title="Débloquer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>`;
        });

        container.innerHTML = html;

        container.querySelectorAll('[data-unblock-id]').forEach(btn => {
            btn.addEventListener('click', () => removeBlockedSlot(btn.dataset.unblockId));
        });
    }

    // Block a slot
    document.getElementById('agendaBlockBtn')?.addEventListener('click', async () => {
        if (!agendaSelectedDate) return;

        const type = document.getElementById('agendaBlockType').value;
        const time = document.getElementById('agendaBlockTime').value;
        const reason = document.getElementById('agendaBlockReason').value.trim();

        if (type === 'slot' && !time) {
            alert('Veuillez sélectionner un créneau horaire.');
            return;
        }

        const btn = document.getElementById('agendaBlockBtn');
        btn.disabled = true;
        btn.textContent = 'Blocage...';

        try {
            const res = await fetch(API.blockedSlots, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({
                    date: agendaSelectedDate,
                    time: type === 'slot' ? time : null,
                    type,
                    reason
                })
            });

            if (res.ok) {
                const data = await res.json();
                allBlockedSlots.push(data.slot);
                renderAgendaCalendar();
                renderAllBlockedList();
                showAgendaDayPanel(agendaSelectedDate);

                // Clear form
                document.getElementById('agendaBlockReason').value = '';
                document.getElementById('agendaBlockType').value = 'full-day';
                document.getElementById('agendaBlockTime').value = '';
                document.getElementById('agendaBlockTime').disabled = true;
            } else {
                alert('Erreur lors du blocage');
            }
        } catch {
            alert('Erreur de connexion');
        }

        btn.disabled = false;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle;"><path d="M12 5v14M5 12h14"/></svg> Bloquer';
    });

    // Remove a blocked slot
    async function removeBlockedSlot(id) {
        if (!confirm('Débloquer ce créneau ?')) return;

        try {
            const res = await fetch(API.blockedSlots, {
                method: 'DELETE',
                headers: headers(),
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                allBlockedSlots = allBlockedSlots.filter(s => s.id !== id);
                renderAgendaCalendar();
                renderAllBlockedList();
                if (agendaSelectedDate) renderDayBlocks(agendaSelectedDate);
            } else {
                alert('Erreur lors du déblocage');
            }
        } catch {
            alert('Erreur de connexion');
        }
    }

    // Calendar nav
    document.getElementById('agendaPrev')?.addEventListener('click', () => {
        agendaMonth--;
        if (agendaMonth < 0) { agendaMonth = 11; agendaYear--; }
        renderAgendaCalendar();
    });

    document.getElementById('agendaNext')?.addEventListener('click', () => {
        agendaMonth++;
        if (agendaMonth > 11) { agendaMonth = 0; agendaYear++; }
        renderAgendaCalendar();
    });

    // ============================
    // Init
    // ============================
    checkAuth();

})();
