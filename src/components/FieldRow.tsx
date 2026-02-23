/**
 * FieldRow.tsx
 * // Autor: CHAIMAA KARIOUI && JAN KRÄMER
 *
 * Projekt: SynthData Wizard
 *
 * Beschreibung:
 * UI-Komponente für eine einzelne Tabellenzeile (Felddefinition) im Wizard.
 * In dieser Zeile kann der Nutzer:
 * - Feldname eingeben
 * - Feldtyp über UseCaseModal auswählen (read-only Input öffnet Modal)
 * - Abhängigkeiten zu anderen Feldern über Multi-Select Dropdown setzen
 * - Verteilungsmodus festlegen (Standard / Upload / Custom / Dependency) inkl. Lock-Mechanismus
 * - Namensquelle (für firstname/lastname/fullname) über NameSourceModal auswählen
 * - Zeile per Drag Handle verschieben
 * - Zeile löschen
 *
 * Implementierungsübersicht:
 * - Dependency-Parsing + Serialisierung (parseDeps/toCommaString)
 * - Dropdown-State und Outside-Click Handling (rootRef + document listener)
 * - Modals: UseCaseModal (Feldtyp/Werte), NameSourceModal (Namensquelle)
 * - Distribution-Mode Locking, damit nur ein Modus aktiv sein kann
 * - UI-Logik für Zusatzanzeigen (z. B. Regex erstes Pattern, Listen erster Wert)
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { UseCaseModal } from "./UseCaseModal";
import {
  getLabelForType,
  getDefaultValuesForType,
  FieldType,
} from "../types/fieldTypes";
import { NameSourceModal } from "./NameSourceModal";

/**
 * Props
 *
 * Zweck:
 * Definiert die benötigten Parameter für die FieldRow-Komponente.
 *
 * @property row                        Aktuelle Datenzeile (Felddefinition).
 * @property idx                        Index der Zeile in der Parent-Liste.
 * @property onChange                   Callback zum Ändern eines Feldes in der Zeile.
 * @property onOpenModal                Öffnet Standard-Verteilungsmodal (Parent gesteuert).
 * @property onCustomDraw               Öffnet Custom-Draw Verteilung (Parent gesteuert).
 * @property onOpenUploadModal          Öffnet Upload-Verteilungsmodal (Parent gesteuert).
 * @property onOpenDependencyModal      Öffnet Abhängigkeits-Verteilungsmodal (optional).
 * @property handleDeleteRow            Löscht die Zeile im Parent.
 * @property allFieldNames              Liste aller Feldnamen (für Abhängigkeiten).
 * @property dragHandleProps            Props für dnd-kit Drag Handle (optional).
 * @property onOpenValueEditor          Optional: öffnet Value-Editor (nicht hier genutzt).
 * @property onEditValuesFromUseCaseModal Optional: Übergabe der editierten Werte aus UseCaseModal an Parent.
 */
type Props = {
  row: any;
  idx: number;
  onChange: (idx: number, field: string, value: any) => void;
  onOpenModal: (idx: number) => void;
  onCustomDraw: (idx: number) => void;
  onOpenUploadModal: (idx: number) => void;
  onOpenDependencyModal?: (idx: number) => void;
  handleDeleteRow: (idx: number) => void;
  allFieldNames: string[];
  dragHandleProps?: any;
  onOpenValueEditor?: (idx: number) => void;
  onEditValuesFromUseCaseModal?: (fieldType: FieldType, newValues: string[]) => void;
};

/**
 * FieldRow
 *
 * Zweck:
 * Rendert eine Feldzeile inkl. Eingaben, Dropdowns, Buttons und Modals.
 */
export const FieldRow: React.FC<Props> = ({
  row,
  idx,
  onChange,
  onOpenModal,
  onCustomDraw,
  onOpenUploadModal,
  onOpenDependencyModal,
  handleDeleteRow,
  allFieldNames,
  dragHandleProps,
  onOpenValueEditor,
  onEditValuesFromUseCaseModal,
}) => {
  // -----------------------------
  // Dependency Helpers
  // -----------------------------

  /**
   * parseDeps
   *
   * Zweck:
   * Zerlegt den dependency-String (kommagetrennt) in ein Array aus bereinigten Werten.
   *
   * Implementierung:
   * - split(",") trennt
   * - trim() entfernt Leerzeichen
   * - filter(Boolean) entfernt leere Einträge
   */
  const parseDeps = (text: string): string[] =>
    (text || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  /**
   * toCommaString
   *
   * Zweck:
   * Baut aus einem Array einen kommagetrennten String (ohne Duplikate).
   *
   * Implementierung:
   * - Set entfernt Duplikate
   * - join(", ") erzeugt konsistente Speicherung
   */
  const toCommaString = (arr: string[]) =>
    Array.from(new Set(arr.filter(Boolean))).join(", ");

  /**
   * allOptions
   *
   * Zweck:
   * Liste aller Feldnamen, die als Abhängigkeit wählbar sind.
   * Das eigene Feld (row.name) wird ausgeschlossen.
   */
  const allOptions: string[] = useMemo(
    () => allFieldNames.filter((name) => name && name !== row.name),
    [allFieldNames, row.name]
  );

  /**
   * selected
   *
   * Zweck:
   * Lokaler State für ausgewählte Abhängigkeiten (Checkbox-UI).
   * Initial wird row.dependency geparst.
   */
  const [selected, setSelected] = useState<string[]>(() =>
    parseDeps(row.dependency)
  );

  /**
   * Sync selected mit row.dependency
   *
   * Zweck:
   * Wenn Parent row.dependency ändert, wird der lokale State aktualisiert,
   * damit UI und Daten konsistent bleiben.
   */
  useEffect(() => {
    setSelected(parseDeps(row.dependency));
  }, [row.dependency]);

  /**
   * updateSelection
   *
   * Zweck:
   * Aktualisiert lokal selected und schreibt den neuen Wert in den Parent.
   *
   * @param next Neue Auswahl als Array.
   */
  const updateSelection = (next: string[]) => {
    setSelected(next);
    onChange(idx, "dependency", toCommaString(next));
  };

  // -----------------------------
  // Dropdown UI State (Dependencies)
  // -----------------------------

  /**
   * open
   *
   * Zweck:
   * Steuert die Sichtbarkeit des Abhängigkeiten-Dropdowns.
   */
  const [open, setOpen] = useState(false);

  /**
   * rootRef
   *
   * Zweck:
   * Referenz auf den Dropdown-Container, um Outside-Clicks zu erkennen.
   */
  const rootRef = useRef<HTMLDivElement | null>(null);

  /**
   * Outside-Click Handler
   *
   * Zweck:
   * Schließt das Dropdown, wenn außerhalb geklickt wird.
   *
   * Implementierung:
   * - document mousedown Listener
   * - prüft rootRef.contains(target)
   */
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  /**
   * isChecked
   *
   * Zweck:
   * Prüft, ob eine Option aktuell ausgewählt ist.
   */
  const isChecked = (opt: string) => selected.includes(opt);

  /**
   * toggle
   *
   * Zweck:
   * Fügt eine Abhängigkeit hinzu oder entfernt sie (Checkbox-Logik).
   *
   * Implementierung:
   * - wenn opt schon gewählt: remove
   * - sonst: add
   */
  const toggle = (opt: string) => {
    const next = isChecked(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];
    updateSelection(next);
  };

  /**
   * selectAll / clearAll
   *
   * Zweck:
   * Komfortfunktionen für Multi-Select.
   */
  const selectAll = () => updateSelection(allOptions);
  const clearAll = () => updateSelection([]);

  /**
   * label
   *
   * Zweck:
   * Anzeige-Text im Dropdown-Button (Placeholder oder Liste).
   */
  const label =
    selected.length === 0 ? "Abhängigkeiten wählen" : selected.join(", ");

  // -----------------------------
  // UseCaseModal / NameSourceModal State
  // -----------------------------

  /**
   * showUseCaseModal
   *
   * Zweck:
   * Steuert die Sichtbarkeit des UseCaseModals (Feldtyp-Auswahl).
   */
  const [showUseCaseModal, setShowUseCaseModal] = useState(false);

  /**
   * showNameSourceModal
   *
   * Zweck:
   * Steuert die Sichtbarkeit des NameSourceModals (Namensquelle).
   */
  const [showNameSourceModal, setShowNameSourceModal] = useState(false);

  // -----------------------------
  // UI States: Reset Button
  // -----------------------------

  /**
   * resetHover / resetActive
   *
   * Zweck:
   * Zusätzliche UI-States für Hover/Active Styling des Reset-Buttons.
   */
  const [resetHover, setResetHover] = useState(false);
  const [resetActive, setResetActive] = useState(false);

  // -----------------------------
  // Distribution Mode Locking
  // -----------------------------

  /**
   * DistributionMode
   *
   * Zweck:
   * Definiert die möglichen Verteilungs-Modi.
   * null bedeutet: kein Modus ausgewählt (Buttons alle frei).
   */
  type DistributionMode = "standard" | "upload" | "custom" | "dependency" | null;

  /**
   * distributionMode
   *
   * Zweck:
   * Aktueller Modus der Zeile (wird in row gespeichert).
   * Dadurch bleibt der Lock auch nach Re-Renders bestehen.
   */
  const distributionMode: DistributionMode = (row?.distributionMode ?? null) as DistributionMode;

  /**
   * isLocked
   *
   * Zweck:
   * Sobald ein Modus gesetzt ist, sind alle anderen Modi gesperrt.
   */
  const isLocked = distributionMode !== null;

  /**
   * setDistributionMode
   *
   * Zweck:
   * Setzt den Verteilungsmodus in der Zeile (Parent-State).
   *
   * Implementierung:
   * - schreibt nur, wenn sich der Wert wirklich ändert
   * - verhindert unnötige Re-Renders
   */
  const setDistributionMode = (mode: Exclude<DistributionMode, null>) => {
    if (row?.distributionMode !== mode) {
      onChange(idx, "distributionMode", mode);
    }
  };

  /**
   * clearDistributionMode
   *
   * Zweck:
   * Hebt den Lock auf und macht alle Verteilungsbuttons wieder aktiv.
   */
  const clearDistributionMode = () => {
    onChange(idx, "distributionMode", null);
  };

  /**
   * isDisabledByMode
   *
   * Zweck:
   * Deaktiviert einen Modus-Button, wenn:
   * - ein Modus bereits gewählt ist
   * - und der Button nicht dem aktiven Modus entspricht
   */
  const isDisabledByMode = (mode: Exclude<DistributionMode, null>) => {
    return isLocked && distributionMode !== mode;
  };

  /**
   * isActiveMode
   *
   * Zweck:
   * UI-Helfer, ob ein Button als aktiv markiert werden soll.
   */
  const isActiveMode = (mode: Exclude<DistributionMode, null>) => distributionMode === mode;

  // -----------------------------
  // Feldtyp Anzeige (mit Extra)
  // -----------------------------

  /**
   * typeDisplay
   *
   * Zweck:
   * Anzeige im Feldtyp-Input:
   * - Basislabel aus getLabelForType(row.type)
   * - falls customValues existieren: erstes Element als Zusatz
   *   - bei regex als " – pattern"
   *   - bei anderen Typen als " (firstValue)"
   */
  const typeLabelBase = getLabelForType(row.type);

  const firstCustom =
    row.customValues && row.customValues.length > 0 ? String(row.customValues[0]) : "";

  const typeExtra =
    firstCustom && row.type === "regex"
      ? ` – ${firstCustom}`
      : firstCustom && row.type !== "regex"
      ? ` (${firstCustom})`
      : "";

  const typeDisplay = typeLabelBase + typeExtra;

  /**
   * isNameField
   *
   * Zweck:
   * Aktiviert das 🌍-Icon nur für Name-Felder.
   */
  const isNameField = ["firstname", "lastname", "fullname"].includes(row.type);

  // -----------------------------
  // Editierbare Feldtypen (Werteliste)
  // -----------------------------

  /**
   * editableFieldTypes
   *
   * Zweck:
   * Liste der Feldtypen, bei denen eine Werteliste üblicherweise editierbar ist.
   */
  const editableFieldTypes = useMemo(
    () => [
      "containerTyp",
      "attributeSize",
      "attributeStatus",
      "attributeDirection",
      "service_route",
      "enum",
      "list",
      "regex",
    ],
    []
  );

  /**
   * isEditableFieldType
   *
   * Zweck:
   * Prüft, ob ein Feldtyp in der editierbaren Liste enthalten ist.
   */
  const isEditableFieldType = (t: string | undefined) => !!t && editableFieldTypes.includes(t);

  // -----------------------------
  // Render
  // -----------------------------

  return (
    <div className="row mb-2 align-items-center">
      {/* Drag Handle */}
      <div
        className="col-auto d-flex align-items-center px-0"
        {...(dragHandleProps || {})}
        style={{
          cursor: "grab",
          userSelect: "none",
          padding: "6px 8px",
        }}
        role="button"
        aria-label="Drag Handle"
        onMouseDown={(e) => e.preventDefault()}
      >
        <span style={{ fontSize: 20, opacity: 0.8 }}>☰</span>
      </div>

      {/* Feldname */}
      <div className="col-2">
        <input
          className="form-control"
          value={row.name}
          onChange={(e) => onChange(idx, "name", e.target.value)}
          placeholder="Feldname"
        />
      </div>

      {/* Feldtyp (read-only, öffnet UseCaseModal) */}
      <div className="col-2" style={{ position: "relative" }}>
        <input
          className="form-control"
          value={typeDisplay}
          readOnly
          onClick={() => setShowUseCaseModal(true)}
          style={{
            cursor: "pointer",
            backgroundColor: "White",
            color: row.type ? "black" : "#00070eff",
          }}
          placeholder="Feldtyp wählen"
        />

        {/* Namensquelle Icon nur bei Name-Feldern */}
        {isNameField && (
          <span
            onClick={() => setShowNameSourceModal(true)}
            style={{
              position: "absolute",
              right: 20,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 18,
              cursor: "pointer",
              color: "rgb(115, 67, 131)",
              opacity: 0.65,
              userSelect: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.65")}
            title="Namensquelle auswählen"
          >
            🌍
          </span>
        )}
      </div>

      {/* Abhängigkeit Dropdown */}
      <div className="col-2" ref={rootRef} style={{ position: "relative", minWidth: 240 }}>
        <button
          type="button"
          className="form-control text-start d-flex align-items-center justify-content-between"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          style={{ cursor: "pointer", backgroundColor: "white" }}
          title={label}
        >
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "90%",
            }}
          >
            {label}
          </span>
          <span style={{ opacity: 0.8 }}>▾</span>
        </button>

        {open && (
          <div
            role="menu"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              zIndex: 1000,
              background: "white",
              color: "black",
              borderRadius: 8,
              marginTop: 6,
              boxShadow:
                "0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)",
              border: "1px solid rgba(0,0,0,.1)",
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            <div className="d-flex justify-content-between align-items-center px-2 py-1 border-bottom">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={selectAll}>
                Alle auswählen
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearAll}>
                Keine
              </button>
            </div>

            <div style={{ padding: 6 }}>
              {allOptions.length === 0 && (
                <div style={{ padding: "8px 10px", color: "#666" }}>
                  Keine Felder vorhanden
                </div>
              )}

              {allOptions.map((opt) => (
                <label
                  key={opt}
                  className="d-flex align-items-center"
                  style={{
                    padding: "6px 10px",
                    gap: 8,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={isChecked(opt)}
                    onChange={() => toggle(opt)}
                    style={{ cursor: "pointer" }}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="col-auto d-flex align-items-center" style={{ padding: "0 12px" }}>
        <div
          style={{
            width: 1,
            height: 42,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
            borderRadius: 1,
          }}
        />
      </div>

      {/* Distribution Buttons + Delete */}
      <div className="col-3 d-flex align-items-center">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 14px",
            borderRadius: 18,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
            transition: "background 160ms ease, box-shadow 160ms ease, transform 120ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "inset 0 0 0 1px rgba(255,255,255,0.14), 0 8px 22px rgba(0,0,0,0.22)";
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "inset 0 0 0 1px rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          }}
        >
          {/* Standard */}
          <button
            className="btn me-3"
            style={{
              backgroundColor: isActiveMode("standard") ? "rgb(135, 87, 155)" : "rgb(115, 67, 131)",
              color: "white",
              minWidth: "160px",
              boxShadow: isActiveMode("standard") ? "0 0 0 2px rgba(190,140,255,0.45)" : undefined,
            }}
            onClick={() => {
              setDistributionMode("standard");
              onOpenModal(idx);
            }}
            title={
              isDisabledByMode("standard")
                ? "Verteilung bereits festgelegt – zuerst zurücksetzen"
                : "Verteilung und Parameter konfigurieren"
            }
            disabled={isDisabledByMode("standard")}
          >
            Standard-Verteilung
          </button>

          {/* Upload */}
          <button
            className="btn me-3"
            style={{
              backgroundColor: isActiveMode("upload") ? "rgb(135, 87, 155)" : "rgb(115, 67, 131)",
              color: "white",
              minWidth: "160px",
              boxShadow: isActiveMode("upload") ? "0 0 0 2px rgba(190,140,255,0.45)" : undefined,
            }}
            onClick={() => {
              setDistributionMode("upload");
              onOpenUploadModal(idx);
            }}
            disabled={isDisabledByMode("upload")}
            title={
              isDisabledByMode("upload")
                ? "Verteilung bereits festgelegt – zuerst zurücksetzen"
                : "Verteilung aus Daten berechnen"
            }
          >
            Verteilung berechnen
          </button>

          {/* Custom */}
          <button
            className="btn me-3"
            style={{
              backgroundColor: isActiveMode("custom") ? "rgb(135, 87, 155)" : "rgb(115, 67, 131)",
              color: "white",
              minWidth: "160px",
              boxShadow: isActiveMode("custom") ? "0 0 0 2px rgba(190,140,255,0.45)" : undefined,
            }}
            onClick={() => {
              setDistributionMode("custom");
              onCustomDraw(idx);
            }}
            disabled={isDisabledByMode("custom")}
            title={
              isDisabledByMode("custom")
                ? "Verteilung bereits festgelegt – zuerst zurücksetzen"
                : "Eigene Verteilung manuell definieren"
            }
          >
            Eigene Verteilung zeichnen
          </button>

          {/* Dependency */}
          <button
            className="btn"
            onClick={() => {
              setDistributionMode("dependency");
              onOpenDependencyModal && onOpenDependencyModal(idx);
            }}
            disabled={!row.dependency || isDisabledByMode("dependency")}
            title={
              !row.dependency
                ? "Zuerst Abhängigkeit wählen"
                : isDisabledByMode("dependency")
                ? "Verteilung bereits festgelegt – zuerst zurücksetzen"
                : "Abhängigkeits-Verteilung festlegen"
            }
            style={{
              backgroundColor: isActiveMode("dependency")
                ? "rgb(135, 87, 155)"
                : row.dependency
                ? "rgb(115,67,131)"
                : "rgba(255,255,255,0.12)",
              color: "white",
              boxShadow: isActiveMode("dependency") ? "0 0 0 2px rgba(190,140,255,0.45)" : undefined,
            }}
          >
            Abhängigkeits-Verteilung
          </button>

          {/* Reset */}
          {isLocked && (
            <button
              type="button"
              className="btn btn-sm ms-2"
              onClick={clearDistributionMode}
              onMouseEnter={() => setResetHover(true)}
              onMouseLeave={() => {
                setResetHover(false);
                setResetActive(false);
              }}
              onMouseDown={() => setResetActive(true)}
              onMouseUp={() => setResetActive(false)}
              title="Auswahl zurücksetzen (alle Verteilungs-Buttons wieder aktivieren)"
              style={{
                backgroundColor: resetActive
                  ? "rgba(255,255,255,0.16)"
                  : resetHover
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(255,255,255,0.08)",
                border: resetActive
                  ? "1px solid rgba(255,255,255,0.30)"
                  : resetHover
                  ? "1px solid rgba(255,255,255,0.24)"
                  : "1px solid rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.94)",
                padding: "6px 10px",
                borderRadius: 12,
                lineHeight: 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                boxShadow: resetHover ? "0 8px 18px rgba(0,0,0,0.18)" : "0 6px 14px rgba(0,0,0,0.12)",
                transform: resetActive ? "translateY(1px)" : "translateY(0)",
                transition:
                  "background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 90ms ease",
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 14, opacity: 0.95 }}>
                ↺
              </span>
              Zurücksetzen
            </button>
          )}

          {/* Delete */}
          <button
            type="button"
            className="btn ms-3"
            aria-label="Delete"
            style={{
              padding: 0,
              background: "none",
              border: "none",
              marginLeft: 8,
              fontSize: "22px",
              cursor: "pointer",
            }}
            onClick={() => handleDeleteRow(idx)}
            title="Zeile löschen"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* UseCaseModal */}
      {showUseCaseModal && (
        <UseCaseModal
          show={showUseCaseModal}
          onClose={() => setShowUseCaseModal(false)}
          onSelectField={(fieldType) => {
            onChange(idx, "type", fieldType);

            // Implementierungsdetail:
            // Wenn Default-Werte existieren und noch keine customValues gesetzt sind,
            // werden defaults als initiale Liste übernommen.
            const defaults = getDefaultValuesForType(fieldType);
            if (defaults.length > 0 && !row.customValues) {
              onChange(idx, "valueSource", "default");
              onChange(idx, "customValues", defaults);
            }

            setShowUseCaseModal(false);
          }}
          onEditValues={(fieldType, newValues) => {
            if (onEditValuesFromUseCaseModal) {
              onEditValuesFromUseCaseModal(fieldType, newValues);
            }
            setShowUseCaseModal(false);
          }}
          currentRow={row}
        />
      )}

      {/* NameSourceModal */}
      {showNameSourceModal && (
        <NameSourceModal
          show={showNameSourceModal}
          onClose={() => setShowNameSourceModal(false)}
          onSelect={(selection) => {
            onChange(idx, "nameSource", selection.source_type);

            if (selection.country) {
              onChange(idx, "nameCountry", selection.country);
            }

            setShowNameSourceModal(false);
          }}
        />
      )}
    </div>
  );
};