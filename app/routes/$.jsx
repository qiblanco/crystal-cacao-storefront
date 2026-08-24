/**
 * @param {Route.LoaderArgs}
 */
export async function loader({request}) {
  throw new Response(`Seite ${new URL(request.url).pathname} nicht gefunden`, {
    status: 404,
  });
}

export default function CatchAllPage() {
  return null;
}

/** @typedef {import('./+types/$').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
