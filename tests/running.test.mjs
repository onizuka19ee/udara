import test from 'node:test';
import assert from 'node:assert/strict';
import {runningAdvice,periodLabel} from '../running.mjs';
const now=Date.now(),s={time:now,value:25};
test('running advice never gives a go-ahead for unknown, stale, remote or failed data',()=>{
 for(const [station,options] of [[null,{}],[s,{}],[{...s,time:now-4*3600000},{verified:true}],[s,{verified:true,fetchFailed:true}],[s,{verified:true,distance:101}],[{...s,value:null},{verified:true}]])assert.equal(runningAdvice(station,{now,...options}).label,'Check before heading out');
});
test('running recommendations respond to Malaysian category boundaries',()=>{
 const title=v=>runningAdvice({...s,value:v},{verified:true,now}).title;
 assert.equal(title(50),'Good air for a run.');assert.equal(title(51),'An easy run is a sensible choice.');assert.equal(title(100),'An easy run is a sensible choice.');assert.equal(title(101),'Move your run indoors.');assert.equal(title(200),'Move your run indoors.');assert.equal(title(201),'Skip the outdoor run.');assert.equal(title(350),'Skip the outdoor run.');
});
test('greetings use Malaysia time rather than device timezone',()=>{
 for(const [utc,label] of [['2026-10-17T23:00:00Z','MORNING'],['2026-10-17T05:00:00Z','AFTERNOON'],['2026-10-17T10:00:00Z','EVENING'],['2026-10-17T14:00:00Z','NIGHT']])assert.equal(periodLabel(new Date(utc)),label);
});
