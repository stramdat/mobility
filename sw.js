/* Offline support. When you upload a new version, bump VERSION so phones refresh their copy. */
const VERSION='mobility-v1';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
const THREE_URL='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
self.addEventListener('install',e=>{e.waitUntil((async()=>{
  const c=await caches.open(VERSION);await c.addAll(CORE);
  try{const r=await fetch(THREE_URL,{mode:'no-cors'});await c.put(THREE_URL,r)}catch(_){}
  self.skipWaiting()})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==VERSION)await caches.delete(k);
  await self.clients.claim()})())});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  // the page itself: try the network first so edits show up, fall back to the saved copy offline
  if(req.mode==='navigate'||(url.origin===location.origin&&url.pathname.endsWith('index.html'))){
    e.respondWith((async()=>{try{const r=await fetch(req);const c=await caches.open(VERSION);c.put('./index.html',r.clone());return r}
      catch(_){return (await caches.match('./index.html'))||(await caches.match('./'))}})());return}
  // everything else (3D library, fonts, icons): saved copy first, network as backup
  e.respondWith((async()=>{const hit=await caches.match(req);if(hit)return hit;
    try{const r=await fetch(req);if(r&&(r.ok||r.type==='opaque')){const c=await caches.open(VERSION);c.put(req,r.clone())}return r}
    catch(_){return hit||Response.error()}})());
});
