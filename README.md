# Crystal Cacao Storefront

Eigenständige Shopify-Hydrogen-Storefront für `crystal-cacao.com`. Eigenes
Theme/Repo, aber angebunden an denselben Shopify-Shop wie `qiblanco.com` —
Checkout läuft deshalb automatisch über `checkout.qiblanco.com`, ohne
zusätzliche Konfiguration hier im Repo.

## Status (Stand: Gerüst-Erstellung)

- [x] Hydrogen-Grundgerüst erzeugt (`shopify hydrogen init`, JavaScript, kein
      Styling-Framework, ein Markt), Build lokal verifiziert (`npm run build`
      läuft grün).
- [x] `.github/workflows/oxygen-deployment.yml` vorbereitet (Muster aus
      `qiblanco-storefront`, ohne die dortigen qiblanco-spezifischen
      Tracking-/Freshdesk-Env-Variablen).
- [ ] **Offen — braucht Shopify-Admin-Rechte:** Neue Hydrogen-Storefront im
      Shopify-Adminbereich anlegen (liefert `PUBLIC_STOREFRONT_API_TOKEN`,
      `PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_ID`, `PUBLIC_CHECKOUT_DOMAIN`
      sowie einen Oxygen-Deployment-Token).
- [ ] **Offen:** GitHub-Secrets im Repo setzen (`SESSION_SECRET` selbst
      generieren, die vier `PUBLIC_*`-Werte + `OXYGEN_DEPLOYMENT_TOKEN` aus
      dem Schritt oben).
- [ ] **Offen — Registrar-Seite (united-domains.de):** `crystal-cacao.com`
      **vor dem 01.09.2026** verlängern (läuft sonst ab). Betrifft auch die
      Schwester-Domains crystal-cacao.de, crystalcacao.de, kristall-kakao.com/.de,
      kristallkakao.com/.de — alle mit demselben Ablaufdatum.
- [ ] **Offen:** Nach dem ersten erfolgreichen Deploy auf `main` die DNS von
      `crystal-cacao.com` bei united-domains von deren Standard-Webspace auf
      Shopify Oxygen umstellen.

Solange kein echter Storefront-API-Token gesetzt ist, läuft `npm run dev`
gegen `mock.shop` (Platzhalter-Produkte) — nicht gegen den echten Qi-Blanco-
Katalog.

## Setup lokal

```bash
npm install
npm run dev
```

---

# Hydrogen template: Skeleton

Hydrogen is Shopify's stack for headless commerce. Hydrogen is designed to dovetail with [React Router](https://reactrouter.com/), the modern multi-strategy router for React. This template contains a **minimal setup** of components, queries and tooling to get started with Hydrogen.

[Check out Hydrogen docs](https://shopify.dev/custom-storefronts/hydrogen)
[Get familiar with React Router](https://reactrouter.com/start/framework/routing)

## What's included

- React Router
- Hydrogen
- Oxygen
- Vite
- Shopify CLI
- ESLint
- Prettier
- GraphQL generator
- TypeScript and JavaScript flavors
- Minimal setup of components and routes
