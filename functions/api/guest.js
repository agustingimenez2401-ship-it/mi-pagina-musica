import {json} from '../_lib/http.js';
import {initialState} from '../_lib/data.js';

// The old public wall and visitor-song submission are retired. Keep the route
// module because the Worker entry point imports it; reactions remain supported.
export async function onRequestPost({request,env}){
  if(!env.MUSIC_DATA)return json({error:'Falta conectar el KV MUSIC_DATA'},503);
  const raw=await request.text();
  if(raw.length>12000)return json({error:'Contenido demasiado grande'},413);
  let body;
  try{body=JSON.parse(raw)}catch{return json({error:'JSON inválido'},400)}
  if(body.type!=='reaction'||!['🔥','🖤','🥶'].includes(body.emoji))return json({error:'Esta función ya no está disponible'},410);
  let state;
  try{state=JSON.parse(await env.MUSIC_DATA.get('site-state'))||JSON.parse(JSON.stringify(initialState))}catch{state=JSON.parse(JSON.stringify(initialState))}
  state.reactions=state.reactions||{};
  state.reactions[body.emoji]=Math.max(0,(state.reactions[body.emoji]||0)+(body.active?1:-1));
  await env.MUSIC_DATA.put('site-state',JSON.stringify(state));
  return json({ok:true});
}
