/* Fixed twelve-hour sessions, measured from successful sign-in. */
(() => {
  'use strict';
  const USER_KEY = 'fb_user';
  const DURATION = 12 * 60 * 60 * 1000;
  const loginUrl = new URL('../login/index.html', document.currentScript.src);
  const onLoginPage = location.pathname === loginUrl.pathname;
  let timer;
  let redirecting = false;

  function expire() {
    clearTimeout(timer);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('admin_session');
    if (!onLoginPage && !redirecting) {
      redirecting = true;
      loginUrl.searchParams.set('reason', 'session-expired');
      location.replace(loginUrl.href);
    }
    return false;
  }

  function check() {
    clearTimeout(timer);
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return false;
    let user;
    try { user = JSON.parse(raw); } catch { return expire(); }
    const now = Date.now();
    if (!user || !user.id || !Number.isFinite(user.loginAt) ||
        !Number.isFinite(user.expiresAt) || user.expiresAt !== user.loginAt + DURATION ||
        user.loginAt > now || now >= user.expiresAt) return expire();
    timer = setTimeout(check, user.expiresAt - now);
    return true;
  }

  function start(user) {
    const loginAt = Date.now();
    const session = {...user, loginAt, expiresAt: loginAt + DURATION};
    sessionStorage.removeItem('admin_session');
    sessionStorage.setItem(USER_KEY, JSON.stringify(session));
    redirecting = false;
    check();
    return session;
  }

  window.FBSession = Object.freeze({start, check});
  const normalizePerms=perms=>[...new Set((perms||[]).map(p=>['재고관리팀','재고관리자','입출고관리','입출고 관리자'].includes(p)?'발주팀':p==='출고'?'출고팀':p))];
  try{const raw=localStorage.getItem('fb_accounts');if(raw){const accounts=JSON.parse(raw);const next=accounts.map(a=>({...a,perms:normalizePerms(a.perms)}));if(JSON.stringify(accounts)!==JSON.stringify(next))localStorage.setItem('fb_accounts',JSON.stringify(next));}const rawUser=sessionStorage.getItem(USER_KEY);if(rawUser){const current=JSON.parse(rawUser);current.perms=normalizePerms(current.perms);sessionStorage.setItem(USER_KEY,JSON.stringify(current));}}catch(error){console.error('업무 권한 이름을 갱신하지 못했습니다.',error);}
  check();
  window.addEventListener('pageshow', check);
  window.addEventListener('focus', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  // Check before a resumed/background tab can submit an expired session.
  for (const type of ['click', 'submit', 'keydown']) {
    document.addEventListener(type, event => {
      if (!onLoginPage && (redirecting || (sessionStorage.getItem(USER_KEY) && !check()))) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }
  if (onLoginPage && new URL(location.href).searchParams.get('reason') === 'session-expired') {
    document.addEventListener('DOMContentLoaded', () => {
      const message = document.getElementById('errMsg');
      if (message) message.textContent = '로그인 시간이 만료되었습니다. 다시 로그인해주세요.';
    });
  }
})();
