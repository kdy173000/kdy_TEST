
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
      ['사내 운영 관리', [['공지사항','main/notices/index.html'],['조직도','main/index.html#org'],['내부 일정 관리','main/leave/index.html']]],
      ['제품 관리', [['자재','inventory/index.html','재고조회'],['부자재','procurement/index.html','재고관리자'],['원료',null,'원료관리'],['제품 신고',null,'제품 신고 관리']]],
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
          item.disabled = true;
          item.setAttribute('aria-disabled','true');
          item.title = permitted ? '준비 중인 페이지입니다.' : '접근 권한이 없습니다.';
        }
        nav.append(item);
      }
    }
    const footer = document.createElement('div'); footer.className = 'sb-footer'; footer.textContent = '사내 운영 포털'; nav.append(footer);
    document.body.append(nav);
  }
  // Normalize destinations in existing page menus before grouping them.
  nav.querySelectorAll('.sb-item').forEach(item => {
    if (['제품 입고/출고/조정','BOM'].includes(item.textContent.trim())) item.remove();
    else if (item.textContent.trim() === '공지사항') {
      const link = document.createElement('a');
      link.className = 'sb-item';
      link.textContent = '공지사항';
      link.href = to('main/notices/index.html');
      if (new URL(link.href).pathname === location.pathname) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
      item.replaceWith(link);
    }
  });
  // Known material pages are readable; their own controls enforce write permissions.
  const materialPages = {
    '자재': 'inventory/index.html',
    '부자재': 'procurement/index.html'
  };
  for (const item of Array.from(nav.querySelectorAll('.sb-item'))) {
    const path = materialPages[item.textContent.trim()];
    if (!path) continue;
    const link = document.createElement('a');
    link.className = 'sb-item';
    link.textContent = item.textContent;
    link.href = to(path);
    if (new URL(link.href).pathname === location.pathname) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
    item.replaceWith(link);
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
    item.disabled = true;
    item.setAttribute('aria-disabled', 'true');
    item.title = '준비 중인 페이지입니다.';
    return item;
  });
  nav.prepend(companyTitle, ...companyItems);

  const header = document.querySelector('.portal-header');
  const actions = header?.querySelector('.portal-header-actions');
  if (!header || !actions) return;
  const subnav = document.createElement('nav');
  subnav.className = 'portal-subnav';
  subnav.setAttribute('aria-label', '서브 메뉴');
  const groups = [];
  let current = null;
  for (const node of Array.from(nav.children)) {
    if (node.classList.contains('sb-group-label')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'category-button';
      button.textContent = node.textContent;
      const panel = document.createElement('div');
      panel.className = 'subnav-items';
      panel.id = 'portal-submenu-' + groups.length;
      panel.hidden = true;
      button.setAttribute('aria-controls', panel.id);
      button.setAttribute('aria-expanded', 'false');
      current = {button, panel};
      groups.push(current);
      nav.append(button);
      subnav.append(panel);
      node.remove();
    } else if (node.classList.contains('sb-item') && current) {
      node.classList.remove('active');
      node.removeAttribute('aria-current');
      if (node.tagName === 'A') {
        const url = new URL(node.href);
        if (url.pathname === location.pathname && (!url.hash || url.hash === location.hash)) {
          node.classList.add('active');
          node.setAttribute('aria-current', 'page');
        }
      }
      const unavailable = node.textContent.trim() === '조직도' ||
        (node.tagName !== 'A' && (node.tagName === 'BUTTON' || typeof node.onclick !== 'function'));
      if (unavailable) {
        const placeholder = document.createElement('button');
        placeholder.type = 'button';
        placeholder.className = 'sb-item';
        placeholder.textContent = node.textContent;
        placeholder.disabled = true;
        placeholder.setAttribute('aria-disabled', 'true');
        placeholder.title = node.title || '준비 중인 페이지입니다.';
        node.remove();
        current.panel.append(placeholder);
      } else current.panel.append(node);
    } else node.remove();
  }
  const homeGroup = groups.find(group => group.panel.querySelector('.active')) ||
    groups.find(group => group.button.textContent === '사내 운영 관리') || groups[0];
  function showGroup(selected) {
    const previewing = selected !== homeGroup;
    subnav.classList.toggle('is-preview', previewing);
    subnav.setAttribute('aria-label', previewing ? selected.button.textContent + ' 서브 메뉴 미리 보기' : '현재 페이지 서브 메뉴');
    groups.forEach(group => {
      const visible = group === selected;
      group.panel.hidden = !visible;
      group.button.setAttribute('aria-expanded', String(visible));
      group.button.classList.toggle('preview-category', visible);
      group.button.classList.toggle('current-category', group === homeGroup);
    });
  }
  const restore = () => showGroup(homeGroup);
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  groups.forEach(group => {
    group.button.addEventListener('pointerenter', () => { if (hover.matches) showGroup(group); });
    group.button.addEventListener('focus', () => showGroup(group));
    group.button.addEventListener('click', () => showGroup(group));
  });
  header.insertBefore(nav, actions);
  header.append(subnav);
  header.addEventListener('pointerleave', restore);
  header.addEventListener('focusout', event => { if (!header.contains(event.relatedTarget)) restore(); });
  document.addEventListener('click', event => { if (!header.contains(event.target)) restore(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') restore(); });
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
  restore();
})();
