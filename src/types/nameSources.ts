// src/types/nameSources.ts
// Autor: CHAIMAA KARIOUI
/**
 *
 * Beschreibung:
 * Diese Datei definiert zentrale Konstanten für Namensquellen,
 * die im Frontend zur Auswahl von Regionen und Ländern für
 * die Generierung synthetischer Personennamen verwendet werden.
 *
 * Ziel:
 * - Zentrale, wartbare Definition möglicher Namensregionen
 * - Einheitliche Nutzung in Dropdowns, Formularen oder Modalen
 * - Vermeidung von Hardcodierung an mehreren Stellen
 */

/**
 * NAME_REGIONS
 *
 * Zweck:
 * Definiert auswählbare Namensregionen für die synthetische
 * Namensgenerierung.
 *
 * Struktur:
 * - value: interner technischer Wert (z. B. für Logik oder API)
 * - label: Benutzeranzeige im UI (z. B. Dropdown)
 *
 * Implementierungsentscheidung:
 * Die Trennung zwischen value und label ermöglicht:
 * - stabile interne Verarbeitung (value)
 * - flexible UI-Anpassung (label) ohne Logikänderung
 */
export const NAME_REGIONS = [
  { value: "western", label: "Westliche Namen" },
  { value: "regional", label: "Regionale Namen" },
];

/**
 * NAME_COUNTRIES
 *
 * Zweck:
 * Liste unterstützter Länder für die länderspezifische
 * Namensgenerierung.
 *
 * Verwendung:
 * - Dropdown-Auswahl im Frontend
 * - Filterkriterium für Namensdatensätze
 * - Weitergabe an Backend oder Generator-Module
 *
 * Implementierungsentscheidung:
 * - Einfache String-Liste, da keine zusätzlichen Metadaten
 *   (z. B. Code, Flagge, ISO-Kürzel) benötigt werden.
 * - Kann bei Bedarf zu einer Objektstruktur erweitert werden.
 */
export const NAME_COUNTRIES = [
  "Deutschland",
  "Österreich",
  "Schweiz",
  "Türkei",
  "Spanien",
  "USA",
  "Frankreich",
  "Italien",
  "Brasilien",
  "Japan",
  "China",
  "Russland",
];
