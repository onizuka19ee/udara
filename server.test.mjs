import test from 'node:test';
import assert from 'node:assert/strict';
import {handleReadings} from '../server/readings.mjs';
import worker from '../worker.mjs';
const request=()=>new Request('https://udara.example/api/readings');
const raw={features:[{attributes:{STATION_ID:'A',STATION_LOCATION:'Test',API:42,DATETIME:Date.UTC(2026,9,18,10),LATITUDE:3,LONGITUDE:101}}]};
test('on-demand endpoint retrieves validated official data without caching',async()=>{
 let calls=0;const res=await handleReadings(request(),async(url,options)=>{calls++;assert.match(url,/^https:\/\/eqms\.doe\.gov\.my\//);assert.equal(options.cache,'no-store');return Response.json(raw);});
 assert.equal(calls,1);assert.equal(res.status,200);assert.match(res.headers.get('cache-control'),/no-store/);const d=await res.json();assert.equal(d.stations[0].value,42);assert.equal(d.schema,1);
});
test('source failures do not return old snapshots as successful responses',async()=>{
 for(const fetcher of [async()=>new Response('Unavailable',{status:503}),async()=>Response.json({error:'source error'}),async()=>{throw Error('Network failed');}]){const res=await handleReadings(request(),fetcher);assert.equal(res.status,502);assert.ok((await res.json()).error);}
});
test('non-GET calls cannot trigger a source fetch',async()=>{const res=await handleReadings(new Request('https://udara.example/api/readings',{method:'POST'}),()=>{throw Error('must not run');});assert.equal(res.status,405);});
test('Workers deployment preserves static asset routing',async()=>{const res=await worker.fetch(new Request('https://udara.example/style.css'),{ASSETS:{fetch:async()=>new Response('body{}')}});assert.equal(await res.text(),'body{}');});
