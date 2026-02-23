// src/types/fieldTypes.ts
// Autor: CHAIMAA KARIOUI
/**
 
 *
 * Beschreibung:
 * Zentrale Typ- und Use-Case-Definitionen für den SynthData Wizard.
 * Diese Datei bildet die „Single Source of Truth“ für:
 * - unterstützte Feldtypen (FieldType)
 * - Metadaten zu Feldern (Label, Tooltip, Default-Listen, editierbare Werte)
 * - Use Cases inkl. Gruppierung der Felder für die UI
 * - Lookup- und Helper-Funktionen zur Abfrage von Label/Tooltip/Defaults
 *
 * Ziel:
 * - Einheitliche Darstellung und Konfiguration der Felder im Frontend
 * - Vermeidung von doppelter Logik in UI-Komponenten
 * - Erweiterbarkeit: neue Use Cases und Feldtypen können zentral ergänzt werden
 */

// =====================================
// Typdefinitionen
// =====================================

/**
 * DistributionConfig
 *
 * Zweck:
 * Konfigurationsstruktur für die Verteilungs-/Generatorlogik eines Feldes.
 * Wird typischerweise pro Feld gespeichert/übergeben, um die Werteerzeugung
 * (z. B. Verteilung, Parameter, Abhängigkeiten) zu steuern.
 *
 * Felder:
 * @property distribution  Name/Typ der Verteilung (z. B. "normal", "uniform", "custom").
 * @property parameterA    Erster Parameter der Verteilung (z. B. mean/min).
 * @property parameterB    Zweiter Parameter der Verteilung (z. B. std/max).
 * @property extraParams   Optionale Zusatzparameter (für komplexere Verteilungen/Generatoren).
 * @property dependency    Optionale Abhängigkeit zu einem anderen Feld (z. B. "bmi" hängt von height/weight ab).
 *
 * Erweiterung (Name-Source):
 * @property name_source   Regionale Namensquelle ("western" | "regional").
 * @property country       Optionales Land zur Spezifizierung der Namensgenerierung.
 */
export type DistributionConfig = {
  distribution: string;
  parameterA: string;
  parameterB: string;
  extraParams?: string[];
  dependency?: string;

  // Name-Source (für personenbezogene Generatoren)
  name_source?: "western" | "regional";
  country?: string;
};

/**
 * FieldType
 *
 * Zweck:
 * Union-Type aller „bekannten“ Feldtypen im System.
 * Diese Werte werden u. a. verwendet für:
 * - Auswahl in der UI (Dropdowns/UseCaseModal)
 * - Zuordnung von Labels, Tooltips, Default-Wertelisten
 * - Generator-Routing im Backend/Frontend (je nach Architektur)
 *
 * Implementierungsentscheidung:
 * - Als Union-Type (string literals) statt enum, da:
 *   - bessere Typsicherheit bei direkten String-Vergleichen
 *   - einfache Erweiterung ohne Zusatz-Compilation-Schritte
 */
export type FieldType =
  // Logistik – Containerdaten
  | "unitName"
  | "containerTyp"
  | "attributeSize"
  | "attributeWeight"
  | "attributeStatus"
  | "attributeDirection"
  | "timeIn"
  | "timeOut"
  | "dwelltime"

  // Logistik – Carrier / Ship
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
  | "bmi-status";

/**
 * UseCaseField
 *
 * Zweck:
 * Beschreibt ein Feld innerhalb eines Use Cases inkl. UI-Metadaten.
 * Diese Struktur ist UI-orientiert (Label/Tooltip) und steuert zusätzlich,
 * ob der Nutzer Werte bearbeiten kann und ob Default-Werte angezeigt werden.
 *
 * @property value           Feldtyp (bekannter FieldType oder freier String).
 * @property label           UI-Anzeige (menschlich lesbar).
 * @property tooltip         Optionaler Hilfetext für UI (z. B. Tooltip im Modal).
 * @property editableValues  Wenn true, besitzt das Feld eine bearbeitbare Werteliste (z. B. Enum/List/Regex).
 * @property defaultValues   Optional: vordefinierte Werte (werden beim Hinzufügen/Editor initial angeboten).
 */
export type UseCaseField = {
  value: FieldType | string;
  label: string;
  tooltip?: string;
  editableValues?: boolean;
  defaultValues?: string[];
};

/**
 * FieldGroup
 *
 * Zweck:
 * Gruppiert UseCaseField-Einträge in der UI (z. B. „Adressdaten“, „Finanzdaten“).
 *
 * @property groupLabel  Gruppenüberschrift in der UI.
 * @property fields      Felder innerhalb der Gruppe.
 */
export type FieldGroup = { groupLabel: string; fields: UseCaseField[] };

/**
 * UseCase
 *
 * Zweck:
 * Beschreibt einen Use Case (Domänenpaket) inkl. Anzeigeinformationen und Feldern.
 *
 * @property id           Technische ID (Routing, Auswahl, Persistenz).
 * @property label        Anzeigename.
 * @property description  Kurzbeschreibung für Nutzer.
 * @property icon         UI-Icon (Emoji) zur schnellen Wiedererkennung.
 * @property fields       Alternative 1: ungegroupte Liste der Felder.
 * @property fieldGroups  Alternative 2: gruppierte Liste der Felder.
 *
 * Hinweis:
 * Es wird entweder fields oder fieldGroups genutzt. Einige Use Cases nutzen Gruppen,
 * andere eine flache Liste.
 */
export type UseCase = {
  id: string;
  label: string;
  description: string;
  icon: string;
  fields?: UseCaseField[];
  fieldGroups?: FieldGroup[];
};

// =====================================
// UseCases (UI-Konfigurationsdaten)
// =====================================

/**
 * useCases
 *
 * Zweck:
 * Zentrale Definition aller Use Cases und ihrer auswählbaren Felder.
 *
 * Implementierungsdokumentation:
 * - Die Struktur ist so aufgebaut, dass UI-Komponenten daraus dynamisch
 *   Menüs, Gruppen und Tooltips rendern können.
 * - Default-Listen sind dort definiert, wo Nutzer typischerweise vordefinierte
 *   Werte benötigen (z. B. regex, currency, transactionType, containerTyp).
 * - Bei einigen Feldern ist editableValues=false gesetzt, um in der UI klarzustellen,
 *   dass hierfür keine manuelle Werteliste gedacht ist (z. B. lastname/fullname/gender).
 */
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
          { value: "string", label: "Text", tooltip: "Beliebige Zeichenkette, z. B. Name, Kommentar, Beschreibung." },
          { value: "number", label: "Zahl", tooltip: "Ganzzahl oder Dezimalwert, z. B. Preis, Menge oder Alter." },
          { value: "boolean", label: "Ja/Nein", tooltip: "Binärer Wahrheitswert, z. B. aktiv / inaktiv." },
          { value: "date", label: "Datum", tooltip: "Datum im Format TT.MM.JJJJ." },
          { value: "time", label: "Uhrzeit", tooltip: "Uhrzeit im Format HH:MM:SS." },
          { value: "datetime", label: "Datum & Uhrzeit", tooltip: "Zeitstempel für Ereignisse und Abläufe." },
        ],
      },
      {
        groupLabel: "🧍 Personenbezogene Daten",
        fields: [
          { value: "firstname", label: "Vorname", tooltip: "Vorname abhängig von der gewählten Region." },
          {
            value: "lastname",
            label: "Nachname",
            tooltip: "Nachname abhängig von der gewählten Region.",
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
            tooltip: "Männlich, weiblich oder divers - inkl. Abhängigkeitsverteilung.",
            editableValues: false,
          },
        ],
      },
      {
        groupLabel: "📞 Kommunikationsdaten",
        fields: [
          { value: "email", label: "E-Mail", tooltip: "Realistisch generierte E-Mail-Adresse anhand des Namens oder zufällig." },
          { value: "phone", label: "Telefonnummer", tooltip: "Internationale oder nationale Telefonnummer im realistischen Format." },
        ],
      },
      {
        groupLabel: "🏠 Adressdaten",
        fields: [
          { value: "street", label: "Straße", tooltip: "Realistisch generierter Straßenname." },
          { value: "house_number", label: "Hausnummer", tooltip: "Zufällige Hausnummern mit Variationen wie 12, 12A, 12–14." },
          { value: "postcode", label: "Postleitzahl (PLZ)", tooltip: "Landesspezifische Postleitzahl." },
          { value: "city", label: "Stadt", tooltip: "Zufällig generierte Stadt oder real existierender Ort." },
          { value: "state", label: "Bundesland", tooltip: "Bundesland oder Provinz." },
          { value: "country", label: "Land", tooltip: "Land aus internationaler Liste." },
          { value: "full_address", label: "Komplette Adresse", tooltip: "Vollständige Adresse inklusive Straße, Nummer, PLZ, Ort und Land." },
        ],
      },
      {
        groupLabel: "📚 Kategorien & Listen",
        fields: [
          { value: "enum", label: "Auswahlliste (Enum)", tooltip: "Benutzerdefinierte feste Liste auswählbarer Werte." },
          { value: "list", label: "Liste", tooltip: "Freie Werteliste zur zufälligen Auswahl." },
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
              "[0-9]{4}-[0-9]{4}",
              "[A-Z0-9]{5}",
              "[A-F0-9]{8}",
            ],
          },
        ],
      },
      {
        groupLabel: "🆔 Identifikatoren",
        fields: [{ value: "uuid", label: "UUID", tooltip: "Eindeutige universelle Identifikationsnummer." }],
      },
      {
        groupLabel: "🧩 Benutzerdefiniert",
        fields: [{ value: "custom", label: "Eigenes Feld", tooltip: "Komplett frei definierbarer Datentyp mit eigenen Strukturen." }],
      },
    ],
  },

  {
    id: "gesundheit",
    label: "Gesundheitsdaten",
    description: "Vordefinierte Gesundheitswerte (BMI, Größe, Gewicht etc.).",
    icon: "🏥",
    fields: [
      { value: "body_height", label: "Körpergröße (cm)", tooltip: "Körpergröße in Zentimetern." },
      { value: "weight", label: "Gewicht (kg)", tooltip: "Körpergewicht in Kilogramm." },
      {
        value: "bmi",
        label: "Body-Mass-Index (BMI)",
        tooltip:
          "Berechneter Body-Mass-Index basierend auf Größe und Gewicht. Die Felder Gewicht und Größe müssen erzeugt werden damit ein Wert für BMI zustande kommt!",
      },
      {
        value: "bmi-status",
        label: "BMI-Status",
        tooltip:
          "Kategorisiert den BMI-Wert gemäß den WHO-Standards. Das Feld BMI muss erzeugt werden damit dieses Feld generiert werden kann!",
      },
    ],
  },

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
            tooltip: "Währungscode oder -bezeichnung, z. B. EUR, USD oder CHF. Liste ist anpassbar.",
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
            defaultValues: ["VISA Karte", "Mastercard", "American Express", "Girocard (EC)", "Maestro"],
          },
          {
            value: "betrag",
            label: "Betrag",
            tooltip: "Betrag in der ausgewählten Währung.",
            editableValues: true,
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
          { value: "unitName", label: "Containereinheit", tooltip: "Eindeutige Kennung der Containereinheit." },
          {
            value: "containerTyp",
            label: "Containertyp",
            tooltip: "Bauart des Containers (Standard, High Cube, Reefer, Open Top, Flat Rack).",
            editableValues: true,
            defaultValues: ["Standard", "High Cube", "Reefer", "Open Top", "Flat Rack"],
          },
          {
            value: "attributeSize",
            label: "Containergröße (Fuß)",
            tooltip: "Standardgrößen: 20, 40, 45.",
            editableValues: true,
            defaultValues: ["20", "40", "45"],
          },
          { value: "attributeWeight", label: "Containergewicht (kg)", tooltip: "Gesamtgewicht inklusive Ladung." },
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
          { value: "timeIn", label: "Ankunftszeit im Terminal", tooltip: "Zeitpunkt der Ankunft." },
          { value: "timeOut", label: "Abfahrtszeit aus dem Terminal", tooltip: "Zeitpunkt der Abfahrt." },
          { value: "dwelltime", label: "Verweildauer (Stunden)", tooltip: "Abfahrtszeit minus Ankunftszeit." },
        ],
      },
      {
        groupLabel: "🚢 Carrier- und Schiffsdaten",
        fields: [
          { value: "serviceName", label: "Servicename", tooltip: "Bezeichnung der Schiffslinie." },
          {
            value: "service_route",
            label: "Service-Route",
            tooltip: "Route des Carriers.",
            editableValues: true,
            defaultValues: ["Asien-Europa", "Transpazifik", "Intra-Europa", "Nord-Süd"],
          },
          { value: "linerName", label: "Reederei (Liner)", tooltip: "Name der Reederei." },
          { value: "shipName", label: "Schiffsname", tooltip: "Name des Schiffs." },
          { value: "eta", label: "ETA", tooltip: "Voraussichtliche Ankunftszeit (Estimated Time of Arrival)." },
          { value: "etd", label: "ETD", tooltip: "Voraussichtliche Abfahrtszeit (Estimated Time of Departure)." },
          { value: "length_m", label: "Schiffslänge (m)", tooltip: "Länge des Schiffs in Metern." },
          { value: "loadTEU", label: "Geladene TEU", tooltip: "Anzahl geladener Container in TEU." },
          { value: "dischargeTEU", label: "Entladene TEU", tooltip: "Anzahl entladener Container in TEU." },
        ],
      },
    ],
  },
];

const allUseCaseFields = (): UseCaseField[] =>
  useCases.flatMap((useCase) => {
    if (useCase.fieldGroups?.length) {
      return useCase.fieldGroups.flatMap((group) => group.fields);
    }
    return useCase.fields ?? [];
  });

export const getLabelForType = (type: FieldType | string): string => {
  const match = allUseCaseFields().find((field) => field.value === type);
  return match?.label ?? String(type);
};

export const getDefaultValuesForType = (type: FieldType | string): string[] => {
  const match = allUseCaseFields().find((field) => field.value === type);
  return match?.defaultValues ?? [];
};
