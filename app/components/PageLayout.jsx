import {Await} from 'react-router';
import {Suspense} from 'react';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header, HeaderMenu} from '~/components/Header';
import {KAKAO_MENUE} from '~/lib/kakao-zone';
import {CartMain} from '~/components/CartMain';

/**
 * @param {PageLayoutProps}
 */
export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  publicStoreDomain,
}) {
  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      {/* HIER STAND BIS 2026-09-09 <SearchAside />. Die Schublade war der
          einzige Zugang zur Suche; ihr Schalter ist mit der Kopfzeile
          entfallen (Begruendung mit Messwerten in Header.jsx, HeaderCtas).
          Sie hier stehen zu lassen waere toter Code mit einem eigenen
          Zustand — und toter Code sieht spaeter wie eine vergessene
          Bedingung aus. Die Route /search bleibt bestehen: sie ist nicht
          kaputt, sie ist nur nicht mehr beworben. */}
      <MobileMenuAside header={header} publicStoreDomain={publicStoreDomain} />
      {header && (
        <Header
          header={header}
          cart={cart}
          publicStoreDomain={publicStoreDomain}
        />
      )}
      <main>{children}</main>
      <Footer
        footer={footer}
        header={header}
        publicStoreDomain={publicStoreDomain}
      />
    </Aside.Provider>
  );
}

/**
 * @param {{cart: PageLayoutProps['cart']}}
 */
function CartAside({cart}) {
  return (
    <Aside type="cart" heading="Warenkorb">
      <Suspense fallback={<p>Warenkorb wird geladen …</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

/**
 * @param {{
 *   header: PageLayoutProps['header'];
 *   publicStoreDomain: PageLayoutProps['publicStoreDomain'];
 * }}
 */
function MobileMenuAside({header, publicStoreDomain}) {
  return (
    // SORTIMENTS-ZAUN (app/lib/kakao-zone.js): das mobile Menü bekommt dieselbe
    // Kakao-Navigation wie die Kopfzeile. `header.menu` gehört dem Fremdshop
    // und wird nicht mehr gelesen — damit hängt dieses Menü auch nicht mehr
    // daran, ob der Fremdshop gerade eine primaryDomain liefert.
    <Aside type="mobile" heading="Menü">
      <HeaderMenu
        menu={KAKAO_MENUE}
        viewport="mobile"
        primaryDomainUrl={header?.shop?.primaryDomain?.url ?? ''}
        publicStoreDomain={publicStoreDomain}
      />
    </Aside>
  );
}

/**
 * @typedef {Object} PageLayoutProps
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<FooterQuery|null>} footer
 * @property {HeaderQuery} header
 * @property {string} publicStoreDomain
 * @property {React.ReactNode} [children]
 */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
