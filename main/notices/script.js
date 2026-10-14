(() => {
  try {
    const user = JSON.parse(sessionStorage.getItem('fb_user') || 'null');
    if (!user || !user.id) location.replace('../../login/index.html');
  } catch { location.replace('../../login/index.html'); }
})();
