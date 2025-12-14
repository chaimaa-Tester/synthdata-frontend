// Zentrale Definitionen für Feldtypen und Use Cases
export type FieldType =
  // Allgemeine Felder
  | "name"
  | "vorname"
  | "nachname"
  | "geschlecht"
  | "alter"
  | "email"
  | "telefon"
  | "date"
  | "Integer"
  | "körpergröße"
  | "gewicht"
  | "bmi"
  | "gewichtdiagnose"
  | ""

  // logistik – Containerdaten
  | "unitName"
  | "containerTyp"
  | "attributeSize"
  | "attributeWeight"
  | "attributeStatus"
  | "attributeDirection"
  | "timeIn"
  | "timeOut"
  | "dwelltime"

  // logistik – Carrier / Ship
  
  | "service_route"
  | "linerName"
  | "serviceName"
  | "shipName"
  | "eta"
  | "etd"
  | "length_m"
  | "loadTEU"
  | "dischargeTEU"

  // Finanzen
  | "kontonummer"
  | "transaktionsdatum"
  | "transaktionsart"
  | "betrag";

export type UseCaseField = { value: FieldType; label: string; tooltip?: string };
export type FieldGroup = { groupLabel: string; fields: UseCaseField[] };
export type UseCase = {
  id: string;
  label: string;
  description: string;
  icon: string;
  // Einige Use Cases haben eine flache 'fields'-Liste, andere sind in Gruppen unterteilt.
  fields?: UseCaseField[];
  fieldGroups?: FieldGroup[];
};

// Einheitliche, deutsche Labels für die Feldtypen
export const useCases: UseCase[] = [
  {
    id: "custom",
    label: "Allgemeine Felder",
    description: "Name, Datum, E-Mail, Telefon, Geschlecht, Alter, Adresse, ",
    icon: "",
    fields: [
      { value: "name", label: "Vollständiger Name", tooltip: "" },
      { value: "date", label: "Datum", tooltip: "" },
      { value: "email", label: "E-Mail", tooltip: "" },
      { value: "telefon", label: "Telefonnummer", tooltip: "" },
      { value: "geschlecht", label: "Geschlecht", tooltip: "" },
      { value: "alter", label: "Alter", tooltip: "" },
      { value: "vorname", label: "Vorname", tooltip: "" },
      { value: "nachname", label: "Nachname", tooltip: "" },









      
    ],
  },
  {
    
    id: "logistik",
    label: "Logistik",
    description: "Simulation von Containerbewegungen, Schiffsanläufen und Reedereidaten im Hafen.",
    icon: "🚢",
    fieldGroups: [

      {
        groupLabel: "📦 Containerdaten",
        fields: [
          { value: "unitName", label: "Containereinheit", tooltip: "Eindeutige Kennung der Containereinheit (z. B. ABCU1234567 oder CNT-123456A)." },
          { value: "containerTyp", label: "Containertyp", tooltip: "Bauart des Containers, z. B. Standard, High Cube, Reefer (Kühlcontainer), Flat Rack oder Open Top." },
          { value: "attributeSize", label: "Containergröße (Fuß)", tooltip: "Standardgrößen: 20 ft, 40 ft oder 45 ft. High-Cube-Container sind höher als Standardcontainer." },
          { value: "attributeWeight", label: "Containergewicht (kg)", tooltip: "Gesamtgewicht inklusive Ladung. Wird je nach Containertyp und Größe realistisch berechnet." },
          { value: "attributeStatus", label: "Beladungsstatus", tooltip: "Zeigt an, ob der Container leer oder beladen ist. Wird automatisch aus dem Gewicht abgeleitet." },
          { value: "attributeDirection", label: "Transportrichtung", tooltip: "Gibt an, ob der Container importiert oder exportiert wird." },
          { value: "timeIn", label: "Ankunftszeit im Terminal", tooltip: "Zeitpunkt, zu dem der Container im Terminal eintrifft (innerhalb der ETA des Schiffes)." },
          { value: "timeOut", label: "Abfahrtszeit aus dem Terminal", tooltip: "Zeitpunkt, zu dem der Container das Terminal verlässt (innerhalb der ETD des Schiffes)." },
          { value: "dwelltime", label: "Verweildauer (Stunden)", tooltip: "Automatisch berechnete Aufenthaltszeit im Terminal (Abfahrtszeit minus Ankunftszeit)." },
        ],
      },
      {
        groupLabel: "🚢 Carrier- und Schiffsdaten",
        fields: [
          { value: "serviceName", label: "Servicename", tooltip: "Bezeichnung der Schiffslinie, z. B. „Europe–India Line“ oder „Transatlantic East“." },
          { value: "service_route", label: "Service-Route", tooltip: "Die Route, die der Carrier bedient, z. B. Asien–Europa oder Transatlantik." },       
          { value: "linerName", label: "Reedereiname", tooltip: "Name der Reederei, der der Carrier angehört, z. B. Hapag-Lloyd oder CMA CGM." },        
          { value: "shipName", label: "Schiffsname", tooltip: "Name des Schiffes, das den Container transportiert (z. B. Ever Ace, MSC Gülsün)." },
          { value: "eta", label: "ETA (Ankunftszeit)", tooltip: "Voraussichtliche Ankunftszeit des Schiffes im Hafen (Estimated Time of Arrival)." },
          { value: "etd", label: "ETD (Abfahrtszeit)", tooltip: "Voraussichtliche Abfahrtszeit des Schiffes aus dem Hafen (Estimated Time of Departure)." },
          { value: "length_m", label: "Schiffslänge (m)", tooltip: "Gesamtlänge des Schiffes in Metern." },
          { value: "loadTEU", label: "Geladene TEU", tooltip: "Anzahl der Container, die auf dem Schiff aktuell geladen sind." },
          { value: "dischargeTEU", label: "Entladene TEU", tooltip: "Anzahl der Container, die im Hafen entladen werden." },
        ],
      },
    ],
  },
  {
    id: "gesundheit",
    label: "Gesundheitswesen",
    description: "Patienten, Diagnosen, Behandlungen",
    icon: "🏥",
    fields: [
      { value: "date", label: "Geburtsdatum" },
      { value: "körpergröße", label: "Körpergröße (cm)" },
      { value: "gewicht", label: "Gewicht (kg)" },
      { value: "bmi", label: "Body-Mass-Index (BMI)" },
      { value: "gewichtdiagnose", label: "Gewichtsdiagnose" },
    ],
  },
  {
    id: "finanzen",
    label: "Finanzwesen",
    description: "Transaktionen, Konten, Zahlungen",
    icon: "💰",
    fields: [
      { value: "kontonummer", label: "Kontonummer" },
      { value: "transaktionsart", label: "Transaktionsart", tooltip: "SEPA-Überweisung, Lastschrift, Kreditkartenzahlung, Bargeldabhebung, Online-Zahlung" },
      { value: "betrag", label: "Betrag" },
    ],
  },

];

export const getLabelForType = (t?: FieldType | string) => {
  if (!t) return "";
  for (const uc of useCases) {
    if (uc.fields) {
      const f = uc.fields.find((ff) => ff.value === t);
      if (f) return f.label;
    }
    if (uc.fieldGroups) {
      for (const g of uc.fieldGroups) {
        const f = g.fields.find((ff) => ff.value === t);
        if (f) return f.label;
      }
    }
  }
  return String(t);
};

export const getTooltipForType = (t?: FieldType | string) => {
  if (!t) return "";
  for (const uc of useCases) {
    if (uc.fields) {
      const f = uc.fields.find((ff) => ff.value === t);
      if (f && f.tooltip) return f.tooltip;
    }
    if (uc.fieldGroups) {
      for (const g of uc.fieldGroups) {
        const f = g.fields.find((ff) => ff.value === t);
        if (f && f.tooltip) return f.tooltip;
      }
    }
  }
  return "";
};
