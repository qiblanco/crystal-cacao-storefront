# Stillgelegte Workflows

Dateien in diesem Verzeichnis werden von GitHub Actions **nicht ausgefuehrt** —
Actions liest ausschliesslich `.github/workflows/`. Sie liegen hier statt
geloescht zu sein, damit ihr Inhalt lesbar bleibt und der Rueckweg ein
`git mv` ist, kein Restore aus der Historie.

## `oxygen-deployment.yml` — stillgelegt am 2026-08-24

**Warum.** Das Repo hatte zwei Oxygen-Deploy-Workflows fuer *dieselbe*
Storefront. Auf `main` sprangen beide gleichzeitig an — belegt an vier
Commits, bei denen beide Laeufe dieselbe `created_at`-Sekunde tragen
(`dd8851e3`, `7bce1f53`, `0ce8c161`, `e0d4e9ea`).

**Was die Messung korrigiert hat.** Der naheliegende Verdacht war ein Rennen
mit nichtdeterministischem Ausgang. Das ist **nicht** der Fall: dieser
Workflow ist in seinen fuenf Laeufen **fuenfmal gescheitert**, immer im
Deploy-Schritt mit

```
No deployment token provided. Use the `--token` flag to provide a token.
```

Er erwartet das Secret `OXYGEN_DEPLOYMENT_TOKEN`; gesetzt ist in diesem Repo
nur `OXYGEN_DEPLOYMENT_TOKEN_1000172095`. Der Ausgang war also deterministisch
— nur eben zugunsten des jeweils anderen Workflows.

**Warum die Stilllegung trotzdem noetig war.** Der Workflow uebergab
`--env-file` mit fuenf **leeren** Werten: alle fuenf referenzierten Secrets
(`SESSION_SECRET`, `PUBLIC_STOREFRONT_API_TOKEN`, `PUBLIC_STORE_DOMAIN`,
`PUBLIC_STOREFRONT_ID`, `PUBLIC_CHECKOUT_DOMAIN`) sind ungesetzt — im
Runner-Log daran zu erkennen, dass sie leer erscheinen, waehrend ein gesetztes
Secret dort als `***` steht. `hydrogen deploy --env-file` sendet den
Dateiinhalt als `overriddenEnvironmentVariables` und **ueberschreibt** damit
die im Shopify-Admin gepflegte Runtime-Env der Oxygen-Umgebung.

Haette also jemand das fehlende Token nachgetragen — der naheliegendste
"Fix" ueberhaupt —, waere die Runtime-Env der Storefront mit leeren
Zeichenketten ueberschrieben worden, `PUBLIC_CHECKOUT_DOMAIN` und
`SESSION_SECRET` eingeschlossen. Das ist eine kundenwirksame Flaeche: ohne
`SESSION_SECRET` wirft `app/lib/context.js` bei jedem Request.

Der Workflow war damit keine harmlose Dublette, sondern eine geladene Waffe,
die nur deshalb nie ausgeloest hat, weil ihr das Token fehlte.

**Was stattdessen gilt.** `.github/workflows/oxygen-deployment-1000172095.yml`
ist der einzige Deploy-Weg. Er faehrt bewusst **ohne** `--env-file`, solange
nicht alle fuenf Secrets gesetzt sind — denn ohne das Flag sendet die CLI gar
keine Ueberschreibung, und die Storefront laeuft mit den Admin-Variablen der
Oxygen-Umgebung. Die Begruendung im Detail steht im Kopf jener Datei.

**Rueckweg.** `git mv .github/retired-workflows/oxygen-deployment.yml
.github/workflows/` — dann aber vorher `OXYGEN_DEPLOYMENT_TOKEN` setzen *und*
die fuenf Env-Secrets befuellen, sonst tritt genau der oben beschriebene
Schaden ein.

**Was hier drin brauchbar bleibt.** Die Preview-Logik (`--preview`,
`--auth-bypass-token`) fuer Nicht-`main`-Branches. Wer sie will, portiert sie
in den aktiven Workflow, statt diesen hier zu reaktivieren.
