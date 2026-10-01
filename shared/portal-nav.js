
(() => {
  const root = new URL('../', document.currentScript.src);
  const to = path => new URL(path, root).href;
  document.body.classList.add('portal-with-nav');
  let nav = document.querySelector('.app-side-nav');
  if (!nav) {
    nav = document.createElement('nav');
    nav.className = 'app-side-nav';
    nav.setAttribute('aria-label', '사내 운영 메뉴');
    let user = {}, links = {};
    try { user = JSON.parse(sessionStorage.getItem('fb_user') || '{}'); } catch {}
    try { links = JSON.parse(localStorage.getItem('fb_perm_links') || '{}'); } catch {}
    const groups = [
      ['사내 운영 관리', [['공지사항','main/index.html#notices'],['조직도','main/index.html#org'],['내부 일정 관리','main/leave/index.html']]],
      ['자재 관리', [['자재 관리','inventory/index.html','재고조회'],['제품 입고/출고/조정',null,'재고관리자'],['제품 신고 관리',null,'제품 신고 관리'],['부자재 관리','procurement/index.html','재고관리자'],['원료 관리',null,'원료관리'],['제품 포장 및 정보',null]]],
      ['디자인팀', [['디자인 업무분배',null],['회의록',null]]],
      ['개인 업무관리', [['김다영',null],['최혜선',null],['송나겸',null]]]
    ];
    for (const [name, items] of groups) {
      const title = document.createElement('div'); title.className = 'sb-group-label'; title.textContent = name; nav.append(title);
      for (const [label, path, perm] of items) {
        const custom = perm && (links[perm] || (perm === '재고관리자' && links['입출고관리']));
        const permitted = !perm || (perm === '재고조회' && (user.perms || []).includes('재고관리자')) || user.role === 'manager' || user.role === 'admin' || ((user.perms || []).includes(perm) || (perm === '재고관리자' && (user.perms || []).some(p => ['입출고관리','입출고 관리자'].includes(p))));
        let url = path && to(path);
        if (custom) { try { const parsed = new URL(custom); if (['http:','https:'].includes(parsed.protocol)) url = parsed.href; } catch {} }
        const item = document.createElement(url && permitted ? 'a' : 'button');
        item.className = 'sb-item'; item.textContent = label;
        if (item.tagName === 'A') {
          item.href = url;
          if (custom) { item.target = '_blank'; item.rel = 'noopener'; }
          if (path && new URL(to(path)).pathname === location.pathname) { item.classList.add('active'); item.setAttribute('aria-current','page'); }
        } else {
          item.type = 'button';
          if (!permitted) { item.disabled = true; item.setAttribute('aria-disabled','true'); item.title = '접근 권한이 없습니다.'; }
          else item.addEventListener('click', () => alert('연결할 페이지가 아직 설정되지 않았습니다.'));
        }
        nav.append(item);
      }
    }
    const footer = document.createElement('div'); footer.className = 'sb-footer'; footer.textContent = '사내 운영 포털'; nav.append(footer);
    document.body.append(nav);
  }
  const content = document.querySelector('body > .layout, body > main, body > .container');
  if (content) {
    const shell = document.createElement('div');
    shell.className = 'portal-page-shell';
    content.before(shell);
    shell.append(nav, content);
  }

  const companyTitle = document.createElement('div');
  companyTitle.className = 'sb-group-label';
  companyTitle.textContent = '회사 안내';
  const companyItems = ['파이어볼 회사소개','파이어볼 기본예절'].map(label => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'sb-item';
    item.textContent = label;
    item.addEventListener('click', () => alert('연결할 페이지가 아직 설정되지 않았습니다.'));
    return item;
  });
  nav.prepend(companyTitle, ...companyItems);
  // Move existing menu nodes so their click handlers and permission state survive.
  const nodes = Array.from(nav.children);
  let group = null, items = null;
  for (const node of nodes) {
    if (node.classList.contains('sb-group-label')) {
      group = document.createElement('details');
      group.className = 'top-nav-group';
      const heading = document.createElement('summary');
      heading.className = 'sb-group-label';
      heading.textContent = node.textContent;
      items = document.createElement('div');
      items.className = 'top-nav-items';
      group.append(heading, items);
      nav.append(group);
      node.remove();
      heading.addEventListener('click', () => {
        nav.querySelectorAll('details[open]').forEach(other => { if (other !== heading.parentElement) other.open = false; });
      });
    } else if (node.classList.contains('sb-item') && items) {
      items.append(node);
      node.addEventListener('click', () => { nav.querySelectorAll('details').forEach(detail => { detail.open = false; }); });
    } else if (node.classList.contains('sb-footer')) node.remove();
  }
  const header = document.querySelector('.portal-header');
  const actions = header?.querySelector('.portal-header-actions');
  if (header && actions) {
    header.insertBefore(nav, actions);
    if (!Array.from(actions.children).some(item => item.textContent.includes('내 프로필'))) {
      const profile = document.createElement('a');
      profile.className = 'portal-header-button';
      profile.href = to('main/index.html#profile');
      profile.textContent = '내 프로필';
      actions.append(profile);
    }
    if (!Array.from(actions.children).some(item => item.textContent.includes('로그아웃'))) {
      const logout = document.createElement('button');
      logout.type = 'button';
      logout.className = 'portal-header-button logout-button';
      logout.textContent = '로그아웃';
      logout.addEventListener('click', () => {
        if (typeof doLogout === 'function') doLogout();
        else { sessionStorage.removeItem('fb_user'); location.href = to('login/index.html'); }
      });
      actions.append(logout);
    }
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'portal-header-button header-nav-toggle';
    toggle.textContent = '메뉴';
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','사내 운영 메뉴 열기');
    toggle.addEventListener('click', () => {
      nav.classList.toggle('header-nav-open');
      toggle.setAttribute('aria-expanded', String(nav.classList.contains('header-nav-open')));
    });
    actions.prepend(toggle);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') { nav.classList.remove('header-nav-open'); toggle.setAttribute('aria-expanded','false'); }
    });
  }
  document.addEventListener('click', event => { if (!nav.contains(event.target)) nav.querySelectorAll('details').forEach(detail => { detail.open = false; }); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') nav.querySelectorAll('details').forEach(detail => { detail.open = false; }); });
})();
