
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
      ['자재 관리', [['자재 관리','inventory/index.html','재고조회'],['제품 입고/출고/조정',null,'입출고관리'],['제품 신고 관리',null,'제품 신고 관리'],['부자재 관리','procurement/index.html','입출고관리'],['원료 관리',null,'원료관리'],['제품 포장 및 정보',null]]],
      ['디자인팀', [['디자인 업무분배',null],['회의록',null]]],
      ['개인 업무관리', [['김다영',null],['최혜선',null],['송나겸',null]]]
    ];
    for (const [name, items] of groups) {
      const title = document.createElement('div'); title.className = 'sb-group-label'; title.textContent = name; nav.append(title);
      for (const [label, path, perm] of items) {
        const custom = perm && links[perm];
        const permitted = !perm || user.role === 'manager' || user.role === 'admin' || (user.perms || []).includes(perm);
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
  let toggle = document.querySelector('.portal-menu-button');
  if (!toggle) {
    toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'portal-header-button portal-nav-toggle'; toggle.textContent = '메뉴';
    toggle.setAttribute('aria-label','사내 운영 메뉴 열기');
    document.querySelector('.portal-header-actions')?.prepend(toggle);
  }
  // Mobile menus expand in document flow and share the page scroll.
  toggle.removeAttribute('onclick');
  {
    toggle.setAttribute('aria-expanded','false');
    toggle.addEventListener('click', () => { nav.classList.toggle('open'); toggle.setAttribute('aria-expanded',String(nav.classList.contains('open'))); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); } });
  }
})();
