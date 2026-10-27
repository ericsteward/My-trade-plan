/* Secure-by-default Twelve Data candle diagnostics. No API keys, no remote requests, no broker-level overwrites. */
(function(){
'use strict';
const tracked={AUDCAD:'BUY',EURCHF:'BUY',AUDCHF:'BUY',NZDUSD:'SELL'};
const target=document.getElementById('fx');
if(!target)return;
const card=document.createElement('div');card.className='card';card.id='candleDiagnostics';
card.innerHTML='<h2>Four-pair candle check (Twelve Data)</h2><p class="muted">Paste a Time Series JSON response from your own API Playground. Do not paste API keys. This preview does not change saved FOREX.com levels or create trade alerts. Twelve Data daily candles may not match FOREX.com broker days.</p><label>Pair<select id="tdPair"><option>AUDCAD</option><option>EURCHF</option><option>AUDCHF</option><option>NZDUSD</option></select></label><label>Time Series JSON<textarea id="tdJson" rows="5" placeholder="Paste the JSON response (meta, values, status)"></textarea></label><button id="tdCheck">Check candles</button><button id="tdClear" style="margin-left:8px;background:#456785">Clear pasted text</button><pre id="tdResult" style="white-space:pre-wrap;overflow-wrap:anywhere" aria-live="polite">Waiting for a candle response.</pre>';
target.insertBefore(card,target.firstChild);
const fetchButton=document.createElement('button');fetchButton.id='tdFetch';fetchButton.textContent='Fetch latest daily candles';fetchButton.style.marginRight='8px';
card.insertBefore(fetchButton,document.getElementById('tdCheck'));
const worker='https://forex-marketdata.spoonie9001.workers.dev';
fetchButton.onclick=async()=>{
 fetchButton.disabled=true;
 const out=document.getElementById('tdResult');
 out.textContent='Checking secure market-data connection…';
 try{
  const pair=document.getElementById('tdPair').value;
  const response=await fetch(worker+'/candles?pair='+encodeURIComponent(pair),{cache:'no-store'});
  const result=await response.json();
  if(!response.ok)throw Error(result.error||'Data service returned '+response.status);
  if(!result.values||!result.meta)throw Error('Missing candle data');
  document.getElementById('tdJson').value=JSON.stringify({meta:result.meta,values:result.values,status:'ok'});
  document.getElementById('tdCheck').click();
  out.textContent='Fetched '+result.asOf+' UTC | '+result.source+'\\n'+out.textContent;
 }catch(e){out.textContent='Automatic refresh unavailable: '+e.message+'. Your manual data remains unchanged.'}
 finally{fetchButton.disabled=false}
};
const el=id=>document.getElementById(id);
el('tdClear').onclick=()=>{el('tdJson').value='';el('tdResult').textContent='Cleared. Saved trading data unchanged.'};
el('tdCheck').onclick=()=>{
 try{
  const raw=el('tdJson').value;
  if(raw.length>250000)throw Error('Response too large');
  const data=JSON.parse(raw),pair=el('tdPair').value;
  if(data.status!=='ok'||!Array.isArray(data.values))throw Error('Expected status ok and values array');
  if(String(data.meta?.symbol||'').replace(/[^A-Za-z]/g,'').toUpperCase()!==pair)throw Error('Response symbol does not match selected pair');
  if(data.meta?.interval!=='1day')throw Error('Only daily candles supported here');
  const valid=[],seen=new Set(),dups=[];
  for(const x of data.values){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(x.datetime))continue;
   const d=new Date(x.datetime+'T00:00:00Z');
   if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==x.datetime)continue;
   if(seen.has(x.datetime)){dups.push(x.datetime);continue}
   seen.add(x.datetime);
   const o=Number(x.open),h=Number(x.high),l=Number(x.low),c=Number(x.close);
   if(![o,h,l,c].every(Number.isFinite)||l<=0||l>Math.min(o,c)||h<Math.max(o,c))continue;
   valid.push({date:x.datetime,day:d.getUTCDay(),o,h,l,c});
  }
  valid.sort((a,b)=>a.date.localeCompare(b.date));
  if(valid.length<2)throw Error('Not enough valid candles');
  const last=valid[valid.length-1];
  const monday=valid.filter(x=>x.day===1).at(-1);
  const weekStart=monday?.date;
  const fmt=x=>Number(x).toFixed(5);
  const levels=['Year','Quarter','Month'].map((label,i)=>{
   const first=valid[0],same=i===0?first.date.slice(0,4)===last.date.slice(0,4):i===1?(first.date.slice(0,4)===last.date.slice(0,4)&&Math.floor((Number(first.date.slice(5,7))-1)/3)===Math.floor((Number(last.date.slice(5,7))-1)/3)):first.date.slice(0,7)===last.date.slice(0,7);
   return label+' open: '+(same?'UNVERIFIED (history does not reach period start)':'UNVERIFIED (needs complete period history)');
  });
  let ema='UNVERIFIED'; // 30 candles insufficient for dependable broker EMA18, and provider day boundaries differ.
  let output=pair+' | Intended '+tracked[pair]+' | PROVIDER DAILY CANDLE CHECK\n';
  output+='Latest candle '+last.date+' close '+fmt(last.c)+' (NOT a live quote)\n';
  output+=levels.join('\n')+'\n';
  output+='Weekly open: UNVERIFIED against FOREX.com\nDaily open: '+fmt(last.o)+' (provider only)\nD1 EMA18: '+ema+'\n';
  if(monday){const mid=(monday.h+monday.l)/2;const pos=last.c>monday.h?'above range':last.c<monday.l?'below range':'inside range';
   output+='Monday '+weekStart+' high '+fmt(monday.h)+' | midpoint '+fmt(mid)+' | low '+fmt(monday.l)+'\n';
   output+='Latest close is '+pos+'. H1/H4 closed-candle confirmation: UNVERIFIED.\n';
   output+='Watch: '+(tracked[pair]==='BUY'?'inside-range bullish rejection / low sweep-reclaim / high breakout-retest':'inside-range bearish rejection / high sweep-reclaim / low breakout-retest')+'; NO SIGNAL.\n';
  }else output+='Monday candle: unavailable.\n';
  output+='Validated candles: '+valid.length+'; duplicate dates: '+dups.length+(dups.length?' ('+[...new Set(dups)].join(', ')+')':'')+'\n';
  output+='WARNING: weekend-dated candles, duplicate dates, timezone and DST may differ from FOREX.com. No automatic alerts or orders.\n';
  output+='Your saved manual/broker levels were NOT changed.';
  el('tdResult').textContent=output;
 }catch(e){el('tdResult').textContent='Cannot use this response: '+e.message+'. Saved data unchanged.'}
};
})();
