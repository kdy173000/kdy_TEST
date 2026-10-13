(() => {
  'use strict';
  const root = new URL('../', document.currentScript.src);
  const to = path => new URL(path, root).href;
  const header = document.querySelector('.portal-header');
  if (!header) return;
  document.body.classList.add('portal-with-nav');
  const previousNav = document.querySelector('.app-side-nav');
  previousNav?.remove();
  document.querySelectorAll('.portal-menu-button,.portal-nav-toggle,.portal-nav-backdrop').forEach(node => node.remove());
  let user = {}, links = {};
  try { user = JSON.parse(sessionStorage.getItem('fb_user') || '{}'); } catch {}
  try {
    const accounts = JSON.parse(localStorage.getItem('fb_accounts') || '[]');
    user = accounts.find(account => account.id === user.id) || user;
    links = JSON.parse(localStorage.getItem('fb_perm_links') || '{}');
  } catch {}
  const elevated = ['manager','admin'].includes(user.role);
  const permissions = user.perms || [];
  const stockAdmin = elevated || permissions.some(permission => ['재고관리자','입출고관리','입출고 관리자'].includes(permission));
  function permissionPath(permission, fallback) {
    const value = links[permission] || (permission === '재고관리자' && links['입출고관리']);
    try { const url = new URL(value); if (['http:','https:'].includes(url.protocol)) return url.href; } catch {}
    return fallback;
  }
  const items = [
    [user.role === 'admin' ? '관리자 홈' : '운영 홈', user.role === 'admin' ? 'admin/main/index.html' : 'main/index.html', true],
    ['내부 일정','main/leave/index.html',true],
    ['자재 관리',permissionPath('재고조회','inventory/index.html'),elevated || stockAdmin || permissions.includes('재고조회')],
    ['부자재 관리',permissionPath('재고관리자','procurement/index.html'),stockAdmin]
  ];
  for (const permission of ['제품 신고 관리','원료관리']) {
    if (!(elevated || permissions.includes(permission))) continue;
    const custom = links[permission];
    try {
      const url = new URL(custom);
      if (['http:','https:'].includes(url.protocol)) items.push([permission,url.href,true]);
    } catch {}
  }
  if (user.role === 'admin') items.push(
    ['계정 관리','admin/accounts/index.html',true],
    ['직원 관리','admin/employees/index.html',true],
    ['권한 설정','admin/permissions/index.html',true],
    ['시계 설정','admin/clock/index.html',true]
  );
  const nav = document.createElement('nav');
  nav.className = 'app-side-nav portal-direct-nav';
  nav.setAttribute('aria-label','사내 운영 메뉴');
  for (const [label,path,permitted] of items) {
    const item = document.createElement(permitted ? 'a' : 'span');
    item.className = 'portal-direct-link';
    item.textContent = label;
    if (permitted) {
      item.href = to(path);
      if (new URL(item.href).origin !== location.origin) { item.target = '_blank'; item.rel = 'noopener'; }
      if (new URL(item.href).pathname === location.pathname) { item.classList.add('active'); item.setAttribute('aria-current','page'); }
    } else { item.setAttribute('aria-disabled','true'); item.title = '접근 권한이 없습니다.'; }
    nav.append(item);
  }
  const actions = header.querySelector('.portal-header-actions');
  header.insertBefore(nav, actions);
  const content = document.querySelector('body > .layout, body > main, body > .container');
  if (content) {
    const shell = document.createElement('div');
    shell.className = 'portal-page-shell';
    content.before(shell);
    shell.append(content);
  }
  if (actions && !Array.from(actions.children).some(item => item.textContent.includes('내 프로필'))) {
    const profile = document.createElement('a');
    profile.className = 'portal-header-button';
    profile.href = to('main/index.html#profile');
    profile.textContent = '내 프로필';
    actions.append(profile);
  }
  if (actions && !Array.from(actions.children).some(item => item.textContent.includes('로그아웃'))) {
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
})();
