/* Read-only, quota-conscious Twelve Data overview. Provider data never overwrites broker/manual levels. */
(()=>{'use strict';
const pairs=['AUDCAD','EURCHF','AUDCHF','NZDUSD','AUDNZD','EURGBP','AUDJPY','EURCAD','EURJPY','GBPAUD','GBPCAD','GBPCHF','GBPJPY','NZDCAD','NZDCHF','NZDJPY','CADCHF','CADJPY','EURNZD','EURAUD','AUDUSD','EURUSD','GBPUSD','USDCHF','USDCAD','USDJPY','GBPNZD'];
const biases={AUDCAD:'BUY',EURCHF:'BUY',AUDCHF:'BUY',NZDUSD:'SELL'};
const worker='https://forex-marketdata.spoonie9001.workers.dev';
const storageKey='gregProviderDailyV2',ttl=12*60*60*1000;
let cache={};try{cache=JSON.parse(localStorage.getItem(storageKey))||{}}catch{}
// Migrate existing 27-pair snapshots without spending another API credit.
try{const old=JSON.parse(localStorage.getItem('gregProviderDailyV1'))||{};for(const [p,entry] of Object.entries(old)){if(!cache[p]&&entry?.data)cache[p]=entry}}catch{}
const root=document.getElementById('fx');if(!root)return;
const panel=document.createElement('div');panel.className='card';panel.id='autoFxOverview';
panel.innerHTML='<h2>27-pair daily market overview</h2><p class="muted">Twelve Data provider D1 candles; not live quotes or FOREX.com broker candles. Auto-refresh is paced for free API limits. Saved trading levels are never overwritten. Calculated BUY/SELL BIAS is directional context only, not an entry signal; original four plan directions are preserved.</p><p id="autoFxStatus" aria-live="polite">Preparing daily updates…</p><button id="autoFxRefresh" type="button">Refresh available data</button><div style="overflow-x:auto"><table style="width:100%;font-size:13px;border-spacing:0 9px;text-align:left"><thead><tr><th>Pair / bias</th><th>Last D1 close</th><th>Monday H / M / L</th><th>Y/Q/M/W/D + EMA</th></tr></thead><tbody id="autoFxRows"></tbody></table></div><p class="muted">Alignment uses provider daily closes and provider reference opens, not real-time price. H1/H4, broker spread and VantagePoint confirmation are unverified. A daily candle may still be forming. Missing yearly or other opens remain explicitly unavailable rather than inventing broker levels.</p>';
const board=root.querySelector('.card');root.insertBefore(panel,board);
const status=document.getElementById('autoFxStatus'),rows=document.getElementById('autoFxRows'),btn=document.getElementById('autoFxRefresh');
const num=x=>Number(x).toFixed(5);
function alignment(d){const labels=['Y','Q','M','W','D','EMA'];if(!Array.isArray(d?.refs))return 'Reference values unavailable';const known=d.refs.filter(x=>x!==null&&Number.isFinite(x)).length;const up=d.refs.filter(x=>x!==null&&Number.isFinite(x)&&d.close>x).length;const down=d.refs.filter(x=>x!==null&&Number.isFinite(x)&&d.close<x).length;const detail=labels.map((k,i)=>k+':'+(d.refs[i]===null||!Number.isFinite(d.refs[i])?'?':num(d.refs[i]))).join(' ');return (known===6&&up===6?'6/6 ABOVE':known===6&&down===6?'6/6 BELOW':known===6?'MIXED ('+up+' above, '+down+' below)':known+'/6 verified ('+up+' above, '+down+' below)')+' | '+detail;}
function calculate(data){
 if(!Array.isArray(data.values)||!data.values.length)throw Error('Missing daily candles');
 const seen=new Set(),v=[];
 for(const c of data.values){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(c.datetime)||seen.has(c.datetime))continue;
  const o=+c.open,h=+c.high,l=+c.low,close=+c.close;
  if(![o,h,l,close].every(Number.isFinite)||l<=0||h<Math.max(o,close)||l>Math.min(o,close))continue;
  seen.add(c.datetime);v.push({date:c.datetime,o,h,l,c:close});
 }
 v.sort((a,b)=>a.date.localeCompare(b.date));
 if(v.length<20)throw Error('Insufficient history');
 const last=v.at(-1),year=last.date.slice(0,4),month=last.date.slice(0,7);
 const quarter=d=>d.slice(0,4)+'-'+Math.floor((Number(d.slice(5,7))-1)/3);
 const start=kind=>{
  const test=kind==='year'?d=>d.date.slice(0,4)===year:kind==='quarter'?d=>quarter(d.date)===quarter(last.date):kind==='month'?d=>d.date.slice(0,7)===month:d=>d.date>=week;
  const i=v.findIndex(test);
  return i>0?v[i].o:null; // preceding history required to establish period start
 };
 const day=new Date(last.date+'T12:00:00Z').getUTCDay(),monday=new Date(last.date+'T12:00:00Z');monday.setUTCDate(monday.getUTCDate()-((day+6)%7));
 const week=monday.toISOString().slice(0,10),mon=v.find(x=>x.date===week);
 let ema=v[0].c;const alpha=2/19;for(const c of v.slice(1))ema=c.c*alpha+ema*(1-alpha);
 const refs=[start('year'),start('quarter'),start('month'),start('week'),last.o,ema];
 const labels=['Y','Q','M','W','D','EMA'];
 const known=refs.filter(x=>x!==null).length;
 const up=refs.filter(x=>x!==null&&last.c>x).length;
 const down=refs.filter(x=>x!==null&&last.c<x).length;
 const missing=labels.filter((x,i)=>refs[i]===null);
 const alignment=known===6&&up===6?'6/6 ABOVE':known===6&&down===6?'6/6 BELOW':known===6?'MIXED ('+up+' above, '+down+' below)':known+'/6 verified ('+up+' above, '+down+' below; '+missing.join(',')+' unavailable)';
 return {date:last.date,close:last.c,mon:mon?{high:mon.h,mid:(mon.h+mon.l)/2,low:mon.l}:null,refs,alignment,count:v.length,dups:data.values.length-v.length};
}
function direction(d){if(!d||!Array.isArray(d.refs))return 'NO DATA';const refs=d.refs.filter(x=>x!==null&&Number.isFinite(x));if(refs.length<4)return 'UNVERIFIED';const above=refs.filter(x=>d.close>x).length,below=refs.filter(x=>d.close<x).length;return above===refs.length?'BUY BIAS':below===refs.length?'SELL BIAS':'MIXED';}
function render(){
 rows.replaceChildren();
 for(const p of pairs){
  const tr=document.createElement('tr'),record=cache[p],d=record?.data;
  const values=[p+' '+(biases[p]?'PLAN '+biases[p]+' | ':'')+(d?direction(d):'NO DATA'),d?num(d.close)+' ('+d.date+')':'—',d?.mon?[d.mon.high,d.mon.mid,d.mon.low].map(num).join(' / '):'Unverified',d?alignment(d):'No data'];
  values.forEach((v,i)=>{const td=document.createElement('td');td.textContent=v;td.style.padding='8px 4px';td.style.borderBottom='1px solid #42617b';if(i===0)td.style.fontWeight='bold';tr.append(td)});
  if(record?.error){tr.lastChild.textContent='Unavailable: '+record.error}
  rows.append(tr);
 }
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));let running=false;
async function update(force=false){
 if(running)return;running=true;btn.disabled=true;
 let fetched=0,failed=0;
 try{
  for(let i=0;i<pairs.length;i++){
   const p=pairs[i],entry=cache[p];
   if(!force&&entry?.data&&Date.now()-entry.time<ttl)continue;
   status.textContent='Updating '+p+' ('+(i+1)+'/27); '+fetched+' refreshed, '+failed+' unavailable. Keep this tab open.';
   try{
    const response=await fetch(worker+'/candles?pair='+p,{cache:'no-store'});
    const raw=await response.json();
    if(!response.ok)throw Error(raw.error||'HTTP '+response.status);
    if(String(raw.meta?.symbol||'').replace(/[^a-z]/gi,'').toUpperCase()!==p)throw Error('Symbol mismatch');
    cache[p]={time:Date.now(),data:calculate(raw)};fetched++;
   }catch(e){
    cache[p]={time:Date.now(),error:String(e.message||e).slice(0,70),data:entry?.data||null};failed++;
    if(/429|limit|credit|quota/i.test(String(e.message||e))){status.textContent='Provider quota reached. Existing data preserved; retry later.';break}
   }
   try{localStorage.setItem(storageKey,JSON.stringify(cache))}catch{}
   render();
   if(i<pairs.length-1)await wait(9000);
  }
  status.textContent+=' Complete: '+fetched+' updated, '+failed+' unavailable. Source: Twelve Data daily candles.';
 }finally{running=false;btn.disabled=false;render()}
}
btn.onclick=()=>update(true);render();update(false);
})();