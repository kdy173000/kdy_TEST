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
