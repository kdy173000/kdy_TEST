
(() => {
  const root = new URL('../', document.currentScript.src);
  const to = path => new URL(path, root).href;
  document.body.classList.add('portal-with-nav');
  let nav = document.querySelector('.app-side-nav');
  if (!nav) { nav = document.createElement('nav'); nav.id='portalSidebar'; }
  {
    nav.replaceChildren();
    nav.className = 'app-side-nav';
    nav.setAttribute('aria-label', '사내 운영 메뉴');
    let user = {}, links = {};
    try { user = JSON.parse(sessionStorage.getItem('fb_user') || '{}'); } catch {}
    try { links = JSON.parse(localStorage.getItem('fb_perm_links') || '{}'); } catch {}
    const groups = [
      ['사내 운영 관리', [['공지사항','main/notices/index.html'],['조직도','main/index.html#org'],['내부 일정 관리','main/leave/index.html']]],
      ['제품 관리', [['자재','inventory/index.html','재고조회'],['부자재','procurement/index.html','재고관리자'],['발주 관리','orders/index.html','발주팀'],['원료',null,'원료관리'],['제품 신고',null,'제품 신고 관리']]],
      ['디자인팀', [['디자인 업무분배',null],['회의록',null]]],
      ['개인 업무관리', [['김다영',null],['최혜선',null],['송나겸',null]]]
    ];
    for (const [name, items] of groups) {
      const title = document.createElement('div'); title.className = 'sb-group-label'; title.textContent = name; nav.append(title);
      for (const [label, path, perm] of items) {
        const custom = path !== 'orders/index.html' && perm && (links[perm] || (perm === '재고관리자' && links['입출고관리']));
        const permitted = path === 'orders/index.html' ? !!window.OrderAccess?.canManageOrders() : (!perm || (perm === '재고조회' && (user.perms || []).some(p=>['발주팀','재고관리팀','재고관리자'].includes(p))) || user.role === 'manager' || user.role === 'admin' || ((user.perms || []).includes(perm) || (perm === '재고관리자' && (user.perms || []).some(p => ['발주팀','재고관리팀','입출고관리','입출고 관리자'].includes(p)))));
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
          item.title = permitted ? '준비 중인 페이지입니다.' : (path === 'orders/index.html' ? '발주팀 권한이 필요합니다.' : '접근 권한이 없습니다.');
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
    groups.find(group => group.button.textContent === (location.pathname === new URL(to('suppliers/index.html')).pathname ? '제품 관리' : '사내 운영 관리')) || groups[0];
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
  setupFavorites();
  function setupFavorites() {
    const style=document.createElement('link');
    style.rel='stylesheet';style.href=to('shared/portal-favorites.css?v=favorite-rounded131');document.head.append(style);
    let account;
    try{account=JSON.parse(sessionStorage.getItem('fb_user')||'null');}catch{}
    if(!account?.id)return;
    const key='fb_portal_favorites_v1:'+account.id;
    const eligible=[...subnav.querySelectorAll('a.sb-item')].filter(a=>!a.target&&new URL(a.href).origin===root.origin);
    const pages=new Map(eligible.map(a=>[new URL(a.href).pathname,{label:a.textContent.trim(),href:a.href}]));
    let saved=read();
    function read(){try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?[...new Set(value.filter(p=>typeof p==='string'))]:[];}catch{return [];}}
    const favoriteButton=document.createElement('button'),favoritePanel=document.createElement('div');
    favoriteButton.type='button';favoriteButton.className='category-button';favoriteButton.textContent='즐겨찾기';
    favoritePanel.className='subnav-items';favoritePanel.id='portal-submenu-favorites';favoritePanel.hidden=true;
    favoriteButton.setAttribute('aria-controls',favoritePanel.id);favoriteButton.setAttribute('aria-expanded','false');
    const favoriteGroup={button:favoriteButton,panel:favoritePanel};groups.push(favoriteGroup);
    nav.append(favoriteButton);subnav.append(favoritePanel);
    favoriteButton.addEventListener('pointerenter',()=>{if(hover.matches)showGroup(favoriteGroup);});
    favoriteButton.addEventListener('focus',()=>showGroup(favoriteGroup));
    favoriteButton.addEventListener('click',()=>showGroup(favoriteGroup));
    function drawStar(button,on){
      button.innerHTML='<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.34l-5.62 2.96 1.07-6.27L2.9 9.6l6.3-.9Z" fill="'+(on?'currentColor':'none')+'" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
    }
    const stars=[];
    function toggle(path){
      const next=saved.includes(path)?saved.filter(p=>p!==path):[...saved,path];
      try{localStorage.setItem(key,JSON.stringify(next));saved=next;render();status('즐겨찾기를 '+(saved.includes(path)?'등록했어요.':'해제했어요.'));}
      catch{status('즐겨찾기를 저장하지 못했어요. 브라우저 저장 공간을 확인해주세요.');}
    }
    function status(message){const el=document.getElementById('portalFavoriteStatus');if(el)el.textContent=message;}
    const currentPath=location.pathname,pageTitle=document.querySelector('main h1, .container h1, .layout h1');
    if(pageTitle&&pages.has(currentPath)){
      const star=document.createElement('button');star.type='button';star.className='favorite-star page-favorite-star';
      pageTitle.append(star);star.addEventListener('click',()=>toggle(currentPath));
      stars.push({star,path:currentPath,label:pages.get(currentPath).label});
    }
    function render(){
      for(const {star,path,label} of stars){
        const on=saved.includes(path);
        drawStar(star,on);star.setAttribute('aria-pressed',String(on));
        star.setAttribute('aria-label',label+' 즐겨찾기 '+(on?'해제':'등록'));star.title=star.getAttribute('aria-label');
      }
      const visible=saved.filter(path=>pages.has(path));
      favoritePanel.replaceChildren();
      if(!visible.length){const empty=document.createElement('span');empty.className='favorite-nav-empty';empty.textContent='서브메뉴의 별표로 자주 쓰는 업무를 등록하세요.';favoritePanel.append(empty);}
      for(const path of visible){
        const page=pages.get(path),wrap=document.createElement('div'),link=document.createElement('a'),star=document.createElement('button');
        wrap.className='subnav-page';link.className='sb-item';link.href=page.href;link.textContent=page.label;
        if(new URL(page.href).pathname===location.pathname){link.classList.add('active');link.setAttribute('aria-current','page');}
        star.type='button';star.className='favorite-star';drawStar(star,true);star.setAttribute('aria-pressed','true');
        star.setAttribute('aria-label',page.label+' 즐겨찾기 해제');star.title=star.getAttribute('aria-label');
        star.addEventListener('click',()=>toggle(path));wrap.append(link,star);favoritePanel.append(wrap);
      }
      const host=document.getElementById('portalFavorites');if(!host)return;
      host.replaceChildren();
      if(!visible.length){
        const empty=document.createElement('p');empty.className='favorite-empty';empty.textContent='상단 서브메뉴 옆의 ☆를 누르면 자주 쓰는 업무가 여기에 표시돼요.';host.append(empty);return;
      }
      const list=document.createElement('ul');list.className='favorite-list';
      for(const path of visible){
        const page=pages.get(path),li=document.createElement('li'),a=document.createElement('a'),remove=document.createElement('button');
        a.href=page.href;a.textContent=page.label;remove.type='button';remove.className='favorite-remove';remove.textContent='×';
        remove.setAttribute('aria-label',page.label+' 즐겨찾기 해제');remove.title=remove.getAttribute('aria-label');
        remove.addEventListener('click',()=>toggle(path));li.append(a,remove);list.append(li);
      }
      host.append(list);
    }
    window.addEventListener('storage',event=>{if(event.key===key||event.key===null){saved=read();render();}});
    render();
  }
})();
