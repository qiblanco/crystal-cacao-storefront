import {AnmeldeWeiche} from './Anmeldeweiche';

// Hülle für die Anmeldeformulare der Kurs- und Aktionsseiten (Name aus der Zeit vor der AC-Ablösung, damit die
// Seiten unverändert bleiben). Seit 17.11.2026 gibt es hier kein ActiveCampaign-Embed mehr (Elina
// EL-20261117-190e62ed: "ALLE Formulare laufen ab sofort NUR noch über den Mail Manager ... kein AC-Rückfall
// mehr"): es erscheint immer das eigene Formular des Mail Managers, bei Störung mit dem Satz aus dem
// Rückfallstand oder eine Hinweiszeile (Begründung in Anmeldeweiche.jsx).
export function ActiveCampaignForm({formId}) {
  return <AnmeldeWeiche formId={formId} />;
}
