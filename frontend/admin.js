'use strict';

const API = 'http://localhost:3000';

// ── Auth Guard ────────────────────────────────────────────────────────────────────

(async function checkAuth() {
  const token = localStorage.getItem('aero_token');
  if (!token) { window.location.href = 'login.html'; return; }
  try {
    const res = await fetch(`${API}/admin/verify`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) { localStorage.clear(); window.location.href = 'login.html'; }
  } catch {
    // server may be starting; allow page to load
  }
})();

function getToken() { return localStorage.getItem('aero_token') || ''; }

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

function handle401(res) {
  if (res.status === 401) {
    localStorage.clear();
    window.location.href = 'login.html';
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem('aero_token');
  localStorage.removeItem('aero_admin');
  window.location.href = 'login.html';
}

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
  overview:    { title: 'Dashboard',        sub: 'System overview and key metrics' },
  airlines:    { title: 'Manage Airlines',  sub: 'Add new airlines to the system' },
  flights:     { title: 'Schedule Flight',  sub: 'Add a new flight to the system' },
  staff:       { title: 'Assign Staff',     sub: 'Assign personnel to flights' },
  allflights:  { title: 'All Flights',      sub: 'Complete flight schedule' },
  allstaff:    { title: 'Staff Directory',  sub: 'All assigned staff members' },
  passengers:  { title: 'All Passengers',   sub: 'Registered passengers with booking summary' },
  reports:     { title: 'Analytics & Reports', sub: 'SQL Views · Charts · Window Functions' },
};

function switchTab(tab) {
  document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const panel   = document.getElementById(`panel-${tab}`);
  const navItem = document.getElementById(`nav-${tab}`);
  if (panel)   panel.classList.add('active');
  if (navItem) navItem.classList.add('active');

  const cfg = tabConfig[tab];
  if (cfg) {
    document.getElementById('page-title').textContent = cfg.title;
    document.getElementById('page-sub').textContent   = cfg.sub;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  };
  return `<span class="badge ${map[status] || 'badge-info'}">${status || '—'}</span>`;
}

function roleBadge(role) {
  const map = {
    'Pilot':        'badge-accent',
    'Cabin Crew':   'badge-info',
    'Ground Staff': 'badge-warning',
  };
  return `<span class="badge ${map[role] || 'badge-accent'}">${role}</span>`;
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

async function loadStats() {
  try {
    const res  = await fetch(`${API}/stats`);
    const data = await res.json();
    const animateCount = (id, target) => {
      const el = document.getElementById(id);
      if (!el) return;
      let current = 0;
      const step  = Math.max(1, Math.ceil(target / 40));
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
      }, 30);
    };
    animateCount('s-flights',    data.totalFlights    || 0);
    animateCount('s-passengers', data.totalPassengers || 0);
    animateCount('s-bookings',   data.totalBookings   || 0);
    animateCount('s-staff',      data.totalStaff      || 0);
    animateCount('s-airlines',   data.totalAirlines   || 0);
  } catch {
    ['s-flights','s-passengers','s-bookings','s-staff','s-airlines']
      .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '—'; });
  }
}

// ── Add Airline ───────────────────────────────────────────────────────────────

async function addAirline() {
  const airlineName    = document.getElementById('al-name').value.trim();
  const airlineCountry = document.getElementById('al-country').value.trim();

  if (!airlineName || !airlineCountry) {
    showToast('Airline name and country are required.', 'warning');
    return;
  }

  try {
    const res  = await fetch(`${API}/add-airline`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ airlineName, airlineCountry })
    });
    if (handle401(res)) return;
    const data = await res.json();

    if (!res.ok) { showToast(data.error || 'Failed to add airline.', 'error'); return; }

    showToast(`Airline "${airlineName}" added with ID: ${data.airline_id}`, 'success');
    document.getElementById('al-name').value    = '';
    document.getElementById('al-country').value = '';
    loadStats();
  } catch {
    showToast('Could not connect to server.', 'error');
  }
}

// ── Add Flight ────────────────────────────────────────────────────────────────

async function addFlight() {
  const airline_id            = document.getElementById('fl-airline').value.trim();
  const source                = document.getElementById('fl-source').value.trim();
  const destination           = document.getElementById('fl-dest').value.trim();
  const departure_airport_id  = document.getElementById('fl-dep-airport').value.trim();
  const arrival_airport_id    = document.getElementById('fl-arr-airport').value.trim();
  const departure_time        = document.getElementById('fl-dep-time').value;
  const arrival_time          = document.getElementById('fl-arr-time').value;
  const status                = document.getElementById('fl-status').value;

  if (!airline_id || !source || !destination || !departure_airport_id || !arrival_airport_id || !departure_time || !arrival_time) {
    showToast('All fields are required to schedule a flight.', 'warning');
    return;
  }

  if (new Date(arrival_time) <= new Date(departure_time)) {
    showToast('Arrival time must be after departure time.', 'warning');
    return;
  }

  try {
    const res  = await fetch(`${API}/api/flights`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ airline_id, source, destination, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status })
    });
    if (handle401(res)) return;
    const data = await res.json();

    if (!res.ok) { showToast(data.error || 'Failed to add flight.', 'error'); return; }

    showToast(`Flight ${source} → ${destination} scheduled! ID: ${data.flight_id}`, 'success');
    ['fl-airline','fl-source','fl-dest','fl-dep-airport','fl-arr-airport','fl-dep-time','fl-arr-time']
      .forEach(id => document.getElementById(id).value = '');
    loadStats();
  } catch {
    showToast('Could not connect to server.', 'error');
  }
}

// ── Assign Staff ──────────────────────────────────────────────────────────────

async function assignStaff() {
  const staffName = document.getElementById('st-name').value.trim();
  const role      = document.getElementById('st-role').value;
  const flightID  = document.getElementById('st-flight').value.trim();
  const contact   = document.getElementById('st-contact').value.trim();

  if (!staffName || !role || !flightID || !contact) {
    showToast('All fields are required.', 'warning');
    return;
  }

  try {
    const res  = await fetch(`${API}/assign-staff`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ staffName, role, flightID, contact })
    });
    if (handle401(res)) return;
    const data = await res.json();

    if (!res.ok) { showToast(data.error || 'Failed to assign staff.', 'error'); return; }

    showToast(`${role} "${staffName}" assigned to Flight ${flightID}`, 'success');
    ['st-name','st-flight','st-contact'].forEach(id => document.getElementById(id).value = '');
    loadStats();
  } catch {
    showToast('Could not connect to server.', 'error');
  }
}

// ── Fetch All Flights ─────────────────────────────────────────────────────────

async function fetchAllFlights() {
  const tbody = document.getElementById('flights-body');
  tbody.innerHTML = `<tr><td colspan="7" class="table-empty"><div class="spinner" style="margin:0 auto;"></div></td></tr>`;

  try {
    const res  = await fetch(`${API}/flights`);
    const data = await res.json();

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No flights scheduled yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(f => `
      <tr>
        <td><span class="mono">FL-${f.Flight_ID}</span></td>
        <td>${f.Airline_ID}</td>
        <td><strong>${f.Source}</strong> → <strong>${f.Destination}</strong></td>
        <td class="text-muted">${formatDateTime(f.Departure_Time)}</td>
        <td class="text-muted">${formatDateTime(f.Arrival_Time)}</td>
        <td>${f.Available_Seats ?? '—'}</td>
        <td>${statusBadge(f.Status)}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="updateFlightStatus(${f.Flight_ID}, '${f.Status}')" style="font-size:0.75rem; padding:5px 10px;">
            ✏️ Update
          </button>
        </td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty" style="color:var(--danger);">Failed to load flights.</td></tr>`;
  }
}

// ── Fetch All Staff ───────────────────────────────────────────────────────────

async function fetchAllStaff() {
  const tbody = document.getElementById('staff-body');
  tbody.innerHTML = `<tr><td colspan="6" class="table-empty"><div class="spinner" style="margin:0 auto;"></div></td></tr>`;

  try {
    const res  = await fetch(`${API}/staff`);
    const data = await res.json();

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No staff assigned yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(s => `
      <tr>
        <td><span class="mono">#${s.Staff_ID}</span></td>
        <td><strong>${s.Name}</strong></td>
        <td>${roleBadge(s.Role)}</td>
        <td><span class="mono">FL-${s.Assigned_Flight_ID || '—'}</span></td>
        <td>${s.Source && s.Destination ? `${s.Source} → ${s.Destination}` : '<span class="text-muted">—</span>'}</td>
        <td class="text-muted">${s.Contact || '—'}</td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty" style="color:var(--danger);">Failed to load staff data.</td></tr>`;
  }
}

// ── Update Flight Status ──────────────────────────────────────────────────────

async function updateFlightStatus(flightId, currentStatus) {
  const statuses = ['On-Time', 'Delayed', 'Canceled'];
  const next = statuses.filter(s => s !== currentStatus);
  const choice = prompt(`Update FL-${flightId} status:\n1. ${next[0]}\n2. ${next[1]}\n\nType the new status exactly:`);
  if (!choice || !statuses.includes(choice)) {
    if (choice !== null) showToast('Invalid status. Use: On-Time, Delayed, or Canceled', 'warning');
    return;
  }
  try {
    const res  = await fetch(`${API}/flight/${flightId}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status: choice })
    });
    if (handle401(res)) return;
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Failed to update status.', 'error'); return; }
    showToast(`FL-${flightId} status → ${choice}`, 'success');
    fetchAllFlights();
  } catch {
    showToast('Could not connect to server.', 'error');
  }
}

// ── Fetch All Passengers ──────────────────────────────────────────────────────

async function fetchPassengers() {
  const tbody = document.getElementById('passengers-body');
  tbody.innerHTML = `<tr><td colspan="9" class="table-empty"><div class="spinner" style="margin:0 auto;"></div></td></tr>`;
  try {
    const res  = await fetch(`${API}/passengers`, { headers: authHeaders() });
    if (handle401(res)) return;
    const data = await res.json();
    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="table-empty">No passengers registered yet.</td></tr>`;
      return;
    }
    const tierIcon = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };
    tbody.innerHTML = data.map(p => `
      <tr>
        <td><span class="mono">#${p.Passenger_id}</span></td>
        <td><strong>${p.Name}</strong></td>
        <td class="text-muted">${p.Email}</td>
        <td>${p.Nationality}</td>
        <td style="text-align:center;"><strong>${p.Total_Bookings || 0}</strong></td>
        <td style="text-align:center;"><span style="color:var(--success);">${p.Paid_Bookings || 0}</span></td>
        <td style="text-align:center;"><span style="color:var(--danger);">${p.Canceled_Bookings || 0}</span></td>
        <td><strong>${Number(p.Reward_Points || 0).toLocaleString()}</strong></td>
        <td>${tierIcon[p.Reward_Tier] || '🥉'} ${p.Reward_Tier || 'Bronze'}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Passengers error:', err);
    tbody.innerHTML = `<tr><td colspan="9" class="table-empty" style="color:var(--danger);">Failed to load passengers: ${err.message}</td></tr>`;
  }
}

// ── Reports / Analytics ───────────────────────────────────────────────────────

let chartRevenue = null;
let chartRoutes  = null;

async function loadReports() {
  await Promise.all([loadRevenueChart(), loadRoutesChart(), loadOccupancy(), loadTopPassengers()]);
}

async function loadRevenueChart() {
  try {
    const res  = await fetch(`${API}/reports/revenue`);
    const data = await res.json();
    const ctx  = document.getElementById('chart-revenue').getContext('2d');
    if (chartRevenue) chartRevenue.destroy();
    chartRevenue = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.Airline_Name),
        datasets: [{
          label: 'Revenue (₹)',
          data: data.map(d => d.Revenue_INR),
          backgroundColor: ['#3b82f6','#06b6d4','#22c55e','#eab308','#ef4444','#8b5cf6'],
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94a3b8', callback: v => `₹${(v/1000).toFixed(0)}k` }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  } catch { console.error('Revenue chart error'); }
}

async function loadRoutesChart() {
  try {
    const res  = await fetch(`${API}/reports/popular-routes`);
    const data = await res.json();
    const top5 = data.slice(0, 5);
    const ctx  = document.getElementById('chart-routes').getContext('2d');
    if (chartRoutes) chartRoutes.destroy();
    chartRoutes = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: top5.map(d => d.Route),
        datasets: [{
          data: top5.map(d => d.Total_Bookings || 1),
          backgroundColor: ['#3b82f6','#06b6d4','#22c55e','#eab308','#8b5cf6'],
          borderColor: '#111e36',
          borderWidth: 3,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, font: { size: 11 } } }
        }
      }
    });
  } catch { console.error('Routes chart error'); }
}

async function loadOccupancy() {
  const tbody = document.getElementById('occupancy-body');
  try {
    const res  = await fetch(`${API}/reports/occupancy`);
    const data = await res.json();
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No data.</td></tr>`; return; }
    tbody.innerHTML = data.map(f => {
      const pct     = f.Occupancy_Pct || 0;
      const barColor = pct > 75 ? 'var(--success)' : pct > 40 ? 'var(--warning)' : 'var(--accent)';
      return `<tr>
        <td><span class="mono">FL-${f.Flight_ID}</span></td>
        <td>${f.Source} → ${f.Destination}</td>
        <td>${f.Airline_Name}</td>
        <td style="text-align:center;">${f.Booked_Seats}</td>
        <td style="text-align:center;">${f.Remaining_Seats}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:6px;background:var(--bg-base);border-radius:99px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:${barColor};border-radius:99px;"></div>
            </div>
            <span style="font-size:0.8125rem;font-weight:600;min-width:38px;">${pct}%</span>
          </div>
        </td>
        <td>${statusBadge(f.Status)}</td>
      </tr>`;
    }).join('');
  } catch {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty" style="color:var(--danger);">Failed to load occupancy.</td></tr>`;
  }
}

async function loadTopPassengers() {
  const tbody = document.getElementById('top-passengers-body');
  try {
    const res  = await fetch(`${API}/reports/top-passengers`);
    const data = await res.json();
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No data.</td></tr>`; return; }
    const tierIcon = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };
    const medals   = { 1: '🥇', 2: '🥈', 3: '🥉' };
    tbody.innerHTML = data.map(p => `
      <tr>
        <td style="text-align:center; font-size:1.2rem;">${medals[p.Loyalty_Rank] || `#${p.Loyalty_Rank}`}</td>
        <td><strong>${p.Name}</strong></td>
        <td>${p.Nationality}</td>
        <td><strong>${p.Points.toLocaleString()}</strong></td>
        <td>${tierIcon[p.Tier] || ''} ${p.Tier}</td>
        <td style="text-align:center;">${p.Total_Bookings}</td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty" style="color:var(--danger);">Failed.</td></tr>`;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Show admin name in header
  try {
    const admin = JSON.parse(localStorage.getItem('aero_admin') || '{}');
    if (admin.name) {
      const topBar = document.querySelector('.top-bar');
      if (topBar) {
        const adminInfo = document.createElement('div');
        adminInfo.style.cssText = 'display:flex;align-items:center;gap:12px;';
        adminInfo.innerHTML = `
          <div style="text-align:right;">
            <div style="font-size:0.8125rem;font-weight:600;">${admin.name}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);">${admin.role || 'Admin'}</div>
          </div>
          <button onclick="logout()" class="btn btn-ghost btn-sm" style="color:var(--danger);" title="Logout">⏏ Logout</button>
        `;
        // Replace the existing right side of top-bar
        const existingRight = topBar.querySelector('div:last-child');
        if (existingRight) topBar.replaceChild(adminInfo, existingRight);
        else topBar.appendChild(adminInfo);
      }
    }
  } catch {}

  loadStats();
});
