

const API_BASE_URL = 'http://localhost:4000/api';

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

document.addEventListener('DOMContentLoaded', wireLogout);