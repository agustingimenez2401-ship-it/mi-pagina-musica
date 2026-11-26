import {json,cookie} from '../_lib/http.js';
export async function onRequestPost(){return json({ok:true},200,{'set-cookie':cookie('',0)})}
