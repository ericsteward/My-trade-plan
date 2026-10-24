const defaults={pairs:{},trades:[],checks:{},settings:{equity:1000,riskPct:1,maxPositions:2}};let db;try{db=JSON.parse(localStorage.getItem('gregPlan'))||JSON.parse(JSON.stringify(defaults))}catch{db=JSON.parse(JSON.stringify(defaults))};const $=id=>document.getElementById(id),save=()=>localStorage.setItem('gregPlan',JSON.stringify(db)),pairs={AUDCAD:'BUY',EURCHF:'BUY',AUDCHF:'BUY',NZDUSD:'SELL',AUDNZD:'WATCH',EURGBP:'WATCH',AUDJPY:'WATCH',EURCAD:'WATCH',EURJPY:'WATCH',GBPAUD:'WATCH',GBPCAD:'WATCH',GBPCHF:'WATCH',GBPJPY:'WATCH',NZDCAD:'WATCH',NZDCHF:'WATCH',NZDJPY:'WATCH',CADCHF:'WATCH',CADJPY:'WATCH',EURNZD:'WATCH',EURAUD:'WATCH',AUDUSD:'WATCH',EURUSD:'WATCH',GBPUSD:'WATCH',USDCHF:'WATCH',USDCAD:'WATCH',USDJPY:'WATCH',GBPNZD:'WATCH'},keys=['price','yearly','quarterly','monthly','weekly','daily','ema','high','low'],names=['Current price (manual)','Yearly open','Quarterly open','Monthly open','Weekly open','Daily open','D1 18 EMA','Monday high','Monday low'];function tab(id,btn){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('on',x.id===id));document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x===btn))}function time(){return new Date().toLocaleString('en-US',{timeZone:'America/New_York',weekday:'long',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}function today(){let d=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short'}).format(new Date());$('clock').textContent=time()+' ET';$('guidance').textContent={Mon:'Mark Monday high/low after the FOREX.com Monday D1 close. Avoid chasing.',Tue:'Weekly entry only after Tuesday 9:30 AM ET, after confirmation.',Wed:'Protect winners, check swap and news, prepare for Thursday exit.',Thu:'Protect or exit weekly FX before Thursday 9:00 AM ET. No fresh weekly entry afterward.',Fri:'No new weekly trades. Review missed entries and transaction costs.',Sat:'Weekend review and preparation only.',Sun:'Weekend review and preparation only.'}[d]}today();setInterval(today,60000);const rules=['Y/Q/M/W/D opening levels and D1 18 EMA align','Check AUDJPY, AUDNZD and EURGBP','Record Monday high, midpoint and low','Wait for inside-range value, sweep/reclaim, or breakout/retest','H1/H4 closed-candle confirmation, not a wick','Check red news, spread, swap, correlations and total risk','Set stop, target, protection and maximum positions'];function drawChecks(){$('checks').innerHTML=rules.map((r,i)=>`<label><input type="checkbox" ${db.checks[i]?'checked':''} onchange="db.checks[${i}]=this.checked;save()">${r}</label>`).join('')}function resetChecks(){db.checks={};save();drawChecks()}drawChecks();$('pair').innerHTML=Object.keys(pairs).map(p=>`<option>${p}</option>`).join('');$('fields').innerHTML=keys.map((k,i)=>`<label>${names[i]}<input type="number" step="any" id="v_${k}" placeholder="Unverified"></label>`).join('');function loadPair(){let p=db.pairs[$('pair').value]||{};keys.forEach(k=>$('v_'+k).value=p[k]??'');$('pattern').value=p.pattern||'none';$('confirm').value=p.confirm||'no';$('bias').textContent='Intended bias: '+pairs[$('pair').value];assess()}function savePair(){let p={};keys.forEach(k=>p[k]=$('v_'+k).value);p.pattern=$('pattern').value;p.confirm=$('confirm').value;db.pairs[$('pair').value]=p;save();assess()}function assess(){let p=db.pairs[$('pair').value]||{},dir=pairs[$('pair').value],n=k=>p[k]===''||p[k]===undefined?null:Number(p[k]),price=n('price'),h=n('high'),l=n('low');if(price===null){$('report').textContent='Enter current price and reference levels to assess; nothing is live.';return}let ref=['yearly','quarterly','monthly','weekly','daily','ema'],available=ref.filter(k=>n(k)!==null),above=available.filter(k=>price>n(k)).length,below=available.filter(k=>price<n(k)).length,full=available.length===6,aligned=full&&((dir==='BUY'&&above===6)||(dir==='SELL'&&below===6));let s=`${dir} WATCH | Manual price ${price}\nY/Q/M/W/D + EMA: ${available.length}/6 entered; ${above} levels below price, ${below} above.\n${full?(aligned?'Aligned with intended bias.':'Mixed or opposite alignment.'):'Full alignment UNVERIFIED.'}\n`;if(h!==null&&l!==null&&h>l){let mid=(h+l)/2;s+=`Monday H/M/L: ${h} / ${mid.toFixed(5)} / ${l}\n${price>=l&&price<=h?'Inside Monday range: examine intended-direction pullbacks.':price>h?'Above Monday high: require close/hold/retest.':'Below Monday low: require close/hold/retest.'}\n`}else s+='Monday range unavailable.\n';let valid=aligned&&p.confirm==='yes'&&['inside','sweep','breakout'].includes(p.pattern);s+=`Pattern: ${p.pattern||'none'}; H1/H4: ${p.confirm||'no'}\nStatus: ${p.pattern==='invalid'?'INVALIDATED':valid?'REVIEW POTENTIAL SETUP':'WAIT / AVOID'}\nNearest Monday structure: ${dir==='BUY'&&l!==null?l:dir==='SELL'&&h!==null?h:'unverified'} (not automatically a valid stop).`; $('report').textContent=s}loadPair();function calc(){let x=Number($('swap').value),d=Number($('days').value);$('cost').textContent=$('swap').value&&d>0?'Estimated cost: $'+(x*d).toFixed(2)+' (actual rates can vary).':'Enter a verified daily broker charge and days.'}function addTrade(){let name=$('instrument').value.trim();if(!name){alert('Enter a pair');return}db.trades.push({date:new Date().toLocaleDateString(),name,side:$('side').value,entry:$('entry').value,stop:$('stop').value,target:$('target').value,risk:$('risk').value,notes:$('notes').value});save();drawTrades();['instrument','entry','stop','target','risk','notes'].forEach(x=>$(x).value='')}function drawTrades(){$('trades').textContent='';db.trades.slice().reverse().forEach(t=>{let d=document.createElement('p');d.textContent=`${t.date} | ${t.name} ${t.side} | Entry ${t.entry} | Stop ${t.stop} | Target ${t.target} | Risk $${t.risk} | ${t.notes}`;$('trades').append(d)});if(!db.trades.length)$('trades').textContent='No trades saved.'}drawTrades();function drawSettings(){for(let k in db.settings)$(k).value=db.settings[k];$('riskDisplay').textContent='Maximum planned risk per idea: $'+(db.settings.equity*db.settings.riskPct/100).toFixed(2)+'. Count correlated exposure across accounts.'}function saveSettings(){let equity=Number($('equity').value),riskPct=Number($('riskPct').value),maxPositions=Number($('maxPositions').value);if(equity<=0||riskPct<=0||riskPct>5||maxPositions<1){alert('Check values');return}db.settings={equity,riskPct,maxPositions};save();drawSettings()}drawSettings();function backup(){let b=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='trading-plan-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}async function restore(e){try{let x=JSON.parse(await e.target.files[0].text());if(!x.pairs||!Array.isArray(x.trades))throw Error('Invalid file');if(confirm('Replace current saved data?')){db=x;save();location.reload()}}catch{alert('Invalid backup')}}function speak(){if(!window.speechSynthesis)return alert('Speech unavailable');speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance($('guidance').textContent))}if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});

/* Version 4: optional delayed daily reference rates; manual broker levels remain authoritative. */
const referenceState={rates:null,date:null,updatedAt:null,error:null};
function installReferencePanel(){
 const target=document.getElementById('fields');
 if(!target||document.getElementById('freeRatePanel'))return;
 const box=document.createElement('div');box.id='freeRatePanel';box.className='card';
 box.style.cssText='margin:14px 0;padding:14px;border:1px solid #51788c;background:#11283d';
 box.innerHTML='<h3 style="margin:0 0 10px">Free FX reference rates</h3><p style="font-size:14px">Daily reference rates only — NOT live broker quotes. FOREX.com Monday candles and opens must still be entered separately.</p><button type="button" id="fetchFreeRates">Get Free FX Prices</button><p id="freeRateStatus" aria-live="polite">No reference rate loaded yet.</p><button type="button" id="copyFreeRate" style="display:none;background:#456785">Use reference as manual price</button>';
 target.parentNode.insertBefore(box,target);
 document.getElementById('fetchFreeRates').addEventListener('click',fetchFreeRates);
 document.getElementById('copyFreeRate').addEventListener('click',()=>{
  const val=getReferencePair();if(val===null)return;
  document.getElementById('v_price').value=val.toFixed(5);
  document.getElementById('freeRateStatus').textContent='Reference copied into price field. Tap Save and assess to keep it. Check your broker before trading.';
 });
 const selector=document.getElementById('pair');selector.addEventListener('change',()=>setTimeout(renderFreeRate,0));
}
function getReferencePair(){
 const symbol=document.getElementById('pair').value;
 if(!referenceState.rates||symbol.length!==6)return null;
 const base=symbol.slice(0,3),quote=symbol.slice(3);
 const r=referenceState.rates;
 const b=base==='EUR'?1:r[base],q=quote==='EUR'?1:r[quote];
 if(!Number.isFinite(b)||!Number.isFinite(q)||b<=0)return null;
 return q/b;
}
function renderFreeRate(){
 const status=document.getElementById('freeRateStatus'),copy=document.getElementById('copyFreeRate');
 if(!status)return;
 const value=getReferencePair();
 if(value!==null){status.textContent=document.getElementById('pair').value+': '+value.toFixed(5)+' | Reference date: '+referenceState.date+' | Source: Frankfurter (ECB-based daily rates). Not live; may be stale on weekends.';copy.style.display='inline-block'}
 else {status.textContent=referenceState.error||'No reference rate loaded for this pair. Tap Get Free FX Prices.';copy.style.display='none'}
}
async function fetchFreeRates(){
 const btn=document.getElementById('fetchFreeRates');btn.disabled=true;
 const status=document.getElementById('freeRateStatus');status.textContent='Retrieving free daily reference rates…';
 try{
  const response=await fetch('https://api.frankfurter.dev/v1/latest?base=EUR',{cache:'no-store'});
  if(!response.ok)throw new Error('Provider returned '+response.status);
  const data=await response.json();
  if(!data||!data.rates||!data.date)throw new Error('Provider response missing date or rates');
  referenceState.rates=data.rates;referenceState.date=data.date;referenceState.updatedAt=new Date().toISOString();referenceState.error=null;
  renderFreeRate();
 }catch(err){referenceState.error='Price retrieval unavailable ('+err.message+'). Check internet access or try again later. Your manual values are unchanged.';renderFreeRate()}
 finally{btn.disabled=false}
}
installReferencePanel();

/* V5 historical daily candle importer. Calculations use supplied D1 data, not ECB reference rates. */
(function(){
 const root=document.getElementById('freeRatePanel');if(!root)return;
 const panel=document.createElement('div');panel.className='card';panel.id='historyPanel';panel.style.cssText='margin:14px 0;padding:14px;border:1px solid #51788c;background:#11283d';
 panel.innerHTML='<h3>Automatic institutional levels from D1 history</h3><p>Import FOREX.com MT4 D1 CSV for the selected pair. The app calculates Y/Q/M/W/D opens, 18-day EMA, and Monday high/mid/low. Confirm server time and DST. This is not a live feed.</p><label>FOREX.com D1 CSV<input type="file" id="historyFile" accept=".csv,.txt,text/csv"></label><button type="button" id="calculateHistory">Calculate levels</button><p id="historyStatus" aria-live="polite">No history imported.</p><button type="button" id="applyHistory" style="display:none;background:#456785">Copy calculated levels into manual fields</button>';
 root.after(panel);
 let calculated=null;
 const el=id=>document.getElementById(id);
 function parseDate(s){const m=String(s).trim().match(/^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})$/);return m?new Date(Date.UTC(+m[1],+m[2]-1,+m[3])):null}
 function parseRows(text){
  const rows=[];
  for(const line of text.split(/\r?\n/)){
   const cols=line.trim().split(/[;,\t]/).map(x=>x.trim().replace(/^"|"$/g,''));
   if(cols.length<5)continue;
   let date=parseDate(cols[0]),offset=1;
   if(!date)continue;
   // MT4 export: Date, Time, Open, High, Low, Close, Volume; or Date, Open, High, Low, Close.
   if(/^\d{1,2}:\d{2}/.test(cols[1]))offset=2;
   const o=Number(cols[offset]),h=Number(cols[offset+1]),l=Number(cols[offset+2]),c=Number(cols[offset+3]);
   if([o,h,l,c].every(Number.isFinite)&&o>0&&h>=Math.max(o,c)&&l<=Math.min(o,c)&&h>=l)rows.push({date,o,h,l,c});
  }
  rows.sort((a,b)=>a.date-b.date);
  return rows.filter((r,i)=>!i||r.date.getTime()!==rows[i-1].date.getTime());
 }
 const fmt=d=>d.toISOString().slice(0,10);
 function calculate(rows){
  if(rows.length<18)throw Error('At least 18 valid daily candles are required');
  const last=rows[rows.length-1],year=last.date.getUTCFullYear(),month=last.date.getUTCMonth(),day=last.date.getUTCDay(),quarter=Math.floor(month/3);
  const mondayOffset=(day+6)%7,weekStart=new Date(last.date.getTime()-mondayOffset*86400000);
  const first=predicate=>{const x=rows.find(predicate);return x?x.o:null};
  const inYear=r=>r.date.getUTCFullYear()===year;
  const y=first(inYear),q=first(r=>inYear(r)&&Math.floor(r.date.getUTCMonth()/3)===quarter);
  const m=first(r=>inYear(r)&&r.date.getUTCMonth()===month);
  const w=first(r=>r.date>=weekStart),d=last.o;
  let ema=rows[0].c;const alpha=2/19;for(let i=1;i<rows.length;i++)ema=alpha*rows[i].c+(1-alpha)*ema;
  const monday=rows.find(r=>r.date.getTime()===weekStart.getTime());
  return {yearly:y,quarterly:q,monthly:m,weekly:w,daily:d,ema,high:monday?.h??null,low:monday?.l??null,asOf:fmt(last.date),candles:rows.length,mondayDate:fmt(weekStart),completeMonday:day!==1};
 }
 el('calculateHistory').onclick=async()=>{
  const file=el('historyFile').files?.[0];if(!file){el('historyStatus').textContent='Select a D1 CSV file first.';return}
  try{
   const rows=parseRows(await file.text());
   if(!rows.length)throw Error('No valid D1 candles found. Use MT4 CSV: Date,Time,Open,High,Low,Close.');
   calculated=calculate(rows);
   const c=calculated;
   el('historyStatus').textContent='Calculated from '+c.candles+' daily candles; last candle '+c.asOf+'. Y '+c.yearly+' | Q '+c.quarterly+' | M '+c.monthly+' | W '+c.weekly+' | D '+c.daily+' | EMA18 '+c.ema.toFixed(5)+' | Monday '+(c.high===null?'unavailable':c.high+' / '+((c.high+c.low)/2).toFixed(5)+' / '+c.low)+'. Check CSV belongs to '+el('pair').value+', FOREX.com server time/DST, and whether Monday candle is complete. No live verification.';
   el('applyHistory').style.display='inline-block';
  }catch(err){calculated=null;el('applyHistory').style.display='none';el('historyStatus').textContent='Could not calculate: '+err.message}
 };
 el('applyHistory').onclick=()=>{
  if(!calculated)return;
  for(const key of ['yearly','quarterly','monthly','weekly','daily','ema','high','low']){
   const value=calculated[key];if(value!==null)el('v_'+key).value=value.toFixed(5);
  }
  el('historyStatus').textContent+=' Values copied. Review them, then tap Save and assess. Current price is unchanged.';
 };
})();

/* V6 free historical reference-rate series. Not OHLC candles. */
(function(){
 const box=document.getElementById('historyPanel');if(!box)return;
 const p=document.createElement('div');p.className='card';p.style.cssText='background:#18334a;border:1px solid #55768b;padding:12px;margin:12px 0';
 p.innerHTML='<h3>Free historical reference estimates</h3><p>Uses Frankfurter/ECB daily reference fixings. Calculates approximate Y/Q/M/W/D reference levels and an 18-observation EMA proxy. These are NOT broker opens or a D1 candle EMA. Monday high/low cannot be calculated from daily fixings.</p><button type="button" id="fetchHistoricalEstimates">Get free historical estimates</button><p id="estimateStatus" aria-live="polite">Not loaded.</p><button type="button" id="copyHistoricalEstimates" style="display:none;background:#456785">Copy estimates to manual fields</button>';
 box.append(p);
 let estimates=null,estimatePair=null;
 document.getElementById('fetchHistoricalEstimates').onclick=async()=>{
  const status=document.getElementById('estimateStatus'),btn=document.getElementById('fetchHistoricalEstimates');
  btn.disabled=true;status.textContent='Loading historical reference fixings…';
  try{
   const pair=document.getElementById('pair').value,base=pair.slice(0,3),quote=pair.slice(3);
   const now=new Date(),start=new Date(Date.UTC(now.getUTCFullYear()-1,0,1)).toISOString().slice(0,10);
   const url='https://api.frankfurter.dev/v1/'+start+'..?base=EUR&symbols='+encodeURIComponent([base,quote].filter(x=>x!=='EUR').join(','));
   const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw Error('Provider HTTP '+res.status);
   const json=await res.json(),rates=json.rates;if(!rates)throw Error('Missing historical observations');
   const data=Object.keys(rates).sort().map(date=>{
    const row=rates[date],b=base==='EUR'?1:row[base],q=quote==='EUR'?1:row[quote];
    return {date,rate:q/b};
   }).filter(x=>Number.isFinite(x.rate)&&x.rate>0);
   if(data.length<18)throw Error('Insufficient history for EMA');
   const last=data[data.length-1],y=last.date.slice(0,4),m=last.date.slice(0,7),month=Number(last.date.slice(5,7)),qStart=String(1+3*Math.floor((month-1)/3)).padStart(2,'0'),quarter=y+'-'+qStart;
   const dt=new Date(last.date+'T00:00:00Z'),weekday=(dt.getUTCDay()+6)%7,mon=new Date(dt.getTime()-weekday*86400000).toISOString().slice(0,10);
   const first=prefix=>data.find(x=>x.date.startsWith(prefix))?.rate;
   let ema=data[0].rate;for(let i=1;i<data.length;i++)ema=ema+(2/19)*(data[i].rate-ema);
   estimates={yearly:first(y),quarterly:data.find(x=>x.date>=quarter)?.rate,monthly:first(m),weekly:data.find(x=>x.date>=mon)?.rate,daily:last.rate,ema};
   estimatePair=pair;
   status.textContent=pair+' | '+data.length+' ECB-based daily reference observations | latest '+last.date+' | Y '+estimates.yearly.toFixed(5)+' | Q '+estimates.quarterly.toFixed(5)+' | M '+estimates.monthly.toFixed(5)+' | W '+(estimates.weekly?.toFixed(5)||'N/A')+' | D '+estimates.daily.toFixed(5)+' | EMA proxy '+estimates.ema.toFixed(5)+'. Monday high/low UNAVAILABLE. Do not treat these as FOREX.com opens or candle EMA.';
   document.getElementById('copyHistoricalEstimates').style.display='inline-block';
  }catch(err){estimates=null;status.textContent='Historical reference retrieval unavailable: '+err.message+'. Manual fields remain unchanged.';document.getElementById('copyHistoricalEstimates').style.display='none'}
  finally{btn.disabled=false}
 };
 document.getElementById('copyHistoricalEstimates').onclick=()=>{
  if(!estimates||estimatePair!==document.getElementById('pair').value){document.getElementById('estimateStatus').textContent='Select the original pair and retrieve its estimates again.';return}
  for(const key of Object.keys(estimates))if(Number.isFinite(estimates[key]))document.getElementById('v_'+key).value=estimates[key].toFixed(5);
  document.getElementById('estimateStatus').textContent+=' Estimates copied for comparison only. They are NOT broker opens. Do not confirm a trade from these proxies. Monday high/low remain unchanged.';
 };
})();

function saveGold(){const ids=['goldSide','goldEntry','goldStop','goldTarget','goldLot','goldHigh','goldLow','goldConfirm','goldSwap','goldDays'];const x={};ids.forEach(id=>x[id]=document.getElementById(id).value);localStorage.setItem('gregGoldPlan',JSON.stringify(x));document.getElementById('goldReport').textContent='Gold plan saved on this phone.'}
function calcGold(){const a=document.getElementById('goldSwap').value,b=document.getElementById('goldDays').value;document.getElementById('goldCost').textContent=a!==''&&Number(b)>0?'Estimated holding charge: $'+(Number(a)*Number(b)).toFixed(2):'Enter daily charge and days.'}
try{const g=JSON.parse(localStorage.getItem('gregGoldPlan')||'{}');Object.keys(g).forEach(k=>{const e=document.getElementById(k);if(e)e.value=g[k]})}catch(e){}
