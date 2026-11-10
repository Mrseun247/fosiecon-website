// pages/pages.js — all page loaders, renderers, and form handlers for FOSIECON

// ── Small helpers ────────────────────────────────────────────
function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
function esc(s) { return (s || '').toString().replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : ''; }

async function loadTicker() {
  try {
    const { data: settings } = await api.settings.getPublic();
    if (settings.ticker_messages) {
      const inner = document.getElementById('ticker-inner');
      if (inner) inner.innerHTML = settings.ticker_messages.map((m) => `<span>${esc(m)}</span>`).join('');
    }
  } catch (err) { console.warn('[ticker] load failed:', err.message); }
}

// ============================================================
// HOME
// ============================================================
window.load_home = async function () {
  try {
    const { data: settings } = await api.settings.getPublic();
    if (settings.commission_stats) {
      const s = settings.commission_stats;
      setText('stat-states', s.memberStates);
      setText('stat-year', s.yearEstablished);
      setText('stat-staff', s.staffCount);
    }
  } catch (err) { console.warn('[home] settings load failed:', err.message); }

  try {
    const { data: articles } = await api.news.getPublished('?limit=3');
    const grid = document.getElementById('home-news-grid');
    if (grid) grid.innerHTML = articles.length ? articles.map(newsCard).join('') : '<p class="empty-state">No news published yet.</p>';
  } catch (err) {
    const grid = document.getElementById('home-news-grid');
    if (grid) grid.innerHTML = `<p class="error-state">Could not load news.</p>`;
  }
};

// ============================================================
// ABOUT
// ============================================================
window.load_about = async function () {
  try {
    const { data: chairman } = await api.team.getChairman();
    const el = document.getElementById('about-chairman-photo');
    // Only override the static default photo once the CMS actually has one on
    // file — keeps the id on the replacement so this still works the second
    // time this page loads, instead of only on first navigation.
    if (el && chairman.photo) {
      el.outerHTML = `<img src="${chairman.photo}" alt="${esc(chairman.fullName)}" class="chairman-photo" id="about-chairman-photo">`;
    }
  } catch (err) { /* keep the static default photo */ }
};

// ============================================================
// SERVICES — fully static, no load function needed
// ============================================================

// ============================================================
// NEWS
// ============================================================
const NEWS_EMOJI = { communique: '📋', press_release: '📢', election_observation: '👁️', advocacy: '📣', training: '🎓', partnership: '🤝', announcement: '📰', member_news: '🏛️', other: '📰' };

function newsCard(a) {
  const hasMedia = a.mediaType === 'video' || a.mediaType === 'audio';
  return `
    <div class="news-card" onclick="openArticle('${a.slug}')">
      <div class="news-img${hasMedia ? ' has-media' : ''}">${a.featuredImage ? `<img src="${a.featuredImage}" alt="${esc(a.title)}">` : (NEWS_EMOJI[a.category] || '📰')}</div>
      <div class="news-body">
        <div class="news-tag">${(a.category || 'news').replace(/_/g, ' ')}</div>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.excerpt || '')}</p>
        <div class="news-date">📅 ${fmtDate(a.publishedAt)}</div>
      </div>
    </div>`;
}

window.load_news = async function () {
  const grid = document.getElementById('news-container');
  if (!grid) return;
  grid.innerHTML = '<div class="loading">Loading articles…</div>';
  try {
    const { data } = await api.news.getPublished();
    grid.innerHTML = data.length ? data.map(newsCard).join('') : '<p class="empty-state">No articles published yet.</p>';
  } catch (err) {
    grid.innerHTML = `<p class="error-state">Could not load news. ${esc(err.message)}</p>`;
  }
};

window.openArticle = async function (slug) {
  try {
    const { data: article } = await api.news.getOne(slug);
    document.getElementById('modal-title').textContent = article.title;
    document.getElementById('modal-content').innerHTML = article.content;
    document.getElementById('modal-date').textContent = fmtDate(article.publishedAt);

    const mediaEl = document.getElementById('modal-media');
    if (mediaEl) {
      mediaEl.innerHTML = '';
      if (article.mediaType === 'video' && article.mediaUrl) {
        mediaEl.innerHTML = `<video src="${article.mediaUrl}" controls></video>`;
      } else if (article.mediaType === 'audio' && article.mediaUrl) {
        mediaEl.innerHTML = `<audio src="${article.mediaUrl}" controls></audio>`;
      }
    }
    document.getElementById('article-modal').classList.add('open');
  } catch (err) { alert('Could not load article: ' + err.message); }
};

window.closeArticleModal = function () {
  const modal = document.getElementById('article-modal');
  modal.classList.remove('open');
  const media = document.getElementById('modal-media');
  if (media) media.innerHTML = '';
};

// ============================================================
// GALLERY
// ============================================================
window.load_gallery = async function () {
  const container = document.getElementById('gallery-container');
  if (!container) return;
  container.innerHTML = '<div class="loading">Loading gallery…</div>';
  try {
    const { data } = await api.gallery.getAll();
    if (!data.length) { container.innerHTML = '<p class="empty-state">No gallery items yet.</p>'; return; }

    const groups = {};
    data.forEach((item) => {
      const cat = (item.category || 'other').replace(/_/g, ' ');
      (groups[cat] = groups[cat] || []).push(item);
    });

    container.innerHTML = Object.entries(groups).map(([cat, items], i) => `
      <div class="gallery-group ${i === 0 ? 'open' : ''}">
        <div class="gallery-group-header" onclick="this.parentElement.classList.toggle('open')">
          <span>${esc(cat)} (${items.length})</span>
          <span class="gallery-toggle">▾</span>
        </div>
        <div class="gallery-group-body">
          ${items.map((item) => `
            <div class="gallery-item${item.mediaType === 'video' ? ' video-item' : ''}" onclick='openGalleryItem(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
              ${item.thumbnailPath || item.filePath
                ? `<img src="${item.thumbnailPath || item.filePath}" alt="${esc(item.title)}">`
                : `<div class="gallery-placeholder">🖼️<span>${esc(item.title)}</span></div>`}
              <div class="gallery-caption">${esc(item.title)}</div>
            </div>`).join('')}
        </div>
      </div>`).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-state">Could not load gallery. ${esc(err.message)}</p>`;
  }
};

window.openGalleryItem = function (item) {
  const mediaEl = document.getElementById('gallery-modal-media');
  if (item.mediaType === 'video' && item.videoUrl) {
    mediaEl.innerHTML = `<div style="position:relative;padding-top:56.25%;"><iframe src="${item.videoUrl}" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`;
  } else {
    mediaEl.innerHTML = `<img src="${item.filePath}" class="gallery-modal-image" alt="${esc(item.title)}">`;
  }
  document.getElementById('gallery-modal-title').textContent = item.title;
  document.getElementById('gallery-modal-caption').textContent = item.description || '';
  document.getElementById('gallery-modal').classList.add('open');
};

window.closeGalleryModal = function () {
  document.getElementById('gallery-modal').classList.remove('open');
  document.getElementById('gallery-modal-media').innerHTML = '';
};

// ============================================================
// TESTIMONIALS
// ============================================================
window.load_testimonials = async function () {
  const container = document.getElementById('testimonials-container');
  if (!container) return;
  container.innerHTML = '<div class="loading">Loading testimonials…</div>';
  try {
    const { data } = await api.testimonials.getApproved();
    container.innerHTML = data.length ? data.map((t) => `
      <div class="testimonial-card">
        <div class="stars">${'★'.repeat(t.rating || 5)}${'☆'.repeat(5 - (t.rating || 5))}</div>
        <p>"${esc(t.content)}"</p>
        <div class="testimonial-author">${esc(t.authorName)}${t.authorTitle ? `<span>${esc(t.authorTitle)}</span>` : ''}</div>
      </div>`).join('') : '<p class="empty-state">No testimonials yet.</p>';
  } catch (err) {
    container.innerHTML = `<p class="error-state">Could not load testimonials.</p>`;
  }
};

window.submitTestimonial = async function (e) {
  e.preventDefault();
  const successEl = document.getElementById('t-success');
  const errorEl = document.getElementById('t-error');
  successEl.style.display = 'none'; errorEl.style.display = 'none';
  try {
    await api.testimonials.submit({
      authorName: document.getElementById('t-name').value,
      authorTitle: document.getElementById('t-title').value,
      content: document.getElementById('t-content').value,
    });
    successEl.style.display = 'block';
    document.getElementById('testimonial-form').reset();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
};

// ============================================================
// FAQ
// ============================================================
window.load_faq = async function () {
  const container = document.getElementById('faq-container');
  if (!container) return;
  container.innerHTML = '<div class="loading">Loading FAQs…</div>';
  try {
    const { data } = await api.faqs.getPublished();
    container.innerHTML = data.length ? data.map((f, i) => `
      <div class="faq-item">
        <div class="faq-question" onclick="this.parentElement.classList.toggle('open')">
          <span>${esc(f.question)}</span><span class="faq-toggle">+</span>
        </div>
        <div class="faq-answer"><div class="faq-answer-inner">${esc(f.answer)}</div></div>
      </div>`).join('') : '<p class="empty-state">No FAQs yet.</p>';
  } catch (err) {
    container.innerHTML = `<p class="error-state">Could not load FAQs.</p>`;
  }
};

// ============================================================
// TEAM / MEMBER COMMISSIONS
// ============================================================
window.load_team = async function () {
  const chairmanEl = document.getElementById('chairman-full-container');
  const teamEl = document.getElementById('team-container');
  const membersEl = document.getElementById('members-container');

  const chairmanFallback = {
    title: 'Hon.', fullName: 'Mamman Nda Eri', role: 'Chairman of the Forum',
    photo: 'images/chairman.jpg',
    bio: 'Hon. Mamman Nda Eri coordinates the 36 State Independent Electoral Commissions on electoral ' +
      'processes in line with the Constitution and the Electoral Act 2026.',
  };

  function renderChairmanCard(chairman) {
    if (!chairmanEl) return;
    chairmanEl.innerHTML = `
      <div class="chairman-full-card">
        <div class="chairman-photo-wrap large">
          ${chairman.photo
            ? `<img src="${chairman.photo}" alt="${esc(chairman.fullName)}" class="chairman-photo large">`
            : `<div class="chairman-photo-placeholder large">FN</div>`}
        </div>
        <div class="eyebrow">Chairman of the Forum</div>
        <h2>${esc(chairman.title || '')} ${esc(chairman.fullName)}</h2>
        <div class="chairman-role-badge">${esc(chairman.role)}</div>
        <p>${esc(chairman.bio || '')}</p>
      </div>`;
  }

  try {
    const { data: chairman } = await api.team.getChairman();
    renderChairmanCard(chairman);
  } catch (err) {
    // CMS unreachable or no chairman record yet — fall back to the known
    // real chairman info rather than showing nothing.
    renderChairmanCard(chairmanFallback);
  }

  try {
    const { data } = await api.team.getAll();
    const rest = data.filter((m) => !m.isChairman);
    if (teamEl) {
      teamEl.innerHTML = rest.length ? rest.map((m) => `
        <div class="team-card">
          <div class="team-photo-wrap">
            ${m.photo ? `<img src="${m.photo}" alt="${esc(m.fullName)}" class="team-photo-img">` : `<div class="team-photo">${esc((m.fullName || '?').charAt(0))}</div>`}
          </div>
          <h3>${esc(m.title || '')} ${esc(m.fullName)}</h3>
          <div class="team-role">${esc(m.role)}</div>
          <p>${esc(m.representingState ? `Representing ${m.representingState} State` : '')}</p>
        </div>`).join('') : '';
    }
  } catch (err) { console.warn('[team] load failed:', err.message); }

  try {
    const { data } = await api.members.getAll();
    if (membersEl) {
      membersEl.innerHTML = data.length ? data.map((m) => `
        <div class="member-card">
          <div class="member-state">${esc(m.state)}</div>
          ${m.abbreviation ? `<div class="member-abbr">${esc(m.abbreviation)}</div>` : ''}
          <div class="member-name">${esc(m.commissionName)}</div>
        </div>`).join('') : '<p class="empty-state">No member commissions listed yet.</p>';
    }
  } catch (err) {
    if (membersEl) membersEl.innerHTML = `<p class="error-state">Could not load member commissions.</p>`;
  }
};

// ============================================================
// EVENTS
// ============================================================
window.load_events = async function () {
  const container = document.getElementById('events-container');
  if (!container) return;
  container.innerHTML = '<div class="loading">Loading events…</div>';
  try {
    const { data } = await api.events.getAll();
    container.innerHTML = data.length ? data.map((e) => {
      const d = new Date(e.eventDate);
      return `
        <div class="event-card">
          <div class="event-date-box"><span class="day">${d.getDate()}</span><span class="mon">${d.toLocaleDateString('en-NG', { month: 'short' })}</span></div>
          <div>
            <h3>${esc(e.title)}</h3>
            <p>${esc(e.description || '')}</p>
            <div class="event-meta">${esc(e.venue || '')}${e.time ? ' · ' + esc(e.time) : ''}</div>
          </div>
        </div>`;
    }).join('') : '<p class="empty-state">No upcoming events.</p>';
  } catch (err) {
    container.innerHTML = `<p class="error-state">Could not load events.</p>`;
  }
};

// ============================================================
// CONTACT
// ============================================================
window.submitInquiry = async function (e) {
  e.preventDefault();
  const successEl = document.getElementById('c-success');
  const errorEl = document.getElementById('c-error');
  successEl.style.display = 'none'; errorEl.style.display = 'none';
  try {
    await api.inquiries.submit({
      fullName: document.getElementById('c-name').value,
      email: document.getElementById('c-email').value,
      phone: document.getElementById('c-phone').value,
      subject: document.getElementById('c-subject').value,
      message: document.getElementById('c-message').value,
    });
    successEl.style.display = 'block';
    document.getElementById('contact-form').reset();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
};

// ============================================================
// LOGIN / REGISTER
// ============================================================
window.load_login = async function () {
  if (Auth.isLoggedIn()) { Router.navigate(Auth.isAdmin() ? 'admin' : 'dashboard'); return; }
  try {
    const { data: members } = await api.members.getAll();
    const select = document.getElementById('reg-commission');
    if (select) select.innerHTML = '<option value="">— Select —</option>' + members.map((m) => `<option value="${m._id}">${esc(m.state)} — ${esc(m.commissionName)}</option>`).join('');
  } catch (err) { /* optional field — fine if it stays empty */ }
};

window.toggleAuthForm = function () {
  const login = document.getElementById('login-form');
  const register = document.getElementById('register-form');
  const isLogin = login.style.display !== 'none';
  login.style.display = isLogin ? 'none' : '';
  register.style.display = isLogin ? '' : 'none';
  setText('auth-heading', isLogin ? 'Create Your Account' : 'Welcome Back');
  setText('auth-subtext', isLogin ? 'Register as a member-state representative.' : 'Sign in to access your FOSIECON member account.');
};

window.handleLogin = async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('login-error');
  errorEl.style.display = 'none';
  try {
    const user = await Auth.login(document.getElementById('login-email').value, document.getElementById('login-password').value);
    renderNavForRole();
    Router.navigate(['super_admin', 'admin', 'staff'].includes(user.role) ? 'admin' : 'dashboard');
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
};

window.handleRegister = async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('register-error');
  errorEl.style.display = 'none';
  try {
    await Auth.register({
      fullName: document.getElementById('reg-name').value,
      email: document.getElementById('reg-email').value,
      phone: document.getElementById('reg-phone').value,
      memberCommission: document.getElementById('reg-commission').value || undefined,
      password: document.getElementById('reg-password').value,
    });
    renderNavForRole();
    Router.navigate('dashboard');
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
};

// ============================================================
// MEMBER DASHBOARD
// ============================================================
window.load_dashboard = async function () {
  const content = document.getElementById('dashboard-content');
  if (!content) return;
  const user = Auth.getUser();
  if (!user) { Router.navigate('login'); return; }

  content.innerHTML = `
    <div class="chairman-card" style="grid-template-columns:1fr;max-width:none;text-align:left;">
      <div>
        <h2 style="font-family:var(--font-display);color:var(--navy);margin-bottom:4px;">${esc(user.fullName)}</h2>
        <p style="color:var(--slate-light);font-size:14px;margin-bottom:20px;">${esc(user.email)}${user.phone ? ' · ' + esc(user.phone) : ''}</p>

        <h4 style="font-family:var(--font-display);color:var(--navy);margin-bottom:10px;">Change Password</h4>
        <form id="dash-password-form" onsubmit="changeOwnPassword(event)" style="max-width:360px;">
          <div class="form-group"><label>Current Password</label><input type="password" id="dash-current-pw" required></div>
          <div class="form-group"><label>New Password</label><input type="password" id="dash-new-pw" required minlength="8"></div>
          <button class="btn-primary" type="submit">Update Password</button>
          <div class="form-success" id="dash-pw-success">Password updated.</div>
          <div class="form-error" id="dash-pw-error"></div>
        </form>
      </div>
    </div>`;
};

window.changeOwnPassword = async function (e) {
  e.preventDefault();
  const successEl = document.getElementById('dash-pw-success');
  const errorEl = document.getElementById('dash-pw-error');
  successEl.style.display = 'none'; errorEl.style.display = 'none';
  try {
    await api.auth.changePassword({
      currentPassword: document.getElementById('dash-current-pw').value,
      newPassword: document.getElementById('dash-new-pw').value,
    });
    successEl.style.display = 'block';
    document.getElementById('dash-password-form').reset();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
};

// ============================================================
// PRIVACY — fully static, no load function needed
// ============================================================

// ============================================================
// ADMIN PANEL
// ============================================================
let currentAdminTab = 'dashboard';

window.load_admin = async function () {
  const user = Auth.getUser();
  setText('admin-user-label', user ? `${user.fullName} (${user.role})` : '');
  switchAdminTab(currentAdminTab);
};

window.switchAdminTab = function (tab) {
  currentAdminTab = tab;
  document.querySelectorAll('.admin-tab-btn').forEach((b) => b.classList.toggle('btn-primary', b.dataset.tab === tab));
  document.querySelectorAll('.admin-tab-btn').forEach((b) => b.classList.toggle('btn-outline', b.dataset.tab !== tab));
  const renderers = {
    dashboard: adminRenderDashboard, news: adminRenderNews, team: adminRenderTeam,
    members: adminRenderMembers, gallery: adminRenderGallery, events: adminRenderEvents,
    downloads: adminRenderDownloads, testimonials: adminRenderTestimonials, faqs: adminRenderFaqs,
    inquiries: adminRenderInquiries, users: adminRenderUsers,
  };
  (renderers[tab] || adminRenderDashboard)();
};

function adminContent() { return document.getElementById('admin-content'); }

// ── Dashboard tab ───────────────────────────────────────────
async function adminRenderDashboard() {
  const el = adminContent();
  el.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const [inquiries, logs] = await Promise.all([
      api.inquiries.getAll('?limit=1'),
      Auth.isSuperAdmin() ? api.auth.logsSummary() : Promise.resolve({ data: null }),
    ]);
    el.innerHTML = `
      <div class="stats-grid" style="max-width:600px;">
        <div><span class="stat-num">${inquiries.unreadCount || 0}</span><div class="stat-label">Unread Inquiries</div></div>
        ${logs.data ? `<div><span class="stat-num">${logs.data.loginsToday}</span><div class="stat-label">Logins Today</div></div>
        <div><span class="stat-num">${logs.data.lockedAccounts}</span><div class="stat-label">Locked Accounts</div></div>` : ''}
      </div>
      <p style="margin-top:24px;color:var(--slate-light);font-size:14px;">Use the tabs above to manage site content: news, team, member commissions, gallery, events, downloads, testimonials, FAQs, inquiries, and users.</p>`;
  } catch (err) {
    el.innerHTML = `<p class="error-state">${esc(err.message)}</p>`;
  }
}

// ── Generic admin list/form scaffolding helper ──────────────
function adminFormShell(title, formHtml) {
  return `<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-bottom:24px;max-width:700px;">
    <h3 style="font-family:var(--font-display);color:var(--navy);margin-bottom:16px;">${title}</h3>
    ${formHtml}
  </div>`;
}

// ── News tab ─────────────────────────────────────────────────
let editingNewsId = null;
async function adminRenderNews() {
  const el = adminContent();
  el.innerHTML = adminFormShell('Add / Edit Article', `
    <form id="admin-news-form" onsubmit="adminSaveNews(event)">
      <div class="form-group"><label>Title</label><input type="text" id="an-title" required></div>
      <div class="form-row">
        <div class="form-group"><label>Category</label>
          <select id="an-category">
            <option value="communique">Communiqué</option>
            <option value="press_release">Press Release</option>
            <option value="election_observation">Election Observation</option>
            <option value="advocacy">Advocacy</option>
            <option value="training">Training</option>
            <option value="partnership">Partnership</option>
            <option value="announcement">Announcement</option>
            <option value="member_news">Member News</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group"><label>Status</label>
          <select id="an-status"><option value="draft">Draft</option><option value="published">Published</option></select>
        </div>
      </div>
      <div class="form-group"><label>Excerpt</label><textarea id="an-excerpt" maxlength="500"></textarea></div>
      <div class="form-group"><label>Content</label><textarea id="an-content" required style="min-height:200px;"></textarea></div>
      <div class="form-group"><label>Featured Image</label><input type="file" id="an-image" accept="image/*"></div>
      <button class="btn-primary" type="submit">Save Article</button>
      <button class="btn-outline" type="button" onclick="adminResetNews()">New Article</button>
      <div class="form-error" id="an-error"></div>
    </form>`);
  el.innerHTML += '<div id="admin-news-list"><div class="loading">Loading…</div></div>';
  await adminLoadNewsList();
}

async function adminLoadNewsList() {
  try {
    const { data } = await api.news.getAll();
    document.getElementById('admin-news-list').innerHTML = data.length ? `<table style="width:100%;border-collapse:collapse;" >${data.map((a) => `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:10px;font-size:13px;">${esc(a.title)} <span class="badge-${a.status === 'published' ? 'active' : 'draft'}">${a.status}</span></td>
        <td style="padding:10px;text-align:right;white-space:nowrap;">
          <button class="btn-outline" style="padding:5px 10px;font-size:12px;" onclick="adminEditNews('${a._id}')">Edit</button>
          <button class="btn-danger" style="padding:5px 10px;font-size:12px;" onclick="adminDeleteNews('${a._id}')">Delete</button>
        </td>
      </tr>`).join('')}</table>` : '<p class="empty-state">No articles yet.</p>';
  } catch (err) { document.getElementById('admin-news-list').innerHTML = `<p class="error-state">${esc(err.message)}</p>`; }
}

window.adminResetNews = function () {
  editingNewsId = null;
  document.getElementById('admin-news-form').reset();
};

window.adminEditNews = async function (id) {
  const { data: a } = await api.news.getOneById(id);
  editingNewsId = id;
  document.getElementById('an-title').value = a.title;
  document.getElementById('an-category').value = a.category;
  document.getElementById('an-status').value = a.status;
  document.getElementById('an-excerpt').value = a.excerpt || '';
  document.getElementById('an-content').value = a.content;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.adminSaveNews = async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('an-error');
  errorEl.style.display = 'none';
  const fd = new FormData();
  fd.append('title', document.getElementById('an-title').value);
  fd.append('category', document.getElementById('an-category').value);
  fd.append('status', document.getElementById('an-status').value);
  fd.append('excerpt', document.getElementById('an-excerpt').value);
  fd.append('content', document.getElementById('an-content').value);
  const imgFile = document.getElementById('an-image').files[0];
  if (imgFile) fd.append('featuredImage', imgFile);
  try {
    if (editingNewsId) await api.news.update(editingNewsId, fd);
    else await api.news.create(fd);
    adminResetNews();
    adminLoadNewsList();
  } catch (err) { errorEl.textContent = err.message; errorEl.style.display = 'block'; }
};

window.adminDeleteNews = async function (id) {
  if (!confirm('Delete this article?')) return;
  await api.news.delete(id);
  adminLoadNewsList();
};

// ── Team tab ─────────────────────────────────────────────────
let editingTeamId = null;
async function adminRenderTeam() {
  const el = adminContent();
  el.innerHTML = adminFormShell('Add / Edit Team Member', `
    <form id="admin-team-form" onsubmit="adminSaveTeam(event)">
      <div class="form-row">
        <div class="form-group"><label>Title</label><input type="text" id="at-title" placeholder="Hon., Dr., Barr."></div>
        <div class="form-group"><label>Full Name</label><input type="text" id="at-name" required></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Role</label><input type="text" id="at-role" required placeholder="e.g. Secretary-General"></div>
        <div class="form-group"><label>Category</label>
          <select id="at-category"><option value="exco">Exco</option><option value="secretariat">Secretariat</option><option value="member_state_rep">Member-State Rep</option><option value="support">Support</option></select>
        </div>
      </div>
      <div class="form-group"><label>Is Chairman?</label><select id="at-chairman"><option value="false">No</option><option value="true">Yes</option></select></div>
      <div class="form-group"><label>Bio</label><textarea id="at-bio"></textarea></div>
      <div class="form-group"><label>Photo</label><input type="file" id="at-photo" accept="image/*"></div>
      <button class="btn-primary" type="submit">Save Team Member</button>
      <button class="btn-outline" type="button" onclick="adminResetTeam()">New Member</button>
      <div class="form-error" id="at-error"></div>
    </form>`);
  el.innerHTML += '<div id="admin-team-list"><div class="loading">Loading…</div></div>';
  await adminLoadTeamList();
}

async function adminLoadTeamList() {
  try {
    const { data } = await api.team.getAll();
    document.getElementById('admin-team-list').innerHTML = data.length ? `<table style="width:100%;border-collapse:collapse;">${data.map((m) => `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:10px;font-size:13px;">${esc(m.fullName)} — ${esc(m.role)} ${m.isChairman ? '👑' : ''}</td>
        <td style="padding:10px;text-align:right;white-space:nowrap;">
          <button class="btn-outline" style="padding:5px 10px;font-size:12px;" onclick="adminEditTeam('${m._id}')">Edit</button>
          <button class="btn-danger" style="padding:5px 10px;font-size:12px;" onclick="adminDeleteTeam('${m._id}')">Delete</button>
        </td>
      </tr>`).join('')}</table>` : '<p class="empty-state">No team members yet.</p>';
  } catch (err) { document.getElementById('admin-team-list').innerHTML = `<p class="error-state">${esc(err.message)}</p>`; }
}

window.adminResetTeam = function () { editingTeamId = null; document.getElementById('admin-team-form').reset(); };

window.adminEditTeam = async function (id) {
  const { data: m } = await api.team.getOne(id);
  editingTeamId = id;
  document.getElementById('at-title').value = m.title || '';
  document.getElementById('at-name').value = m.fullName;
  document.getElementById('at-role').value = m.role;
  document.getElementById('at-category').value = m.roleCategory;
  document.getElementById('at-chairman').value = String(!!m.isChairman);
  document.getElementById('at-bio').value = m.bio || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.adminSaveTeam = async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('at-error');
  errorEl.style.display = 'none';
  const fd = new FormData();
  fd.append('title', document.getElementById('at-title').value);
  fd.append('fullName', document.getElementById('at-name').value);
  fd.append('role', document.getElementById('at-role').value);
  fd.append('roleCategory', document.getElementById('at-category').value);
  fd.append('isChairman', document.getElementById('at-chairman').value);
  fd.append('bio', document.getElementById('at-bio').value);
  const photo = document.getElementById('at-photo').files[0];
  if (photo) fd.append('photo', photo);
  try {
    if (editingTeamId) await api.team.update(editingTeamId, fd);
    else await api.team.create(fd);
    adminResetTeam();
    adminLoadTeamList();
  } catch (err) { errorEl.textContent = err.message; errorEl.style.display = 'block'; }
};

window.adminDeleteTeam = async function (id) {
  if (!confirm('Remove this team member?')) return;
  await api.team.delete(id);
  adminLoadTeamList();
};

// ── Member Commissions tab ──────────────────────────────────
let editingMemberId = null;
async function adminRenderMembers() {
  const el = adminContent();
  el.innerHTML = adminFormShell('Add / Edit Member Commission', `
    <form id="admin-members-form" onsubmit="adminSaveMember(event)">
      <div class="form-row">
        <div class="form-group"><label>State</label><select id="am-state" required></select></div>
        <div class="form-group"><label>Abbreviation</label><input type="text" id="am-abbr" placeholder="e.g. KOSIEC"></div>
      </div>
      <div class="form-group"><label>Commission Name</label><input type="text" id="am-name" required></div>
      <div class="form-row">
        <div class="form-group"><label>Chairman Name</label><input type="text" id="am-chairman"></div>
        <div class="form-group"><label>Contact Email</label><input type="email" id="am-email"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Contact Phone</label><input type="text" id="am-phone"></div>
        <div class="form-group"><label>Website</label><input type="text" id="am-website"></div>
      </div>
      <button class="btn-primary" type="submit">Save Member Commission</button>
      <button class="btn-outline" type="button" onclick="adminResetMember()">New</button>
      <div class="form-error" id="am-error"></div>
    </form>`);
  el.innerHTML += '<div id="admin-members-list"><div class="loading">Loading…</div></div>';

  try {
    const { data: states } = await api.members.states();
    document.getElementById('am-state').innerHTML = states.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
  } catch (err) { /* fine, form still usable without state dropdown populated */ }

  await adminLoadMembersList();
}

async function adminLoadMembersList() {
  try {
    const { data } = await api.members.getAll();
    document.getElementById('admin-members-list').innerHTML = data.length ? `<table style="width:100%;border-collapse:collapse;">${data.map((m) => `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:10px;font-size:13px;">${esc(m.state)} — ${esc(m.commissionName)}${m.abbreviation ? ` (${esc(m.abbreviation)})` : ''}</td>
        <td style="padding:10px;text-align:right;white-space:nowrap;">
          <button class="btn-outline" style="padding:5px 10px;font-size:12px;" onclick="adminEditMember('${m._id}')">Edit</button>
          <button class="btn-danger" style="padding:5px 10px;font-size:12px;" onclick="adminDeleteMember('${m._id}')">Remove</button>
        </td>
      </tr>`).join('')}</table>` : '<p class="empty-state">No member commissions yet.</p>';
  } catch (err) { document.getElementById('admin-members-list').innerHTML = `<p class="error-state">${esc(err.message)}</p>`; }
}

window.adminResetMember = function () { editingMemberId = null; document.getElementById('admin-members-form').reset(); };

window.adminEditMember = async function (id) {
  const { data: m } = await api.members.getOne(id);
  editingMemberId = id;
  document.getElementById('am-state').value = m.state;
  document.getElementById('am-abbr').value = m.abbreviation || '';
  document.getElementById('am-name').value = m.commissionName;
  document.getElementById('am-chairman').value = m.chairmanName || '';
  document.getElementById('am-email').value = m.contactEmail || '';
  document.getElementById('am-phone').value = m.contactPhone || '';
  document.getElementById('am-website').value = m.website || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.adminSaveMember = async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('am-error');
  errorEl.style.display = 'none';
  const fd = new FormData();
  fd.append('state', document.getElementById('am-state').value);
  fd.append('abbreviation', document.getElementById('am-abbr').value);
  fd.append('commissionName', document.getElementById('am-name').value);
  fd.append('chairmanName', document.getElementById('am-chairman').value);
  fd.append('contactEmail', document.getElementById('am-email').value);
  fd.append('contactPhone', document.getElementById('am-phone').value);
  fd.append('website', document.getElementById('am-website').value);
  try {
    if (editingMemberId) await api.members.update(editingMemberId, fd);
    else await api.members.create(fd);
    adminResetMember();
    adminLoadMembersList();
  } catch (err) { errorEl.textContent = err.message; errorEl.style.display = 'block'; }
};

window.adminDeleteMember = async function (id) {
  if (!confirm('Remove this member commission from the directory?')) return;
  await api.members.delete(id);
  adminLoadMembersList();
};

// ── Gallery tab ──────────────────────────────────────────────
async function adminRenderGallery() {
  const el = adminContent();
  el.innerHTML = adminFormShell('Add Gallery Item', `
    <form id="admin-gallery-form" onsubmit="adminSaveGallery(event)">
      <div class="form-row">
        <div class="form-group"><label>Title</label><input type="text" id="ag-title" required></div>
        <div class="form-group"><label>Category</label>
          <select id="ag-category"><option value="general_assembly">General Assembly</option><option value="election_observation">Election Observation</option><option value="training">Training</option><option value="advocacy">Advocacy</option><option value="meeting">Meeting</option><option value="office">Office</option><option value="other">Other</option></select>
        </div>
      </div>
      <div class="form-group"><label>Image</label><input type="file" id="ag-image" accept="image/*" required></div>
      <button class="btn-primary" type="submit">Add to Gallery</button>
      <div class="form-error" id="ag-error"></div>
    </form>`);
  el.innerHTML += '<div id="admin-gallery-list"><div class="loading">Loading…</div></div>';
  await adminLoadGalleryList();
}

async function adminLoadGalleryList() {
  try {
    const { data } = await api.gallery.getAll();
    document.getElementById('admin-gallery-list').innerHTML = data.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;">${data.map((g) => `
      <div style="text-align:center;">
        <img src="${g.thumbnailPath || g.filePath}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:6px;">
        <div style="font-size:12px;margin-bottom:4px;">${esc(g.title)}</div>
        <button class="btn-danger" style="padding:4px 8px;font-size:11px;" onclick="adminDeleteGallery('${g._id}')">Delete</button>
      </div>`).join('')}</div>` : '<p class="empty-state">No gallery items yet.</p>';
  } catch (err) { document.getElementById('admin-gallery-list').innerHTML = `<p class="error-state">${esc(err.message)}</p>`; }
}

window.adminSaveGallery = async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('ag-error');
  errorEl.style.display = 'none';
  const fd = new FormData();
  fd.append('title', document.getElementById('ag-title').value);
  fd.append('category', document.getElementById('ag-category').value);
  fd.append('galleryImage', document.getElementById('ag-image').files[0]);
  try {
    await api.gallery.create(fd);
    document.getElementById('admin-gallery-form').reset();
    adminLoadGalleryList();
  } catch (err) { errorEl.textContent = err.message; errorEl.style.display = 'block'; }
};

window.adminDeleteGallery = async function (id) {
  if (!confirm('Delete this gallery item?')) return;
  await api.gallery.delete(id);
  adminLoadGalleryList();
};

// ── Events tab ───────────────────────────────────────────────
async function adminRenderEvents() {
  const el = adminContent();
  el.innerHTML = adminFormShell('Add Event', `
    <form id="admin-events-form" onsubmit="adminSaveEvent(event)">
      <div class="form-group"><label>Title</label><input type="text" id="ae-title" required></div>
      <div class="form-row">
        <div class="form-group"><label>Date</label><input type="date" id="ae-date" required></div>
        <div class="form-group"><label>Time</label><input type="text" id="ae-time" placeholder="9:00 AM - 4:00 PM"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Venue</label><input type="text" id="ae-venue"></div>
        <div class="form-group"><label>Category</label>
          <select id="ae-category"><option value="general_assembly">General Assembly</option><option value="election_observation">Election Observation</option><option value="training">Training</option><option value="advocacy">Advocacy</option><option value="meeting">Meeting</option><option value="conference">Conference</option><option value="other">Other</option></select>
        </div>
      </div>
      <div class="form-group"><label>Description</label><textarea id="ae-desc"></textarea></div>
      <button class="btn-primary" type="submit">Add Event</button>
      <div class="form-error" id="ae-error"></div>
    </form>`);
  el.innerHTML += '<div id="admin-events-list"><div class="loading">Loading…</div></div>';
  await adminLoadEventsList();
}

async function adminLoadEventsList() {
  try {
    const { data } = await api.events.getAll();
    document.getElementById('admin-events-list').innerHTML = data.length ? `<table style="width:100%;border-collapse:collapse;">${data.map((e) => `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:10px;font-size:13px;">${fmtDate(e.eventDate)} — ${esc(e.title)}</td>
        <td style="padding:10px;text-align:right;"><button class="btn-danger" style="padding:5px 10px;font-size:12px;" onclick="adminDeleteEvent('${e._id}')">Delete</button></td>
      </tr>`).join('')}</table>` : '<p class="empty-state">No events yet.</p>';
  } catch (err) { document.getElementById('admin-events-list').innerHTML = `<p class="error-state">${esc(err.message)}</p>`; }
}

window.adminSaveEvent = async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('ae-error');
  errorEl.style.display = 'none';
  try {
    await api.events.create({
      title: document.getElementById('ae-title').value,
      eventDate: document.getElementById('ae-date').value,
      time: document.getElementById('ae-time').value,
      venue: document.getElementById('ae-venue').value,
      category: document.getElementById('ae-category').value,
      description: document.getElementById('ae-desc').value,
    });
    document.getElementById('admin-events-form').reset();
    adminLoadEventsList();
  } catch (err) { errorEl.textContent = err.message; errorEl.style.display = 'block'; }
};

window.adminDeleteEvent = async function (id) {
  if (!confirm('Delete this event?')) return;
  await api.events.delete(id);
  adminLoadEventsList();
};

// ── Downloads tab ────────────────────────────────────────────
async function adminRenderDownloads() {
  const el = adminContent();
  el.innerHTML = adminFormShell('Add Document', `
    <form id="admin-downloads-form" onsubmit="adminSaveDownload(event)">
      <div class="form-group"><label>Title</label><input type="text" id="ad-title" required></div>
      <div class="form-group"><label>Category</label>
        <select id="ad-category"><option value="communique">Communiqué</option><option value="constitution">Constitution</option><option value="guideline">Guideline</option><option value="report">Report</option><option value="policy">Policy</option><option value="notice">Notice</option><option value="other">Other</option></select>
      </div>
      <div class="form-group"><label>File (PDF, DOCX, XLSX)</label><input type="file" id="ad-file" accept=".pdf,.docx,.xlsx" required></div>
      <button class="btn-primary" type="submit">Upload Document</button>
      <div class="form-error" id="ad-error"></div>
    </form>`);
  el.innerHTML += '<div id="admin-downloads-list"><div class="loading">Loading…</div></div>';
  await adminLoadDownloadsList();
}

async function adminLoadDownloadsList() {
  try {
    const { data } = await api.downloads.getAll();
    document.getElementById('admin-downloads-list').innerHTML = data.length ? `<table style="width:100%;border-collapse:collapse;">${data.map((d) => `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:10px;font-size:13px;">${esc(d.title)} <span style="color:var(--slate-light);">(${esc(d.fileSize || '')})</span></td>
        <td style="padding:10px;text-align:right;"><button class="btn-danger" style="padding:5px 10px;font-size:12px;" onclick="adminDeleteDownload('${d._id}')">Delete</button></td>
      </tr>`).join('')}</table>` : '<p class="empty-state">No documents yet.</p>';
  } catch (err) { document.getElementById('admin-downloads-list').innerHTML = `<p class="error-state">${esc(err.message)}</p>`; }
}

window.adminSaveDownload = async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('ad-error');
  errorEl.style.display = 'none';
  const fd = new FormData();
  fd.append('title', document.getElementById('ad-title').value);
  fd.append('category', document.getElementById('ad-category').value);
  fd.append('document', document.getElementById('ad-file').files[0]);
  try {
    await api.downloads.create(fd);
    document.getElementById('admin-downloads-form').reset();
    adminLoadDownloadsList();
  } catch (err) { errorEl.textContent = err.message; errorEl.style.display = 'block'; }
};

window.adminDeleteDownload = async function (id) {
  if (!confirm('Delete this document?')) return;
  await api.downloads.delete(id);
  adminLoadDownloadsList();
};

// ── Testimonials tab (moderation) ───────────────────────────
async function adminRenderTestimonials() {
  const el = adminContent();
  el.innerHTML = '<div id="admin-testimonials-list"><div class="loading">Loading…</div></div>';
  try {
    const { data } = await api.testimonials.getAll();
    const pending = data.filter((t) => !t.isApproved);
    const approved = data.filter((t) => t.isApproved);

    const row = (t, showApprove) => `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:10px;font-size:13px;">${esc(t.authorName)}${t.authorTitle ? ` <span style="color:var(--slate-light);">(${esc(t.authorTitle)})</span>` : ''}: "${esc(t.content.slice(0, 80))}${t.content.length > 80 ? '…' : ''}"</td>
        <td style="padding:10px;text-align:right;white-space:nowrap;">
          ${showApprove ? `<button class="btn-outline" style="padding:5px 10px;font-size:12px;" onclick="adminApproveTestimonial('${t._id}')">Approve</button>` : ''}
          <button class="btn-danger" style="padding:5px 10px;font-size:12px;" onclick="adminDeleteTestimonial('${t._id}')">Delete</button>
        </td>
      </tr>`;

    document.getElementById('admin-testimonials-list').innerHTML = `
      <h3 style="font-family:var(--font-display);color:var(--navy);margin-bottom:16px;">Pending Review (${pending.length})</h3>
      ${pending.length ? `<table style="width:100%;border-collapse:collapse;margin-bottom:32px;">${pending.map((t) => row(t, true)).join('')}</table>` : '<p class="empty-state" style="margin-bottom:32px;">Nothing waiting for review.</p>'}
      <h3 style="font-family:var(--font-display);color:var(--navy);margin-bottom:16px;">Approved (${approved.length})</h3>
      ${approved.length ? `<table style="width:100%;border-collapse:collapse;">${approved.map((t) => row(t, false)).join('')}</table>` : '<p class="empty-state">No approved testimonials yet.</p>'}`;
  } catch (err) {
    document.getElementById('admin-testimonials-list').innerHTML = `<p class="error-state">${esc(err.message)}</p>`;
  }
}

window.adminApproveTestimonial = async function (id) {
  await api.testimonials.approve(id);
  adminRenderTestimonials();
};

window.adminDeleteTestimonial = async function (id) {
  if (!confirm('Delete this testimonial?')) return;
  await api.testimonials.delete(id);
  adminRenderTestimonials();
};

// ── FAQs tab ─────────────────────────────────────────────────
async function adminRenderFaqs() {
  const el = adminContent();
  el.innerHTML = adminFormShell('Add FAQ', `
    <form id="admin-faq-form" onsubmit="adminSaveFaq(event)">
      <div class="form-group"><label>Question</label><input type="text" id="af-question" required></div>
      <div class="form-group"><label>Answer</label><textarea id="af-answer" required></textarea></div>
      <div class="form-group"><label>Category</label>
        <select id="af-category"><option value="general">General</option><option value="membership">Membership</option><option value="elections">Elections</option><option value="forum_operations">Forum Operations</option><option value="other">Other</option></select>
      </div>
      <button class="btn-primary" type="submit">Add FAQ</button>
      <div class="form-error" id="af-error"></div>
    </form>`);
  el.innerHTML += '<div id="admin-faq-list"><div class="loading">Loading…</div></div>';
  await adminLoadFaqList();
}

async function adminLoadFaqList() {
  try {
    const { data } = await api.faqs.getAll();
    document.getElementById('admin-faq-list').innerHTML = data.length ? `<table style="width:100%;border-collapse:collapse;">${data.map((f) => `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:10px;font-size:13px;">${esc(f.question)}</td>
        <td style="padding:10px;text-align:right;"><button class="btn-danger" style="padding:5px 10px;font-size:12px;" onclick="adminDeleteFaq('${f._id}')">Delete</button></td>
      </tr>`).join('')}</table>` : '<p class="empty-state">No FAQs yet.</p>';
  } catch (err) { document.getElementById('admin-faq-list').innerHTML = `<p class="error-state">${esc(err.message)}</p>`; }
}

window.adminSaveFaq = async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('af-error');
  errorEl.style.display = 'none';
  try {
    await api.faqs.create({
      question: document.getElementById('af-question').value,
      answer: document.getElementById('af-answer').value,
      category: document.getElementById('af-category').value,
    });
    document.getElementById('admin-faq-form').reset();
    adminLoadFaqList();
  } catch (err) { errorEl.textContent = err.message; errorEl.style.display = 'block'; }
};

window.adminDeleteFaq = async function (id) {
  if (!confirm('Delete this FAQ?')) return;
  await api.faqs.delete(id);
  adminLoadFaqList();
};

// ── Inquiries tab ────────────────────────────────────────────
async function adminRenderInquiries() {
  const el = adminContent();
  el.innerHTML = '<div id="admin-inquiries-list"><div class="loading">Loading…</div></div>';
  try {
    const { data } = await api.inquiries.getAll('?archived=false');
    document.getElementById('admin-inquiries-list').innerHTML = data.length ? `<table style="width:100%;border-collapse:collapse;">${data.map((inq) => `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:10px;font-size:13px;">
          <strong>${esc(inq.fullName)}</strong> <span class="badge-${inq.status === 'new' ? 'pending' : 'active'}">${inq.status}</span><br>
          <span style="color:var(--slate-light);">${esc(inq.subject)} — ${esc(inq.message.slice(0, 100))}${inq.message.length > 100 ? '…' : ''}</span>
        </td>
        <td style="padding:10px;text-align:right;white-space:nowrap;">
          <button class="btn-outline" style="padding:5px 10px;font-size:12px;" onclick="adminMarkInquiryReplied('${inq._id}')">Mark Replied</button>
          <button class="btn-danger" style="padding:5px 10px;font-size:12px;" onclick="adminDeleteInquiry('${inq._id}')">Delete</button>
        </td>
      </tr>`).join('')}</table>` : '<p class="empty-state">No new inquiries.</p>';
  } catch (err) { document.getElementById('admin-inquiries-list').innerHTML = `<p class="error-state">${esc(err.message)}</p>`; }
}

window.adminMarkInquiryReplied = async function (id) {
  await api.inquiries.setStatus(id, { status: 'replied' });
  adminRenderInquiries();
};

window.adminDeleteInquiry = async function (id) {
  if (!confirm('Delete this inquiry?')) return;
  await api.inquiries.delete(id);
  adminRenderInquiries();
};

// ── Users & Logs tab (super_admin) ──────────────────────────
async function adminRenderUsers() {
  const el = adminContent();
  if (!Auth.isSuperAdmin()) {
    el.innerHTML = '<p class="empty-state">Only a super admin can manage users and view activity logs.</p>';
    return;
  }
  el.innerHTML = adminFormShell('Add Staff / Admin Account', `
    <form id="admin-staff-form" onsubmit="adminSaveStaff(event)">
      <div class="form-row">
        <div class="form-group"><label>Full Name</label><input type="text" id="as-name" required></div>
        <div class="form-group"><label>Email</label><input type="email" id="as-email" required></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Password</label><input type="password" id="as-password" required minlength="8"></div>
        <div class="form-group"><label>Role</label><select id="as-role"><option value="staff">Staff</option><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select></div>
      </div>
      <button class="btn-primary" type="submit">Create Account</button>
      <div class="form-error" id="as-error"></div>
    </form>`);
  el.innerHTML += '<div id="admin-users-list"><div class="loading">Loading…</div></div>';
  await adminLoadUsersList();
}

async function adminLoadUsersList() {
  try {
    const { data } = await api.auth.users();
    document.getElementById('admin-users-list').innerHTML = `<table style="width:100%;border-collapse:collapse;">${data.map((u) => `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:10px;font-size:13px;">${esc(u.fullName)} — ${esc(u.email)} <span class="badge-${u.isActive ? 'active' : 'draft'}">${u.role}</span></td>
        <td style="padding:10px;text-align:right;"><button class="btn-outline" style="padding:5px 10px;font-size:12px;" onclick="adminToggleUser('${u._id}')">${u.isActive ? 'Deactivate' : 'Activate'}</button></td>
      </tr>`).join('')}</table>`;
  } catch (err) { document.getElementById('admin-users-list').innerHTML = `<p class="error-state">${esc(err.message)}</p>`; }
}

window.adminSaveStaff = async function (e) {
  e.preventDefault();
  const errorEl = document.getElementById('as-error');
  errorEl.style.display = 'none';
  try {
    await api.auth.createStaff({
      fullName: document.getElementById('as-name').value,
      email: document.getElementById('as-email').value,
      password: document.getElementById('as-password').value,
      role: document.getElementById('as-role').value,
    });
    document.getElementById('admin-staff-form').reset();
    adminLoadUsersList();
  } catch (err) { errorEl.textContent = err.message; errorEl.style.display = 'block'; }
};

window.adminToggleUser = async function (id) {
  await api.auth.toggleUser(id);
  adminLoadUsersList();
};
