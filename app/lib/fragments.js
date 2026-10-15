// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/cart
export const CART_QUERY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
  fragment CartLine on CartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height

        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
      }
    }
    parentRelationship {
      parent {
        id
      }
    }
  }
  fragment CartLineComponent on ComponentizableCartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height
        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
      }
    }
    lineComponents {
      ...CartLine
    }
  }
  fragment CartApiQuery on Cart {
    updatedAt
    id
    appliedGiftCards {
      id
      lastCharacters
      amountUsed {
        ...Money
      }
    }
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: $numCartLines) {
      nodes {
        ...CartLine
      }
      nodes {
        ...CartLineComponent
      }
    }
    cost {
      subtotalAmount {
        ...Money
      }
      totalAmount {
        ...Money
      }
      totalDutyAmount {
        ...Money
      }
      totalTaxAmount {
        ...Money
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      code
      applicable
    }
  }
`;

// ANTWORT JEDER WARENKORB-MUTATION (Hydrogen `mutateFragment`, eingehängt in
// app/lib/context.js). Grossjob 20261013 „Warenkorb hängt", Segment s02;
// Christian 13.10.: „hängt voll im warenkorb … dauerhaft abstellen".
//
// Hydrogens Vorgabe trägt nur id, totalQuantity und checkoutUrl. Der
// Set-Schritt (legeKakaoSetZeile, K1) las deshalb nach jeder Kundenaktion die
// Zeilen mit einer eigenen Abfrage nach (0,10 bis 0,15 s, gemessen 14.10.).
// Hier stehen dieselben Felder wie in ZEILEN_QUERY von
// kakao-set-zeile.server.js, auch dieselben ersten 100 Zeilen. Dann liest der
// Set-Schritt sie aus der Antwort (zeilenAusAntwort). Gemessen am 14.10. in
// DE, CH, US und AT: die Antwort ist in 15 von 15 Fällen gleich der Abfrage
// danach, samt Rabatt-Zuteilungen der Automatik und des Partnercodes. Fehlt
// ein Feld, liest der Set-Schritt wie bisher nach: kein stiller Fehler, nur
// die alte Abfrage. Probe der Naht: crystal-cacao-node/proben/
// probe_set_schritt_rundreisen.py --modus naht (Server-Timing setzeile q=0).
//
// BEWUSST OHNE `attributes`: persistAttributionOnCartResult
// (cart-attribution.server.js) ersetzt die Attribute, wenn es in der Antwort
// keine findet, und mischt sie mit den vorhandenen, wenn es welche findet.
// Ohne das Feld bleibt die Ersetzen-Semantik genau wie vorher.
//
// `appliedGiftCards { id }` (Befund C07, 13.10.2026): CartGiftCard
// (CartSummary.jsx) vergleicht die Zahl der Gutscheine vor und nach dem
// Einloesen und meldet „nicht gefunden“, statt das Feld still zu leeren.
//
// Ohne #graphql-Kennung wie die Abfragen in kakao-set-zeile.server.js: das
// Fragment gehört nicht in die Codegen-Typen, deren Fragmentnamen schon heute
// kollidieren (README Abschnitt „Was offen bleibt" 5).
export const CART_MUTATE_FRAGMENT = `
  fragment CartApiMutation on Cart {
    id
    totalQuantity
    checkoutUrl
    appliedGiftCards {
      id
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            product {
              handle
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
        discountAllocations {
          discountedAmount {
            amount
          }
          ... on CartCodeDiscountAllocation {
            code
          }
        }
      }
    }
  }
`;

const MENU_FRAGMENT = `#graphql
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
  fragment ChildMenuItem on MenuItem {
    ...MenuItem
  }
  fragment ParentMenuItem on MenuItem {
    ...MenuItem
    items {
      ...ChildMenuItem
    }
  }
  fragment Menu on Menu {
    id
    items {
      ...ParentMenuItem
    }
  }
`;

// SORTIMENTS-ZAUN (app/lib/kakao-zone.js): Diese Abfrage holte bis 2026-09-02
// zusaetzlich `menu(handle: "main-menu")` aus dem Shop qi-blanco.myshopify.com.
// Kopf- und Fusszeile lesen dieses Menue seit dem Zaun nicht mehr — es wurde
// aber WEITERHIN GEHOLT und landete im Hydratations-Datensatz JEDER Seite:
// gemessen 9 Fremdnennungen (QiOne(R), QiBracelet(R), QiHome(R) Air, Links auf
// checkout.qiblanco.com) im ausgelieferten HTML von /cart und /policies, obwohl
// dort sichtbar nichts davon stand.
//
// DAS IST DER UNTERSCHIED ZWISCHEN "WIRD NICHT ANGEZEIGT" UND "IST NICHT DA":
// unsichtbar heisst hier nur, dass gerade keine Komponente es rendert. Die
// Daten gingen trotzdem ueber die Leitung, standen im Quelltext und waren eine
// einzige Komponentenaenderung von der Sichtbarkeit entfernt. Deshalb faellt
// die Menue-Abfrage hier ganz weg statt nur ungenutzt zu bleiben.
//
// `shop` bleibt: primaryDomain wird fuer die URL-Normalisierung gebraucht.
export const HEADER_QUERY = `#graphql
  fragment Shop on Shop {
    id
    name
    description
    primaryDomain {
      url
    }
    # Das Feld brand/logo ist hier bewusst NICHT mehr enthalten: es lieferte
    # die Logo-URL der Marke Qi Blanco in den Datensatz jeder Seite, und
    # gemessen 2026-09-02 liest keine Komponente dieser Storefront es (Suche
    # ueber app/ nach .brand: 0 Treffer ausserhalb dieser Datei). Die
    # Kopfzeile zeigt ABSENDER_MARKE als Text.
    #
    # primaryDomain BLEIBT und ist KEIN Versehen: sie zeigt auf
    # checkout.qiblanco.com und wird von HeaderMenu/FooterMenu gebraucht, um
    # shop-interne URLs auf Pfade zu kuerzen. Der Checkout ist bei Shopify
    # gemeinsam — das ist die Kassen-Domain, keine Fremdwerbung.
  }
  query Header(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    shop {
      ...Shop
    }
  }
`;

export const FOOTER_QUERY = `#graphql
  query Footer(
    $country: CountryCode
    $footerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    menu(handle: $footerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
`;
