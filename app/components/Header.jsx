import {Suspense} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';
import {
  ABSENDER_MARKE,
  KAKAO_KENNZAHLEN,
  KAKAO_MENUE,
} from '~/lib/kakao-zone';

/**
 * @param {HeaderProps}
 */
export function Header({header, isLoggedIn, cart, publicStoreDomain}) {
  // SORTIMENTS-ZAUN (app/lib/kakao-zone.js): `header.shop.name` und
  // `header.menu` kommen aus dem Shopify-Shop qi-blanco.myshopify.com und
  // trugen dadurch die fremde Absender-Marke und das fremde Sortiment in die
  // Kopfzeile JEDER Seite. Beide werden hier bewusst nicht mehr gelesen.
  return (
    <>
      <CacaoAnnouncementBanner />
      <header className="header">
      <NavLink
        className="header-marke"
        prefetch="intent"
        to="/"
        style={activeLinkStyle}
        title={ABSENDER_MARKE}
        end
      >
        <strong>{ABSENDER_MARKE}</strong>
      </NavLink>
      <HeaderMenu
        menu={KAKAO_MENUE}
        viewport="desktop"
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
      />
      <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      </header>
    </>
  );
}

/**
 * Der Vertrauensbalken ueber der Kopfzeile — UEBERTRAGEN, nicht erfunden.
 *
 * HERKUNFT, woertlich aus der Vorlage: qiblanco-storefront
 * app/components/Header.jsx Zeile 184-216 rendert `<AnnouncementBanner>` und
 * waehlt seinen Inhalt ueber `isCacaoPage`. Der Kakao-Zweig lautet dort
 * "{KAKAO_KENNZAHLEN.bewertungSkala} ⭐⭐⭐⭐⭐ - Über {KAKAO_KENNZAHLEN.nutzer}
 * aktive Nutzer" + " - " + "jetzt mit Zufriedenheitsgarantie!" und verlinkt
 * auf /pages/crystal-cacao. Genau dieser Zweig steht hier; der Qi-Blanco-Zweig
 * (GoogleSterneBadge, 14.000 zufriedene Kunden, 20 Tage risikofrei) und der
 * Rezensionen-Popup-Handler sind NICHT uebernommen — sie gehoeren zur fremden
 * Welt und waeren genau der Fremdinhalt, den s02 getilgt hat.
 *
 * WARUM ER HIER OHNE `isCacaoPage`-Abfrage STEHT: auf crystal-cacao.com ist
 * JEDE Seite eine Kakao-Seite (Sortiments-Zaun, kakao-zone.js). Eine
 * Fallunterscheidung haette hier baulich keinen zweiten Zweig — sie waere
 * toter Code, und toter Code sieht spaeter wie eine vergessene Bedingung aus.
 *
 * WARUM ER DEN SCROLL-EINZUG DER VORLAGE NICHT MITBRINGT: dort haengt
 * `maxHeight: scrolled ? 0 : 100px` an einem Scroll-Listener, den crystals
 * Kopfzeile nicht fuehrt (sie ist `position: sticky` statt eigen-versteckend).
 * Den Listener nachzubauen waere ein zweites Verhalten in einer fremden
 * Kopfzeile, nicht eine Uebertragung. Der Balken scrollt hier schlicht mit
 * weg, weil er ausserhalb des sticky-Elements steht.
 *
 * DIE ZAHLEN kommen aus derselben SSoT wie in der Vorlage
 * (KAKAO_KENNZAHLEN in app/lib/kakao-zone.js: 4,9/5,0 und 1.000) — sie sind
 * ABGELEITET, nicht danebengeschrieben. Sie gehoeren bewusst NICHT ins
 * JSON-LD; die Begruendung steht im Kopf jener Konstante.
 */
function CacaoAnnouncementBanner() {
  return (
    <div className="Header-AnnouncementBanner">
      <NavLink prefetch="intent" to="/pages/crystal-cacao">
        <p>
          <span className="banner-line">
            {KAKAO_KENNZAHLEN.bewertungSkala} ⭐⭐⭐⭐⭐ - Über{' '}
            {KAKAO_KENNZAHLEN.nutzer} aktive Nutzer
          </span>
          <span className="banner-offer-sep"> - </span>
          <span className="banner-line">jetzt mit Zufriedenheitsgarantie!</span>
        </p>
      </NavLink>
    </div>
  );
}

/**
 * @param {{
 *   menu: HeaderProps['header']['menu'];
 *   primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
 *   viewport: Viewport;
 *   publicStoreDomain: HeaderProps['publicStoreDomain'];
 * }}
 */
export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}) {
  const className = `header-menu-${viewport}`;
  const {close} = useAside();

  return (
    <nav className={className} role="navigation">
      {(menu || KAKAO_MENUE).items.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            style={activeLinkStyle}
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
      {/* Der Drawer traegt seit 2026-09-02 (s05) auch den Weg zum Konto: in der
          Kopfzeile hat er auf schmalen Geraeten die Marke verdraengt (siehe
          HeaderCtas), hier ist Platz. Kein Funktionsverlust, ein Fingertipp
          mehr — und er steht NACH der Navigation, weil ein Besucher zuerst den
          Laden sucht und erst danach sein Konto.
          "Home" ist dabei entfallen: der erste Menuepunkt heisst bereits
          "Start" und zeigt auf dasselbe Ziel; zwei Eintraege fuer eine Seite
          sahen wie zwei verschiedene Ziele aus. */}
      {viewport === 'mobile' && (
        <NavLink
          className="header-menu-item header-menu-konto"
          onClick={close}
          prefetch="intent"
          style={activeLinkStyle}
          to="/account"
        >
          Mein Konto
        </NavLink>
      )}
    </nav>
  );
}

/**
 * @param {Pick<HeaderProps, 'isLoggedIn' | 'cart'>}
 */
function HeaderCtas({isLoggedIn, cart}) {
  return (
    <nav className="header-ctas" role="navigation">
      <HeaderMenuMobileToggle />
      {/* Die Klasse ist der Griff, an dem app.css diesen Eintrag auf schmalen
          Geraeten aus der Kopfzeile nimmt — den Weg zum Konto uebernimmt dort
          der Menue-Drawer (HeaderMenu, viewport="mobile"). Gemessen 2026-09-02:
          die drei Wort-CTAs belegten 226 von 358 px Innenbreite bei 390px und
          drueckten den Ladennamen auf "Crys…"; bei 320px lief die Kopfzeile
          sogar ueber (scrollWidth 327). */}
      <NavLink
        className="header-konto"
        prefetch="intent"
        to="/account"
        style={activeLinkStyle}
      >
        <Suspense fallback="Anmelden">
          <Await resolve={isLoggedIn} errorElement="Anmelden">
            {(isLoggedIn) => (isLoggedIn ? 'Mein Konto' : 'Anmelden')}
          </Await>
        </Suspense>
      </NavLink>
      <SearchToggle />
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className="header-menu-mobile-toggle reset"
      onClick={() => open('mobile')}
    >
      <h3>☰</h3>
    </button>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button className="reset" onClick={() => open('search')}>
      Suchen
    </button>
  );
}

/**
 * @param {{count: number}}
 */
function CartBadge({count}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        });
      }}
    >
      Warenkorb <span className="cart-count" aria-label={`(Artikel: ${count})`}>{count}</span>
    </a>
  );
}

/**
 * @param {Pick<HeaderProps, 'cart'>}
 */
function CartToggle({cart}) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue();
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Kollektionen',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Magazin',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Rechtliches',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'Über uns',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

/**
 * @param {{
 *   isActive: boolean;
 *   isPending: boolean;
 * }}
 */
function activeLinkStyle({isActive, isPending}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    // s03, 2026-09-04: hier standen die Literale 'black' und 'grey' — die
    // letzten zwei freien Farbwerte des Ladens, und die hartnaeckigsten.
    // GEMESSEN: nach der Umstellung aller Stylesheets auf --cc-dunkel trugen
    // auf JEDER der fuenf Routen immer noch 13 Elemente exakt rgb(0,0,0);
    // alle 13 waren Kopfzeilen-Links. Der Grund ist die Bauform, nicht die
    // Farbe: dies ist ein INLINE-Style, und ein Inline-Style schlaegt jede
    // Regel aus jedem Stylesheet. Ein Fix in der CSS-Datei waere gruen
    // gewesen (die Regel steht ja da) und haette nichts geaendert — genau die
    // Sorte Falsch-Gruen, die man nur am gerenderten DOM sieht.
    // Beide Werte zeigen jetzt auf die Token-Schicht; der Fallback haelt die
    // Komponente ohne kakao-seiten.css unveraendert lauffaehig.
    color: isPending
      ? 'var(--cc-muted, grey)'
      : 'var(--cc-dunkel, black)',
  };
}

/** @typedef {'desktop' | 'mobile'} Viewport */
/**
 * @typedef {Object} HeaderProps
 * @property {HeaderQuery} header
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 */

/** @typedef {import('@shopify/hydrogen').CartViewPayload} CartViewPayload */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
