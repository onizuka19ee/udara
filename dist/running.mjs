import {stale,band} from './core.mjs';
export function periodLabel(now=new Date()){
 const h=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kuala_Lumpur',hour:'2-digit',hourCycle:'h23'}).format(now));
 return h>=5&&h<12?'MORNING':h>=12&&h<17?'AFTERNOON':h>=17&&h<20?'EVENING':'NIGHT';
}
export function runningAdvice(s,{verified=false,distance=null,fetchFailed=false,now=Date.now()}={}){
 const unknown=(title,body)=>({title,body,label:'Check before heading out',soft:'#eef1eb'});
 if(!s||s.value===null||!Number.isFinite(s.value)||stale(s,now)||fetchFailed)return unknown('Fresh data needed.','A current reading could not be verified. Check MyEQMS before deciding on an outdoor run.');
 if(!verified)return unknown('Choose your running location.','Location access was not confirmed. Select your running station or enable location to get an outlook for the right area.');
 if(distance!==null&&(!Number.isFinite(distance)||distance>100))return unknown('The station is too far away.','This monitoring station may not represent your route. Check a closer local source before planning your run.');
 const b=band(s.value),base={label:`IPU ${s.value} · ${b.name}`,soft:b.soft};
 if(s.value<=50)return {...base,title:'Good air for a run.',body:'From an air-quality perspective, outdoor running is generally suitable for most people. Local conditions can differ from the station.'};
 if(s.value<=100)return {...base,title:'An easy run is a sensible choice.',body:'Outdoor activity is generally acceptable for most people at this level. As a cautious running choice, keep the effort comfortable. If you are sensitive to air pollution or have a heart or lung condition, follow your clinician’s advice.'};
 if(s.value<=200)return {...base,title:'Move your run indoors.',body:'Air quality is unhealthy. Reduce prolonged or strenuous outdoor exercise; an indoor session in cleaner air is the more cautious running option. Higher-risk people should limit outdoor activity.'};
 return {...base,title:'Skip the outdoor run.',body:'Avoid strenuous outdoor exercise at this level. Stay in cleaner indoor air, consider postponing training, and follow current official advisories.'};
}
