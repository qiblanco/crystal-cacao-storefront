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
export function Header({header, cart, publicStoreDomain}) {
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
      <HeaderCtas cart={cart} />
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
      <NavLink prefetch="intent" to="/">
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
      {/* HIER STAND BIS 2026-09-09 „Mein Konto" — UND DAHINTER LAG EIN
          SERVERFEHLER. Gemessen am echten Rand https://crystal-cacao.com:
          /account -> 302 -> /account/orders -> HTTP 500; alle SECHS
          Konto-Routen endeten im Serverfehler. Ursache ist keine Zeile in
          dieser Datei, sondern eine fehlende Zugangskonfiguration: der Dienst
          meldet "[h2:error:customerAccount] You do not have the valid
          credential to use Customer Account API". Sie zu beschaffen heisst
          Shopify-Admin und Geheimnis — R3-Perimeter, nicht autonom.
          ENTSCHIEDEN WURDE NICHT „reparieren oder liegenlassen", sondern die
          Frage davor: BRAUCHT dieser Laden ein Kundenkonto? Gemessen an der
          echten Kasse (checkout.qiblanco.com, Konfigurationsfeld
          `customerAccountRequirement`): "OPTIONAL" — die Kasse verlangt KEIN
          Konto, ein Gast kauft durch. Bei zwei Sorten ohne Abo ist ein Konto
          damit kein Nutzen, sondern eine Huerde mit einem Fehler dahinter.
          Wer trotzdem eines will, findet den Weg in der Kasse selbst
          (`loginLinkVisible: true`) — dort funktioniert er, weil Shopify ihn
          hostet. Ein entfernter Verweis ist ehrlicher als ein kaputter. */}
    </nav>
  );
}

/**
 * DIE KOPFZEILE TRAEGT NUR NOCH, WAS DER BESUCHER BRAUCHT — 2026-09-09.
 *
 * Bis heute standen hier DREI Wort-Schalter nebeneinander: „Anmelden",
 * „Suchen", „Warenkorb". Zwei davon sind ersatzlos weg, und beide aus einem
 * GEMESSENEN Grund, nicht aus Geschmack:
 *
 *  (1) ANMELDEN — dahinter lag ein Serverfehler. Alle sechs Konto-Routen
 *      endeten am echten Rand in HTTP 500 (Ursache und Entscheidung stehen
 *      ausfuehrlich im Kommentar in HeaderMenu). Die Kasse verlangt kein
 *      Konto (`customerAccountRequirement: "OPTIONAL"`), der Laden hat zwei
 *      Sorten und kein Abo. Also: Verweis weg statt Fassade repariert.
 *
 *  (2) SUCHEN — sie war nicht kaputt, sie war SCHAEDLICH. Gemessen am
 *      2026-09-09: die Suche nach „kakao" liefert elf Treffer, darunter
 *      „Test Page - Crystal Cacao® Create später wieder löschen" (HTTP 200,
 *      fuer jeden Besucher erreichbar) und eine Dublette der Create-Seite
 *      unter einem Muell-Handle. Ein Laden mit ZWEI Sorten, die beide
 *      namentlich im Menue stehen, gewinnt durch eine Suche nichts — er
 *      riskiert nur, dass ein Besucher unsere Werkbank sieht. Der Weg zur
 *      Ware bleibt vollstaendig: „AWAKE", „CREATE", „Alle Sorten".
 *      (Die Wurzel — Testartefakte in der Kollektion `zeremonie-kakao` —
 *      gehoert nicht hierher; sie ist der Gegenstand des eingereihten Jobs
 *      20260909-crystal-cacao-sitemap-meldet-testseite-und-dublette. Wird
 *      sie dort behoben, ist dieser Kopf trotzdem richtig: die Suche bliebe
 *      auch dann eine leere Geste bei zwei Sorten.)
 *
 * WAS BLEIBT, ist der Warenkorb — und er ist jetzt ein ZEICHEN mit einem
 * Abzeichen statt eines Wortes mit einer Zahl daneben.
 *
 * @param {Pick<HeaderProps, 'cart'>}
 */
function HeaderCtas({cart}) {
  return (
    <nav className="header-ctas" role="navigation">
      <HeaderMenuMobileToggle />
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

/**
 * DER WARENKORB IST EIN ZEICHEN, KEIN WORT — 2026-09-09.
 *
 * Christians Punkt woertlich: er soll „erkennbar sein, den Fuellstand zeigen
 * und sich nicht hinter Text verstecken". Bis heute stand hier das Wort
 * „Warenkorb" und daneben ein Zaehler, der auch bei leerem Korb eine „0"
 * zeigte — gemessen 85 x 44 px, von denen 61 px reiner Text waren.
 *
 * DREI ENTSCHEIDUNGEN, jede mit ihrem Grund:
 *
 *  (a) EIN ZEICHEN STATT DES WORTES. Der Korb ist das eine Symbol, das im
 *      Web niemand erklaeren muss. Das Wort geht dabei NICHT verloren: es
 *      steht als `aria-label` weiter da, ein Screenreader liest unveraendert
 *      „Warenkorb, N Artikel". Sichtbarer Text verschwindet, die
 *      Zugaenglichkeit nicht.
 *
 *  (b) DAS ABZEICHEN ERSCHEINT ERST AB DEM ERSTEN ARTIKEL. Eine dauerhafte
 *      „0" ist kein Fuellstand, sie ist Rauschen — sie sagt jedem Besucher
 *      auf jeder Seite, dass er noch nichts gekauft hat. Ab dem ersten
 *      Artikel traegt das Zeichen die Zahl sichtbar auf sich.
 *
 *  (c) DIE TREFFERFLAECHE BLEIBT >= 44 x 44 px (WCAG 2.5.5 AAA, wie
 *      web-dach.yaml `trefferflaeche`). Kleiner wird das WORT, nicht der
 *      Knopf — die Regel aus app.css Block 19 gilt unveraendert weiter.
 *
 * @param {{count: number}}
 */
function CartBadge({count}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      className="header-warenkorb"
      href="/cart"
      aria-label={`Warenkorb, ${count} Artikel`}
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
      {/* aria-hidden: der zugaengliche Name steht am <a>, sonst laese ein
          Screenreader das Zeichen ein zweites Mal als leeres Bild vor. */}
      <svg
        className="header-warenkorb-zeichen"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M6 8h12l-1.2 10.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 8Z" />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
      </svg>
      {count > 0 ? (
        <span className="cart-count" aria-hidden="true">
          {count}
        </span>
      ) : null}
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
