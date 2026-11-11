const CACHE='lumo-shell-v10',FILES=['./','./index.html','./config.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
const cacheReady=caches.open(CACHE);
self.addEventListener('install',e=>{e.waitUntil(cacheReady.then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});

// The addon loader calls route() after each manifest response. Since route()
// replaces the full screen, intermediate progress callbacks can make startup
// flicker. Remove only that progress callback and let the existing final render
// run once addon loading settles.
async function stabilizeHtml(response) {
  if (!response || !response.ok || !/text\/html/i.test(response.headers.get('content-type') || '')) return response;
  const html = await response.clone().text();
  if (!html.includes('loadAddons(prog)')) return response;

  const stableHtml = html
    .replace(/const prog=\(\)=>\{if\(t\)return;t=setTimeout\(\(\)=>\{t=null;if\(hot\(\)\)route\(\)\},600\)\};/, '')
    .replace('function bootAddons(){S.ld=true;let t=null;', 'function bootAddons(){S.ld=true;')
    .replace('return loadAddons(prog).then(()=>{S.ld=false;if(hot())route()})}', 'return loadAddons().then(()=>{S.ld=false;if(hot())route()})}');
  if (stableHtml === html) return response;

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('etag');
  return new Response(stableHtml, { status: response.status, statusText: response.statusText, headers });
}

self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||r.headers.has('range'))return;
  e.respondWith(cacheReady.then(async c=>{
    const hit=await c.match(r);
    if(hit)return r.mode==='navigate'?stabilizeHtml(hit):hit;
    try{
      const res=await fetch(r);
      if(res&&res.ok&&res.type==='basic')c.put(r,res.clone());
      return r.mode==='navigate'?stabilizeHtml(res):res;
    }catch(err){
      if(r.mode==='navigate'){
        const shell=await c.match('./index.html');
        if(shell)return stabilizeHtml(shell);
      }
      return new Response('Offline',{status:503});
    }
  }));
});
