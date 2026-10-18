const CACHE='udara-shell-v1.2';
const SHELL=['./','./index.html','./style.css','./app.mjs','./core.mjs','./running.mjs','./icon.svg','./manifest.webmanifest','./icons/apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('udara-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 // Never cache air-quality readings: offline must not look like a fresh successful fetch.
 if(event.request.method!=='GET'||url.origin!==self.location.origin||(url.pathname.includes('/data/')||url.pathname.includes('/api/')))return;
 const allowed=SHELL.map(p=>new URL(p,self.registration.scope).href);
 if(!allowed.includes(url.href)&&event.request.mode!=='navigate')return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{const res=await fetch(event.request);if(res.ok)await cache.put(event.request,res.clone());return res;}
  catch{const saved=await cache.match(event.request)|| (event.request.mode==='navigate'?await cache.match(new URL('./index.html',self.registration.scope).href):null);return saved||Response.error();}
 })());
});
