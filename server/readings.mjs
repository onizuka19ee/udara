import {SOURCE,normalize} from '../core.mjs';
export async function handleReadings(request,fetcher=fetch){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff'};
 if(request.method!=='GET')return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers:{...headers,Allow:'GET'}});
 try{
  // Fixed official endpoint only; never forward caller-supplied URLs or coordinates.
  const response=await fetcher(SOURCE,{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Official feed unavailable');
  const stations=normalize(await response.json());
  return new Response(JSON.stringify({schema:1,source:'Department of Environment Malaysia / MyEQMS',sourceUrl:'https://eqms.doe.gov.my/',fetchedAt:new Date().toISOString(),stations}),{headers});
 }catch{
  return new Response(JSON.stringify({error:'Official readings could not be retrieved. Please try again or check MyEQMS.'}),{status:502,headers});
 }
}
