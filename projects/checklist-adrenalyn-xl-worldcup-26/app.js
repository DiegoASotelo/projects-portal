const STORAGE_KEY = 'checklist-adrenalyn-xl-worldcup-26';
const PROJECT_KEY = 'checklist-adrenalyn-xl-worldcup-26';
const COLLECTION_KEY = 'adrenalyn-xl-worldcup-26';
const runtimeConfig = window.CHECKLIST_SUPABASE_CONFIG || {};
const CONFIG = {
  supabaseUrl: runtimeConfig.url || '',
  supabaseAnonKey: runtimeConfig.anonKey || ''
};
const supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);

const state = {
  cards: [],
  activeUser: null,
  membership: null,
  checklistId: null,
  filters: { q: '', section: '', type: '', status: '' },
  trialMode: true,
  projectId: null,
  isAdminView: false
};

const el = {
  loginScreen: document.getElementById('loginScreen'),
  appShell: document.getElementById('appShell'),
  googleLoginButton: document.getElementById('googleLoginButton'),
  emailLoginForm: document.getElementById('emailLoginForm'),
  emailInput: document.getElementById('emailInput'),
  passwordInput: document.getElementById('passwordInput'),
  loginMessage: document.getElementById('loginMessage'),
  currentUser: document.getElementById('currentUser'),
  logoutButton: document.getElementById('logoutButton'),
  ownedCount: document.getElementById('ownedCount'),
  missingCount: document.getElementById('missingCount'),
  duplicateCount: document.getElementById('duplicateCount'),
  progressPercent: document.getElementById('progressPercent'),
  search: document.getElementById('search'),
  teamFilter: document.getElementById('teamFilter'),
  typeFilter: document.getElementById('typeFilter'),
  statusFilter: document.getElementById('statusFilter'),
  cardsGrid: document.getElementById('cardsGrid'),
  template: document.getElementById('cardTemplate'),
  imageModal: document.getElementById('imageModal'),
  modalImage: document.getElementById('modalImage'),
  closeModal: document.getElementById('closeModal'),
  backupSlot: document.getElementById('backupSlot'),
  adminLink: document.getElementById('adminLink'),
  appView: document.getElementById('appView'),
  adminView: document.getElementById('adminView'),
  adminTable: document.getElementById('adminTable'),
  createUserForm: document.getElementById('createUserForm'),
  adminEmailInput: document.getElementById('adminEmailInput'),
  adminPasswordInput: document.getElementById('adminPasswordInput'),
  adminPlanInput: document.getElementById('adminPlanInput'),
  adminMessage: document.getElementById('adminMessage'),
  backToAppButton: document.getElementById('backToAppButton')
};

const placeholder = './placeholder-card.svg';
const teamCodeMap = {'ALGERIA':'dz','ARGENTINA':'ar','AUSTRALIA':'au','AUSTRIA':'at','BELGIUM':'be','BRAZIL':'br','CANADA':'ca','CAPE VERDE':'cv','COLOMBIA':'co','CROATIA':'hr','CURACAO':'cw','ECUADOR':'ec','EGYPT':'eg','ENGLAND':'gb-eng','FRANCE':'fr','GERMANY':'de','GHANA':'gh','HAITI':'ht','IRAN':'ir','IVORY COAST':'ci','JAPAN':'jp','JORDAN':'jo','SOUTH KOREA':'kr','MEXICO':'mx','MOROCCO':'ma','NETHERLANDS':'nl','NEW ZEALAND':'nz','NORWAY':'no','PANAMA':'pa','PARAGUAY':'py','PORTUGAL':'pt','QATAR':'qa','SAUDI ARABIA':'sa','SCOTLAND':'gb-sct','SENEGAL':'sn','SOUTH AFRICA':'za','SPAIN':'es','SWITZERLAND':'ch','TUNISIA':'tn','UNITED STATES':'us','URUGUAY':'uy','UZBEKISTAN':'uz'};
const specialLabels = {golden_baller:'Golden Ballers',contenders:'Contenders',top_keeper:'Top Keepers',defensive_rock:'Defensive Rocks',midfield_maestro:'Midfield Maestro',goal_machine:'Goal Machines',master_rookie:'Master Rookie',official_emblem:'Emblema',official_mascot:'Mascotas',eternos_22:'Eternos 22'};

const crestUrl = team => team === 'UNITED STATES' || team === 'USA' ? 'https://flagcdn.com/us.svg' : teamCodeMap[team] ? `https://flagcdn.com/h40/${teamCodeMap[team]}.png` : '';
const getStatus = card => card.owned > 1 ? 'duplicates' : card.owned === 1 ? 'owned' : 'missing';
const getSectionKey = card => {
  if (card.number <= 9) return 'golden_baller';
  if (card.number <= 513) return card.team;
  if (card.number <= 549) return 'contenders';
  if (card.number <= 558) return 'top_keeper';
  if (card.number <= 567) return 'defensive_rock';
  if (card.number <= 585) return 'midfield_maestro';
  if (card.number <= 607) return 'goal_machine';
  if (card.number <= 623) return 'master_rookie';
  if (card.number === 624) return 'official_emblem';
  if (card.number <= 627) return 'official_mascot';
  return 'eternos_22';
};
const getSectionLabel = key => specialLabels[key] || key;
const setLoginMessage = (text, error = false) => {
  el.loginMessage.textContent = text;
  el.loginMessage.dataset.error = error ? 'true' : 'false';
};
const setAdminMessage = (text, error = false) => {
  el.adminMessage.textContent = text;
  el.adminMessage.dataset.error = error ? 'true' : 'false';
};
const filteredCards = () => state.cards.filter(card => {
  const q = state.filters.q;
  return (!q || `${card.number} ${card.name} ${card.team}`.toLowerCase().includes(q))
    && (!state.filters.section || getSectionKey(card) === state.filters.section)
    && (!state.filters.type || card.type === state.filters.type)
    && (!state.filters.status || getStatus(card) === state.filters.status)
    && (!state.trialMode || card.trial);
});
const buildSections = list => {
  const map = new Map();
  list.forEach(card => {
    const key = getSectionKey(card);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(card);
  });
  const ordered = [];
  if (map.has('golden_baller')) ordered.push('golden_baller');
  const teamSections = [...map.keys()].filter(key => !['golden_baller','contenders','top_keeper','defensive_rock','midfield_maestro','goal_machine','master_rookie','official_emblem','official_mascot','eternos_22'].includes(key)).sort((a,b) => map.get(a)[0].number - map.get(b)[0].number);
  ordered.push(...teamSections);
  ['contenders','top_keeper','defensive_rock','midfield_maestro','goal_machine','master_rookie','official_emblem','official_mascot','eternos_22'].forEach(key => { if (map.has(key)) ordered.push(key); });
  return ordered.map(key => ({ key, items: map.get(key).sort((a,b) => a.number - b.number) }));
};
const downloadBackup = stateObj => {
  const blob = new Blob([JSON.stringify(stateObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  el.backupSlot.innerHTML = `<a id="backupLink" class="backup-link" download="checklist-backup.json" href="${url}">Descargar backup</a>`;
};
const renderDashboard = () => {
  const total = state.cards.length;
  const owned = state.cards.filter(c => c.owned > 0).length;
  const duplicates = state.cards.reduce((sum, c) => sum + Math.max(0, c.owned - 1), 0);
  el.ownedCount.textContent = owned;
  el.missingCount.textContent = total - owned;
  el.duplicateCount.textContent = duplicates;
  el.progressPercent.textContent = `${Math.round((owned / total) * 100) || 0}%`;
};
const renderCards = () => {
  el.cardsGrid.innerHTML = '';
  buildSections(filteredCards()).forEach(section => {
    const owned = section.items.filter(card => card.owned > 0).length;
    const wrapper = document.createElement('section');
    wrapper.className = 'group';
    const head = document.createElement('div');
    head.className = 'group-head';
    const crest = crestUrl(section.key);
    head.innerHTML = `<div class="group-title">${crest ? `<img class="crest" src="${crest}" alt="${section.key}">` : '<span class="crest crest-fallback">★</span>'}<div><h2>${getSectionLabel(section.key)}</h2><p>${owned} de ${section.items.length}</p></div></div>`;
    const row = document.createElement('div');
    row.className = 'cards-row';
    section.items.forEach(card => {
      const node = el.template.content.firstElementChild.cloneNode(true);
      node.classList.toggle('owned', card.owned >= 1);
      node.querySelector('.num').textContent = `#${card.number}`;
      node.querySelector('.badge').textContent = card.owned > 1 ? `${card.owned}` : '';
      node.querySelector('.badge').style.display = card.owned > 1 ? 'grid' : 'none';
      node.querySelector('.name').textContent = card.name;
      node.querySelector('.team').textContent = card.team;
      node.querySelector('.meta').textContent = card.subtype.replaceAll('_', ' ');
      const img = node.querySelector('.thumb');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = card.image || placeholder;
      node.querySelector('.thumb-button').onclick = () => {
        el.modalImage.src = card.image || placeholder;
        el.imageModal.showModal();
      };
      node.querySelector('[data-action="increment"]').onclick = () => updateCard(card, 1);
      node.querySelector('[data-action="decrement"]').onclick = () => updateCard(card, -1);
      row.appendChild(node);
    });
    wrapper.append(head, row);
    el.cardsGrid.appendChild(wrapper);
  });
};
const fillFilters = () => {
  el.teamFilter.innerHTML = '<option value="">Todas las secciones</option>';
  el.typeFilter.innerHTML = '<option value="">Todos los tipos</option>';
  buildSections(state.cards).map(s => s.key).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = getSectionLabel(key);
    el.teamFilter.appendChild(option);
  });
  [...new Set(state.cards.map(c => c.type))].forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = getSectionLabel(type);
    el.typeFilter.appendChild(option);
  });
};
const ensureProfile = async user => {
  const { data: existing } = await supabase.from('app_users').select('*').eq('id', user.id).maybeSingle();
  if (!existing) {
    await supabase.from('app_users').insert({ id: user.id, email: user.email, display_name: user.user_metadata?.full_name || user.email });
  }
};
const ensureProject = async () => {
  const { data } = await supabase.from('platform_projects').select('*').eq('project_key', PROJECT_KEY).single();
  state.projectId = data.id;
  return data;
};
const ensureMembership = async user => {
  const { data: membership } = await supabase.from('project_memberships').select('*').eq('project_id', state.projectId).eq('user_id', user.id).maybeSingle();
  if (membership) return membership;
  const { data } = await supabase.from('project_memberships').insert({ project_id: state.projectId, user_id: user.id, role: 'user', status: 'active', plan: 'basic' }).select('*').single();
  return data;
};
const ensureChecklist = async user => {
  const { data: checklist } = await supabase.from('checklists').select('*').eq('project_id', state.projectId).eq('user_id', user.id).eq('collection_key', COLLECTION_KEY).maybeSingle();
  if (checklist) return checklist;
  const { data } = await supabase.from('checklists').insert({ project_id: state.projectId, user_id: user.id, collection_key: COLLECTION_KEY, name: 'Mi checklist' }).select('*').single();
  return data;
};
const loadChecklistCards = async checklistId => {
  const { data } = await supabase.from('checklist_cards').select('card_number, owned_count').eq('checklist_id', checklistId);
  const map = new Map((data || []).map(item => [item.card_number, item.owned_count]));
  state.cards = state.cards.map(card => ({ ...card, owned: map.get(card.number) || 0 }));
  downloadBackup(Object.fromEntries(state.cards.map(card => [card.id, card.owned])));
};
const persistChecklistCard = async card => {
  await supabase.from('checklist_cards').upsert({ checklist_id: state.checklistId, card_number: card.number, owned_count: card.owned }, { onConflict: 'checklist_id,card_number' });
  downloadBackup(Object.fromEntries(state.cards.map(item => [item.id, item.owned])));
};
const renderAdmin = async () => {
  const { data } = await supabase.from('project_memberships').select('id, role, status, plan, user_id, app_users(email)').eq('project_id', state.projectId).order('created_at');
  const rows = (data || []).map(item => `
    <tr>
      <td>${item.app_users?.email || item.user_id}</td>
      <td>${item.role}</td>
      <td>${item.plan}</td>
      <td>${item.status}</td>
      <td>
        <button data-action="toggle" data-id="${item.id}">${item.status === 'active' ? 'Desactivar' : 'Activar'}</button>
      </td>
    </tr>`).join('');
  el.adminTable.innerHTML = `<table><thead><tr><th>Email</th><th>Rol</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table>`;
  el.adminTable.querySelectorAll('button').forEach(button => {
    button.onclick = async () => {
      const membership = data.find(item => item.id === button.dataset.id);
      const nextStatus = membership.status === 'active' ? 'disabled' : 'active';
      await supabase.from('project_memberships').update({ status: nextStatus }).eq('id', membership.id);
      renderAdmin();
    };
  });
};
const showAdmin = async () => {
  state.isAdminView = true;
  el.appView.hidden = true;
  el.adminView.hidden = false;
  await renderAdmin();
};
const showApp = () => {
  state.isAdminView = false;
  el.adminView.hidden = true;
  el.appView.hidden = false;
};
const setActiveUser = async user => {
  state.activeUser = user;
  state.trialMode = false;
  await ensureProfile(user);
  await ensureProject();
  state.membership = await ensureMembership(user);
  if (state.membership.status !== 'active') {
    await supabase.auth.signOut();
    setLoginMessage('Cuenta desactivada.', true);
    return;
  }
  const checklist = await ensureChecklist(user);
  state.checklistId = checklist.id;
  await loadChecklistCards(checklist.id);
  el.currentUser.textContent = `${user.email}${state.membership.role === 'admin' ? ' · admin' : ''}`;
  el.loginScreen.hidden = true;
  el.appShell.hidden = false;
  el.adminLink.hidden = state.membership.role !== 'admin';
  renderDashboard();
  renderCards();
  showApp();
};
const updateCard = async (card, delta) => {
  card.owned = Math.max(0, card.owned + delta);
  await persistChecklistCard(card);
  renderDashboard();
  renderCards();
};
const handleEmailLogin = async event => {
  event.preventDefault();
  const email = el.emailInput.value.trim().toLowerCase();
  const password = el.passwordInput.value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const signUp = await supabase.auth.signUp({ email, password });
    if (signUp.error) return setLoginMessage(signUp.error.message, true);
    setLoginMessage('Cuenta creada. Revisa tu email si Supabase pide confirmación.');
    if (signUp.data.user) await setActiveUser(signUp.data.user);
    return;
  }
  setLoginMessage('');
  await setActiveUser(data.user);
};
const initGoogleLogin = () => {
  el.googleLoginButton.innerHTML = '<button type="button" id="googleDirectButton">Entrar con Google</button>';
  document.getElementById('googleDirectButton').onclick = async () => {
    const redirectTo = 'https://projects-portal.pages.dev/projects/checklist-adrenalyn-xl-worldcup-26/';
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  };
};
const logout = async () => {
  await supabase.auth.signOut();
  state.activeUser = null;
  state.membership = null;
  state.checklistId = null;
  state.trialMode = true;
  el.appShell.hidden = true;
  el.loginScreen.hidden = false;
  el.emailLoginForm.reset();
  setLoginMessage('');
};
const bindEvents = () => {
  ['input','change'].forEach(evt => {
    el.search.addEventListener(evt, () => { state.filters.q = el.search.value.trim().toLowerCase(); renderCards(); });
    el.teamFilter.addEventListener(evt, () => { state.filters.section = el.teamFilter.value; renderCards(); });
    el.typeFilter.addEventListener(evt, () => { state.filters.type = el.typeFilter.value; renderCards(); });
    el.statusFilter.addEventListener(evt, () => { state.filters.status = el.statusFilter.value; renderCards(); });
  });
  el.closeModal.onclick = () => el.imageModal.close();
  el.imageModal.addEventListener('click', event => { if (event.target === el.imageModal) el.imageModal.close(); });
  el.emailLoginForm.addEventListener('submit', handleEmailLogin);
  el.logoutButton.addEventListener('click', logout);
  el.adminLink.addEventListener('click', showAdmin);
  el.backToAppButton.addEventListener('click', showApp);
  el.createUserForm.addEventListener('submit', async event => {
    event.preventDefault();
    setAdminMessage('Para crear usuarios ahora mismo, usa alta normal por email o Google. La creación admin directa la conectamos después.', false);
  });
};
const init = async () => {
  state.cards = await fetch('./data/cards.json').then(r => r.json());
  fillFilters();
  bindEvents();
  initGoogleLogin();
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user) await setActiveUser(sessionData.session.user);
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) await setActiveUser(session.user);
    if (event === 'SIGNED_OUT') {
      state.activeUser = null;
      state.trialMode = true;
      el.appShell.hidden = true;
      el.loginScreen.hidden = false;
    }
  });
};
init();
