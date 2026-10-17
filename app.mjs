import {BANDS,band,distance,stale} from './core.mjs';
const $=id=>document.getElementById(id),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data=null,selected=null,position=null,mode='DEFAULT STATION',busy=false,mapLoaded=false,geoBusy=false;
const dateFmt=new Intl.DateTimeFormat('en-MY',{timeZone:'Asia/Kuala_Lumpur',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:true});
const hourFmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kuala_Lumpur',hour:'2-digit',minute:'2-digit',hour12:false});
const fmt=t=>t?dateFmt.format(new Date(t)):'Not reported';
function say(text,error=false){$('notice').textContent=text;$('notice').classList.toggle('error',error);}
function clock(){$('clock').textContent=new Intl.DateTimeFormat('en-MY',{timeZone:'Asia/Kuala_Lumpur',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());}clock();
$('legend').innerHTML=BANDS.map(b=>`<div class="legend-row"><i style="background:${b.color}"></i><span>${b.name}<small>${b.bm}</small></span><strong>${b.range}</strong></div>`).join('');
function remembered(){try{return localStorage.getItem('udara.station');}catch{return null;}}
function remember(id){try{localStorage.setItem('udara.station',id);}catch{}}
function station(){return data?.stations.find(s=>s.id===selected);}
function nearby(s){return position?distance(position,s):Infinity;}
function distanceText(s){const d=nearby(s);return Number.isFinite(d)?`${d.toFixed(1)} km`:'—';}
async function load(manual=false){
 if(busy)return;busy=true;$('refresh').disabled=true;
 const oldTime=data?.fetchedAt;
 try{
  const res=await fetch(`./data/latest.json?t=${Date.now()}`,{cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(!res.ok)throw Error(`HTTP ${res.status}`);
  const next=await res.json();
  if(next.schema!==1||!Array.isArray(next.stations)||!next.stations.length||!Number.isFinite(Date.parse(next.fetchedAt)))throw Error('Invalid data');
  data=next;
  if(!station()){
   const saved=remembered();selected=data.stations.find(s=>s.id===saved)?.id||data.stations.find(s=>s.name.toLowerCase().includes('putrajaya'))?.id||data.stations[0].id;mode=saved===selected?'SAVED STATION':'DEFAULT STATION';
  }
  const prev=$('stateFilter').value;
  $('stateFilter').innerHTML='<option value="">All states</option>'+[...new Set(data.stations.map(s=>s.state))].sort().map(s=>`<option value="${escape(s)}">${escape(s)}</option>`).join('');$('stateFilter').value=prev;
  render();
  const aged=Date.now()-Date.parse(data.fetchedAt)>3*3600000;
  say(aged?'Published data is over 3 hours old. Check the official portal for newer readings.':manual?(oldTime===data.fetchedAt?'Checked. No newer published data yet.':'Latest published readings loaded.'):'Use your location to find the nearest station, or search for a station.',aged);
 }catch(e){say(data?'Could not refresh. Previously loaded readings remain visible; check their observation times.':'Unable to load readings. Check your connection and try Refresh. For local preview, run the server described in README.',true);}
 finally{busy=false;$('refresh').disabled=false;}
}
function choose(id,newMode='SELECTED STATION'){
 if(!data.stations.some(s=>s.id===id))return;
 selected=id;mode=newMode;remember(id);$('searchResults').hidden=true;$('stationSearch').value='';render();
 say(newMode==='NEAREST STATION'?'Nearest station selected using your location. Distance is straight-line, not driving distance.':'Station selected. Readings describe this monitoring site, not your exact location.');
}
function render(){
 const s=station();if(!s)return;
 const b=band(s.value),outdated=stale(s);
 $('reading').style.setProperty('--soft',b.soft);$('selectionMode').textContent=mode;
 $('freshness').textContent=s.value===null?'Reading unavailable':outdated?'Outdated reading':'Recent reading';$('freshness').classList.toggle('outdated',outdated);
 $('stationName').textContent=s.name;$('stationMeta').textContent=[s.state,s.type,s.id].filter(Boolean).join(' · ');
 $('apiValue').textContent=s.value??'—';$('category').textContent=b.name;$('categoryBM').textContent=b.bm;
 $('observed').textContent=fmt(s.time)+' MYT';$('distance').textContent=position?distanceText(s):'Location not enabled';
 $('scale').innerHTML=BANDS.map(x=>`<span class="${x.name===b.name?'active':''}" style="background:${x.color}" title="${x.name}: ${x.range}"></span>`).join('');
 $('pollutant').textContent=s.pollutant||'Not reported';
 $('pollutantNote').textContent=s.pollutant?`Dominant parameter reported by DOE${s.symbol?` (source marker: ${s.symbol})`:''}. Concentration is not supplied in this feed.`:'The source has not supplied a dominant parameter for this station.';
 $('contextTitle').textContent=outdated?'Check the latest update.':s.value===null?'A reading is not available.':'A station reading, a local reference.';
 $('contextText').textContent=outdated?'This observation is more than 3 hours old, missing its timestamp, or has an unexpected future time. Refer to MyEQMS for current conditions.':nearby(s)>100&&position?'This station is more than 100 km away. It may not represent the air around you. This dashboard covers Malaysian monitoring stations only.':'Air quality at your exact location can differ. Use this reading as a reference and check official advisories before planning outdoor activities.';
 $('syncTime').textContent='Source last retrieved: '+fmt(Date.parse(data.fetchedAt))+' MYT. Scheduled collection: hourly; delays are possible.';
 renderChart();renderMap();renderNational();renderTable();
}
function points(){return (data?.history?.[selected]||[]).filter(p=>Number.isFinite(p.value)&&p.time>=Date.now()-24*3600000&&p.time<=Date.now()+15*60000).sort((a,b)=>a.time-b.time);}
function renderChart(){
 const ps=points();$('trendCount').textContent=`${ps.length} observation${ps.length===1?'':'s'}`;$('download').disabled=!ps.length;
 if(ps.length<2){$('chart').innerHTML=`<p>${ps.length?'One observation recorded.':'No observations in the last 24 hours.'}<br>The chart appears after at least two readings have been collected.</p>`;return;}
 const W=550,H=170,left=32,right=535,top=12,bottom=140,start=Date.now()-24*3600000,end=Date.now(),max=Math.max(100,Math.ceil(Math.max(...ps.map(p=>p.value))/50)*50);
 const x=t=>left+(t-start)/(end-start)*(right-left),y=v=>bottom-v/max*(bottom-top);
 let grid='';for(let v=0;v<=max;v+=max/4)grid+=`<line x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}" stroke="#e5eae2"/><text x="24" y="${y(v)+3}" text-anchor="end" font-size="9" fill="#62706b">${Math.round(v)}</text>`;
 for(let i=0;i<5;i++){const t=start+i*(end-start)/4;grid+=`<text x="${x(t)}" y="162" text-anchor="middle" font-size="9" fill="#62706b">${hourFmt.format(t)}</text>`;}
 let path='';ps.forEach((p,i)=>{path+=`${i&&p.time-ps[i-1].time<=90*60000?'L':'M'}${x(p.time).toFixed(2)},${y(p.value).toFixed(2)} `;});
 $('chart').innerHTML=`<svg role="img" aria-label="Recorded IPU over the last 24 hours; minimum ${Math.min(...ps.map(p=>p.value))}, maximum ${Math.max(...ps.map(p=>p.value))}. Download CSV for all observations." viewBox="0 0 ${W} ${H}">${grid}<path d="${path}" fill="none" stroke="#347b57" stroke-width="2.5"/>${ps.map(p=>`<circle cx="${x(p.time)}" cy="${y(p.value)}" r="3.5" fill="#173e37"><title>${escape(fmt(p.time))}: IPU ${p.value}</title></circle>`).join('')}</svg>`;
}
function renderMap(){
 const s=station(),valid=Number.isFinite(s.lat)&&Number.isFinite(s.lon);
 $('mapLink').hidden=!valid;$('place').textContent=s.place||'Station location details are not supplied.';
 if(valid)$('mapLink').href=`https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lon}#map=12/${s.lat}/${s.lon}`;
 if(mapLoaded&&valid){const f=document.createElement('iframe');f.title='Monitoring station on OpenStreetMap';f.loading='lazy';f.referrerPolicy='no-referrer';f.src=`https://www.openstreetmap.org/export/embed.html?bbox=${s.lon-.08}%2C${s.lat-.055}%2C${s.lon+.08}%2C${s.lat+.055}&layer=mapnik&marker=${s.lat}%2C${s.lon}`;$('map').replaceChildren(f);}
 else{$('map').innerHTML=`<div class="map-placeholder"><span class="map-pin" aria-hidden="true"></span><p>${escape(valid?s.name:'Coordinates unavailable')}</p><button id="loadMap" class="outline" ${valid?'':'disabled'}>Load interactive map</button><span class="small">Map by OpenStreetMap</span></div>`;$('loadMap').onclick=()=>{mapLoaded=true;renderMap();};}
}
function renderNational(){
 const fresh=data.stations.filter(s=>s.value!==null&&!stale(s));
 $('nationalCount').textContent=`${fresh.length} recent / ${data.stations.length} stations`;
 $('nationalBands').innerHTML=BANDS.map(b=>`<div class="band-card" style="--band:${b.color};--bandsoft:${b.soft}"><strong>${fresh.filter(s=>band(s.value).name===b.name).length}</strong><span>${b.name}</span></div>`).join('');
}
function renderTable(){
 if(!data)return;
 const filtered=data.stations.filter(s=>!$('stateFilter').value||s.state===$('stateFilter').value),sort=$('sort').value;
 filtered.sort((a,b)=>sort==='highest'?(b.value??-Infinity)-(a.value??-Infinity):sort==='lowest'?(a.value??Infinity)-(b.value??Infinity):sort==='nearest'?nearby(a)-nearby(b):a.name.localeCompare(b.name));
 $('tableCount').textContent=`${filtered.length} stations · outdated / unavailable excluded from totals above`;
 $('stationRows').innerHTML=filtered.map(s=>{const b=band(s.value);return `<tr class="${s.id===selected?'selected':''}"><td><button data-id="${escape(s.id)}">${escape(s.name)}</button><small>${escape(s.state)}</small></td><td><strong>${s.value??'—'}</strong></td><td><span class="table-status"><i style="background:${b.color}"></i>${b.name}</span></td><td>${escape(fmt(s.time))}${stale(s)?'<small class="outdated">Outdated</small>':''}</td><td>${distanceText(s)}</td></tr>`;}).join('')||'<tr><td colspan="5" class="empty-row">No stations found.</td></tr>';
}
function search(){
 const q=$('stationSearch').value.trim().toLowerCase(),box=$('searchResults');box.hidden=!q;
 if(!q)return;
 if(!data){box.innerHTML='<p>Station data has not loaded yet.</p>';return;}
 const matches=data.stations.filter(s=>(s.name+' '+s.state).toLowerCase().includes(q));
 box.innerHTML=matches.length?matches.map(s=>`<button data-id="${escape(s.id)}">${escape(s.name)} <span class="small">· IPU ${s.value??'—'}</span></button>`).join(''):'<p>No matching stations. Try a state name.</p>';
}
async function locate(){
 if(geoBusy)return;if(!navigator.geolocation){say('Geolocation is unavailable. Search for a station instead.',true);return;}if(!data){say('Wait for station data to load, then try your location.',true);return;}
 geoBusy=true;$('locate').disabled=true;say('Finding your location…');
 navigator.geolocation.getCurrentPosition(p=>{
  position={lat:p.coords.latitude,lon:p.coords.longitude};const nearest=[...data.stations].sort((a,b)=>nearby(a)-nearby(b))[0];
  if(nearest&&Number.isFinite(nearby(nearest))){choose(nearest.id,'NEAREST STATION');if(nearby(nearest)>100)say('The nearest Malaysian station is over 100 km away and may not represent your location.',true);}
  else say('Station coordinates are unavailable. Choose a station manually.',true);
  geoBusy=false;$('locate').disabled=false;
 },e=>{say(e.code===1?'Location permission was declined. You can still search or select a station.':'Your location could not be found. Try again or choose a station manually.',true);geoBusy=false;$('locate').disabled=false;},{enableHighAccuracy:false,timeout:15000,maximumAge:60000});
}
$('locate').onclick=locate;$('refresh').onclick=()=>load(true);$('stationSearch').oninput=search;
$('stationSearch').onkeydown=e=>{if(e.key==='Escape')$('searchResults').hidden=true;if(e.key==='ArrowDown'){$('searchResults').querySelector('button')?.focus();e.preventDefault();}};
$('searchResults').onclick=e=>{const b=e.target.closest('[data-id]');if(b){choose(b.dataset.id);$('stationSearch').focus();}};
$('searchResults').onkeydown=e=>{const buttons=[...$('searchResults').querySelectorAll('button')],i=buttons.indexOf(document.activeElement);if(e.key==='ArrowDown'){buttons[Math.min(i+1,buttons.length-1)]?.focus();e.preventDefault();}if(e.key==='ArrowUp'){(buttons[i-1]||$('stationSearch')).focus();e.preventDefault();}if(e.key==='Escape'){$('searchResults').hidden=true;$('stationSearch').focus();}};
document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap'))$('searchResults').hidden=true;});
$('stationRows').onclick=e=>{const b=e.target.closest('[data-id]');if(b){choose(b.dataset.id);$('reading').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}};
$('stateFilter').onchange=renderTable;$('sort').onchange=()=>{if($('sort').value==='nearest'&&!position){say('Enable your location to sort by distance.',true);$('sort').value='name';}renderTable();};
$('download').onclick=()=>{
 const s=station(),quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
 const csv='Station,Timestamp (UTC),Timestamp (MYT),IPU\r\n'+points().map(p=>[s.name,new Date(p.time).toISOString(),fmt(p.time)+' MYT',p.value].map(quote).join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`udara-${s.id}-24h.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
await load();
try{if((await navigator.permissions?.query({name:'geolocation'}))?.state==='granted')locate();}catch{}
setInterval(()=>{if(!document.hidden)load();},5*60000);
setInterval(()=>{clock();if(data){renderNational();renderTable();const s=station();$('freshness').textContent=s.value===null?'Reading unavailable':stale(s)?'Outdated reading':'Recent reading';$('freshness').classList.toggle('outdated',stale(s));}},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
