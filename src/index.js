import * as login from "../functions/api/login.js";
import * as logout from "../functions/api/logout.js";
import * as session from "../functions/api/session.js";
import * as state from "../functions/api/state.js";
import * as guest from "../functions/api/guest.js";

const routes = new Map([
  ["/api/login", login],
  ["/api/logout", logout],
  ["/api/session", session],
  ["/api/state", state],
  ["/api/guest", guest],
]);

function handlerName(method) {
  return "onRequest" + method[0] + method.slice(1).toLowerCase();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/admin") {
      return Response.redirect(new URL("/admin/", url), 308);
    }

    const route = routes.get(url.pathname);
    if (route) {
      const handler = route[handlerName(request.method)];
      if (!handler) return new Response("Método no permitido", { status: 405 });
      return handler({
        request,
        env,
        params: {},
        waitUntil: promise => ctx.waitUntil(promise),
        next: () => env.ASSETS.fetch(request),
      });
    }

    return env.ASSETS.fetch(request);
  },
};
