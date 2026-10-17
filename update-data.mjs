import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {SOURCE,normalize,mergeHistory} from '../core.mjs';
let raw;
for(let attempt=0;attempt<3;attempt++){
 try{const res=await fetch(SOURCE,{signal:AbortSignal.timeout(30000),headers:{Accept:'application/json','User-Agent':'Udara-IPU-Monitor/1.0'}});if(!res.ok)throw Error(`DOE HTTP ${res.status}`);raw=await res.json();normalize(raw);break;}
 catch(e){if(attempt===2)throw e;await new Promise(r=>setTimeout(r,2000*(attempt+1)));}
}
const stations=normalize(raw);let previous={};
try{previous=JSON.parse(await readFile(new URL('../data/latest.json',import.meta.url),'utf8'));}catch{}
const now=Date.now();
const payload={schema:1,source:'Department of Environment Malaysia / MyEQMS',sourceUrl:'https://eqms.doe.gov.my/',fetchedAt:new Date(now).toISOString(),stations,history:mergeHistory(previous.history||{},stations,now)};
await mkdir(new URL('../data/',import.meta.url),{recursive:true});
await writeFile(new URL('../data/latest.json',import.meta.url),JSON.stringify(payload));
console.log(`Saved ${stations.length} official stations. Latest observation: ${new Date(Math.max(...stations.map(s=>s.time||0))).toISOString()}`);
