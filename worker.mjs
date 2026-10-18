import {handleReadings} from './server/readings.mjs';
export default {
 async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path==='/api/readings'||path==='/api/readings/')return handleReadings(request);
  return env.ASSETS.fetch(request);
 }
};
