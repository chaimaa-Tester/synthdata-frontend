// =====================================
// Zentrale Definitionen für Feldtypen und Use Cases
// =====================================

export type DistributionConfig = {
  distribution: string;
  parameterA: string;
  parameterB: string;
  extraParams?: string[];
  dependency?: string;
  // NEUE FELDER FÜR NAME-SOURCE:
  name_source?: "western" | "regional";
  country?: string;
};

export type FieldType =
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
  | "creditcard"
  | "transaktionsart"
  | "IBAN"
  | "currency"

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
  | "list"
  | "enum"
  | "regex"
  | "uuid"
  | "custom"

  // Gesundheitsdaten
  | "body_height"
  | "weight"
  | "bmi"
  | "bmi-status"
  

// Felddefinition innerhalb eines UseCases
export type UseCaseField = {
  value: FieldType | string;
  label: string;
  tooltip?: string;
  editableValues?: boolean;  // Feld hat bearbeitbare Werteliste
  defaultValues?: string[];  // vordefinierte Liste
};

export type FieldGroup = { groupLabel: string; fields: UseCaseField[] };

export type UseCase = {
  id: string;
  label: string;
  description: string;
  icon: string;
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
      // ----------------- Primitive Datentypen -----------------
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

      // ----------------- Personenbezogene Daten -----------------
      {
        groupLabel: "🧍 Personenbezogene Daten",
        fields: [
          {
            value: "firstname",
            label: "Vorname",
            tooltip: "Vorname abhängig von der gewählten Region.",
          },
          {
            value: "lastname",
            label: "Nachname",
            tooltip:
              "Nachname abhängig von der gewählten Region.",
              editableValues: false,
          },
          {
            value: "fullname",
            label: "Vollständiger Name",
            tooltip: "Vollständiger Name, Vor- und Nachname abhängig von der gewählten Region.",
            editableValues: false,
          },
          {
            value: "gender",
            label: "Geschlecht",
            tooltip:
              "Männlich, weiblich oder divers - inkl. Abhängigkeitsverteilung.",
              editableValues: false,
          },
        ],
      },

      // ----------------- Kommunikationsdaten -----------------
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

      // ----------------- Adressdaten -----------------
      {
        groupLabel: "🏠 Adressdaten",
        fields: [
          {
            value: "street",
            label: "Straße",
            tooltip: "Realistisch generierter Straßenname.",
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
            tooltip: "Landesspezifische Postleitzahl.",
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
            tooltip: "Bundesland oder Provinz.",
          },
          {
            value: "country",
            label: "Land",
            tooltip: "Land aus internationaler Liste.",
          },
          {
            value: "full_address",
            label: "Komplette Adresse",
            tooltip:
              "Vollständige Adresse inklusive Straße, Nummer, PLZ, Ort und Land.",
          },
        ],
      },

      // ----------------- Kategorien & Listen -----------------
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

      // ----------------- Musterbasierte Datentypen -----------------
      {
        groupLabel: "🔣 Musterbasierte Datentypen",
        fields: [
          {
            value: "regex",
            label: "Muster (Regex)",
            tooltip:
              "Generiert Werte anhand eines Muster-Ausdrucks (Regex), z. B. AB-[0-9]{5}.",
            editableValues: true,
            defaultValues: [
              "[A-Z]{4}[0-9]{7}",
              "[A-Z0-9]{10}",
              "[A-Z]{3}-[0-9]{4}",
              "[0-9]{4}-[0-9]{4}",
              "[A-Z0-9]{5}",
              "[A-F0-9]{8}",
            ],
          },
        ],
      },

      // ----------------- Identifikatoren -----------------
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

      // ----------------- Benutzerdefiniert -----------------
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

  // ----------------- Gesundheitsdaten -----------------
  {
    id: "gesundheit",
    label: "Gesundheitsdaten",
    description: "Vordefinierte Gesundheitswerte (BMI, Größe, Gewicht etc.).",
    icon: "🏥",
    fields: [
      {
        value: "body_height",
        label: "Körpergröße (cm)",
        tooltip: "Körpergröße in Zentimetern.",
      },
      {
        value: "weight",
        label: "Gewicht (kg)",
        tooltip: "Körpergewicht in Kilogramm.",
      },
      {
        value: "bmi",
        label: "Body-Mass-Index (BMI)",
        tooltip:
          "Berechneter Body-Mass-Index basierend auf Größe und Gewicht. Die Felder Gewicht und Größe müssen erzeugt werden damit ein Wert für BMI zustande kommt!",
      },
      {
        value: "bmi-status",
        label: "BMI-Status",
        tooltip: "Kategorisiert den BMI-Wert gemäß den WHO-Standards. Das Feld BMI muss erzeugt werden damit dieses Feld generiert werden kann!"
      },
    ],
  },

  // ==================== Finanzen ====================
  {
    id: "finanzen",
    label: "Finanzdaten",
    description:
      "Vordefinierte Finanz- und Zahlungswerte (Währung, Transaktionsarten, Kreditkartentypen, IBAN).",
    icon: "💰",
    fieldGroups: [
      {
        groupLabel: "💰 Finanzdaten",
        fields: [
          {
            value: "IBAN",
            label: "IBAN",
            tooltip:
              "Internationale Bankkontonummer (IBAN), z. B. DE89 3704 0044 0532 0130 00.",
          },
          {
            value: "currency",
            label: "Währung",
            tooltip:
              "Währungscode oder -bezeichnung, z. B. EUR, USD oder CHF. Liste ist anpassbar.",
            editableValues: true,
            defaultValues: ["EUR", "USD", "CHF", "GBP"],
          },
          {
            value: "transactionType",
            label: "Transaktionsart",
            tooltip:
              "Art der Transaktion (z. B. SEPA-Überweisung, Gehalt, Kartenzahlung). Liste kann erweitert werden.",
            editableValues: true,
            defaultValues: [
              "SEPA-Überweisung",
              "Gehalt / Lohn",
              "Karten-Zahlung (Debit)",
              "Gebühren / Kontoführungsgebühr",
              "Rückerstattung / Refund",
              "Internationale Überweisung (Swift)",
              "Online-Zahlung",
              "Mobile Payment",
              "Abonnement / Abo-Zahlung",
            ],
          },
          {
            value: "creditcard",
            label: "Kreditkarte",
            tooltip:
              "Kartentyp für die Generierung von Kreditkartennummern (VISA, Mastercard, Amex...).",
            editableValues: true,
            defaultValues: [
              "VISA Karte",
              "Mastercard",
              "American Express",
              "Girocard (EC)",
              "Maestro",
            ],
          },
          {
            value: "betrag",
            label: "Betrag",
            tooltip:
              "Betrag in der ausgewählten Währung.",
            editableValues: true
          },
        ],
      },
    ],
  },

  // ==================== Logistik ====================
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
            tooltip: "Eindeutige Kennung der Containereinheit.",
          },
          {
            value: "containerTyp",
            label: "Containertyp",
            tooltip:
              "Bauart des Containers (Standard, High Cube, Reefer, Open Top, Flat Rack).",
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
            tooltip: "Standardgrößen: 20, 40, 45.",
            editableValues: true,
            defaultValues: ["20", "40", "45"],
          },
          {
            value: "attributeWeight",
            label: "Containergewicht (kg)",
            tooltip: "Gesamtgewicht inklusive Ladung.",
          },
          {
            value: "attributeStatus",
            label: "Beladungsstatus",
            tooltip: "Leer / teilbeladen / voll beladen.",
            editableValues: true,
            defaultValues: ["leer", "teilbeladen", "voll beladen"],
          },
          {
            value: "attributeDirection",
            label: "Transportrichtung",
            tooltip: "Import / Export / Transshipment.",
            editableValues: true,
            defaultValues: ["Import", "Export", "Transshipment"],
          },
          {
            value: "timeIn",
            label: "Ankunftszeit im Terminal",
            tooltip: "Zeitpunkt der Ankunft.",
          },
          {
            value: "timeOut",
            label: "Abfahrtszeit aus dem Terminal",
            tooltip: "Zeitpunkt der Abfahrt.",
          },
          {
            value: "dwelltime",
            label: "Verweildauer (Stunden)",
            tooltip: "Abfahrtszeit minus Ankunftszeit.",
          },
        ],
      },
      {
        groupLabel: "🚢 Carrier- und Schiffsdaten",
        fields: [
          {
            value: "serviceName",
            label: "Servicename",
            tooltip: "Bezeichnung der Schiffslinie.",
          },
          {
            value: "service_route",
            label: "Service-Route",
            tooltip: "Route des Carriers.",
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
            tooltip: "Name der Reederei.",
          },
          {
            value: "shipName",
            label: "Schiffsname",
            tooltip: "Name des Schiffes.",
          },
          {
            value: "eta",
            label: "ETA (Ankunftszeit)",
            tooltip: "Estimated Time of Arrival.",
          },
          {
            value: "etd",
            label: "ETD (Abfahrtszeit)",
            tooltip: "Estimated Time of Departure.",
          },
          {
            value: "length_m",
            label: "Schiffslänge (m)",
            tooltip: "Gesamtlänge des Schiffes in Metern.",
          },
          {
            value: "loadTEU",
            label: "Geladene TEU",
            tooltip: "Anzahl geladener TEU.",
          },
          {
            value: "dischargeTEU",
            label: "Entladene TEU",
            tooltip: "Anzahl entladener TEU.",
          },
        ],
      },
    ],
  },
];

// =====================================
// Helper: Field-Lookup
// =====================================

export const findFieldDef = (t?: FieldType | string): UseCaseField | undefined => {
  if (!t) return undefined;
  for (const uc of useCases) {
    if (uc.fields) {
      const f = uc.fields.find((ff) => ff.value === t);
      if (f) return f;
    }
    if (uc.fieldGroups) {
      for (const g of uc.fieldGroups) {
        const f = g.fields.find((ff) => ff.value === t);
        if (f) return f;
      }
    }
  }
  return undefined;
};

export const getLabelForType = (t?: FieldType | string): string => {
  const field = findFieldDef(t);
  if (field?.label) return field.label;
  return t ? String(t) : "";
};

export const getTooltipForType = (t?: FieldType | string): string => {
  const field = findFieldDef(t);
  if (field?.tooltip) return field.tooltip;
  return "";
};

export const getDefaultValuesForType = (
  t?: FieldType | string
): string[] => {
  const field = findFieldDef(t);
  return field?.defaultValues ? [...field.defaultValues] : [];
};
