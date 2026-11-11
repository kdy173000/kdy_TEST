/* Shared UI access check for the purchase-order page. */
window.OrderAccess=(()=>{
 function currentUser(){try{const session=JSON.parse(sessionStorage.getItem('fb_user')||'null');if(!session?.id)return null;const accounts=JSON.parse(localStorage.getItem('fb_accounts')||'[]');return accounts.find(a=>a.id===session.id)||session;}catch{return null;}}
 function canManageOrders(){const u=currentUser();return !!u&&(u.role==='admin'||(Array.isArray(u.perms)&&u.perms.includes('발주팀')));}
 function guard(){const raw=sessionStorage.getItem('fb_user');if(!window.FBSession?.check()){document.documentElement.style.visibility='hidden';if(!raw)location.replace('../login/index.html');return false;}if(!canManageOrders()){document.documentElement.style.visibility='hidden';location.replace('../main/index.html?access=orders');return false;}return true;}
 return Object.freeze({currentUser,canManageOrders,guard});
})();
