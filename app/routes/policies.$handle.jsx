import {Link, redirect, useLoaderData} from 'react-router';
import {canonicalLink} from '~/lib/seo';
import {seitenSignale} from '~/lib/kakao-seo';
import {ABSENDER_MARKE, rechtstextTitel} from '~/lib/kakao-zone';

/**
 * Selbst-Canonical, Teilbild und strukturierte Daten (Job 20260912-sieben-
 * indexierbare-seiten-ohne-sitemap-und-ohne-auszeichnung-prio22).
 *
 * Die Rechtstexte sind eigenständige, indexierbare Seiten mit echtem Inhalt
 * (`/policies/refund-policy` misst 741 eigene Wörter, am 2026-09-12 gemessen).
 * Sie bleiben im Index; ihnen fehlte nur die Auszeichnung, weil diese Route nie
 * eine setzte. Die Vorlage qiblanco-storefront führt den Canonical hier seit
 * dem 2026-08-26, das Teilbild und die strukturierten Daten fehlten dort
 * EBENFALLS — es war nie ein crystal-Defekt, sondern eine Lücke der geteilten
 * Routenklasse in beiden Läden.
 *
 * DER CANONICAL HÄNGT AM ROUTEN-PARAMETER, NICHT AM GELADENEN TEXT: kommt die
 * Shopify-Abfrage ohne Daten zurück, wirft der Loader 404 und `meta` liefert
 * ohnehin nichts Indexierbares mehr. `params.handle` ist die Adresse, die der
 * Besucher aufgerufen hat, und genau die soll kanonisiert werden.
 *
 * KEINE ZUSATZ-AUSZEICHNUNG FÜR `privacy-policy`: der Loader leitet diesen
 * Handle mit 301 auf /pages/datenschutz um (der Shopify-Text gehört einer
 * fremden Praxis-Vorlage). Eine Weiterleitung erreicht `meta` nie.
 *
 * DER RECHTSTEXT SELBST BLEIBT UNBERÜHRT — diese Änderung fasst den <head> an,
 * nie den Text einer Pflichtangabe.
 *
 * @type {Route.MetaFunction}
 */
export const meta = ({data, params}) => {
  const kurz = data?.policy
    ? rechtstextTitel(data.policy.handle, data.policy.title)
    : 'Rechtliches';
  const titel = `${kurz} | ${ABSENDER_MARKE}`;
  const tags = [{title: titel}];
  if (params?.handle) {
    const pfad = `/policies/${params.handle}`;
    tags.push(canonicalLink(pfad), ...seitenSignale({pfad, titel}));
  }
  return tags;
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({params, context}) {
  if (!params.handle) {
    throw new Response('Es wurde keine Seite angegeben', {status: 404});
  }

  // DATENSCHUTZ KOMMT NICHT MEHR AUS SHOPIFY (Job 20260910-crystal-cacao-dse-
  // ist-alter-generatortext-jameda-patienten, gemessen am 2026-09-10):
  // Der Rechtstext `privacy-policy` des geteilten Stores qi-blanco.myshopify.com
  // ist ein alter Generatortext -- 78 528 Zeichen, die „Jameda" nennen und von
  // „Patienten" sprechen. Er gehoert einer fremden Praxis-Vorlage, nicht diesem
  // Laden, und er laesst sich von hier aus nicht heilen: Schreiben braeuchte den
  // Shopify-Scope `write_legal_policies` (fehlt serverweit), und derselbe Text
  // haengt zugleich am Schwester-Laden qiblanco.com.
  //
  // Die Umleitung steht bewusst HIER und nicht nur im Fussmenue: der Fussmenue-
  // Link ist EIN Weg auf diese Adresse, nicht der einzige. Lesezeichen, der
  // Google-Index, die Uebersicht /policies und Verweise aus anderen Rechtstexten
  // zeigen weiter hierher -- ein blosser Link-Tausch haette den Generatortext
  // unter derselben Adresse erreichbar gelassen.
  //
  // 301 und nicht 302: die Verschiebung ist dauerhaft gemeint.
  if (params.handle === 'privacy-policy') {
    throw redirect('/pages/datenschutz', 301);
  }

  const policyName = params.handle.replace(/-([a-z])/g, (_, m1) =>
    m1.toUpperCase(),
  );

  const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
    variables: {
      privacyPolicy: false,
      shippingPolicy: false,
      termsOfService: false,
      refundPolicy: false,
      [policyName]: true,
      language: context.storefront.i18n?.language,
    },
  });

  const policy = data.shop?.[policyName];

  if (!policy) {
    throw new Response('Dieser rechtliche Hinweis wurde nicht gefunden', {status: 404});
  }

  return {policy};
}

export default function Policy() {
  /** @type {LoaderReturnData} */
  const {policy} = useLoaderData();

  return (
    <div className="policy cc-seite cc-seite--text">
      <p className="cc-zurueck">
        <Link to="/policies">← Zurück zur Übersicht</Link>
      </p>
      {/* DEUTSCHER ANZEIGE-TITEL (app/lib/kakao-zone.js rechtstextTitel):
          Shopify liefert die Rechtstexte mit englischem Titel ("Refund
          Policy"), ihr Inhalt ist durchgehend deutsch. Geändert wird NUR die
          Beschriftung — der Rechtstext selbst bleibt Zeichen für Zeichen so,
          wie er aus Shopify kommt. */}
      <h1>{rechtstextTitel(policy.handle, policy.title)}</h1>
      <div
        className="cc-rechtstext"
        dangerouslySetInnerHTML={{__html: policy.body}}
      />
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/Shop
const POLICY_CONTENT_QUERY = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
  query Policy(
    $country: CountryCode
    $language: LanguageCode
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
  ) @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
    }
  }
`;

/**
 * @typedef {keyof Pick<
 *   Shop,
 *   'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy'
 * >} SelectedPolicies
 */

/** @typedef {import('./+types/policies.$handle').Route} Route */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').Shop} Shop */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
