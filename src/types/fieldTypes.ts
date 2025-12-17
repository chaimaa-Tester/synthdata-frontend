// Zentrale Definitionen für Feldtypen und Use Cases
export type FieldType =
  // gesundheit – Patienteninformationen
  | "körpergröße"
  | "gewicht"
  | "bmi"
  | "gewichtdiagnose"

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
  | "betrag"
  | "IBAN"

  // Allgemeine Datentypen
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "time"
  | "datetime"
  | "firstname"
  | "lastname"
  | "fullname"
  | "gender"
  | "email"
  | "phone"
  | "street"
  | "house_number"
  | "postcode"
  | "city"
  | "state"
  | "country"
  | "full_address"
  | "enum"
  | "list"
  | "regex"
  | "uuid"
  | "custom";

// Felddefinition innerhalb eines UseCases
export type UseCaseField = {
  value: FieldType;
  label: string;
  tooltip?: string;
  editableValues?: boolean;   // Feld hat bearbeitbare Werteliste
  defaultValues?: string[];   // unsere vordefinierte Liste
};

export type FieldGroup = { groupLabel: string; fields: UseCaseField[] };

export type UseCase = {
  id: string;
  label: string;
  description: string;
  icon: string;
  // Einige Use Cases haben eine flache 'fields'-Liste,
  // andere sind in Gruppen unterteilt.
  fields?: UseCaseField[];
  fieldGroups?: FieldGroup[];
};

// =====================================
// UseCases
// =====================================

export const useCases: UseCase[] = [
  {
    id: "general",
    label: "Allgemeine Daten",
    description:
      "Flexible Definition eigener Felder, Werte und Strukturen – ohne Domainvorgaben.",
    icon: "🧩",
    fieldGroups: [
      {
        groupLabel: "🔤 Primitive Datentypen",
        fields: [
          {
            value: "string",
            label: "Text",
            tooltip:
              "Beliebige Zeichenkette, z. B. Name, Kommentar, Beschreibung.",
          },
          {
            value: "number",
            label: "Zahl",
            tooltip:
              "Ganzzahl oder Dezimalwert, z. B. Preis, Menge oder Alter.",
          },
          {
            value: "boolean",
            label: "Ja/Nein",
            tooltip: "Binärer Wahrheitswert, z. B. aktiv / inaktiv.",
          },
          {
            value: "date",
            label: "Datum",
            tooltip: "Datum im Format TT.MM.JJJJ.",
          },
          {
            value: "time",
            label: "Uhrzeit",
            tooltip: "Uhrzeit im Format HH:MM:SS.",
          },
          {
            value: "datetime",
            label: "Datum & Uhrzeit",
            tooltip: "Zeitstempel für Ereignisse und Abläufe.",
          },
        ],
      },

      {
        groupLabel: "🧍 Personenbezogene Daten",
        fields: [
          {
            value: "firstname",
            label: "Vorname",
            tooltip:
              "Zufällig generierter Vorname aus Namensdatenbanken.",
          },
          {
            value: "lastname",
            label: "Nachname",
            tooltip:
              "Zufällig generierter Nachname aus Namensdatenbanken.",
          },
          {
            value: "fullname",
            label: "Vollständiger Name",
            tooltip: "Automatische Kombination aus Vor- und Nachname.",
          },
          {
            value: "gender",
            label: "Geschlecht",
            tooltip:
              "Männlich, weiblich oder divers – inkl. Abhängigkeitsverteilung.",
          },
        ],
      },

      {
        groupLabel: "📞 Kommunikationsdaten",
        fields: [
          {
            value: "email",
            label: "E-Mail",
            tooltip:
              "Realistisch generierte E-Mail-Adresse anhand des Namens oder zufällig.",
          },
          {
            value: "phone",
            label: "Telefonnummer",
            tooltip:
              "Internationale oder nationale Telefonnummer im realistischen Format.",
          },
        ],
      },

      {
        groupLabel: "🏠 Adressdaten",
        fields: [
          {
            value: "street",
            label: "Straße",
            tooltip:
              "Realistisch generierter Straßenname, z. B. ‚Hauptstraße‘ oder ‚Bahnhofweg‘.",
          },
          {
            value: "house_number",
            label: "Hausnummer",
            tooltip:
              "Zufällige Hausnummern mit Variationen wie 12, 12A, 12–14.",
          },
          {
            value: "postcode",
            label: "Postleitzahl (PLZ)",
            tooltip:
              "Landesspezifische Postleitzahl, z. B. 10115 für Berlin.",
          },
          {
            value: "city",
            label: "Stadt",
            tooltip:
              "Zufällig generierte Stadt oder real existierender Ort.",
          },
          {
            value: "state",
            label: "Bundesland",
            tooltip:
              "Bundesland oder Provinz, z. B. NRW, Bayern oder Ontario.",
          },
          {
            value: "country",
            label: "Land",
            tooltip:
              "Land aus internationaler Liste, z. B. Deutschland, Frankreich, USA.",
          },
          {
            value: "full_address",
            label: "Komplette Adresse",
            tooltip:
              "Vollständige Adresse inklusive Straße, Nummer, PLZ, Ort und Land.",
          },
        ],
      },

      {
        groupLabel: "📚 Kategorien & Listen",
        fields: [
          {
            value: "enum",
            label: "Auswahlliste (Enum)",
            tooltip:
              "Benutzerdefinierte feste Liste auswählbarer Werte.",
          },
          {
            value: "list",
            label: "Liste",
            tooltip: "Freie Werteliste zur zufälligen Auswahl.",
          },
        ],
      },

      {
        groupLabel: "🔣 Musterbasierte Datentypen",
        fields: [
          {
            value: "regex",
          label: "Muster (Regex)",
          tooltip: "Generiert Werte anhand eines Muster-Ausdrucks (Regex), z. B. AB-[0-9]{5}.",
          editableValues: true,
          defaultValues: [
            "[A-Z]{4}[0-9]{7}",
            "[A-Z0-9]{10}",
            "[A-Z]{3}-[0-9]{4}",
            "[A-Z]{2}[0-9]{6}",
            "[0-9]{4}-[0-9]{4}",
            "[A-Z][0-9]{3}[A-Z]",
            "[A-Z0-9]{5}",
            "[A-F0-9]{8}"
    ]
          },
        ],
      },

      {
        groupLabel: "🆔 Identifikatoren",
        fields: [
          {
            value: "uuid",
            label: "UUID",
            tooltip: "Eindeutige universelle Identifikationsnummer.",
          },
        ],
      },

      {
        groupLabel: "🧩 Benutzerdefiniert",
        fields: [
          {
            value: "custom",
            label: "Eigenes Feld",
            tooltip:
              "Komplett frei definierbarer Datentyp mit eigenen Strukturen.",
          },
        ],
      },
    ],
  },

  {
    id: "logistik",
    label: "Logistik",
    description:
      "Simulation von Containerbewegungen, Schiffsanläufen und Reedereidaten im Hafen.",
    icon: "🚢",
    fieldGroups: [

      {
        groupLabel: "📦 Containerdaten",
        fields: [
          {
            value: "unitName",
            label: "Containereinheit",
            tooltip:
              "Eindeutige Kennung der Containereinheit (z. B. ABCU1234567 oder CNT-123456A).",
            // keine Liste → kein editableValues
          },
          {
            value: "containerTyp",
            label: "Containertyp",
            tooltip:
              "Bauart des Containers, z. B. Standard, High Cube, Reefer (Kühlcontainer), Flat Rack oder Open Top.",
            editableValues: true,
            defaultValues: [
              "Standard",
              "High Cube",
              "Reefer",
              "Open Top",
              "Flat Rack",
            ],
          },
          {
            value: "attributeSize",
            label: "Containergröße (Fuß)",
            tooltip:
              "Standardgrößen: 20 ft, 40 ft oder 45 ft. High-Cube-Container sind höher als Standardcontainer.",
            editableValues: true,
            defaultValues: ["20", "40", "45"],
          },
          {
            value: "attributeWeight",
            label: "Containergewicht (kg)",
            tooltip:
              "Gesamtgewicht inklusive Ladung. Wird je nach Containertyp und Größe realistisch berechnet.",
          },
          {
            value: "attributeStatus",
            label: "Beladungsstatus",
            tooltip:
              "Zeigt an, ob der Container leer oder beladen ist. Wird automatisch aus dem Gewicht abgeleitet.",
            editableValues: true,
            defaultValues: ["leer", "teilbeladen", "voll beladen"],
          },
          {
            value: "attributeDirection",
            label: "Transportrichtung",
            tooltip:
              "Gibt an, ob der Container importiert oder exportiert wird.",
            editableValues: true,
            defaultValues: ["Import", "Export", "Transshipment"],
          },
          {
            value: "timeIn",
            label: "Ankunftszeit im Terminal",
            tooltip:
              "Zeitpunkt, zu dem der Container im Terminal eintrifft (innerhalb der ETA des Schiffes).",
          },
          {
            value: "timeOut",
            label: "Abfahrtszeit aus dem Terminal",
            tooltip:
              "Zeitpunkt, zu dem der Container das Terminal verlässt (innerhalb der ETD des Schiffes).",
          },
          {
            value: "dwelltime",
            label: "Verweildauer (Stunden)",
            tooltip:
              "Automatisch berechnete Aufenthaltszeit im Terminal (Abfahrtszeit minus Ankunftszeit).",
          },
        ],
      },
      {
        groupLabel: "🚢 Carrier- und Schiffsdaten",
        fields: [
          {
            value: "serviceName",
            label: "Servicename",
            tooltip:
              "Bezeichnung der Schiffslinie, z. B. „Europe–India Line“ oder „Transatlantic East“. ",
          },
          {
            value: "service_route",
            label: "Service-Route",
            tooltip:
              "Die Route, die der Carrier bedient, z. B. Asien–Europa oder Transatlantik.",
            editableValues: true,
            defaultValues: [
              "Asien–Europa",
              "Europa–Nordamerika",
              "Europa–Südamerika",
              "Intra-Europa",
              "Asien–Nordamerika",
            ],
          },
          {
            value: "linerName",
            label: "Reedereiname",
            tooltip:
              "Name der Reederei, der der Carrier angehört, z. B. Hapag-Lloyd oder CMA CGM.",
          },
          {
            value: "shipName",
            label: "Schiffsname",
            tooltip:
              "Name des Schiffes, das den Container transportiert (z. B. Ever Ace, MSC Gülsün).",
          },
          {
            value: "eta",
            label: "ETA (Ankunftszeit)",
            tooltip:
              "Voraussichtliche Ankunftszeit des Schiffes im Hafen (Estimated Time of Arrival).",
          },
          {
            value: "etd",
            label: "ETD (Abfahrtszeit)",
            tooltip:
              "Voraussichtliche Abfahrtszeit des Schiffes aus dem Hafen (Estimated Time of Departure).",
          },
          {
            value: "length_m",
            label: "Schiffslänge (m)",
            tooltip: "Gesamtlänge des Schiffes in Metern.",
          },
          {
            value: "loadTEU",
            label: "Geladene TEU",
            tooltip:
              "Anzahl der Container, die auf dem Schiff aktuell geladen sind.",
          },
          {
            value: "dischargeTEU",
            label: "Entladene TEU",
            tooltip:
              "Anzahl der Container, die im Hafen entladen werden.",
          },
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
      { value: "transaktionsdatum", label: "Transaktionsdatum" },
      { value: "transaktionsart", label: "Transaktionsart" },
      { value: "betrag", label: "Betrag" },
      { value: "IBAN", label: "IBAN" },
    ],
  },

];

// =====================================
// Helper: Label & Tooltip Lookup
// =====================================

// =====================================
// Helper: Label & Tooltip Lookup
// =====================================

export const getLabelForType = (t?: FieldType | string): string => {
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

export const getTooltipForType = (t?: FieldType | string): string => {
  if (!t) return "";
  for (const uc of useCases) {
    if (uc.fields) {
      const f = uc.fields.find((ff) => ff.value === t);
      if (f?.tooltip) return f.tooltip;
    }
    if (uc.fieldGroups) {
      for (const g of uc.fieldGroups) {
        const f = g.fields.find((ff) => ff.value === t);
        if (f?.tooltip) return f.tooltip;
      }
    }
  }
  return "";
};

// =====================================
// Helper: editierbare Feldtypen
// =====================================

export const isEditableFieldType = (t?: FieldType | string): boolean => {
  if (!t) return false;
  for (const uc of useCases) {
    if (uc.fields) {
      const f = uc.fields.find((ff) => ff.value === t);
      if (f?.editableValues) return true;
    }
    if (uc.fieldGroups) {
      for (const g of uc.fieldGroups) {
        const f = g.fields.find((ff) => ff.value === t);
        if (f?.editableValues) return true;
      }
    }
  }
  return false;
};

export const getDefaultValuesForType = (t?: FieldType | string): string[] => {
  if (!t) return [];
  for (const uc of useCases) {
    if (uc.fields) {
      const f = uc.fields.find((ff) => ff.value === t);
      if (f?.defaultValues) return f.defaultValues;
    }
    if (uc.fieldGroups) {
      for (const g of uc.fieldGroups) {
        const f = g.fields.find((ff) => ff.value === t);
        if (f?.defaultValues) return f.defaultValues;
      }
    }
  }
  return [];
};
