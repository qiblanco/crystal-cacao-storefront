/**
 * Erst jede Person einmal, dann die Wiederholungen — die gemeinsame
 * Sortierregel aller Video-/Testimonial-Slider (qiblanco.com, crystal-cacao.com;
 * qi-blanco.com führt dieselbe Regel in snippets/qb-amazonstil-ig-kacheln.liquid).
 *
 * Christian am 02.11.2026, wörtlich: „Also generelle Regel, dass man erst sagt,
 * ja nach Datum, aber bevor die Wiederholungsposts anfangen, kommen die Leute
 * noch rein, die man noch gar nicht hat. Und das gilt natürlich dann für alle
 * Homepage-Videos, die wir haben."
 *
 * Die Funktion bekommt die Kacheln in der Reihenfolge, die die Fläche schon
 * hat (Datum auf den Kakao-Seiten, Christians Stufen/`vorn`/`ansEnde` auf den
 * Produktseiten), und legt sie in Runden:
 *   Runde 1: von jeder Person die erste Kachel dieser Reihenfolge.
 *   Runde 2 ff.: die zweite, dritte … Kachel derselben Personen.
 * Innerhalb jeder Runde bleibt die Reihenfolge erhalten. Nur wenn die nächste
 * Kachel dieselbe Person wäre wie die vorige (an der Rundengrenze), rückt die
 * nächste Kachel einer anderen Person derselben Runde vor. Hat eine Runde
 * nur noch Kacheln derselben Person, gibt es keine andere Reihe.
 *
 * „Person" ist `person` (wenn jemand zwei Konten führt), sonst `profil`, in
 * Kleinschreibung. Eigene Beiträge ohne Profil zählen als eine Person.
 * Ohne Wiederholung in der Eingabe ist die Funktion ein No-Op.
 */
export const personVon = (t) =>
  String(t?.person ?? t?.profil ?? '').toLowerCase();

export function reiheErstJedePerson(geordnet) {
  const zaehler = new Map();
  const runden = [];
  for (const t of geordnet) {
    const p = personVon(t);
    const n = zaehler.get(p) ?? 0;
    zaehler.set(p, n + 1);
    (runden[n] ??= []).push(t);
  }
  const reihe = [];
  for (const runde of runden) {
    const offen = [...runde];
    while (offen.length > 0) {
      const vorige =
        reihe.length > 0 ? personVon(reihe[reihe.length - 1]) : null;
      const i = offen.findIndex((t) => personVon(t) !== vorige);
      reihe.push(offen.splice(i === -1 ? 0 : i, 1)[0]);
    }
  }
  return reihe;
}
