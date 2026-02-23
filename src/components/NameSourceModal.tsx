/**
 * NameSourceModal.tsx
 * // Autor: CHAIMAA KARIOUI
 *
 * Projekt: SynthData Wizard
 *
 * Beschreibung:
 * React-Modal zur Auswahl der Namensquelle für die Namensgenerierung.
 * Der Nutzer kann zwischen einer westlichen Namensquelle ("western") oder
 * einer regionalen Namensquelle ("regional") wählen. Bei "regional" muss
 * zusätzlich ein Land ausgewählt werden.
 *
 * Inhalt:
 * - Typdefinition NameSourceSelection für die Rückgabe der Auswahl
 * - Props-Definition zur Steuerung (show/onClose/onSelect)
 * - UI-Logik: Umschalten zwischen Modi, optionales Länder-Dropdown
 * - Bestätigungslogik: Übergabe der Auswahl an Parent über onSelect
 */

import React, { useState } from "react";
import { NAME_REGIONS, NAME_COUNTRIES } from "../types/nameSources";

/**
 * NameSourceSelection
 *
 * Zweck:
 * Definiert die Datenstruktur, die bei der Bestätigung aus dem Modal
 * an die Parent-Komponente zurückgegeben wird.
 *
 * @property source_type  Gewählte Namensquelle ("western" | "regional").
 * @property country      Optionales Land (nur relevant, wenn source_type === "regional").
 */
export type NameSourceSelection = {
  source_type: "western" | "regional";
  country?: string;
};

/**
 * NameSourceModalProps
 *
 * Zweck:
 * Props zur Steuerung des Modals durch die Parent-Komponente.
 *
 * @property show     Steuert, ob das Modal gerendert wird.
 * @property onClose  Callback zum Schließen des Modals.
 * @property onSelect Callback zum Übernehmen der Auswahl (liefert NameSourceSelection zurück).
 */
type NameSourceModalProps = {
  show: boolean;
  onClose: () => void;
  onSelect: (selection: NameSourceSelection) => void;
};

/**
 * NameSourceModal
 *
 * Zweck:
 * Rendert ein Modal zur Auswahl von Namensquellen.
 *
 * Implementierungsdetails:
 * - Wenn show=false: return null (Modal wird nicht gerendert).
 * - mode steuert die aktive Region ("western" oder "regional").
 * - country speichert das ausgewählte Land (nur bei "regional").
 * - handleConfirm baut ein Selection-Objekt und ruft onSelect + onClose auf.
 */
export const NameSourceModal: React.FC<NameSourceModalProps> = ({
  show,
  onClose,
  onSelect,
}) => {
  /**
   * mode
   *
   * Zweck:
   * Speichert den aktuell gewählten Modus der Namensquelle.
   * Default ist "regional", damit der Nutzer direkt ein Land auswählen kann.
   */
  const [mode, setMode] = useState<"western" | "regional">("regional");

  /**
   * country
   *
   * Zweck:
   * Speichert das aktuell ausgewählte Land.
   * Wird nur genutzt, wenn mode === "regional".
   */
  const [country, setCountry] = useState<string>("");

  /**
   * show-Guard
   *
   * Zweck:
   * Modal wird nur gerendert, wenn show=true.
   */
  if (!show) return null;

  /**
   * accent
   *
   * Zweck:
   * Akzentfarbe für aktive Buttons und Primäraktionen.
   */
  const accent = "rgb(115, 67, 131)";

  /**
   * handleConfirm
   *
   * Zweck:
   * Bestätigt die aktuelle Auswahl und übergibt sie an die Parent-Komponente.
   *
   * Implementierungsdetails:
   * - selection enthält immer source_type.
   * - country wird nur gesetzt, wenn mode === "regional" und country nicht leer ist.
   * - ruft onSelect(selection) und schließt danach das Modal über onClose().
   */
  const handleConfirm = () => {
    const selection: NameSourceSelection = {
      source_type: mode,
    };

    if (mode === "regional" && country) {
      selection.country = country;
    }

    onSelect(selection);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1050,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className="modal-content bg-white rounded"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%",
          maxWidth: 480,
          padding: "1.5rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
        }}
      >
        <h4 className="mb-2">Test-Namensquellen anpassen</h4>
        <p className="text-muted mb-3">
          Wählen Sie eine Region oder ein Land für die Namensgenerierung.
        </p>

        {/* Region-Buttons */}
        <div className="d-flex gap-2 mb-3">
          {NAME_REGIONS.map((r) => {
            const active = mode === r.value;
            return (
              <button
                key={r.value}
                type="button"
                className="btn"
                onClick={() => {
                  setMode(r.value as "western" | "regional");

                  // Implementierungsdetail:
                  // Beim Wechsel auf "western" wird country zurückgesetzt,
                  // damit kein altes Land ungewollt in der Auswahl bleibt.
                  if (r.value === "western") setCountry("");
                }}
                style={{
                  backgroundColor: active ? accent : "transparent",
                  color: active ? "white" : accent,
                  border: `1px solid ${accent}`,
                  padding: "0.25rem 0.75rem",
                  fontSize: "0.9rem",
                  borderRadius: 999,
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Länderauswahl nur bei "regional" */}
        {mode === "regional" && (
          <select
            className="form-select"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">Land wählen…</option>
            {NAME_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        <div className="d-flex justify-content-end mt-3 gap-2">
          <button
            className="btn"
            onClick={onClose}
            type="button"
            style={{
              backgroundColor: "transparent",
              color: accent,
              border: "1px solid #ced4da",
            }}
          >
            Abbrechen
          </button>

          <button
            className="btn"
            type="button"
            onClick={handleConfirm}
            disabled={mode === "regional" && !country}
            style={{
              backgroundColor: mode === "regional" && !country ? "#e0d5ea" : accent,
              color: "white",
              border: "1px solid " + accent,
              opacity: mode === "regional" && !country ? 0.7 : 1,
            }}
          >
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
};