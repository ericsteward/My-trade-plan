// Cloudflare Worker for Twelve Data. Deploy this code in Cloudflare, NOT as a GitHub Pages script.
// Add TWELVE_DATA_API_KEY as a Worker Secret, never to the browser or this repository.
// Set ALLOWED_ORIGIN to the exact GitHub Pages origin (no trailing slash).
const PAIRS=new Set(['AUDCAD','EURCHF','AUDCHF','NZDUSD','AUDNZD','EURGBP','AUDJPY','EURCAD','EURJPY','GBPAUD','GBPCAD','GBPCHF','GBPJPY','NZDCAD','NZDCHF','NZDJPY','CADCHF','CADJPY','EURNZD','EURAUD','AUDUSD','EURUSD','GBPUSD','USDCHF','USDCAD','USDJPY','GBPNZD']);
const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const respond=(obj,status=200,origin='')=>new Response(JSON.stringify(obj),{status,headers:{...JSON_HEADERS,...(origin?{'access-control-allow-origin':origin,'vary':'Origin'}:{})}});
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin')||'';
  const allowed=env.ALLOWED_ORIGIN||'https://ericsteward.github.io';
  const cors=origin===allowed?origin:'';
  if(request.method==='OPTIONS'){
   if(!cors)return new Response(null,{status:403});
   return new Response(null,{status:204,headers:{'access-control-allow-origin':cors,'access-control-allow-methods':'GET, OPTIONS','access-control-allow-headers':'Content-Type','access-control-max-age':'3600','vary':'Origin'}});
  }
  if(request.method!=='GET')return respond({error:'Method not allowed'},405,cors);
  const url=new URL(request.url);
  if(url.pathname==='/health')return respond({status:'ok',service:'forex-market-data',keyConfigured:Boolean(env.TWELVE_DATA_API_KEY)},200,cors);
  if(url.pathname!=='/candles')return respond({error:'Not found'},404,cors);
  const pair=(url.searchParams.get('pair')||'').toUpperCase();
  if(!PAIRS.has(pair))return respond({error:'Unsupported pair'},400,cors);
  if(!env.TWELVE_DATA_API_KEY)return respond({error:'Worker API key not configured'},503,cors);
  const cacheKey=new Request('https://cache.internal.invalid/'+pair);
  const cached=await caches.default.match(cacheKey);
  if(cached){const data=await cached.json();return respond({...data,cache:'HIT'},200,cors)}
  const api=new URL('https://api.twelvedata.com/time_series');
  api.searchParams.set('symbol',pair.slice(0,3)+'/'+pair.slice(3));
  api.searchParams.set('interval','1day');
  api.searchParams.set('outputsize','300');
  api.searchParams.set('timezone','America/New_York');
  // Header-based authentication keeps the secret out of URLs and access logs.
  let upstream;
  try{upstream=await fetch(api.toString(),{headers:{'Authorization':'apikey '+env.TWELVE_DATA_API_KEY,'Accept':'application/json'},signal:AbortSignal.timeout(12000)})}
  catch{return respond({error:'Market-data provider unavailable'},502,cors)}
  if(!upstream.ok)return respond({error:'Market-data provider request failed',status:upstream.status},502,cors);
  let data;try{data=await upstream.json()}catch{return respond({error:'Invalid provider response'},502,cors)}
  if(data.status!=='ok'||!Array.isArray(data.values))return respond({error:'Provider returned no usable candles',providerCode:data.code||null},502,cors);
  const payload={source:'Twelve Data daily candles (not broker quotes)',pair,asOf:new Date().toISOString(),meta:data.meta,values:data.values};
  const stored=respond(payload,200);
  stored.headers.set('cache-control','public, max-age=900');
  await caches.default.put(cacheKey,stored.clone());
  return respond({...payload,cache:'MISS'},200,cors);
 }
};