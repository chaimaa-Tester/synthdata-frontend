import React, { useEffect, useState } from "react";
import { NameSourceModal, type NameSourceSelection } from "./NameSourceModal";

// Props für das Modal
type DistributionModalProps = {
  show: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData: any;
  fieldType: string;
  allFieldNames?: string[];
};

// Hauptkomponente für das Modal zur Verteilungsspezifikation
export const DistributionModal: React.FC<DistributionModalProps> = ({
  show,
  onClose,
  onSave,
  initialData,
  fieldType,
}) => {
  if (!show) return null;

  // State für die Eingabefelder im Modal
  const [form, setForm] = useState(
    initialData || {
      distribution: "",
      parameterA: "",
      parameterB: "",
      extraParams: [] as string[],
      name_source: initialData?.name_source ?? undefined,
      country: initialData?.country ?? undefined,
    }
  );

  const [showNameSourceModal, setShowNameSourceModal] = useState(false);

  // Synchronisiert die Form-Daten mit den Initialdaten
  useEffect(() => {
    setForm(
      initialData || {
        distribution: "",
        parameterA: "",
        parameterB: "",
        extraParams: [] as string[],
        name_source: initialData?.name_source ?? undefined,
        country: initialData?.country ?? undefined,
      }
    );
  }, [initialData]);

  const handleNameSourceSelect = (selection: NameSourceSelection) => {
    setForm((prev: typeof form) => ({
      ...prev,
      name_source: selection.source_type,
      country: selection.country || null,
    }));
    setShowNameSourceModal(false);
  };

  // Handler zum Ändern eines zusätzlichen Parameters
  const handleExtraParamChange = (idx: number, value: string) => {
    const newExtraParams = [...(form.extraParams || [])];
    newExtraParams[idx] = value;
    setForm({ ...form, extraParams: newExtraParams });
  };

  // Handler zum Hinzufügen eines weiteren Parameters
  const handleAddExtraParam = () => {
    setForm({ ...form, extraParams: [...(form.extraParams || []), ""] });
  };

  //  NEU: Verfügbare Verteilungen erweitert für mimesis-Typen
  const getAllowedDistributions = (type: string) => {
    switch (type) {
      case "name":
      case "vorname":
      case "nachname":
      case "vollständigername":
        return ["categorical"];
      case "geschlecht":
      case "gender":
        return ["categorical"];
      case "Date":
      case "date":
        return ["uniform"];
      case "körpergröße":
      case "gewicht":
      case "float":
      case "dwelltime":
        return ["uniform", "normal"];
      case "Integer":
      case "integer":
      case "alter":
      case "plz":
      case "hausnummer":
        return ["uniform", "normal", "poisson"];
      case "adresse":
      case "straße":
      case "stadt":
      case "land":
      case "email":
      case "telefon":
        return ["categorical"]; //  Neue Feldtypen
      default:
        return ["normal", "uniform", "gamma"];
    }
  };

  // Input-Type erweitert
  const getInputType = () => {
    if (fieldType.toLowerCase() === "date") return "date";
    if (["integer", "körpergröße", "alter", "plz", "hausnummer", "gewicht"].includes(fieldType.toLowerCase())) 
      return "number";
    return "text";
  };

  //  NEU: Verbesserte Platzhalter für mimesis-Typen
  const getPlaceholder = (distribution: string, paramKey: string) => {
    const fieldTypeLower = fieldType.toLowerCase();
    
    if (fieldTypeLower === "date") return "TT.MM.JJJJ";

    if (["körpergröße", "integer", "alter", "plz", "hausnummer", "gewicht"].includes(fieldTypeLower)) {
      switch (distribution) {
        case "uniform":
          return paramKey === "a" ? "Minimum" : "Maximum";
        case "normal":
          return paramKey === "a" ? "Mittelwert (μ)" : "Std.Abweichung (σ)";
        case "poisson":
          return "Durchschnitt (λ)";
        default:
          return paramKey === "a" ? "Parameter A" : "Parameter B";
      }
    }

    if (["name", "vorname", "nachname", "vollständigername", "geschlecht", "adresse", "straße", "stadt", "land", "email", "telefon"].includes(fieldTypeLower)) {
      if (distribution === "categorical")
        return paramKey === "a" ? "Werte (mit Komma)" : "Gewichte (mit Komma)";
    }

    return paramKey === "a" ? "Parameter A" : "Parameter B";
  };

  // Verteilungsnamen für die Anzeige
  const getDistributionLabel = (dist: string) => {
    switch (dist) {
      case "normal":
        return "Normalverteilung";
      case "uniform":
        return "Gleichverteilung";
      case "gamma":
        return "Gammaverteilung";
      case "lognormal":
        return "Log-Normalverteilung";
      case "exponential":
        return "Exponentialverteilung";
      case "poisson":
        return "Poisson-Verteilung";
      case "categorical":
        return "Kategoriale Verteilung";
      default:
        return dist;
    }
  };

  // Soll Parameter B angezeigt werden?
  const shouldShowParameterB = (distribution: string) => {
    if (distribution === "exponential") return false;
    if (distribution === "poisson") return false;
    if (["name", "vorname", "nachname", "geschlecht", "adresse", "straße", "stadt", "land", "email", "telefon"].includes(fieldType.toLowerCase()) && 
        distribution === "categorical") {
      return true; //  Bei kategorialen Verteilungen für Namen etc. Parameter B für Gewichte anzeigen
    }
    return true;
  };

  // Schrittweite
  const getStepValue = () => {
    if (["körpergröße", "gewicht"].includes(fieldType.toLowerCase())) return "0.01";
    if (["integer", "alter", "plz", "hausnummer"].includes(fieldType.toLowerCase())) return "1";
    return undefined;
  };

  const allowedDistributions = getAllowedDistributions(fieldType);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "white",
          color: "black",
          padding: 30,
          borderRadius: 10,
          minWidth: 800,
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >

        {/* Option 1 */}
        <div className="row mb-3">
          <div className="col-12">
            <h5 className="fw-bold">Option 1: Manuelle Verteilungskonfiguration</h5>
          </div>
        </div>

        <div className="row mb-4 align-items-center">
          {/* Auswahl der Verteilung */}
          <div className="col-4">
            <select
              className="form-select"
              value={form.distribution}
              onChange={(e) => {
                const dist = e.target.value;
                setForm({
                  ...form,
                  distribution: dist,
                  parameterA: "",
                  parameterB: "",
                  extraParams: [],
                });
              }}
              disabled={allowedDistributions.length === 0}
            >
              <option value="">Verteilung wählen</option>
              {allowedDistributions.map((dist) => (
                <option key={dist} value={dist}>
                  {getDistributionLabel(dist)}
                </option>
              ))}
            </select>
          </div>

          {/* Hauptparameter */}
          {form.distribution && (
            <>
              <div className="col-3 ms-2">
                <input
                  className="form-control"
                  type={getInputType()}
                  value={form.parameterA}
                  onChange={(e) => setForm({ ...form, parameterA: e.target.value })}
                  placeholder={getPlaceholder(form.distribution, "a")}
                  step={getStepValue()}
                  style={{ minWidth: "200px" }}
                />
              </div>

              {shouldShowParameterB(form.distribution) && (
                <div className="col-3 ms-2">
                  <input
                    className="form-control"
                    type={getInputType()}
                    value={form.parameterB}
                    onChange={(e) => setForm({ ...form, parameterB: e.target.value })}
                    placeholder={getPlaceholder(form.distribution, "b")}
                    step={getStepValue()}
                    style={{ minWidth: "200px" }}
                  />
                </div>
              )}
            </>
          )}

          {/* Dynamische Zusatzparameter */}
          {(form.extraParams || []).map((param: any, idx: any) => (
            <div className="col-3 d-flex align-items-center ms-2" key={idx}>
              <input
                className="form-control"
                type="text"
                value={param}
                onChange={(e) => handleExtraParamChange(idx, e.target.value)}
                placeholder={`Zusatzparameter ${idx + 1}`}
                style={{ minWidth: "150px" }}
              />
              <button
                className="btn ms-1"
                style={{
                  backgroundColor: "rgb(115, 67, 131)",
                  color: "white",
                  fontSize: 20,
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
                onClick={() => {
                  const newExtraParams = [...(form.extraParams || [])];
                  newExtraParams.splice(idx, 1);
                  setForm({ ...form, extraParams: newExtraParams });
                }}
                title="Parameter entfernen"
              >
                ×
              </button>
            </div>
          ))}

          {/* Weiteren Parameter hinzufügen */}
          {form.distribution && (
            <div className="col-1 ms-2">
              <button
                className="btn"
                style={{
                  backgroundColor: "rgb(115, 67, 131)",
                  color: "white",
                  fontSize: 20,
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={handleAddExtraParam}
                title="Weiteren Parameter hinzufügen"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Namensquelle Auswahl (nur für Namensfelder) */}
        {["vorname", "nachname", "name", "vollständigername"].includes(fieldType.toLowerCase()) && (
          <div className="mb-3">
            <label className="form-label">Namensquelle</label>
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={() => setShowNameSourceModal(true)}
            >
              {form.name_source
                ? `Quelle: ${form.name_source}${form.country ? ` (${form.country})` : ""}`
                : "Namensquelle wählen..."}
            </button>
          </div>
        )}

        {/* Aktionen */}
        <div className="text-center mt-4">
          <button
            className="me-3 btn btn-success px-4 py-2"
            onClick={() => onSave({
              ...form,
            })}
            disabled={!form.distribution}
          >
            Speichern
          </button>
          <button className="btn btn-secondary px-4 py-2" onClick={onClose}>
            Schließen
          </button>
        </div>

        {/* NameSourceModal */}
        {showNameSourceModal && (
          <NameSourceModal
            show={showNameSourceModal}
            onClose={() => setShowNameSourceModal(false)}
            onSelect={handleNameSourceSelect}
          />
        )}
      </div>
    </div>
  );
};