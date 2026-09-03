import {useLoaderData, Link} from 'react-router';
import {ABSENDER_MARKE, rechtstextTitel} from '~/lib/kakao-zone';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: `Rechtliche Hinweise | ${ABSENDER_MARKE}`}];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const data = await context.storefront.query(POLICIES_QUERY);

  const shopPolicies = data.shop;
  const policies = [
    shopPolicies?.privacyPolicy,
    shopPolicies?.shippingPolicy,
    shopPolicies?.termsOfService,
    shopPolicies?.refundPolicy,
    shopPolicies?.subscriptionPolicy,
  ].filter((policy) => policy != null);

  if (!policies.length) {
    throw new Response('Keine rechtlichen Hinweise gefunden', {status: 404});
  }

  return {policies};
}

export default function Policies() {
  /** @type {LoaderReturnData} */
  const {policies} = useLoaderData();

  return (
    <div className="policies cc-seite cc-seite--text">
      <h1>Rechtliche Hinweise</h1>
      <p className="cc-lead">
        Hier findest du alles, was du vor und nach einer Bestellung wissen
        musst — Widerruf, Versand und Zahlung, AGB und Datenschutz.
      </p>
      {/* Deutscher Anzeige-Titel, siehe app/lib/kakao-zone.js: der Rechtstext
          selbst wird nicht angefasst, nur seine Beschriftung. */}
      <ul className="cc-linkliste">
        {policies.map((policy) => (
          <li key={policy.id}>
            <Link to={`/policies/${policy.handle}`}>
              {rechtstextTitel(policy.handle, policy.title)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const POLICIES_QUERY = `#graphql
  fragment PolicyItem on ShopPolicy {
    id
    title
    handle
  }
  query Policies ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        ...PolicyItem
      }
      shippingPolicy {
        ...PolicyItem
      }
      termsOfService {
        ...PolicyItem
      }
      refundPolicy {
        ...PolicyItem
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
`;

/** @typedef {import('./+types/policies._index').Route} Route */
/** @typedef {import('storefrontapi.generated').PoliciesQuery} PoliciesQuery */
/** @typedef {import('storefrontapi.generated').PolicyItemFragment} PolicyItemFragment */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
