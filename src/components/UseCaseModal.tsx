import React, { useState } from "react";

// Wichtig : Nur die tatsächlich in Use Cases verwendeten Feldtypen
type FieldType = 
  // Basis-Felder (verwendet in mehreren Use Cases)
  | "name" | "vorname" | "nachname" | "geschlecht" | "alter" | "email" | "telefon" | "Date" | "Integer" 
  // Gesundheitswesen Use Case

  | "körpergröße" | "gewicht" | "Body-Mass-Index" | "gewichtdiagnose" 
  // Finanzwesen Use Case

  | "kontonummer" | "transaktionsdatum" | "transaktionsart" | "betrag"

  // Containerlogistik Use Case
  | "unitName" | "timeIn" | "timeOut" | "attributeSizes" | "attributeStatus"
  
  | "attributeWeights" | "attributeDirections" | "inboundCarrierId" 
  
  | "outboundCarrierId" | "serviceId" | "linerId";

type UseCase = {
  id: string;
  label: string;
  description: string;
  icon: string;
  fields: { value: FieldType; label: string }[];
};

type UseCaseModalProps = {
  show: boolean;
  onClose: () => void;
  onSelectField: (fieldType: FieldType) => void;
};

export const useCases: UseCase[] = [
  // Containerlogistik Use Case
  {
    id: "containerlogistik",
    label: "Containerlogistik",
    description: "Container-Transport, Häfen, Logistik",
    icon: "🚢",
    fields: [
      { value: "unitName", label: "Containereinheit" },
      { value: "timeIn", label: "Ankunftszeit" },
      { value: "timeOut", label: "Abfahrtszeit" },
      { value: "attributeSizes", label: "Containergröße" },
      { value: "attributeStatus", label: "Status" },
      { value: "attributeWeights", label: "Gewicht" },
      { value: "attributeDirections", label: "Richtung (Import/Export)" },
      { value: "inboundCarrierId", label: "Eingehendes Transportmittel" },
      { value: "outboundCarrierId", label: "Ausgehendes Transportmittel" },
      { value: "serviceId", label: "Dienst-ID" },
      { value: "linerId", label: "Reederei-ID" }
    ]
  },
  // Gesundheitswesen Use Case
  {
    id: "gesundheit",
    label: "Gesundheitswesen",
    description: "Patienten, Diagnosen, Behandlungen",
    icon: "🏥",
    fields: [
      { value: "name", label: "Patientenname" },
      { value: "vorname", label: "Vorname" },
      { value: "nachname", label: "Nachname" },
      { value: "geschlecht", label: "Geschlecht" },
      { value: "alter", label: "Alter" },
      { value: "Date", label: "Geburtsdatum" },
      { value: "körpergröße", label: "Körpergröße" },
      { value: "gewicht", label: "Gewicht" },
      { value: "Body-Mass-Index", label: "BMI" },
      { value: "gewichtdiagnose", label: "Gewichtsdianose" }
    ]
  },
  // Finanzwesen Use Case
  {
    id: "finanzen",
    label: "Finanzwesen",
    description: "Transaktionen, Konten, Zahlungen",
    icon: "💰",
    fields: [
      { value: "name", label: "Kundenname" },
      { value: "Integer", label: "Kontonummer" },
      { value: "Date", label: "Transaktionsdatum" },
      { value: "email", label: "E-Mail" },
      { value: "telefon", label: "Telefon" },
      { value: "transaktionsart", label: "Transaktionsart" },
      { value: "betrag", label: "Betrag" }
    ]
  }
];

export const UseCaseModal: React.FC<UseCaseModalProps> = ({ show, onClose, onSelectField }) => {
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const selectedUseCaseData = useCases.find(uc => uc.id === selectedUseCase);
  
  const filteredFields = selectedUseCaseData?.fields.filter(field => 
    field.label.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
                      border: "2px solid #dee2e6"
                    }}
                    onClick={() => handleUseCaseSelect(useCase.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#0d6efd";
                      e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#dee2e6";
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
                        {useCase.fields.length} Feldtypen verfügbar
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
            <div className="row g-2">
              {filteredFields.map((field) => (
                <div key={field.value} className="col-md-6">
                  <button
                    className="btn btn-outline-primary w-100 text-start"
                    onClick={() => handleFieldSelect(field.value)}
                    style={{
                      padding: "0.75rem 1rem",
                      border: "2px solid #dee2e6",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#0d6efd";
                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#dee2e6";
                      e.currentTarget.style.backgroundColor = "white";
                    }}
                  >
                    <div className="fw-bold text-dark">{field.label}</div>
                    <small className="text-muted">{field.value}</small>
                  </button>
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