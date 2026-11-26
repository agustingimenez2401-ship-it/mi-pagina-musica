export async function onRequest(context){const url=new URL(context.request.url);if(url.pathname==='/admin')return Response.redirect(new URL('/admin/',url),308);return context.next()}
