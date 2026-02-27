// src/SheetManager.tsx
// Autor: CHAIMAA KARIOUI
import React, { useMemo, useState } from "react";

/**
 * Datenstruktur eines exportierbaren Sheets (Tabellenblatt).
 *
 * @property id         Eindeutige ID des Sheets (z. B. für React keys und interne Referenzen).
 * @property name       Anzeigename des Sheets (wird in der UI gezeigt und ist editierbar, falls nicht locked).
 * @property fieldNames Liste der Feldnamen (Spalten/Attribute), die in diesem Sheet enthalten sein sollen.
 * @property locked     Wenn true, ist das Sheet "fixiert" und darf nicht umbenannt/editiert/gelöscht werden.
 */
export type ExportSheet = {
  id: string;
  name: string;
  fieldNames: string[];
  locked?: boolean;
};

/**
 * Props für die Komponente SheetManager.
 *
 * Der SheetManager kapselt die komplette UI-Logik zum:
 * - Anzeigen einer Sheet-Liste
 * - Anlegen/Löschen/Umbenennen von Sheets
 * - Auswählen der Felder pro aktivem Sheet (Checkboxen)
 * - optionalen Ein-/Ausklappen der gesamten Oberfläche
 *
 * @property sheets              Aktueller Zustand aller Sheets (vom Parent verwaltet).
 * @property setSheets           Setter-Funktion, um die Sheet-Liste im Parent zu aktualisieren (State-Lifting).
 * @property availableFieldNames Verfügbare Feldnamen (Quelle für die Checkbox-Liste).
 * @property title               Überschrift der Komponente.
 * @property collapsible         Wenn true, kann die UI eingeklappt/ausgeklappt werden.
 * @property defaultOpen         Initialzustand des einklappbaren Bereichs.
 * @property darkBgColor         Primärfarbe für Buttons/Badges (Standard: dunkles Blau).
 */
type SheetManagerProps = {
  sheets: ExportSheet[];
  setSheets: (next: ExportSheet[]) => void;
  availableFieldNames: string[];
  title?: string;

  // Fenster schließen/öffnen
  collapsible?: boolean; // default: true
  defaultOpen?: boolean; // default: true

  // Styling (dein dunkles Blau)
  darkBgColor?: string; // default: "rgb(31, 53, 88)"
};

/**
 * SheetManager (React-Komponente)
 *
 * Zweck:
 * Diese Komponente verwaltet die UI für die Konfiguration von "Sheets" (Export-Tabellenblättern).
 * Der State der Sheet-Liste liegt bewusst im Parent (sheets + setSheets), damit andere Komponenten
 * denselben Zustand nutzen können (Single Source of Truth). Der SheetManager verwaltet nur UI-nahe
 * Zustände (aktives Sheet, Open/Close).
 *
 * Hauptfunktionen:
 * - Auswahl des aktiven Sheets (activeIdx)
 * - Sicheres Aufbereiten der verfügbaren Feldnamen (Dedup + Trim + Filter)
 * - Editieren der Feldauswahl pro Sheet (toggleField, selectAll, selectNone)
 * - Anlegen / Löschen / Umbenennen von Sheets
 * - Berücksichtigung des "locked"-Flags (Fix/Readonly-Logik)
 */
export const SheetManager: React.FC<SheetManagerProps> = ({
  sheets,
  setSheets,
  availableFieldNames,
  title = "Sheets konfigurieren",
  collapsible = true,
  defaultOpen = true,
  darkBgColor = "rgb(31, 53, 88)",
}) => {
  /**
   * Index des aktuell ausgewählten Sheets.
   * Wird genutzt, um das aktive Sheet in der rechten Konfiguration anzuzeigen.
   */
  const [activeIdx, setActiveIdx] = useState(0);

  /**
   * Steuert, ob die Komponente (bei collapsible=true) aufgeklappt ist.
   */
  const [isOpen, setIsOpen] = useState(defaultOpen);

  /**
   * Das aktuell aktive Sheet-Objekt (abgeleitet über activeIdx).
   * Kann undefined sein, wenn sheets leer ist.
   */
  const activeSheet = sheets[activeIdx];

  /**
   * safeFieldNames:
   * Implementierungsdokumentation:
   * - bereinigt availableFieldNames (trim)
   * - filtert leere Strings raus
   * - entfernt Duplikate (Set)
   *
   * Motivation:
   * - verhindert doppelte Checkbox-Einträge
   * - verhindert Einträge wie "", "   "
   * - liefert eine stabile, UI-taugliche Liste
   */
  const safeFieldNames = useMemo(
    () =>
      Array.from(
        new Set(
          (availableFieldNames || [])
            .map((n) => (n || "").trim())
            .filter((n) => n.length > 0)
        )
      ),
    [availableFieldNames]
  );

  // ------- Helpers -------

  /**
   * setActiveSheetFields
   *
   * Zweck:
   * Setzt die Feldliste (fieldNames) des aktuell aktiven Sheets.
   *
   * Verhalten / Validierungen:
   * - bricht ab, wenn kein aktives Sheet existiert
   * - bricht ab, wenn das aktive Sheet locked ist (Fix-Logik)
   *
   * Implementierung:
   * - erstellt ein neues Array nextSheets via map (immutables Update)
   * - ersetzt bei i === activeIdx nur fieldNames, alle anderen Sheets bleiben unverändert
   * - ruft setSheets(nextSheets) auf, damit der Parent den State übernimmt
   *
   * @param nextFieldNames Neue Feldliste für das aktive Sheet.
   */
  const setActiveSheetFields = (nextFieldNames: string[]) => {
    if (!activeSheet) return;
    if (activeSheet.locked) return; // FIX = nicht editierbar

    const nextSheets = sheets.map((s, i) =>
      i === activeIdx ? { ...s, fieldNames: nextFieldNames } : s
    );
    setSheets(nextSheets);
  };

  /**
   * toggleField
   *
   * Zweck:
   * Schaltet einen Feldnamen im aktiven Sheet an/aus (Checkbox-Logik).
   *
   * Verhalten / Validierungen:
   * - bricht ab, wenn kein aktives Sheet existiert
   * - bricht ab, wenn activeSheet locked ist
   *
   * Implementierung:
   * - prüft, ob fieldName bereits in activeSheet.fieldNames enthalten ist
   * - wenn ja: entfernt es (filter)
   * - wenn nein: fügt es hinzu (spread)
   * - delegiert das eigentliche Update an setActiveSheetFields (Single Update Path)
   *
   * @param fieldName Der umzuschaltende Feldname.
   */
  const toggleField = (fieldName: string) => {
    if (!activeSheet) return;
    if (activeSheet.locked) return;

    const isSelected = activeSheet.fieldNames.includes(fieldName);
    const nextFieldNames = isSelected
      ? activeSheet.fieldNames.filter((f) => f !== fieldName)
      : [...activeSheet.fieldNames, fieldName];

    setActiveSheetFields(nextFieldNames);
  };

  /**
   * selectAll
   *
   * Zweck:
   * Wählt alle verfügbaren Feldnamen für das aktive Sheet aus.
   *
   * Verhalten / Validierungen:
   * - kein aktives Sheet => Abbruch
   * - locked => Abbruch
   *
   * Implementierung:
   * - übernimmt safeFieldNames vollständig als neue Feldliste
   */
  const selectAll = () => {
    if (!activeSheet) return;
    if (activeSheet.locked) return;
    setActiveSheetFields([...safeFieldNames]);
  };

  /**
   * selectNone
   *
   * Zweck:
   * Entfernt alle Feldzuordnungen im aktiven Sheet (alle Checkboxen aus).
   *
   * Verhalten / Validierungen:
   * - kein aktives Sheet => Abbruch
   * - locked => Abbruch
   *
   * Implementierung:
   * - setzt fieldNames auf leeres Array
   */
  const selectNone = () => {
    if (!activeSheet) return;
    if (activeSheet.locked) return;
    setActiveSheetFields([]);
  };

  /**
   * addSheet
   *
   * Zweck:
   * Fügt ein neues Sheet zur Liste hinzu und macht es sofort aktiv.
   *
   * Implementierung:
   * - erzeugt ein neues Sheet mit:
   *   - id: Zeitstempel (Date.now) als einfache eindeutige ID
   *   - name: "Sheet X" basierend auf aktueller Anzahl
   *   - fieldNames: leer (muss der Nutzer auswählen)
   *   - locked: false (standardmäßig editierbar)
   * - hängt das Sheet an sheets an (immutables Append)
   * - setzt den Parent-State über setSheets
   * - setzt activeIdx auf das neue Sheet (letzter Index)
   * - öffnet die UI (setIsOpen(true)), damit der Nutzer es direkt konfigurieren kann
   */
  const addSheet = () => {
    const newSheet: ExportSheet = {
      id: `sheet-${Date.now()}`,
      name: `Sheet ${sheets.length + 1}`,
      fieldNames: [],
      locked: false,
    };
    const next = [...sheets, newSheet];
    setSheets(next);
    setActiveIdx(next.length - 1);
    setIsOpen(true);
  };

  /**
   * deleteSheet
   *
   * Zweck:
   * Löscht ein Sheet an einem gegebenen Index, sofern es nicht locked ist.
   *
   * Verhalten / Validierungen:
   * - wenn kein Sheet an idx existiert => Abbruch
   * - wenn Sheet locked => Abbruch (Fix-Sheets können nicht gelöscht werden)
   *
   * Implementierungsdetails:
   * - filtert das Sheet aus der Liste heraus (immutables Remove)
   * - aktualisiert den Parent-State
   * - korrigiert activeIdx:
   *   - wenn danach keine Sheets mehr vorhanden: activeIdx = 0
   *   - wenn activeIdx außerhalb des neuen Arrays liegt: activeIdx auf letzten gültigen Index setzen
   *
   * @param idx Index des zu löschenden Sheets.
   */
  const deleteSheet = (idx: number) => {
    if (!sheets[idx] || sheets[idx].locked) return;

    const nextSheets = sheets.filter((_, i) => i !== idx);
    setSheets(nextSheets);

    if (nextSheets.length === 0) {
      setActiveIdx(0);
      return;
    }
    if (activeIdx >= nextSheets.length) setActiveIdx(nextSheets.length - 1);
  };

  /**
   * renameActive
   *
   * Zweck:
   * Benennt das aktive Sheet um (Input-Feld in der UI).
   *
   * Verhalten / Validierungen:
   * - kein aktives Sheet => Abbruch
   * - locked => Abbruch (Fix-Sheets dürfen nicht umbenannt werden)
   *
   * Implementierung:
   * - immutables Update via map
   * - ersetzt bei i === activeIdx nur "name"
   *
   * @param value Neuer Name für das aktive Sheet.
   */
  const renameActive = (value: string) => {
    if (!activeSheet) return;
    if (activeSheet.locked) return;

    const nextSheets = sheets.map((s, i) =>
      i === activeIdx ? { ...s, name: value } : s
    );
    setSheets(nextSheets);
  };

  /**
   * Abgeleiteter Zustand: true, wenn das aktive Sheet gesperrt ist.
   * Wird verwendet, um Inputs/Buttons/Checkboxen zu deaktivieren.
   */
  const isLocked = !!activeSheet?.locked;

  /**
   * badgeStyle
   *
   * Zweck:
   * Einheitliches Styling für Badges ("Fix", "Editierbar") passend zum dunklen Theme.
   * Wird in mehreren UI-Stellen wiederverwendet (verhindert Duplikation).
   */
  const badgeStyle: React.CSSProperties = {
    backgroundColor: darkBgColor,
    color: "white",
    border: "1px solid rgba(255,255,255,0.25)",
    fontWeight: 600,
  };

  /**
   * Render-Dokumentation (UI-Implementierung):
   *
   * Layout:
   * - Oberkopfzeile: Titel + optionaler Toggle-Button (collapsible)
   * - Inhalt (wenn isOpen):
   *   - links: Sheet-Liste (Auswahl + Fix-Badge + Löschen-Icon + "Neues Sheet")
   *   - rechts: Konfiguration des aktiven Sheets (Name, Felder, Alle/Keine, Liste, ggf. Löschen-Button)
   *
   * Sicherheits-/Robustheitsaspekte:
   * - Zugriff auf activeSheet wird über Optional Chaining abgesichert (activeSheet?.name)
   * - Bei locked:
   *   - Input disabled
   *   - Buttons disabled
   *   - Checkboxen disabled + UI-Opacity reduziert
   * - deleteSheet wird in der Liste über stopPropagation aufgerufen, damit ein Klick auf 🗑️
   *   nicht zusätzlich das Sheet als aktiv auswählt.
   */
  return (
    <div className="row g-3">
      <div className="col-12 d-flex align-items-center justify-content-between">
        <h5 className="mb-0">{title}</h5>

        {collapsible && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setIsOpen((v) => !v)}
            title={isOpen ? "Schließen" : "Öffnen"}
            style={{
              backgroundColor: darkBgColor,
              color: "white",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            {isOpen ? "✕" : "▾"}
          </button>
        )}
      </div>

      {!isOpen ? null : (
        <>
          {/* Linke Seite: Sheet-Liste */}
          <div className="col-12 col-md-4">
            <div className="card" style={{ background: "#f8f9fa" }}>
              <div className="card-body">
                <h6 className="card-title mb-3">Sheets</h6>

                <div className="list-group list-group-flush mb-3">
                  {sheets.map((sheet, idx) => (
                    <button
                      key={sheet.id}
                      type="button"
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                        activeIdx === idx ? "active" : ""
                      }`}
                      onClick={() => setActiveIdx(idx)}
                      style={{
                        backgroundColor:
                          activeIdx === idx ? "rgb(115, 67, 131)" : "transparent",
                        color: activeIdx === idx ? "white" : "black",
                        borderColor: "rgba(0,0,0,0.06)",
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sheet.name}
                      </span>

                      <span className="d-flex align-items-center gap-2">
                        {sheet.locked && (
                          <span className="badge" style={badgeStyle}>
                            Fix
                          </span>
                        )}
                        {!sheet.locked && (
                          <span
                            role="button"
                            title="Sheet löschen"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSheet(idx);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            🗑️
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Button: Dunkelblau wie Hintergrund */}
                <button
                  type="button"
                  className="btn btn-sm w-100"
                  onClick={addSheet}
                  style={{
                    backgroundColor: darkBgColor,
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                >
                  + Neues Sheet
                </button>
              </div>
            </div>
          </div>

          {/* Rechte Seite: Sheet-Konfiguration */}
          <div className="col-12 col-md-8">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="card-title mb-2">Sheet-Name</h6>

                  {isLocked ? (
                    <span className="badge" style={badgeStyle}>
                      Fix
                    </span>
                  ) : (
                    <span className="badge" style={badgeStyle}>
                      Editierbar
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  className="form-control mb-3"
                  value={activeSheet?.name || ""}
                  onChange={(e) => renameActive(e.target.value)}
                  disabled={isLocked}
                />

                <h6 className="card-title mb-2">Felder</h6>

                <div className="d-flex gap-2 mb-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={selectAll}
                    disabled={isLocked}
                  >
                    Alle Felder
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={selectNone}
                    disabled={isLocked}
                  >
                    Keine
                  </button>
                </div>

                <div
                  className="list-group"
                  style={{ maxHeight: 300, overflowY: "auto" }}
                >
                  {safeFieldNames.length === 0 ? (
                    <div className="text-muted p-2">
                      Keine Feldnamen vorhanden.
                    </div>
                  ) : (
                    safeFieldNames.map((name) => {
                      const checked = !!activeSheet?.fieldNames?.includes(name);
                      return (
                        <label
                          key={name}
                          className="list-group-item d-flex gap-2 align-items-center"
                          style={{
                            cursor: isLocked ? "not-allowed" : "pointer",
                            opacity: isLocked ? 0.7 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={checked}
                            disabled={isLocked}
                            onChange={() => toggleField(name)}
                          />
                          <span>{name}</span>
                        </label>
                      );
                    })
                  )}
                </div>

                {!isLocked && activeSheet && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger mt-3"
                    onClick={() => deleteSheet(activeIdx)}
                  >
                    Sheet löschen
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
