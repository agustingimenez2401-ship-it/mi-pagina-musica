import {json,sign,cookie} from '../_lib/http.js';
export async function onRequestPost({request,env}){if(!env.ADMIN_PASSWORD||!env.COOKIE_SECRET)return json({error:'Configurá ADMIN_PASSWORD y COOKIE_SECRET en Cloudflare.'},503);let body;try{body=await request.json()}catch{return json({error:'Solicitud inválida'},400)}if(typeof body.password!=='string'||body.password.length>200)return json({error:'Clave incorrecta'},401);if(body.password!==env.ADMIN_PASSWORD)return json({error:'Clave incorrecta'},401);const exp=Date.now()+8*60*60*1000,nonce=crypto.randomUUID(),value=`${exp}.${nonce}`,sig=await sign(value,env.COOKIE_SECRET);return json({ok:true},200, { 'set-cookie':cookie(`${value}.${sig}`,28800)})}


