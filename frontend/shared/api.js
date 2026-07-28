const API_BASE='/api';
const api={
  token:()=>localStorage.getItem('ration_token'),
  headers(){const h={'Content-Type':'application/json'};if(this.token())h['Authorization']=`Bearer ${this.token()}`;return h;},
  async get(url){try{const r=await fetch(API_BASE+url,{headers:this.headers()});if(r.status===401||r.status===403){this.logout();return null;}return r.json();}catch{return null;}},
  async post(url,body){try{const r=await fetch(API_BASE+url,{method:'POST',headers:this.headers(),body:JSON.stringify(body)});return r.json();}catch{return null;}},
  async put(url,body){try{const r=await fetch(API_BASE+url,{method:'PUT',headers:this.headers(),body:JSON.stringify(body)});return r.json();}catch{return null;}},
  async delete(url){try{const r=await fetch(API_BASE+url,{method:'DELETE',headers:this.headers()});return r.json();}catch{return null;}},
  logout(){localStorage.removeItem('ration_token');localStorage.removeItem('ration_user');window.location.href='/';},
  getUser(){const u=localStorage.getItem('ration_user');return u?JSON.parse(u):null;}
};

function showToast(m,type=''){
  let t=document.getElementById('_gt');
  if(!t){t=document.createElement('div');t.id='_gt';t.style.cssText='position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-80px);padding:12px 22px;border-radius:10px;font-size:0.85rem;font-weight:600;z-index:9999;transition:transform 0.3s;white-space:nowrap;max-width:90vw;text-align:center;color:white;font-family:Nunito,sans-serif;';document.body.appendChild(t);}
  t.style.background=type==='error'?'#e53e3e':type==='warning'?'#d97706':'#1a202c';
  t.textContent=m;t.style.transform='translateX(-50%) translateY(0)';
  setTimeout(()=>t.style.transform='translateX(-50%) translateY(-80px)',2800);
}

function timeAgo(d){
  if(!d)return'—';
  const diff=Date.now()-new Date(d).getTime();
  const m=Math.floor(diff/60000);
  if(m<1)return'Just now';if(m<60)return m+'m ago';
  const h=Math.floor(m/60);if(h<24)return h+'h ago';
  const days=Math.floor(h/24);
  if(days===1)return'Yesterday';
  return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}
function formatTime(t){
  if(!t)return'—';const[h,m]=t.split(':');
  const hr=parseInt(h),ap=hr>=12?'PM':'AM';
  return`${hr%12||12}:${m} ${ap}`;
}
function itemIcon(name){
  // All use same box icon as per requirement
  return '📦';
}
