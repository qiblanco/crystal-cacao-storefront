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
