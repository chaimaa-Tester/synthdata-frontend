import React, { useState } from "react";
import { useCases, FieldType } from "../types/fieldTypes";
import { Tooltip } from "./Tooltip";

type UseCaseModalProps = {
  show: boolean;
  onClose: () => void;
  onSelectField: (fieldType: FieldType) => void;
};

export const UseCaseModal: React.FC<UseCaseModalProps> = ({ show, onClose, onSelectField }) => {
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGroup, setActiveGroup] = useState<"container" | "carrier">("container");

  // Reset modal internals when opened/closed
  React.useEffect(() => {
    if (!show) {
      setSelectedUseCase(null);
      setSearchTerm("");
      setActiveGroup("container");
    }
  }, [show]);

  if (!show) return null;

  const handleUseCaseSelect = (useCaseId: string) => {
    setSelectedUseCase(useCaseId);
  };

  const handleBackToUseCases = () => {
    setSelectedUseCase(null);
    setSearchTerm("");
  };

  const handleFieldSelect = (fieldType: FieldType) => {
    onSelectField(fieldType);
    onClose();
    setSelectedUseCase(null);
    setSearchTerm("");
  };

  const selectedUseCaseData = useCases.find((uc) => uc.id === selectedUseCase);

  // Determine which fields to show. If the use case has groups, pick the group's fields
  let allFields: any[] = [];
  if (selectedUseCaseData) {
    // generische Prüfungen: benutze fieldGroups, wenn vorhanden — keine harte ID‑Prüfung
    if (selectedUseCaseData.fieldGroups && selectedUseCaseData.fieldGroups.length > 0) {
      const key = activeGroup === "container" ? "container" : "carrier";
      const found = selectedUseCaseData.fieldGroups.find((g) =>
        g.groupLabel.toLowerCase().includes(key)
      );
      allFields = found?.fields ?? [];
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
        alignItems: "center"
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
          overflowY: "auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="text-dark mb-0">
            {selectedUseCase ? selectedUseCaseData?.label : "Feldtyp wählen"}
          </h4>
          <button 
            className="btn-close" 
            onClick={onClose}
            aria-label="Close"
          />
        </div>

        {!selectedUseCase ? (
          /* Use Case Auswahl */
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
                      border: "2px solid #e6e6e6"
                    }}
                    onClick={() => handleUseCaseSelect(useCase.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgb(115,67,131)"; // violett
                      e.currentTarget.style.backgroundColor = "#faf5fb";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(115,67,131,0.08)";
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
                        {useCase.fields ? useCase.fields.length : (useCase.fieldGroups?.reduce((acc, g) => acc + g.fields.length, 0) ?? 0)} Feldtypen verfügbar
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Feldtyp Auswahl */
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

            {/* Felder Liste */}
            {/* Gruppenumschaltung wenn fieldGroups vorhanden sind */}
{selectedUseCaseData?.fieldGroups && selectedUseCaseData.fieldGroups.length > 0 && (
  <div className="d-flex justify-content-center gap-3 mb-4">
    <button
      className="btn"
      onClick={() => setActiveGroup("container")}
      style={{
        backgroundColor: activeGroup === "container" ? "rgb(115,67,131)" : "transparent",
        color: activeGroup === "container" ? "white" : "rgb(34,37,41)",
        border: "1px solid rgb(115,67,131)",
        padding: "0.45rem 1rem"
      }}
    >
      📦 Containerdaten
    </button>
    <button
      className="btn"
      onClick={() => setActiveGroup("carrier")}
      style={{
        backgroundColor: activeGroup === "carrier" ? "rgb(115,67,131)" : "transparent",
        color: activeGroup === "carrier" ? "white" : "rgb(34,37,41)",
        border: "1px solid rgb(115,67,131)",
        padding: "0.45rem 1rem"
      }}
    >
      🚢 Carrier / Schiffsdaten
    </button>
  </div>
)}

            <div className="row g-2">
              {filteredFields.map((field) => (
                <div key={field.value} className="col-md-6">
                  <div style={{ position: "relative" }}>
                    <button
                      className="btn btn-outline-primary w-100 text-start"
                      onClick={() => handleFieldSelect(field.value)}
                      style={{
                        padding: "0.75rem 1rem",
                        border: "2px solid #e6e6e6",
                        transition: "all 0.2s",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "white"
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
                        <small className="text-muted">{field.value}</small>
                      </div>
                      {field.tooltip ? (
                        <div style={{ marginLeft: 12, marginRight: 6 }}>
                          <Tooltip content={field.tooltip}>
                            <span style={{ cursor: "help", color: "#6c757d", padding: 6 }}>ⓘ</span>
                          </Tooltip>
                        </div>
                      ) : null}
                    </button>
                    {/* no-op: tooltip icon is rendered inside the button via Tooltip */}
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