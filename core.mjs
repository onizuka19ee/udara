export const SOURCE='https://eqms.doe.gov.my/api3/publicmapproxy/PUBLIC_DISPLAY/CAQM_MCAQM_Current_Reading/MapServer/0/query?f=json&outFields=*&returnGeometry=false&where=1%3D1';
export const BANDS=[
 {max:50,name:'Good',bm:'Baik',color:'#3d8af7',soft:'#e9f2ff',range:'0–50'},
 {max:100,name:'Moderate',bm:'Sederhana',color:'#7cde6b',soft:'#e9f8de',range:'51–100'},
 {max:200,name:'Unhealthy',bm:'Tidak sihat',color:'#ffff00',soft:'#fff9cf',range:'101–200'},
 {max:300,name:'Very unhealthy',bm:'Sangat tidak sihat',color:'#ffa834',soft:'#fff0dc',range:'201–300'},
 {max:Infinity,name:'Hazardous',bm:'Berbahaya',color:'#ff3823',soft:'#ffe5df',range:'>300'}
];
export function band(n){return Number.isFinite(n)&&n>=0?BANDS.find(b=>n<=b.max):{name:'Unavailable',bm:'Tiada data',color:'#b3b3b3',soft:'#eff1ef',range:'—'};}
export function numeric(v){return v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null;}
// This DOE MapServer encodes MYT wall-clock components as epoch milliseconds.
// Its official map displays these with getUTC*(), so subtract UTC+8 for real instants.
export function normalize(raw){
 if(raw.error||!Array.isArray(raw.features)||!raw.features.length||raw.exceededTransferLimit)throw Error('Incomplete or invalid official response');
 const stations=raw.features.map(({attributes:a})=>{
 if(!a?.STATION_ID||!a.STATION_LOCATION)throw Error('Station schema changed');
 const value=numeric(a.API),lat=numeric(a.LATITUDE),lon=numeric(a.LONGITUDE),time=numeric(a.DATETIME);
 return {id:a.STATION_ID,name:a.STATION_LOCATION,state:a.STATE_NAME||'',value:value!==null&&value>=0?value:null,time:time>0?time-8*3600000:null,lat:lat!==null&&Math.abs(lat)<=90?lat:null,lon:lon!==null&&Math.abs(lon)<=180?lon:null,pollutant:a.PARAM_SELECTED||null,symbol:a.PARAM_SYMBOL||'',place:a.PLACE||'',type:a.STATION_CATEGORY||''};
 });
 if(!stations.some(s=>s.value!==null&&s.time))throw Error('No valid timestamped readings');
 return stations;
}
export function distance(a,b){if([a.lat,a.lon,b.lat,b.lon].some(v=>!Number.isFinite(v)))return Infinity;const r=Math.PI/180,dlat=(b.lat-a.lat)*r,dlon=(b.lon-a.lon)*r,q=Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlon/2)**2;return 6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(Math.max(0,1-q)));}
export function stale(s,now=Date.now()){return !s.time||now-s.time>3*3600000||s.time>now+15*60000;}
export function mergeHistory(old,stations,now=Date.now()){
 const out={};
 for(const s of stations){const map=new Map((old[s.id]||[]).filter(p=>p.time>=now-48*3600000&&p.time<=now+15*60000&&Number.isFinite(p.value)).map(p=>[p.time,p]));if(s.time&&s.value!==null&&s.time>=now-48*3600000&&s.time<=now+15*60000)map.set(s.time,{time:s.time,value:s.value});out[s.id]=[...map.values()].sort((a,b)=>a.time-b.time);}
 return out;
}
