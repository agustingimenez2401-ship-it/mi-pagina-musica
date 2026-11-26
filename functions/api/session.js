import {json,validSession} from '../_lib/http.js';
export async function onRequestGet({request,env}){return json({authenticated:await validSession(request,env)})}
