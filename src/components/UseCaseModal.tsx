/**
 * Autor: CHAIMAA KARIOUI
 
 *
 * Beschreibung:
 * Modal-Komponente zur Auswahl eines Feldtyps über vordefinierte Use Cases.
 * Der Nutzer wählt zuerst einen Use Case (z. B. Allgemein, Finanzen, Logistik),
 * danach einen konkreten Feldtyp. Optional können bei bestimmten Feldtypen
 * Werte-Listen (Defaultwerte oder eigene Werte) ausgewählt bzw. bearbeitet werden.
 *
 * Ziel:
 * - Geführte Auswahl von Feldtypen statt manueller Eingabe
 * - Einheitliche Darstellung von Labels/Tooltips aus fieldTypes.ts
 * - Optional: komfortables Bearbeiten von Wertelisten ohne window.prompt
 *
 * Abhängigkeiten:
 * - useCases: Zentrale Use-Case-Konfiguration (Feldgruppen, Labels, Tooltips)
 * - getDefaultValuesForType: Defaultwertelisten pro Feldtyp
 * - Tooltip: UI-Komponente zur Anzeige von Hilfetexten und Defaultwerten
 */

import React, { useEffect, useState } from "react";
import { useCases, FieldType, getDefaultValuesForType } from "../types/fieldTypes";
import { Tooltip } from "./Tooltip";

/**
 * UseCaseModalProps
 *
 * @property show          Steuert, ob das Modal sichtbar ist.
 * @property onClose       Callback zum Schließen des Modals.
 * @property onSelectField Callback, wenn ein Feldtyp gewählt wurde.
 * @property onEditValues  Optionaler Callback zum Speichern eigener Wertelisten pro Feldtyp.
 * @property currentRow    Optional: aktuelle Zeile/Row-Kontext (z. B. bereits gespeicherte customValues).
 */
type UseCaseModalProps = {
  show: boolean;
  onClose: () => void;
  onSelectField: (fieldType: FieldType) => void;
  onEditValues?: (fieldType: FieldType, newValues: string[]) => void;
  currentRow?: any;
};

/**
 * ValueEditorState
 *
 * Zweck:
 * Zustand für das interne Werte-Editor-Modal.
 * Wird gesetzt, wenn der Nutzer „Werte bearbeiten“ auswählt.
 *
 * @property fieldType      Feldtyp, dessen Werte bearbeitet werden sollen.
 * @property label          Anzeigename (für Modal-Titel).
 * @property initialValues  Startwerte (entweder aus currentRow.customValues oder Defaultwerten).
 */
type ValueEditorState = {
  fieldType: FieldType | string;
  label: string;
  initialValues: string[];
} | null;

/**
 * UseCaseModal
 *
 * Funktionslogik (Übersicht):
 * 1) Wenn show=false -> render null (Modal unsichtbar)
 * 2) UseCase-Auswahl: Kartenansicht mit Icon/Label/Description
 * 3) Feldtyp-Auswahl: Suchfeld + ggf. Gruppen-Tabs + Feldliste
 * 4) Tooltip pro Feld: zeigt Tooltiptext und Defaultwerte
 * 5) Optional: internes Modal zum Bearbeiten eigener Wertelisten
 */
export const UseCaseModal: React.FC<UseCaseModalProps> = ({
  show,
  onClose,
  onSelectField,
  onEditValues,
  currentRow,
}) => {
  /**
   * selectedUseCase:
   * Speichert die ID des aktuell ausgewählten Use Cases.
   * - null => UseCase-Übersicht (erste Ebene)
   * - string => Feldliste eines Use Cases (zweite Ebene)
   */
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);

  /**
   * searchTerm:
   * Suchbegriff zur Filterung der Feldliste im ausgewählten Use Case.
   */
  const [searchTerm, setSearchTerm] = useState("");

  /**
   * activeGroupIndex:
   * Index der aktuell aktiven Feldgruppe (nur relevant, wenn fieldGroups vorhanden sind).
   */
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  /**
   * valueEditorState/valueEditorText:
   * Zustände des internen Werte-Editors:
   * - valueEditorState steuert, ob das Editor-Modal offen ist und für welches Feld.
   * - valueEditorText enthält den bearbeitbaren Text (kommasepariert).
   */
  const [valueEditorState, setValueEditorState] = useState<ValueEditorState>(null);
  const [valueEditorText, setValueEditorText] = useState("");

  // ---------------------------------------
  // Lifecycle / Effects
  // ---------------------------------------

  /**
   * Reset bei Öffnen/Schließen:
   * Wenn das Modal geschlossen wird (show=false), werden alle UI-Zustände zurückgesetzt.
   * Damit ist beim nächsten Öffnen ein definierter „Startzustand“ vorhanden.
   */
  useEffect(() => {
    if (!show) {
      setSelectedUseCase(null);
      setSearchTerm("");
      setActiveGroupIndex(0);
      setValueEditorState(null);
      setValueEditorText("");
    }
  }, [show]);

  /**
   * Bei UseCase-Wechsel:
   * Setzt die Gruppenauswahl wieder auf die erste Gruppe.
   * Verhindert „Index außerhalb des Bereichs“, wenn ein anderer Use Case weniger Gruppen hat.
   */
  useEffect(() => {
    setActiveGroupIndex(0);
  }, [selectedUseCase]);

  /**
   * Wenn Modal nicht angezeigt wird, wird nichts gerendert.
   * Vorteil: keine unnötigen DOM-Elemente/Events im Hintergrund.
   */
  if (!show) return null;

  // ---------------------------------------
  // Event Handler (Use Cases / Navigation)
  // ---------------------------------------

  /**
   * handleUseCaseSelect
   *
   * Zweck:
   * Wechsel von UseCase-Übersicht zur Feldliste eines konkreten Use Cases.
   *
   * @param useCaseId ID des ausgewählten Use Cases.
   */
  const handleUseCaseSelect = (useCaseId: string) => {
    setSelectedUseCase(useCaseId);
  };

  /**
   * handleBackToUseCases
   *
   * Zweck:
   * Navigation zurück zur UseCase-Übersicht (erste Ebene).
   * Setzt Suche und Gruppenindex zurück.
   */
  const handleBackToUseCases = () => {
    setSelectedUseCase(null);
    setSearchTerm("");
    setActiveGroupIndex(0);
  };

  /**
   * handleFieldSelect
   *
   * Zweck:
   * Auswahl eines Feldtyps und anschließendes Schließen des Modals.
   *
   * Implementierungsdetails:
   * - ruft onSelectField(fieldType) auf (Parent übernimmt die tatsächliche Auswahl)
   * - schließt das Modal über onClose()
   * - setzt lokale UI-Zustände zurück, damit beim nächsten Öffnen Startzustand aktiv ist
   *
   * @param fieldType Der ausgewählte Feldtyp (FieldType).
   */
  const handleFieldSelect = (fieldType: FieldType) => {
    onSelectField(fieldType);
    onClose();
    setSelectedUseCase(null);
    setSearchTerm("");
    setActiveGroupIndex(0);
  };

  // ---------------------------------------
  // Ableitungen: aktiver UseCase / Felder / Filter
  // ---------------------------------------

  /**
   * selectedUseCaseData:
   * Datenobjekt des aktiven Use Cases aus der zentralen Konfiguration.
   */
  const selectedUseCaseData = useCases.find((uc) => uc.id === selectedUseCase);

  /**
   * allFields:
   * Bestimmt die Feldliste für die Anzeige:
   * - Wenn fieldGroups existieren: nur Felder der aktuell aktiven Gruppe (activeGroupIndex)
   * - Sonst: flache Liste selectedUseCaseData.fields
   *
   * Hinweis:
   * Der Index wird über Math.min abgesichert, damit er nie außerhalb der Gruppenlänge liegt.
   */
  let allFields: any[] = [];
  if (selectedUseCaseData) {
    if (selectedUseCaseData.fieldGroups && selectedUseCaseData.fieldGroups.length > 0) {
      const groups = selectedUseCaseData.fieldGroups;
      const activeGroup = groups[Math.min(activeGroupIndex, groups.length - 1)];
      allFields = activeGroup?.fields ?? [];
    } else {
      allFields = selectedUseCaseData.fields ?? [];
    }
  }

  /**
   * filteredFields:
   * Filtert die Feldliste anhand des Suchbegriffs.
   * Implementierung:
   * - Case-insensitive Vergleich über toLowerCase()
   */
  const filteredFields = allFields.filter((field: any) =>
    field.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ---------------------------------------
  // Werte-Editor: Öffnen / Schließen / Speichern
  // ---------------------------------------

  /**
   * openValueEditor
   *
   * Zweck:
   * Öffnet das interne Werte-Editor-Modal für ein Feld.
   *
   * Logik:
   * 1) Defaultwerte aus getDefaultValuesForType(field.value) laden
   * 2) Falls currentRow.customValues existiert und nicht leer ist: diese als initialValues verwenden
   * 3) Sonst: Defaultwerte verwenden
   * 4) State setzen und valueEditorText als kommaseparierten String befüllen
   *
   * @param field Felddefinition aus der UseCase-Konfiguration (enthält value/label/editableValues).
   */
  const openValueEditor = (field: any) => {
    const defaults = getDefaultValuesForType(field.value) || [];

    const currentValues =
      currentRow &&
      Array.isArray(currentRow.customValues) &&
      currentRow.customValues.length
        ? currentRow.customValues
        : defaults;

    setValueEditorState({
      fieldType: field.value,
      label: field.label,
      initialValues: currentValues,
    });
    setValueEditorText(currentValues.join(", "));
  };

  /**
   * closeValueEditor
   *
   * Zweck:
   * Schließt das Werte-Editor-Modal und leert den Editor-Text.
   * Verhindert, dass alte Eingaben beim nächsten Öffnen wieder erscheinen.
   */
  const closeValueEditor = () => {
    setValueEditorState(null);
    setValueEditorText("");
  };

  /**
   * handleValueEditorSave
   *
   * Zweck:
   * Speichert die vom Nutzer eingegebenen Werte aus dem Editor.
   *
   * Implementierung:
   * - valueEditorText wird über Komma getrennt
   * - trim() entfernt Leerzeichen
   * - filter(Boolean) entfernt leere Einträge
   * - onEditValues wird (falls vorhanden) aufgerufen
   * - anschließend wird der Feldtyp ausgewählt (onSelectField), Editor geschlossen und Modal geschlossen
   *
   * Robustheit:
   * - wenn valueEditorState nicht gesetzt ist => Abbruch
   */
  const handleValueEditorSave = () => {
    if (!valueEditorState) return;

    const raw = valueEditorText || "";
    const arr = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (onEditValues) {
      onEditValues(valueEditorState.fieldType as FieldType, arr);
    }

    onSelectField(valueEditorState.fieldType as FieldType);
    closeValueEditor();
    onClose();
  };

  // ---------------------------------------
  // Render
  // ---------------------------------------

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1050,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      onClick={onClose}
    >
      <div
        className="modal-content bg-white rounded"
        style={{
          width: "80%",
          maxWidth: "800px",
          maxHeight: "80%",
          padding: "2rem",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="text-dark mb-0">
            {selectedUseCase ? selectedUseCaseData?.label : "Feldtyp wählen"}
          </h4>
          <button className="btn-close" onClick={onClose} aria-label="Close" />
        </div>

        {/* UseCase-Auswahl (Ebene 1) */}
        {!selectedUseCase ? (
          <div>
            <p className="text-muted mb-4">
              Wählen Sie einen Anwendungsbereich für Ihre Datenfelder:
            </p>

            <div className="row g-3">
              {useCases.map((useCase) => (
                <div key={useCase.id} className="col-md-4">
                  <div
                    className="card h-100 border-2 cursor-pointer hover-card"
                    style={{
                      cursor: "pointer",
                      transition: "all 0.2s",
                      border: "2px solid #e6e6e6",
                    }}
                    onClick={() => handleUseCaseSelect(useCase.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgb(115,67,131)";
                      e.currentTarget.style.backgroundColor = "#faf5fb";
                      e.currentTarget.style.boxShadow =
                        "0 6px 16px rgba(115,67,131,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e6e6e6";
                      e.currentTarget.style.backgroundColor = "white";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div className="card-body text-center">
                      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                        {useCase.icon}
                      </div>
                      <h5 className="card-title text-dark">{useCase.label}</h5>
                      <p className="card-text text-muted">{useCase.description}</p>
                      <small className="text-muted">
                        {useCase.fields
                          ? useCase.fields.length
                          : useCase.fieldGroups?.reduce((acc, g) => acc + g.fields.length, 0) ?? 0}{" "}
                        Feldtypen verfügbar
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Feldtyp-Auswahl (Ebene 2) */
          <div>
            {/* Navigation */}
            <div className="d-flex align-items-center mb-3">
              <button className="btn btn-outline-secondary me-3" onClick={handleBackToUseCases}>
                ← Zurück
              </button>
              <div className="flex-grow-1">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Feldtyp suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Gruppen-Tabs (falls fieldGroups vorhanden) */}
            {selectedUseCaseData?.fieldGroups && selectedUseCaseData.fieldGroups.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mb-4">
                {selectedUseCaseData.fieldGroups.map((group, idx) => (
                  <button
                    key={group.groupLabel}
                    className="btn"
                    onClick={() => setActiveGroupIndex(idx)}
                    style={{
                      backgroundColor: activeGroupIndex === idx ? "rgb(115,67,131)" : "transparent",
                      color: activeGroupIndex === idx ? "white" : "rgb(34,37,41)",
                      border: "1px solid rgb(115,67,131)",
                      padding: "0.45rem 1rem",
                    }}
                  >
                    {group.groupLabel}
                  </button>
                ))}
              </div>
            )}

            {/* Feldliste */}
            <div className="row g-2">
              {filteredFields.map((field: any) => (
                <div key={field.value} className="col-md-6">
                  <div style={{ position: "relative" }}>
                    <button
                      className="btn w-100 text-start"
                      onClick={() => handleFieldSelect(field.value as FieldType)}
                      style={{
                        padding: "0.75rem 1rem",
                        border: "2px solid #e6e6e6",
                        transition: "all 0.2s",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "white",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgb(115,67,131)";
                        e.currentTarget.style.backgroundColor = "#fbf2fb";
                        e.currentTarget.style.boxShadow = "0 6px 12px rgba(115,67,131,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#e6e6e6";
                        e.currentTarget.style.backgroundColor = "white";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div>
                        <div className="fw-bold text-dark">{field.label}</div>
                      </div>

                      {/* Tooltip nur anzeigen, wenn kein Werte-Editor offen ist */}
                      {field.tooltip && !valueEditorState ? (
                        <div style={{ marginLeft: 12, marginRight: 6 }}>
                          <Tooltip
                            content={
                              <div style={{ maxWidth: 320 }}>
                                <div style={{ marginBottom: 8 }}>{field.tooltip}</div>

                                {/* Default-Werte anzeigen und auswählbar machen */}
                                {getDefaultValuesForType(field.value)?.length ? (
                                  <div style={{ marginBottom: 8 }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 6,
                                      }}
                                    >
                                      <strong>Vordefinierte Werte:</strong>
                                      <small style={{ color: "rgba(255,255,255,0.65)" }}>
                                        Klicken zum Auswählen
                                      </small>
                                    </div>

                                    <div
                                      style={{
                                        marginTop: 6,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 8,
                                      }}
                                    >
                                      {getDefaultValuesForType(field.value).map((v) => (
                                        <button
                                          key={v}
                                          type="button"
                                          onClick={() => {
                                            const defaults = getDefaultValuesForType(field.value) || [];
                                            const ordered = [v, ...defaults.filter((d) => d !== v)];

                                            if (onEditValues) {
                                              onEditValues(field.value as FieldType, ordered);
                                            }
                                            onSelectField(field.value as FieldType);
                                          }}
                                          style={{
                                            cursor: "pointer",
                                            textAlign: "left",
                                            padding: "8px 10px",
                                            background: "rgba(11,35,55,0.9)",
                                            color: "white",
                                            fontFamily: "monospace",
                                            borderRadius: 8,
                                            border: "1px solid rgba(255,255,255,0.06)",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            transition:
                                              "transform .06s ease, background .08s ease, box-shadow .08s ease",
                                            boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.25)",
                                          }}
                                          onMouseEnter={(e) => {
                                            const el = e.currentTarget as HTMLButtonElement;
                                            el.style.background = "rgba(115,67,131,0.95)";
                                            el.style.transform = "translateY(-1px)";
                                            el.style.boxShadow = "0 4px 10px rgba(0,0,0,0.25)";
                                          }}
                                          onMouseLeave={(e) => {
                                            const el = e.currentTarget as HTMLButtonElement;
                                            el.style.background = "rgba(11,35,55,0.9)";
                                            el.style.transform = "none";
                                            el.style.boxShadow = "inset 0 -1px 0 rgba(0,0,0,0.25)";
                                          }}
                                          title="Klicken, um dieses Muster zu verwenden"
                                        >
                                          <span
                                            style={{
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                              marginRight: 12,
                                            }}
                                          >
                                            {v}
                                          </span>
                                          <span style={{ opacity: 0.85, fontSize: 14 }}>➜</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}

                                {/* Eigener Editor-Button */}
                                {onEditValues ? (
                                  <div style={{ textAlign: "right", marginTop: 6 }}>
                                    <button
                                      className={`btn btn-sm ${
                                        field.editableValues
                                          ? "btn-secondary"
                                          : "btn-outline-secondary"
                                      } w-100 d-flex align-items-center justify-content-center`}
                                      disabled={!field.editableValues}
                                      onClick={(e) => {
                                        if (!field.editableValues) return;
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openValueEditor(field);
                                      }}
                                      title={
                                        field.editableValues
                                          ? "Eigene Werte für dieses Feld definieren"
                                          : "Dieses Feld erlaubt keine Bearbeitung der Werte"
                                      }
                                      style={{ gap: 8 }}
                                    >
                                      <span style={{ fontSize: 14 }}>✏️</span>
                                      <span style={{ fontWeight: 600 }}>Werte bearbeiten</span>
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            }
                          >
                            <span style={{ cursor: "help", color: "#6c757d", padding: 6 }}>ⓘ</span>
                          </Tooltip>
                        </div>
                      ) : null}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredFields.length === 0 && searchTerm && (
              <div className="text-center text-muted py-4">
                Keine Felder gefunden für "{searchTerm}"
              </div>
            )}
          </div>
        )}

        {/* internes Werte-Editor-Modal */}
        {valueEditorState && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000000,
            }}
            onClick={closeValueEditor}
          >
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: "1.5rem",
                width: "90%",
                maxWidth: 500,
                boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h5 className="mb-2">Eigene Werte für {valueEditorState.label}</h5>
              <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                Werte kommasepariert eingeben, z. B.: <code>Rot, Grün, Blau</code>
              </p>

              <textarea
                className="form-control"
                rows={4}
                value={valueEditorText}
                onChange={(e) => setValueEditorText(e.target.value)}
                placeholder="Wert1, Wert2, Wert3"
              />

              <div className="d-flex justify-content-end mt-3 gap-2">
                <button className="btn btn-outline-secondary" type="button" onClick={closeValueEditor}>
                  Abbrechen
                </button>
                <button
                  className="btn"
                  type="button"
                  style={{ backgroundColor: "rgb(115,67,131)", color: "white" }}
                  onClick={handleValueEditorSave}
                >
                  Übernehmen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
