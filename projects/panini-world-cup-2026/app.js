const STORAGE_KEY = 'panini-world-cup-2026';
const PROJECT_KEY = 'panini-world-cup-2026';
const COLLECTION_KEY = 'panini-world-cup-2026';
const LOCALE_KEY = `${STORAGE_KEY}:locale`;
const REMEMBER_KEY = `${STORAGE_KEY}:remember`;
const REMEMBER_EMAIL_KEY = `${STORAGE_KEY}:remember:email`;
const runtimeConfig = window.CHECKLIST_SUPABASE_CONFIG || {};
const { dictionaries, defaultLocale } = window.ChecklistI18n;
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
  isAdminView: false,
  locale: localStorage.getItem(LOCALE_KEY) || defaultLocale
};
window.__checklistDebug = { state };
const trialSections = new Set(['page-001','page-002']);

const el = {
  loginScreen: document.getElementById('loginScreen'),
  appShell: document.getElementById('appShell'),
  emailLoginForm: document.getElementById('emailLoginForm'),
  emailInput: document.getElementById('emailInput'),
  passwordInput: document.getElementById('passwordInput'),
  togglePasswordButton: document.getElementById('togglePasswordButton'),
  emailSignInButton: document.getElementById('emailSignInButton'),
  emailSignUpButton: document.getElementById('emailSignUpButton'),
  loginMessage: document.getElementById('loginMessage'),
  currentUser: document.getElementById('currentUser'),
  adminLink: document.getElementById('adminLink'),
  trialUpgradeSlot: document.getElementById('trialUpgradeSlot'),
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
  lastScrollY: 0,
  backupSlot: document.getElementById('backupSlot'),
  backupUploadInput: document.getElementById('backupUploadInput'),
  backupUploadLabel: document.getElementById('backupUploadLabel'),
  appView: document.getElementById('appView'),
  adminView: document.getElementById('adminView'),
  adminTable: document.getElementById('adminTable'),
  adminMessage: document.getElementById('adminMessage'),
  backToAppButton: document.getElementById('backToAppButton'),
  localeSelectorTop: document.getElementById('localeSelectorTop'),
  localeSelectorLogin: document.getElementById('localeSelectorLogin'),
  rememberMeCheckbox: document.getElementById('rememberMeCheckbox'),
  rememberMeLabel: document.getElementById('rememberMeLabel')
};

const placeholder = './placeholder-card.svg';
const teamCodeMap = {};
const sectionTranslationKeys = {};

const t = key => key.split('.').reduce((acc, part) => acc?.[part], dictionaries[state.locale]) || key;
const crestUrl = () => '';
const getStatus = card => card.owned > 1 ? 'duplicates' : card.owned === 1 ? 'owned' : 'missing';
const getSectionKey = card => card.team;
const getSectionLabel = key => `Página ${Number(key.split('-').pop())}`;
const setLoginMessage = (text, error = false) => {
  el.loginMessage.textContent = text;
  el.loginMessage.dataset.error = error ? 'true' : 'false';
};
const setAdminMessage = (text, error = false) => {
  el.adminMessage.textContent = text;
  el.adminMessage.dataset.error = error ? 'true' : 'false';
};
const formatDate = value => value ? new Intl.DateTimeFormat(state.locale).format(new Date(value)) : '-';
const filteredCards = () => state.cards.filter(card => {
  const q = state.filters.q;
  return (!q || `${card.number} ${card.name} ${card.team}`.toLowerCase().includes(q))
    && (!state.filters.section || getSectionKey(card) === state.filters.section)
    && (!state.filters.type || card.type === state.filters.type)
    && (!state.filters.status || getStatus(card) === state.filters.status)
    && (!state.trialMode || trialSections.has(getSectionKey(card)));
});
const buildSections = list => {
  const map = new Map();
  list.forEach(card => {
    const key = getSectionKey(card);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(card);
  });
  const ordered = [...map.keys()].sort((a,b) => map.get(a)[0].number - map.get(b)[0].number);
  return ordered.map(key => ({ key, items: map.get(key).sort((a,b) => a.number - b.number) }));
};
const downloadBackup = stateObj => {
  const blob = new Blob([JSON.stringify(stateObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  el.backupSlot.innerHTML = `<a id="backupLink" class="backup-link" download="checklist-backup.json" href="${url}">${t('app.backup')}</a>`;
};
const renderTrialUpgradeButton = () => {
  const shouldShow = state.membership?.role !== 'admin' && state.membership?.plan !== 'paid';
  el.trialUpgradeSlot.hidden = !shouldShow;
  if (!shouldShow) {
    el.trialUpgradeSlot.innerHTML = '';
    return;
  }
  el.trialUpgradeSlot.innerHTML = `<button class="trial-upgrade-fallback" type="button">${t('login.unlockFull')}</button>`;
  el.trialUpgradeSlot.querySelector('button').onclick = () => window.open('https://ko-fi.com/U7U51ZIXYB', '_blank', 'noopener,noreferrer');
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
    wrapper.dataset.sectionKey = section.key;
    const head = document.createElement('div');
    head.className = 'group-head';
    const crest = crestUrl(section.key);
    head.innerHTML = `<div class="group-title"><span class="crest crest-fallback">📄</span><div><h2>${getSectionLabel(section.key)}</h2><p>${owned} de ${section.items.length}</p></div></div>`;
    const row = document.createElement('div');
    row.className = 'cards-row';
    section.items.forEach(card => {
      const node = el.template.content.firstElementChild.cloneNode(true);
      node.dataset.cardNumber = card.number;
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
      img.alt = `${card.name} ${card.team}`;
      node.querySelector('.thumb-button').onclick = () => {
        state.lastScrollY = window.scrollY;
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
  const currentSection = state.filters.section;
  const currentType = state.filters.type;
  const visibleCards = state.trialMode ? state.cards.filter(card => trialSections.has(getSectionKey(card))) : state.cards;
  const visibleSections = buildSections(visibleCards).map(s => s.key);
  const visibleTypes = [...new Set(visibleCards.map(c => c.type))];
  el.teamFilter.innerHTML = `<option value="">${t('app.allSections')}</option>`;
  el.typeFilter.innerHTML = `<option value="">${t('app.allTypes')}</option>`;
  visibleSections.forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = getSectionLabel(key);
    el.teamFilter.appendChild(option);
  });
  visibleTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = getSectionLabel(type);
    el.typeFilter.appendChild(option);
  });
  el.teamFilter.value = visibleSections.includes(currentSection) ? currentSection : '';
  el.typeFilter.value = visibleTypes.includes(currentType) ? currentType : '';
  if (!visibleSections.includes(currentSection)) state.filters.section = '';
  if (!visibleTypes.includes(currentType)) state.filters.type = '';
};
const ensureProfile = async user => {
  const { data: existing, error } = await supabase.from('app_users').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (!existing) {
    const { error: insertError } = await supabase.from('app_users').insert({ id: user.id, email: user.email, display_name: user.user_metadata?.full_name || user.email });
    if (insertError) throw insertError;
  }
};
const ensureProject = async () => {
  const { data, error } = await supabase.from('platform_projects').select('*').eq('project_key', PROJECT_KEY).maybeSingle();
  if (error) throw error;
  if (!data && state.membership?.project_id) {
    state.projectId = state.membership.project_id;
    return { id: state.projectId, project_key: PROJECT_KEY };
  }
  if (!data) throw new Error(t('errors.projectMissing'));
  state.projectId = data.id;
  return data;
};
const ensureMembership = async user => {
  const { data: membership, error } = await supabase.from('project_memberships').select('*').eq('project_id', state.projectId).eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  if (membership) return membership;
  const now = new Date();
  const trialEnds = new Date(now.getTime() + 183 * 24 * 60 * 60 * 1000);
  const { data, error: insertError } = await supabase.from('project_memberships').insert({ project_id: state.projectId, user_id: user.id, role: 'user', status: 'active', plan: 'basic', trial_started_at: now.toISOString(), trial_ends_at: trialEnds.toISOString() }).select('*').maybeSingle();
  if (insertError) throw insertError;
  return data;
};
const ensureChecklist = async user => {
  const { data: checklist, error } = await supabase.from('checklists').select('*').eq('project_id', state.projectId).eq('user_id', user.id).eq('collection_key', COLLECTION_KEY).maybeSingle();
  if (error) throw error;
  if (checklist) return checklist;
  const { data, error: insertError } = await supabase.from('checklists').insert({ project_id: state.projectId, user_id: user.id, collection_key: COLLECTION_KEY, name: 'Mi checklist' }).select('*').maybeSingle();
  if (insertError) throw insertError;
  return data;
};
const loadChecklistCards = async checklistId => {
  const { data, error } = await supabase.from('checklist_cards').select('card_number, owned_count').eq('checklist_id', checklistId);
  if (error) throw error;
  const map = new Map((data || []).map(item => [item.card_number, item.owned_count]));
  state.cards = state.cards.map(card => ({ ...card, owned: map.get(card.number) || 0 }));
  downloadBackup(Object.fromEntries(state.cards.map(card => [card.id, card.owned])));
};
const persistChecklistCard = async card => {
  await supabase.from('checklist_cards').upsert({ checklist_id: state.checklistId, card_number: card.number, owned_count: card.owned }, { onConflict: 'checklist_id,card_number' });
  downloadBackup(Object.fromEntries(state.cards.map(item => [item.id, item.owned])));
};
const importBackup = async file => {
  const text = await file.text();
  const parsed = JSON.parse(text);
  for (const card of state.cards) {
    card.owned = Math.max(0, Number(parsed[card.id] ?? parsed[String(card.number)] ?? 0) || 0);
  }
  const rows = state.cards.map(card => ({
    checklist_id: state.checklistId,
    card_number: card.number,
    owned_count: card.owned
  }));
  await supabase.from('checklist_cards').upsert(rows, { onConflict: 'checklist_id,card_number' });
  renderDashboard();
  renderCards();
  downloadBackup(Object.fromEntries(state.cards.map(item => [item.id, item.owned])));
};
const loadAdminUsers = async () => {
  const { data: memberships, error: membershipsError } = await supabase.from('project_memberships').select('id,user_id,role,plan,status,trial_started_at,trial_ends_at,deactivated_at').eq('project_id', state.projectId).order('created_at', { ascending: true });
  if (membershipsError) throw membershipsError;
  const members = memberships || [];
  const ids = [...new Set(members.map(item => item.user_id).filter(Boolean))];
  let userMap = new Map();
  if (ids.length) {
    const { data: users, error: usersError } = await supabase.from('app_users').select('id,email,display_name').in('id', ids);
    if (usersError) throw usersError;
    userMap = new Map((users || []).map(user => [user.id, user]));
  }
  return members.map(item => ({ ...item, email: userMap.get(item.user_id)?.email || item.user_id, displayName: userMap.get(item.user_id)?.display_name || '' }));
};
const renderAdmin = async () => {
  try {
    setAdminMessage('');
    const users = await loadAdminUsers();
    const rows = users.map(item => `
      <tr>
        <td>${item.email}</td>
        <td>${item.displayName || '-'}<\/td>
        <td>${item.role}<\/td>
        <td>
          <select data-plan="${item.id}" ${item.role === 'admin' ? 'disabled' : ''}>
            <option value="basic" ${item.plan === 'basic' ? 'selected' : ''}>trial<\/option>
            <option value="paid" ${item.plan === 'paid' ? 'selected' : ''}>paid<\/option>
          <\/select>
        <\/td>
        <td>
          <select data-status="${item.id}" ${item.role === 'admin' ? 'disabled' : ''}>
            <option value="active" ${item.status === 'active' ? 'selected' : ''}>active<\/option>
            <option value="disabled" ${item.status === 'disabled' ? 'selected' : ''}>disabled<\/option>
          <\/select>
        <\/td>
        <td>${formatDate(item.trial_started_at)}<\/td>
        <td>${formatDate(item.trial_ends_at)}<\/td>
        <td>${formatDate(item.deactivated_at)}<\/td>
      <\/tr>`).join('');
    el.adminTable.innerHTML = `<table><thead><tr><th>Email<\/th><th>Nombre<\/th><th>Rol<\/th><th>Plan<\/th><th>Estado<\/th><th>Trial inicio<\/th><th>Trial fin<\/th><th>Desactivado<\/th><\/tr><\/thead><tbody>${rows}<\/tbody><\/table>`;
    el.adminTable.querySelectorAll('select[data-plan]').forEach(select => {
      select.addEventListener('change', async () => {
        const plan = select.value;
        const now = new Date();
        const trialEnds = new Date(now.getTime() + 183 * 24 * 60 * 60 * 1000);
        const patch = plan === 'paid'
          ? { plan: 'paid', status: 'active', checklist_limit: 10, trial_started_at: null, trial_ends_at: null, deactivated_at: null, payment_note: 'admin update' }
          : { plan: 'basic', status: 'active', checklist_limit: 1, trial_started_at: now.toISOString(), trial_ends_at: trialEnds.toISOString(), deactivated_at: null, payment_note: 'admin update' };
        const { error } = await supabase.from('project_memberships').update(patch).eq('id', select.dataset.plan);
        if (error) return setAdminMessage(error.message, true);
        await renderAdmin();
      });
    });
    el.adminTable.querySelectorAll('select[data-status]').forEach(select => {
      select.addEventListener('change', async () => {
        const status = select.value;
        const patch = status === 'disabled'
          ? { status: 'disabled', deactivated_at: new Date().toISOString() }
          : { status: 'active', deactivated_at: null };
        const { error } = await supabase.from('project_memberships').update(patch).eq('id', select.dataset.status);
        if (error) return setAdminMessage(error.message, true);
        await renderAdmin();
      });
    });
  } catch (error) {
    console.error(error);
    setAdminMessage(error.message || 'Error cargando usuarios.', true);
  }
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
  try {
    await ensureProfile(user);
    await ensureProject();
    state.membership = await ensureMembership(user);
    if (state.membership.status !== 'active') {
      await supabase.auth.signOut();
      setLoginMessage(t('errors.accountDisabled'), true);
      return;
    }
    state.trialMode = state.membership.role !== 'admin' && state.membership.plan !== 'paid';
    const checklist = await ensureChecklist(user);
    state.checklistId = checklist.id;
    await loadChecklistCards(checklist.id);
    const planTag = state.membership.role === 'admin' ? t('common.adminPlan') : (state.membership.plan === 'paid' ? t('common.paidPlan') : t('common.trialPlan'));
    el.currentUser.textContent = `${user.email} · ${planTag}`;
    renderTrialUpgradeButton();
    el.loginScreen.style.display = 'none';
    el.loginScreen.hidden = true;
    el.appShell.hidden = false;
    el.appShell.style.display = 'block';
    el.adminLink.hidden = state.membership.role !== 'admin';
    if (state.membership.role === 'admin') {
      await showAdmin();
    } else {
      renderDashboard();
      renderCards();
      showApp();
    }
  } catch (error) {
    console.error(error);
    setLoginMessage(error.message || t('errors.loadAccount'), true);
  }
};
const updateVisibleCard = card => {
  const cardNode = document.querySelector(`.card-item[data-card-number="${card.number}"]`);
  if (!cardNode) return false;
  cardNode.classList.toggle('owned', card.owned >= 1);
  const badge = cardNode.querySelector('.badge');
  badge.textContent = card.owned > 1 ? `${card.owned}` : '';
  badge.style.display = card.owned > 1 ? 'grid' : 'none';
  return true;
};
const refreshSectionProgress = card => {
  const sectionKey = getSectionKey(card);
  const sectionNode = document.querySelector(`.group[data-section-key="${sectionKey}"]`);
  if (!sectionNode) return;
  const sectionCards = filteredCards().filter(item => getSectionKey(item) === sectionKey);
  const owned = sectionCards.filter(item => item.owned > 0).length;
  const progress = sectionNode.querySelector('.group-title p');
  if (progress) progress.textContent = `${owned} de ${sectionCards.length}`;
};
const updateCard = async (card, delta) => {
  const nextOwned = Math.max(0, card.owned + delta);
  if (nextOwned === card.owned) return;
  card.owned = nextOwned;
  await persistChecklistCard(card);
  renderDashboard();
  updateVisibleCard(card);
  refreshSectionProgress(card);
};
const getEmailCredentials = () => ({
  email: el.emailInput.value.trim().toLowerCase(),
  password: el.passwordInput.value
});
const persistRememberMe = () => {
  if (el.rememberMeCheckbox.checked) {
    localStorage.setItem(REMEMBER_KEY, '1');
    localStorage.setItem(REMEMBER_EMAIL_KEY, el.emailInput.value.trim().toLowerCase());
  } else {
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(REMEMBER_EMAIL_KEY);
  }
};
const handleEmailSignIn = async () => {
  const { email, password } = getEmailCredentials();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return setLoginMessage(error.message, true);
  persistRememberMe();
  setLoginMessage('');
  if (data.user) await setActiveUser(data.user);
};
const handleEmailSignUp = async () => {
  const { email, password } = getEmailCredentials();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return setLoginMessage(error.message, true);
  persistRememberMe();
  setLoginMessage(t('errors.accountCreatedSignIn'));
  if (data.user) await setActiveUser(data.user);
};
const logout = async () => {
  const keepRemember = el.rememberMeCheckbox.checked;
  await supabase.auth.signOut();
  state.activeUser = null;
  state.membership = null;
  state.checklistId = null;
  state.trialMode = true;
  el.appShell.hidden = true;
  el.appShell.style.display = 'none';
  el.trialUpgradeSlot.innerHTML = '';
  el.trialUpgradeSlot.hidden = true;
  el.loginScreen.hidden = false;
  el.loginScreen.style.display = 'grid';
  el.emailLoginForm.reset();
  if (keepRemember) {
    el.emailInput.value = localStorage.getItem(REMEMBER_EMAIL_KEY) || '';
    el.rememberMeCheckbox.checked = true;
  }
  setLoginMessage('');
};
const applyTranslations = () => {
  document.documentElement.lang = dictionaries[state.locale].htmlLang;
  document.title = t('pageTitle');
  document.getElementById('loginTitle').textContent = t('login.title');
  document.getElementById('loginSubtitle').textContent = t('login.subtitle');
  el.emailInput.placeholder = t('login.emailPlaceholder');
  el.passwordInput.placeholder = t('login.passwordPlaceholder');
  el.togglePasswordButton.textContent = el.passwordInput.type === 'password' ? t('login.showPassword') : t('login.hidePassword');
  el.emailSignInButton.textContent = t('login.signIn');
  el.emailSignUpButton.textContent = t('login.signUp');
  el.rememberMeLabel.textContent = t('login.rememberMe');
  document.getElementById('appTitle').textContent = t('app.title');
  document.getElementById('appSubtitle').textContent = t('app.subtitle');
  el.adminLink.textContent = 'Admin';
  el.logoutButton.textContent = t('app.logout');
  document.getElementById('labelOwned').textContent = t('app.owned');
  document.getElementById('labelMissing').textContent = t('app.missing');
  document.getElementById('labelDuplicates').textContent = t('app.duplicates');
  document.getElementById('labelCompleted').textContent = t('app.completed');
  el.search.placeholder = t('app.searchPlaceholder');
  el.statusFilter.innerHTML = `<option value="">${t('app.allStatuses')}</option><option value="owned">${t('app.statusOwned')}</option><option value="missing">${t('app.statusMissing')}</option><option value="duplicates">${t('app.statusDuplicates')}</option>`;
  document.getElementById('legendOwned').textContent = t('app.statusOwned');
  document.getElementById('legendMissing').textContent = t('app.statusMissing');
  document.getElementById('legendDuplicates').textContent = t('app.statusDuplicates');
  el.backupUploadLabel.textContent = 'Cargar backup';
  el.localeSelectorTop.value = state.locale;
  el.localeSelectorLogin.value = state.locale;
  fillFilters();
  if (state.isAdminView) renderAdmin();
  else if (!el.appShell.hidden) {
    renderDashboard();
    renderCards();
  }
};
const setLocale = locale => {
  state.locale = dictionaries[locale] ? locale : defaultLocale;
  localStorage.setItem(LOCALE_KEY, state.locale);
  applyTranslations();
};
const bindEvents = () => {
  ['input','change'].forEach(evt => {
    el.search.addEventListener(evt, () => { state.filters.q = el.search.value.trim().toLowerCase(); renderCards(); });
    el.teamFilter.addEventListener(evt, () => { state.filters.section = el.teamFilter.value; renderCards(); });
    el.typeFilter.addEventListener(evt, () => { state.filters.type = el.typeFilter.value; renderCards(); });
    el.statusFilter.addEventListener(evt, () => { state.filters.status = el.statusFilter.value; renderCards(); });
  });
  el.closeModal.onclick = () => {
    el.imageModal.close();
    window.scrollTo(0, state.lastScrollY || 0);
  };
  el.imageModal.addEventListener('click', event => {
    if (event.target === el.imageModal) {
      el.imageModal.close();
      window.scrollTo(0, state.lastScrollY || 0);
    }
  });
  el.imageModal.addEventListener('close', () => {
    window.scrollTo(0, state.lastScrollY || 0);
  });
  el.emailLoginForm.addEventListener('submit', event => event.preventDefault());
  el.togglePasswordButton.addEventListener('click', () => {
    const hidden = el.passwordInput.type === 'password';
    el.passwordInput.type = hidden ? 'text' : 'password';
    el.togglePasswordButton.textContent = hidden ? t('login.hidePassword') : t('login.showPassword');
  });
  el.emailSignInButton.addEventListener('click', handleEmailSignIn);
  el.emailSignUpButton.addEventListener('click', handleEmailSignUp);
  el.logoutButton.addEventListener('click', logout);
  el.adminLink.addEventListener('click', showAdmin);
  el.backToAppButton.addEventListener('click', showApp);
  el.localeSelectorTop.addEventListener('change', event => setLocale(event.target.value));
  el.localeSelectorLogin.addEventListener('change', event => setLocale(event.target.value));
  el.rememberMeCheckbox.addEventListener('change', persistRememberMe);
  el.backupUploadInput.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importBackup(file);
      setLoginMessage('');
    } catch (error) {
      console.error(error);
      setLoginMessage('Backup no válido.', true);
    }
    event.target.value = '';
  });
};
const init = async () => {
  state.cards = await fetch('./data/cards.json').then(r => r.json());
  bindEvents();
  const params = new URLSearchParams(window.location.search);
  const forceLogout = params.get('logout') === '1';
  const remembered = !forceLogout && localStorage.getItem(REMEMBER_KEY) === '1';
  if (forceLogout) {
    sessionStorage.clear();
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(REMEMBER_EMAIL_KEY);
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) localStorage.removeItem(key);
    });
    await supabase.auth.signOut().catch(() => {});
    history.replaceState({}, '', window.location.pathname);
  }
  el.rememberMeCheckbox.checked = remembered;
  if (remembered) el.emailInput.value = localStorage.getItem(REMEMBER_EMAIL_KEY) || '';

  applyTranslations();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!forceLogout && sessionData.session?.user) await setActiveUser(sessionData.session.user);
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) await setActiveUser(session.user);
    if (event === 'SIGNED_OUT') {
      state.activeUser = null;
      state.trialMode = true;
      el.appShell.hidden = true;
      el.appShell.style.display = 'none';
      el.trialUpgradeSlot.innerHTML = '';
      el.trialUpgradeSlot.hidden = true;
      el.loginScreen.hidden = false;
      el.loginScreen.style.display = 'grid';
    }
  });
};
init();
