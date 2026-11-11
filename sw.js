const CACHE='lumo-shell-v9',FILES=['./','./index.html','./config.js','./startup-guard.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
const cacheReady=caches.open(CACHE);
self.addEventListener('install',e=>{e.waitUntil(cacheReady.then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});

async function addStartupGuard(response, requestUrl) {
  if (!response || !response.ok || !response.headers.get('content-type')?.includes('text/html')) return response;
  const html = await response.text();
  if (html.includes('startup-guard.js')) return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  const script = '<script src="./startup-guard.js"></script>';
  const updated = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, script + '</body>') : html + script;
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('etag');
  return new Response(updated, { status: response.status, statusText: response.statusText, headers });
}

self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||r.headers.has('range'))return;
  e.respondWith(cacheReady.then(async c=>{
    const hit=await c.match(r);
    if(hit)return r.mode==='navigate'?addStartupGuard(hit,u):hit;
    try{
      const res=await fetch(r);
      if(res&&res.ok&&res.type==='basic')c.put(r,res.clone());
      return r.mode==='navigate'?addStartupGuard(res,u):res;
    }catch(err){
      if(r.mode==='navigate'){
        const shell=await c.match('./index.html');
        if(shell)return addStartupGuard(shell,u);
      }
      return new Response('Offline',{status:503});
    }
  }));
});
