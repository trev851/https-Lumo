const CACHE='lumo-shell-v11',FILES=['./','./index.html','./config.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
const cacheReady=caches.open(CACHE);
self.addEventListener('install',e=>{e.waitUntil(cacheReady.then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||r.headers.has('range'))return;
  e.respondWith(cacheReady.then(async c=>{
    const hit=await c.match(r);
    if(hit)return hit;
    try{
      const res=await fetch(r);
      if(res&&res.ok&&res.type==='basic')c.put(r,res.clone());
      return res;
    }catch(err){
      if(r.mode==='navigate'){
        const shell=await c.match('./index.html');
        if(shell)return shell;
      }
      return new Response('Offline',{status:503});
    }
  }));
});
