function toggleTheme() {
  const h = document.documentElement;
  const dark = h.dataset.theme === 'dark';
  h.dataset.theme = dark ? 'light' : 'dark';
  document.getElementById('t-ico').textContent = '◐';
  document.getElementById('t-lbl').textContent = dark ? '다크 모드' : '라이트 모드';
}

const FIXED_ACCOUNTS = [
  { id: 'fireballadmin', pw: 'adminfireball', role: 'admin', redirect: '../admin/main/index.html' },
  { id: '23060801', pw: '940214', role: 'manager', name: '김다영', redirect: '../main/index.html' },
];

function getAllAccounts() {
  const stored = JSON.parse(localStorage.getItem('fb_accounts') || '[]');
  return [...FIXED_ACCOUNTS, ...stored];
}

function doLogin() {
  const id = document.getElementById('userId').value.trim();
  const pw = document.getElementById('userPw').value;
  const err = document.getElementById('errMsg');
  if (!id) { err.textContent = '아이디를 입력해 주세요.'; return; }
  if (!pw) { err.textContent = '비밀번호를 입력해 주세요.'; return; }

  const account = getAllAccounts().find(a => a.id === id && a.pw === pw);
  if (account) {
    const isAdmin = account.role === 'admin' || (account.perms && account.perms.includes('관리자'));
    sessionStorage.setItem('fb_user', JSON.stringify({ id: account.id, role: account.role || (isAdmin?'admin':'user'), name: account.name || account.id, perms: account.perms || [] }));
    window.location.href = isAdmin
      ? (account.redirect || '../admin/main/index.html')
      : '../main/index.html';
  } else {
    err.textContent = '아이디 또는 비밀번호가 올바르지 않습니다.';
  }
}
