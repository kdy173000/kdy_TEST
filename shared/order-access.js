/* Shared UI access check for the purchase-order page. */
window.OrderAccess=(()=>{
 const STOCK_PERMS=['발주팀','재고관리팀','재고관리자','입출고관리','입출고 관리자'];
 function currentUser(){try{const session=JSON.parse(sessionStorage.getItem('fb_user')||'null');if(!session?.id)return null;const accounts=JSON.parse(localStorage.getItem('fb_accounts')||'[]');return accounts.find(a=>a.id===session.id)||session;}catch{return null;}}
 function canManageOrders(){const u=currentUser();return !!u&&(u.role==='admin'||(Array.isArray(u.perms)&&u.perms.some(p=>STOCK_PERMS.includes(p))));}
 function guard(){const raw=sessionStorage.getItem('fb_user');if(!window.FBSession?.check()){document.documentElement.style.visibility='hidden';if(!raw)location.replace('../login/index.html');return false;}if(!canManageOrders()){document.documentElement.style.visibility='hidden';location.replace('../main/index.html?access=orders');return false;}return true;}
 return Object.freeze({currentUser,canManageOrders,guard});
})();
