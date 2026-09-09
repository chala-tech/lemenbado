

const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE_URL = isLocal
  ? 'http://127.0.0.1:4000/api'
  : 'https://lemenbado.onrender.com/api'; 

const SESSION_KEY = 'lemenbado_session';

const Session = {
  get() {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  },
  set(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },
  clear() {
    localStorage.removeItem(SESSION_KEY);
  },
  user() {
    const session = this.get();
    return session ? session.user : null;
  },
  token() {
    const session = this.get();
    return session ? session.token : null;
  },
};


async function apiFetch(path, options = {}) {
  const token = Session.token();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}


function requireSession() {
  const user = Session.user();
  if (!user) {
    window.location.href = window.location.pathname.includes('/pages/')
      ? 'login.html'
      : 'pages/login.html';
    return null;
  }
  return user;
}

function wireLogout() {
  const goHome = () => {
    Session.clear();
    const isInPages = window.location.pathname.includes('/pages/');
    window.location.href = isInPages ? '../index.html' : 'index.html';
  };

  const link = document.getElementById('logout-link');
  if (link) link.addEventListener('click', (e) => { e.preventDefault(); goHome(); });

  const btn = document.getElementById('logout-btn');
  if (btn) btn.addEventListener('click', goHome);
}


const RefData = {
  cities: null,
  truckTypes: null,
  cargoTypes: null,

  async getCities() {
    if (!this.cities) this.cities = await apiFetch('/cities');
    return this.cities;
  },

  async getTruckTypes() {
    if (!this.truckTypes) this.truckTypes = await apiFetch('/truck-types');
    return this.truckTypes;
  },

  async getCargoTypes() {
    if (!this.cargoTypes) this.cargoTypes = await apiFetch('/cargo-types');
    return this.cargoTypes;
  },
};



function populateSelect(selectEl, items, { valueKey = 'id', labelKey = 'name' } = {}) {
  items.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = item[valueKey];
    opt.textContent = item[labelKey];
    selectEl.appendChild(opt);
  });
}

function showFormError(form, message) {
  let banner = form.querySelector('.form-error-banner');
  if (!banner) {
    banner = document.createElement('p');
    banner.className = 'form-error-banner';
    banner.style.color = 'var(--color-alert)';
    banner.style.fontSize = 'var(--text-sm)';
    form.prepend(banner);
  }
  banner.textContent = message;
}

/** Shows a brief inline success message near a form. */
function showFormSuccess(form, message) {
  let banner = form.querySelector('.form-success-banner');
  if (!banner) {
    banner = document.createElement('p');
    banner.className = 'form-success-banner';
    banner.style.color = 'var(--color-signal)';
    banner.style.fontSize = 'var(--text-sm)';
    form.prepend(banner);
  }
  banner.textContent = message;
  setTimeout(() => banner.remove(), 4000);
}

/** Shows a temporary confirmation banner, for actions not tied to a form. */
function showToast(message, type = 'success') {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    document.body.appendChild(toast);
  }
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span class="toast__dot"></span><span>${message}</span>`;

  requestAnimationFrame(() => toast.classList.add('toast--visible'));
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove('toast--visible'), 3000);
}



const BOOKING_STATUS_BADGE = {
  REQUESTED: 'badge--wait', ACCEPTED: 'badge--wait', IN_TRANSIT: 'badge--wait',
  DELIVERED: 'badge--wait', COMPLETED: 'badge--signal', CANCELLED: 'badge--alert', REJECTED: 'badge--alert',
};

const BOOKING_STATUS_LABEL = {
  REQUESTED: 'Awaiting reply', ACCEPTED: 'Confirmed', IN_TRANSIT: 'On the way',
  DELIVERED: 'Arrived', COMPLETED: 'Done', CANCELLED: 'Cancelled', REJECTED: 'Declined',
};


function bookingStatusLabel(booking, currentUserId) {
  if (booking.status === 'REQUESTED') {
    return booking.requested_by_user_id === currentUserId ? 'Waiting for their reply' : 'Needs your reply';
  }
  return BOOKING_STATUS_LABEL[booking.status] || booking.status;
}



const LISTING_STATUS_BADGE = {
  OPEN: 'badge--signal', MATCHED: 'badge--wait', BOOKED: 'badge--wait',
  CANCELLED: 'badge--alert', EXPIRED: 'badge--alert',
};

const LISTING_STATUS_LABEL = {
  OPEN: 'Open for matches', MATCHED: 'Matched — awaiting booking', BOOKED: 'Booked — job in progress',
  CANCELLED: 'Cancelled', EXPIRED: 'Expired',
};



const BOTTOM_NAV_ICONS = {
  dashboard: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  route: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2.5"/><path d="M8 12 h4" stroke-dasharray="2 2"/><circle cx="16" cy="12" r="2.5" fill="none"/><path d="M18.5 12 h1.5"/></svg>',
  matches: '<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="4"/><circle cx="16" cy="16" r="4"/><path d="M11 11 l2 2"/></svg>',
  bookings: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8 h8 M8 12 h8 M8 16 h5"/></svg>',
  cargo: '<svg viewBox="0 0 24 24"><path d="M3 8 l9-5 9 5-9 5-9-5z"/><path d="M3 8 v8 l9 5 9-5 V8"/><path d="M12 13 v8"/></svg>',
};

const BOTTOM_NAV_ITEMS = [
  { label: 'Dashboard', href: 'dashboard.html', match: 'dashboard', icon: 'dashboard' },
  { label: 'Availability', href: 'publish-availability.html', match: 'publish-availability', icon: 'route', roleOnly: 'TRUCK_OWNER' },
  { label: 'Post cargo', href: 'post-cargo.html', match: 'post-cargo', icon: 'cargo', roleOnly: 'CARGO_OWNER' },
  { label: 'Matches', href: 'matches.html', match: 'matches', icon: 'matches' },
  { label: 'Bookings', href: 'bookings.html', match: 'bookings', icon: 'bookings' },
];

function renderBottomNav(user) {
  const current = window.location.pathname.split('/').pop().replace('.html', '');
  const items = BOTTOM_NAV_ITEMS.filter((i) => !i.roleOnly || i.roleOnly === user.role);

  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Primary');
  nav.innerHTML = items.map((item) => `
    <a class="bottom-nav__item ${current === item.match ? 'bottom-nav__item--active' : ''}" href="${item.href}">
      ${BOTTOM_NAV_ICONS[item.icon]}
      <span class="bottom-nav__label">${item.label}</span>
    </a>
  `).join('');

  document.body.appendChild(nav);
}

document.addEventListener('DOMContentLoaded', wireLogout);