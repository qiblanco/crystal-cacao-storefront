#!/usr/bin/env bash
# Die Naht zum Vendoring-Vertrag (ADR 0056): dieser Bau darf KEINE ALARM-Klasse
# der Drift-Wache erzeugen.
#
# WARUM EIN WRAPPER UND NICHT DIE PROBE DIREKT — der Unterschied entscheidet
# ueber einen Fehlalarm: homepage_crystal_cacao_drift.py kennt DREI Ausgaenge,
# und nur zwei davon sind Befunde.
#   exit 0  synchron
#   exit 3  NUR UPSTREAM-DRIFT — die autoritative Seite hat sich bewegt, die
#           Kopie zieht nach. Die Wache selbst nennt das woertlich "der
#           Vendoring-Vertrag bei der Arbeit und kein Alarm" und routet es auf
#           den log-Kanal. Fuer die HIER zugesagte Naht ist das ERFUELLT.
#   exit 2  ALARM: LOKAL-DRIFT / HUELLE-DRIFT / NAHT-NACHZUG / FEHLT. Genau das
#           ist die Zusage dieses Bauens: er erzeugt keinen davon.
#   exit 4  Messausfall -> keine Aussage, durchgereicht.
# Wer exit 3 als Widerlegung bucht, schickt einen Reparaturauftrag gegen einen
# gesunden Vertrag, sobald qiblanco das naechste Mal irgendetwas aendert.
set -o pipefail
python3 /srv/openclaw/shared-state/bauten-wache/bin/proben/homepage_crystal_cacao_drift.py
rc=$?
case "$rc" in
  0) echo "NAHT GESCHLOSSEN: Manifest und Kopie synchron."; exit 0 ;;
  3) echo "NAHT GESCHLOSSEN: nur UPSTREAM-DRIFT (faelliger Nachzug), keine ALARM-Klasse."; exit 0 ;;
  4) echo "MESSAUSFALL der Drift-Wache — keine Aussage."; exit 4 ;;
  *) echo "NAHT OFFEN: Drift-Wache meldet eine ALARM-Klasse (exit $rc)."; exit 1 ;;
esac
