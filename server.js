import * as serverBuild from 'virtual:react-router/server-build';
import {createRequestHandler, storefrontRedirect} from '@shopify/hydrogen';
import {createHydrogenRouterContext} from '~/lib/context';

/**
 * Export a fetch handler in module format.
 */
export default {
  /**
   * @param {Request} request
   * @param {Env} env
   * @param {ExecutionContext} executionContext
   * @return {Promise<Response>}
   */
  async fetch(request, env, executionContext) {
    try {
      const hydrogenContext = await createHydrogenRouterContext(
        request,
        env,
        executionContext,
      );

      /**
       * Create a Hydrogen request handler that internally
       * delegates to React Router for routing and rendering.
       */
      const handleRequest = createRequestHandler({
        build: serverBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => hydrogenContext,
      });

      const response = await handleRequest(request);

      // MESSPUNKT AM RAND: welche Storefront-API-Version dieser laufende
      // Prozess fuer seine eigenen Abfragen WIRKLICH benutzt (Muster:
      // qiblanco-storefront server.js). Gelesen von
      // homepage-bauer/pruefungen/probe_sfapi_version_frist.py (Quelle `rand`)
      // - anders als ein Blick in node_modules zeigt er den geladenen Stand,
      // auch nach einem Neu-Installieren ohne Neustart.
      // Wirft nie: ein fehlender Messkopf darf den Kaufweg nicht beruehren.
      try {
        const version = /\/api\/([^/]+)\/graphql\.json/.exec(
          hydrogenContext.storefront.getApiUrl(),
        )?.[1];
        if (version) response.headers.set('X-QB-SFAPI-Version', version);
      } catch {
        // unveraenderliche Kopfzeilen (z.B. Redirect) - Messkopf entfaellt
      }

      if (hydrogenContext.session.isPending) {
        response.headers.set(
          'Set-Cookie',
          await hydrogenContext.session.commit(),
        );
      }

      if (response.status === 404) {
        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        return storefrontRedirect({
          request,
          response,
          storefront: hydrogenContext.storefront,
        });
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};
