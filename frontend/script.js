'use strict';

const API = 'http://localhost:3000';

// ── Toast Notification System ─────────────────────────────────────────────────

function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── Tab Navigation ────────────────────────────────────────────────────────────

const tabConfig = {
  register:      { title: 'Register Passenger',    sub: 'Create a new passenger account' },
  findid:        { title: 'Find Passenger ID',     sub: 'Look up your ID using email or passport' },
  search:        { title: 'Search Flights',        sub: 'Filter flights by route, date, and status' },
  flights:       { title: 'Available Flights',     sub: 'Browse all scheduled flights' },
  book:          { title: 'Book a Ticket',         sub: 'Reserve your seat on a flight' },
  tickets:       { title: 'My Tickets',            sub: 'View all your bookings' },
  rewards:       { title: 'Rewards & Loyalty',     sub: 'Check your loyalty points and tier' },
  notifications: { title: 'Notifications',         sub: 'Flight alerts and status changes' },
};

function switchTab(tab) {
  document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const panel = document.getElementById(`panel-${tab}`);
  const navItem = document.getElementById(`nav-${tab}`);
  if (panel) panel.classList.add('active');
  if (navItem) navItem.classList.add('active');

  const cfg = tabConfig[tab];
  if (cfg) {
    document.getElementById('page-title').textContent = cfg.title;
    document.getElementById('page-sub').textContent = cfg.sub;
  }

  if (tab === 'flights') fetchFlights();
  if (tab === 'book')    loadFlightsForBooking();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
  btn.innerHTML = loading
    ? `<span class="spinner"></span> Please wait...`
    : btn.dataset.originalText;
}

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

function statusBadge(status) {
  const map = {
    'On-Time':  'badge-success',
    'Delayed':  'badge-warning',
    'Canceled': 'badge-danger',
    'Paid':     'badge-success',
    'Pending':  'badge-warning',
    'Canceled': 'badge-danger',
  };
  return `<span class="badge ${map[status] || 'badge-info'}">${status}</span>`;
}

// ── Register Passenger ────────────────────────────────────────────────────────

async function registerPassenger() {
  const name        = document.getElementById('reg-name').value.trim();
  const email       = document.getElementById('reg-email').value.trim();
  const phone       = document.getElementById('reg-phone').value.trim();
  const nationality = document.getElementById('reg-nationality').value.trim();
  const passport_no = document.getElementById('reg-passport').value.trim();

  if (!name || !email || !phone || !nationality || !passport_no) {
    showToast('Please fill in all required fields.', 'warning');
    return;
  }

  if (!/^\d{7,15}$/.test(phone)) {
    showToast('Enter a valid phone number (7–15 digits).', 'warning');
    return;
  }

  setLoading('btn-register', true);
  try {
    const res = await fetch(`${API}/register-passenger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, nationality, passport_no })
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Registration failed.', 'error');
      return;
    }

    document.getElementById('reg-pid').textContent = data.passenger_id;
    const resultBox = document.getElementById('reg-result');
    resultBox.classList.add('visible');
    showToast(`Registered! Passenger ID: ${data.passenger_id}`, 'success');

    // Clear form
    ['reg-name','reg-email','reg-phone','reg-nationality','reg-passport']
      .forEach(id => document.getElementById(id).value = '');

  } catch {
    showToast('Could not connect to server. Make sure the backend is running.', 'error');
  } finally {
    setLoading('btn-register', false);
  }
}

// ── Find Passenger ID ─────────────────────────────────────────────────────────

async function findPassengerID() {
  const email      = document.getElementById('find-email').value.trim();
  const passport   = document.getElementById('find-passport').value.trim();

  if (!email && !passport) {
    showToast('Enter an email or passport number.', 'warning');
    return;
  }

  try {
    const params = new URLSearchParams();
    if (email)    params.set('email', email);
    if (passport) params.set('passport_no', passport);

    const res  = await fetch(`${API}/get-passenger-id?${params}`);
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Passenger not found.', 'error');
      document.getElementById('find-result').classList.remove('visible');
      return;
    }

    document.getElementById('find-pid').textContent          = data.passenger_id;
    document.getElementById('find-name').textContent         = data.name || '—';
    document.getElementById('find-email-result').textContent = data.email || '—';
    document.getElementById('find-result').classList.add('visible');
    showToast(`Found! Passenger ID: ${data.passenger_id}`, 'success');

  } catch {
    showToast('Could not connect to server.', 'error');
  }
}

// ── Fetch Flights ─────────────────────────────────────────────────────────────

async function fetchFlights() {
  const container = document.getElementById('flights-list');
  container.innerHTML = '<div class="card" style="text-align:center; padding:48px;"><div class="spinner" style="margin:0 auto;"></div></div>';

  try {
    const res  = await fetch(`${API}/flights`);
    const data = await res.json();

    if (!data.length) {
      container.innerHTML = '<div class="card" style="text-align:center; padding:48px; color:var(--text-muted);">No flights found. Add flights via the Admin Dashboard.</div>';
      return;
    }

    container.innerHTML = data.map(f => `
      <div class="flight-card">
        <div style="display:flex; flex-direction:column; align-items:center; gap:4px; min-width:40px;">
          <span class="flight-id">FL-${f.Flight_ID}</span>
        </div>
        <div class="flight-route">
          <div>
            <div class="flight-city">${f.Source}</div>
            <div class="flight-times">${formatDateTime(f.Departure_Time)}</div>
          </div>
          <div class="flight-arrow">→</div>
          <div>
            <div class="flight-city">${f.Destination}</div>
            <div class="flight-times">${formatDateTime(f.Arrival_Time)}</div>
          </div>
        </div>
        <div>${statusBadge(f.Status)}</div>
      </div>
    `).join('');

  } catch {
    container.innerHTML = '<div class="card" style="text-align:center; padding:48px; color:var(--danger);">Failed to load flights. Check server connection.</div>';
  }
}

// ── Book Ticket (Smart UI) ───────────────────────────────────────────────────

let _flightsForBooking = [];
let _selectedSeats     = new Set();   // ordered set of seat IDs
let _seatPassengers    = {};          // { seatId: { id, name, email } }
let _paxSearchTimers   = {};          // debounce timers per seat

async function loadFlightsForBooking() {
  const sel = document.getElementById('book-fid');
  if (!sel) return;
  sel.innerHTML = '<option value="">Loading flights...</option>';
  try {
    const res  = await fetch(`${API}/flights-for-booking`);
    const data = await res.json();
    _flightsForBooking = data;
    if (!data.length) { sel.innerHTML = '<option value="">No available flights</option>'; return; }
    sel.innerHTML = '<option value="">— Select a flight —</option>' +
      data.map(f => `<option value="${f.Flight_ID}">FL-${f.Flight_ID} | ${f.Source} → ${f.Destination} | ${f.Airline_Name} | ${formatDateTime(f.Departure_Time)} | ${f.Available_Seats} seats</option>`).join('');
  } catch { sel.innerHTML = '<option value="">Failed to load flights</option>'; }
}

async function onFlightSelect(flightId) {
  const preview     = document.getElementById('flight-preview');
  const seatSection = document.getElementById('seat-map-section');
  const paxSection  = document.getElementById('passenger-assignment-section');
  if (!flightId) {
    preview.style.display = 'none'; seatSection.style.display = 'none';
    paxSection.style.display = 'none'; return;
  }
  const f = _flightsForBooking.find(x => String(x.Flight_ID) === String(flightId));
  if (!f) return;
  document.getElementById('preview-route').textContent   = `${f.Source} → ${f.Destination}`;
  document.getElementById('preview-airline').textContent = f.Airline_Name;
  document.getElementById('preview-dep').textContent     = formatDateTime(f.Departure_Time);
  document.getElementById('preview-seats').textContent   = `${f.Available_Seats} seats`;
  document.getElementById('preview-status').innerHTML    = statusBadge(f.Status);
  preview.style.display = 'block';
  seatSection.style.display = 'block';
  await renderSeatMap(flightId);
}

// ── Seat Map ─────────────────────────────────────────────────────────────────

async function renderSeatMap(flightId) {
  const grid  = document.getElementById('seat-grid');
  const label = document.getElementById('seat-selected-label');
  _selectedSeats.clear(); _seatPassengers = {};
  document.getElementById('book-seat').value = '';
  document.getElementById('passenger-assignment-section').style.display = 'none';
  document.getElementById('passenger-assignment-rows').innerHTML = '';
  label.textContent = 'None selected';
  grid.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem;padding:8px;">Loading seat map...</div>';
  try {
    const res  = await fetch(`${API}/seat-map/${flightId}`);
    const data = await res.json();
    const booked = new Set(data.booked_seats || []);
    const ROWS = 20, COLS = ['A','B','C','D','E','F'];
    let html = '';
    for (let row = 1; row <= ROWS; row++) {
      html += `<div style="display:grid;grid-template-columns:28px 6px repeat(3,32px) 14px repeat(3,32px);gap:3px;margin-bottom:3px;align-items:center;">`;
      html += `<div style="font-size:0.62rem;color:var(--text-muted);text-align:right;padding-right:3px;">${row}</div><div></div>`;
      COLS.forEach((col, idx) => {
        const sid = `${row}${col}`;
        if (idx === 3) html += `<div></div>`;
        if (booked.has(sid)) {
          html += `<div title="${sid}—Booked" style="width:28px;height:26px;border-radius:5px 5px 2px 2px;background:#2a1f1f;border:1px solid #ef444455;cursor:not-allowed;display:flex;align-items:center;justify-content:center;font-size:0.58rem;color:#ef4444;">✕</div>`;
        } else {
          html += `<div id="seat-${sid}" onclick="toggleSeat('${sid}')" title="${sid}"
            style="width:28px;height:26px;border-radius:5px 5px 2px 2px;background:#1e3a5f;border:1px solid #3b82f655;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.58rem;color:#93c5fd;transition:all 0.12s;user-select:none;"
            onmouseover="if(!_selectedSeats.has('${sid}')){this.style.background='#1d4ed8';this.style.borderColor='#60a5fa';}"
            onmouseout="if(!_selectedSeats.has('${sid}')){this.style.background='#1e3a5f';this.style.borderColor='#3b82f655';}">
            ${sid}</div>`;
        }
      });
      html += `</div>`;
    }
    grid.innerHTML = html;
  } catch { grid.innerHTML = '<div style="color:var(--danger);padding:8px;">Failed to load seat map.</div>'; }
}

function toggleSeat(seatId) {
  const label = document.getElementById('seat-selected-label');
  const el    = document.getElementById(`seat-${seatId}`);
  if (_selectedSeats.has(seatId)) {
    _selectedSeats.delete(seatId);
    delete _seatPassengers[seatId];
    if (el) { el.style.background='#1e3a5f'; el.style.borderColor='#3b82f655'; el.style.color='#93c5fd'; el.style.transform=''; el.style.fontWeight=''; }
  } else {
    if (_selectedSeats.size >= 6) { showToast('Max 6 seats per booking.', 'warning'); return; }
    _selectedSeats.add(seatId);
    if (el) { el.style.background='#2563eb'; el.style.borderColor='#60a5fa'; el.style.color='#fff'; el.style.transform='scale(1.08)'; el.style.fontWeight='700'; }
  }
  const seats = [..._selectedSeats];
  document.getElementById('book-seat').value = seats.join(',');
  label.textContent = seats.length ? `${seats.length} seat(s): ${seats.join(', ')}` : 'None selected';
  updatePassengerAssignmentRows(seats);
}

// ── Per-Seat Passenger Assignment ─────────────────────────────────────────────

function updatePassengerAssignmentRows(seats) {
  const section = document.getElementById('passenger-assignment-section');
  const rows    = document.getElementById('passenger-assignment-rows');
  if (!seats.length) { section.style.display = 'none'; rows.innerHTML = ''; return; }
  section.style.display = 'block';

  // Remove rows for deselected seats, keep existing
  const existing = new Set([...rows.querySelectorAll('[data-seat]')].map(el => el.dataset.seat));
  seats.forEach(sid => {
    if (existing.has(sid)) return; // already rendered
    const rowEl = document.createElement('div');
    rowEl.dataset.seat = sid;
    rowEl.style.cssText = 'background:var(--bg-base);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px 14px;margin-bottom:10px;';
    rowEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <span style="background:var(--accent);color:#fff;font-size:0.72rem;font-weight:700;padding:3px 10px;border-radius:20px;">Seat ${sid}</span>
        <span style="font-size:0.8rem;color:var(--text-muted);">Assign Passenger</span>
      </div>
      <input class="form-input" type="text" id="pax-search-${sid}"
        placeholder="Type name, email or passport…"
        oninput="debounceSeatPaxSearch('${sid}', this.value)"
        autocomplete="off" style="margin-bottom:6px;" />
      <div id="pax-results-${sid}" style="display:none;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;margin-bottom:4px;"></div>
      <div id="pax-selected-${sid}" style="display:none;background:var(--accent-subtle);border:1px solid var(--accent);border-radius:var(--radius-md);padding:7px 12px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:0.85rem;font-weight:600;" id="pax-name-${sid}">—</span>
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:0.72rem;background:var(--accent);color:#fff;padding:1px 7px;border-radius:20px;" id="pax-id-${sid}">ID —</span>
          <button class="btn btn-ghost btn-sm" onclick="clearSeatPax('${sid}')" style="padding:1px 7px;">✕</button>
        </div>
      </div>`;
    rows.appendChild(rowEl);
  });

  // Remove rows for seats no longer selected
  [...rows.querySelectorAll('[data-seat]')].forEach(el => {
    if (!seats.includes(el.dataset.seat)) el.remove();
  });
}

function debounceSeatPaxSearch(seatId, query) {
  clearTimeout(_paxSearchTimers[seatId]);
  if (query.trim().length < 2) { document.getElementById(`pax-results-${seatId}`).style.display = 'none'; return; }
  _paxSearchTimers[seatId] = setTimeout(() => searchSeatPax(seatId, query), 350);
}

async function searchSeatPax(seatId, query) {
  const container = document.getElementById(`pax-results-${seatId}`);
  container.style.display = 'block';
  container.innerHTML = '<div style="padding:8px 12px;font-size:0.78rem;color:var(--text-muted);">Searching…</div>';
  try {
    const res  = await fetch(`${API}/find-passenger?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!data.length) { container.innerHTML = '<div style="padding:8px 12px;font-size:0.78rem;color:var(--text-muted);">No results.</div>'; return; }
    container.innerHTML = data.map(p => `
      <div onclick="selectSeatPax('${seatId}',${p.Passenger_id},'${p.Name.replace(/'/g,"\\'")}','${p.Email}')"
        style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);transition:background 0.1s;"
        onmouseover="this.style.background='var(--bg-card)'" onmouseout="this.style.background=''">
        <strong style="font-size:0.82rem;">${p.Name}</strong>
        <span style="font-size:0.72rem;color:var(--text-muted);margin-left:6px;">${p.Email}</span>
        <span style="float:right;font-size:0.7rem;color:var(--text-muted);">ID #${p.Passenger_id} · ${p.Passport_No}</span>
      </div>`).join('');
  } catch { container.innerHTML = '<div style="padding:8px 12px;font-size:0.78rem;color:var(--danger);">Search failed.</div>'; }
}

function selectSeatPax(seatId, id, name, email) {
  _seatPassengers[seatId] = { id, name, email };
  document.getElementById(`pax-results-${seatId}`).style.display  = 'none';
  document.getElementById(`pax-selected-${seatId}`).style.display = 'flex';
  document.getElementById(`pax-name-${seatId}`).textContent = `${name} · ${email}`;
  document.getElementById(`pax-id-${seatId}`).textContent   = `ID #${id}`;
  document.getElementById(`pax-search-${seatId}`).value     = '';
}

function clearSeatPax(seatId) {
  delete _seatPassengers[seatId];
  document.getElementById(`pax-selected-${seatId}`).style.display = 'none';
  document.getElementById(`pax-search-${seatId}`).value = '';
}

// ── Payment toggle ────────────────────────────────────────────────────────────

function updatePayLabel() {
  const pL = document.getElementById('pay-paid-label'), pnL = document.getElementById('pay-pend-label');
  if (!pL) return;
  const isPaid = document.getElementById('pay-paid').checked;
  pL.style.borderColor  = isPaid ? 'var(--accent)' : 'var(--border)';
  pL.style.background   = isPaid ? 'var(--accent-subtle)' : '';
  pnL.style.borderColor = !isPaid ? 'var(--warning)' : 'var(--border)';
  pnL.style.background  = !isPaid ? 'rgba(234,179,8,0.08)' : '';
}

// ── Confirm Booking ───────────────────────────────────────────────────────────

async function bookTicket() {
  const flight_id      = document.getElementById('book-fid').value;
  const seats          = [..._selectedSeats];
  const paymentRadio   = document.querySelector('input[name="payment"]:checked');
  const payment_status = paymentRadio ? paymentRadio.value : 'Paid';

  if (!flight_id)    { showToast('Select a flight first.', 'warning'); return; }
  if (!seats.length) { showToast('Select at least one seat from the map.', 'warning'); return; }

  // Validate all seats have a passenger
  for (const sid of seats) {
    if (!_seatPassengers[sid]) {
      showToast(`Assign a passenger to seat ${sid} first.`, 'warning');
      document.getElementById(`pax-search-${sid}`)?.focus();
      return;
    }
  }

  const f = _flightsForBooking.find(x => String(x.Flight_ID) === String(flight_id));

  // Build bookings array
  const bookings = seats.map(sid => ({
    seat_no: sid,
    passenger_id: _seatPassengers[sid].id,
    flight_id
  }));

  try {
    const res  = await fetch(`${API}/book-tickets-batch`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookings, payment_status })
    });
    const data = await res.json();

    if (!data.booked || !data.booked.length) {
      showToast(data.error || 'Booking failed — seats may already be taken.', 'error'); return;
    }

    const bookingIds  = data.booked.map(b => `#${b.booking_id}`).join(', ');
    const bookedSeats = data.booked.map(b => b.seat).join(', ');

    const resultBox = document.getElementById('book-result');
    document.getElementById('book-bid').textContent           = bookingIds;
    document.getElementById('book-route-confirm').textContent = f ? `${f.Source} → ${f.Destination}` : `FL-${flight_id}`;
    document.getElementById('book-seat-confirm').textContent  = bookedSeats;
    resultBox.style.display = 'block';
    resultBox.classList.add('visible');

    if (data.failed?.length) {
      showToast(`⚠️ ${data.booked.length} booked, ${data.failed.length} had conflicts.`, 'warning');
    } else {
      showToast(`🎫 ${data.booked.length} seat(s) booked!`, 'success');
    }

    // Reset
    await loadFlightsForBooking();
    document.getElementById('book-fid').value = '';
    document.getElementById('flight-preview').style.display   = 'none';
    document.getElementById('seat-map-section').style.display = 'none';
    document.getElementById('passenger-assignment-section').style.display = 'none';
    document.getElementById('passenger-assignment-rows').innerHTML = '';
    _selectedSeats.clear(); _seatPassengers = {};
    document.getElementById('book-seat').value = '';

  } catch { showToast('Could not connect to server.', 'error'); }
}

// ── Fetch Tickets ─────────────────────────────────────────────────────────────


async function fetchTickets() {
  const passengerID = document.getElementById('tickets-pid').value.trim();
  if (!passengerID) { showToast('Enter a Passenger ID.', 'warning'); return; }

  const tbody = document.getElementById('tickets-body');
  tbody.innerHTML = `<tr><td colspan="7" class="table-empty"><div class="spinner" style="margin:0 auto;"></div></td></tr>`;

  try {
    const res  = await fetch(`${API}/tickets/${passengerID}`);
    const data = await res.json();

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No tickets found for Passenger ID ${passengerID}.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(t => `
      <tr>
        <td><span class="mono">#${t.Booking_ID}</span></td>
        <td><span class="mono">FL-${t.Flight_ID}</span></td>
        <td>${t.Source || '—'} → ${t.Destination || '—'}</td>
        <td><strong>${t.Seat_No}</strong></td>
        <td class="text-muted">${formatDateTime(t.Booking_Date)}</td>
        <td>${statusBadge(t.Flight_Status || 'On-Time')}</td>
        <td>${statusBadge(t.Payment_Status)}</td>
      </tr>
    `).join('');

    showToast(`Loaded ${data.length} ticket(s).`, 'success');
  } catch {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty" style="color:var(--danger);">Failed to load tickets.</td></tr>`;
  }
}

// ── Fetch Rewards ─────────────────────────────────────────────────────────────

async function fetchRewards() {
  const pid = document.getElementById('rewards-pid').value.trim();
  if (!pid) { showToast('Enter a Passenger ID.', 'warning'); return; }

  try {
    const res  = await fetch(`${API}/rewards/${pid}`);
    const data = await res.json();

    if (!res.ok) { showToast(data.error || 'Could not fetch rewards.', 'error'); return; }

    const points = data.Points || 0;
    const tier   = data.Tier   || 'Bronze';

    const tierThresholds = { Bronze: 0, Silver: 1000, Gold: 5000, Platinum: 10000 };
    const tierOrder      = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    const nextTierIdx    = tierOrder.indexOf(tier) + 1;
    const nextThreshold  = nextTierIdx < tierOrder.length ? tierThresholds[tierOrder[nextTierIdx]] : null;
    const barPct         = nextThreshold ? Math.min((points / nextThreshold) * 100, 100) : 100;
    const pointsToNext   = nextThreshold ? nextThreshold - points : 0;

    const tierIcons = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };
    const tierClass  = { Bronze: 'tier-bronze', Silver: 'tier-silver', Gold: 'tier-gold', Platinum: 'tier-platinum' };

    document.getElementById('rewards-tier-badge').className = `rewards-tier ${tierClass[tier]}`;
    document.getElementById('rewards-tier-badge').innerHTML = `${tierIcons[tier]} ${tier}`;
    document.getElementById('rewards-points').textContent   = points.toLocaleString();
    document.getElementById('rewards-bar').style.width      = `${barPct}%`;
    document.getElementById('rewards-next-label').textContent = nextThreshold
      ? `${pointsToNext.toLocaleString()} points to ${tierOrder[nextTierIdx]}`
      : '🎉 Maximum tier achieved!';

    document.getElementById('rewards-card').style.display = 'block';
    showToast(`Tier: ${tier} · ${points} points`, 'success');

  } catch {
    showToast('Could not connect to server.', 'error');
  }
}

// ── Fetch Notifications ───────────────────────────────────────────────────────

async function fetchNotifications() {
  const pid = document.getElementById('notif-pid').value.trim();
  if (!pid) { showToast('Enter a Passenger ID.', 'warning'); return; }

  const container = document.getElementById('notif-list');
  container.innerHTML = '<div class="card" style="text-align:center; padding:32px;"><div class="spinner" style="margin:0 auto;"></div></div>';

  try {
    const res  = await fetch(`${API}/notifications/${pid}`);
    const data = await res.json();

    if (!data.length) {
      container.innerHTML = '<div class="card" style="text-align:center; padding:32px; color:var(--text-muted);">No notifications found.</div>';
      return;
    }

    container.innerHTML = data.map(n => `
      <div class="card" style="margin-bottom:10px; padding:16px 20px; border-left:3px solid var(--warning);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
          <div>
            <span style="font-size:1rem;">🔔</span>
            <span style="margin-left:8px; font-size:0.9rem;">${n.Message}</span>
          </div>
          <span class="text-muted" style="font-size:0.75rem; white-space:nowrap;">${formatDateTime(n.Notification_Date)}</span>
        </div>
      </div>
    `).join('');

    showToast(`${data.length} notification(s) loaded.`, 'info');
  } catch {
    container.innerHTML = '<div class="card" style="text-align:center; padding:32px; color:var(--danger);">Failed to load notifications.</div>';
  }
}

// ── Search Flights ────────────────────────────────────────────────────────────

async function searchFlights() {
  const source      = document.getElementById('srch-source').value.trim();
  const destination = document.getElementById('srch-dest').value.trim();
  const date        = document.getElementById('srch-date').value;
  const status      = document.getElementById('srch-status').value;

  if (!source && !destination && !date && !status) {
    showToast('Enter at least one search filter.', 'warning');
    return;
  }

  const params = new URLSearchParams();
  if (source)      params.set('source', source);
  if (destination) params.set('destination', destination);
  if (date)        params.set('date', date);
  if (status)      params.set('status', status);

  const container = document.getElementById('search-results');
  container.innerHTML = '<div class="card" style="text-align:center;padding:48px;"><div class="spinner" style="margin:0 auto;"></div></div>';

  try {
    const res  = await fetch(`${API}/search-flights?${params}`);
    const data = await res.json();

    if (!data.length) {
      container.innerHTML = '<div class="card" style="text-align:center;padding:48px;color:var(--text-muted);">No flights found matching your search.</div>';
      showToast('No matching flights found.', 'info');
      return;
    }

    container.innerHTML = `
      <div style="font-size:0.8125rem;color:var(--text-muted);margin-bottom:12px;">
        Found <strong style="color:var(--accent);">${data.length}</strong> flight(s)
      </div>
      ${data.map(f => `
        <div class="flight-card">
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:44px;">
            <span class="flight-id">FL-${f.Flight_ID}</span>
          </div>
          <div class="flight-route">
            <div>
              <div class="flight-city">${f.Source}</div>
              <div class="flight-times">${formatDateTime(f.Departure_Time)}</div>
            </div>
            <div class="flight-arrow">→</div>
            <div>
              <div class="flight-city">${f.Destination}</div>
              <div class="flight-times">${formatDateTime(f.Arrival_Time)}</div>
            </div>
          </div>
          <div>${statusBadge(f.Status)}</div>
          <button class="btn btn-primary btn-sm"
            onclick="document.getElementById('book-fid').value=${f.Flight_ID}; switchTab('book');">
            Book This →
          </button>
        </div>
      `).join('')}
    `;
    showToast(`${data.length} flight(s) found.`, 'success');
  } catch {
    container.innerHTML = '<div class="card" style="text-align:center;padding:48px;color:var(--danger);">Search failed. Check server connection.</div>';
  }
}

function clearSearch() {
  ['srch-source','srch-dest','srch-date'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('srch-status').value = '';
  document.getElementById('search-results').innerHTML =
    '<div class="card" style="text-align:center;padding:48px;color:var(--text-muted);">Use the filters above to search for flights</div>';
}

// ── Cancel Ticket ─────────────────────────────────────────────────────────────

async function cancelTicket(bookingId) {
  if (!confirm(`Cancel Booking #${bookingId}? This cannot be undone.`)) return;
  try {
    const res  = await fetch(`${API}/booking/${bookingId}/cancel`, { method: 'PUT' });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Could not cancel booking.', 'error'); return; }
    showToast(`Booking #${bookingId} canceled successfully.`, 'success');
    const pid = document.getElementById('tickets-pid').value;
    if (pid) fetchTickets();
  } catch {
    showToast('Could not connect to server.', 'error');
  }
}
