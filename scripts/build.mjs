import {mkdir,cp,rm,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),out=new URL('dist/',root);
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const f of ['index.html','style.css','app.mjs','core.mjs','running.mjs','icon.svg','manifest.webmanifest','sw.js','icons'])await cp(new URL(f,root),new URL(f,out),{recursive:true});
await writeFile(new URL('_routes.json',out),JSON.stringify({version:1,include:['/api/*'],exclude:[]}));
console.log('Static app built in dist; functions/ stays at the repository root for Cloudflare Pages.');
