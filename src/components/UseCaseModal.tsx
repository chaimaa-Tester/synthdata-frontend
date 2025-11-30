import React, { useState, useEffect } from "react";
import { useCases, FieldType, getDefaultValuesForType } from "../types/fieldTypes";
import { Tooltip } from "./Tooltip";

type UseCaseModalProps = {
  show: boolean;
  onClose: () => void;
  onSelectField: (fieldType: FieldType) => void;
  // optionaler Callback: wenn der Nutzer im Tooltip die Default-Liste bearbeitet
  onEditValues?: (fieldType: FieldType, newValues: string[]) => void;
};

export const UseCaseModal: React.FC<UseCaseModalProps> = ({
  show,
  onClose,
  onSelectField,
  onEditValues,
}) => {
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  // Reset bei Öffnen/Schließen
  useEffect(() => {
    if (!show) {
      setSelectedUseCase(null);
      setSearchTerm("");
      setActiveGroupIndex(0);
    }
  }, [show]);

  // Wenn ein anderer UseCase gewählt wird, immer auf erste Gruppe springen
  useEffect(() => {
    setActiveGroupIndex(0);
  }, [selectedUseCase]);

  if (!show) return null;

  const handleUseCaseSelect = (useCaseId: string) => {
    setSelectedUseCase(useCaseId);
  };

  const handleBackToUseCases = () => {
    setSelectedUseCase(null);
    setSearchTerm("");
    setActiveGroupIndex(0);
  };

  const handleFieldSelect = (fieldType: FieldType) => {
    onSelectField(fieldType);
    onClose();
    setSelectedUseCase(null);
    setSearchTerm("");
    setActiveGroupIndex(0);
  };

  const selectedUseCaseData = useCases.find((uc) => uc.id === selectedUseCase);

  // Felder bestimmen
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

  const filteredFields = allFields.filter((field: any) =>
    field.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {!selectedUseCase ? (
          /* Use-Case-Auswahl */
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
                      <p className="card-text text-muted">
                        {useCase.description}
                      </p>
                      <small className="text-muted">
                        {useCase.fields
                          ? useCase.fields.length
                          : useCase.fieldGroups?.reduce(
                              (acc, g) => acc + g.fields.length,
                              0
                            ) ?? 0}{" "}
                        Feldtypen verfügbar
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Feldtyp-Auswahl */
          <div>
            {/* Navigation */}
            <div className="d-flex align-items-center mb-3">
              <button
                className="btn btn-outline-secondary me-3"
                onClick={handleBackToUseCases}
              >
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

            {/* Dynamische Gruppen-Tabs, falls fieldGroups vorhanden */}
            {selectedUseCaseData?.fieldGroups &&
              selectedUseCaseData.fieldGroups.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mb-4">
                  {selectedUseCaseData.fieldGroups.map((group, idx) => (
                    <button
                      key={group.groupLabel}
                      className="btn"
                      onClick={() => setActiveGroupIndex(idx)}
                      style={{
                        backgroundColor:
                          activeGroupIndex === idx
                            ? "rgb(115,67,131)"
                            : "transparent",
                        color:
                          activeGroupIndex === idx
                            ? "white"
                            : "rgb(34,37,41)",
                        border: "1px solid rgb(115,67,131)",
                        padding: "0.45rem 1rem",
                      }}
                    >
                      {group.groupLabel}
                    </button>
                  ))}
                </div>
              )}

            <div className="row g-2">
              {filteredFields.map((field) => (
                <div key={field.value} className="col-md-6">
                  <div style={{ position: "relative" }}>
                    <button
                      className="btn w-100 text-start"
                      onClick={() => handleFieldSelect(field.value)}
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
                        e.currentTarget.style.boxShadow =
                          "0 6px 12px rgba(115,67,131,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#e6e6e6";
                        e.currentTarget.style.backgroundColor = "white";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div>
                        <div className="fw-bold text-dark">
                          {field.label}
                        </div>
                        {/* field.value absichtlich nicht mehr anzeigen */}
                      </div>
                      {field.tooltip ? (
                        <div style={{ marginLeft: 12, marginRight: 6 }}>
                          <Tooltip
                            // Tooltip-Content erweitern: Tooltip zeigt Tooltip-Text
                            // plus vordefinierte Werte (falls vorhanden) und einen Stift zum Editieren.
                            content={
                              <div style={{ maxWidth: 320 }}>
                                <div style={{ marginBottom: 8 }}>{field.tooltip}</div>
                                {/* Zeige Default-Werte falls vorhanden */}
                                {getDefaultValuesForType(field.value)?.length ? (
                                  <div style={{ marginBottom: 8 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                      <strong>Vordefinierte Werte:</strong>
                                      <small style={{ color: "rgba(255,255,255,0.65)" }}>Klicken zum Auswählen</small>
                                    </div>

                                    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 8 }}>
                                      {getDefaultValuesForType(field.value).map((v) => (
                                        <button
                                          key={v}
                                          type="button"
                                          onClick={() => {
                                            // neue Logik: speichere die ganze Default-Liste, aber setze das
                                            // gewählte Element an erste Stelle (Preview zeigt das ausgewählte)
                                            const defaults = getDefaultValuesForType(field.value) || [];
                                            const ordered = [v, ...defaults.filter((d) => d !== v)];
                                            if (onEditValues) {
                                              onEditValues(field.value as FieldType, ordered);
                                            }
                                            // Feldtyp auswählen / Modal schließen
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
                                            transition: "transform .06s ease, background .08s ease, box-shadow .08s ease",
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
                                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 12 }}>{v}</span>
                                          <span style={{ opacity: 0.85, fontSize: 14 }}>➜</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                                {/* Stift: nur sichtbar wenn Parent einen Edit-Callback übergeben hat */}
                                {onEditValues ? (
                                  <div style={{ textAlign: "right", marginTop: 6 }}>
                                    <button
                                      className="btn btn-sm btn-secondary w-100 d-flex align-items-center justify-content-center"
                                      onClick={() => {
                                        const currentDefaults = getDefaultValuesForType(field.value) || [];
                                        const raw = window.prompt(
                                          `Eigene Werte für ${field.label} (Komma-getrennt):`,
                                          currentDefaults.join(", ")
                                        );
                                        if (raw === null) return;
                                        const arr = raw
                                          .split(",")
                                          .map((s) => s.trim())
                                          .filter(Boolean);
                                        if (!arr.length) return;

                                        // an Parent weitergeben (speichert in rows[activeRowIdx])
                                        if (onEditValues) onEditValues(field.value as FieldType, arr);

                                        // Feldtyp auswählen / Modal schließen
                                        onSelectField(field.value as FieldType);
                                      }}
                                      title="Eigene Werte für dieses Feld definieren"
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
                            <span
                              style={{
                                cursor: "help",
                                color: "#6c757d",
                                padding: 6,
                              }}
                            >
                              ⓘ
                            </span>
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
      </div>
    </div>
  );
};