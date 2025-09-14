import React, { useEffect, useState } from "react";

// Props für das Modal
type DistributionModalProps = {
  show: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData: any;
  fieldType: string;
  allFieldNames?: string[]; // ✅ hinzugefügt (optional)
};

// Hauptkomponente für das Modal zur Verteilungsspezifikation
export const DistributionModal: React.FC<DistributionModalProps> = ({
  show,
  onClose,
  onSave,
  initialData,
  fieldType,
  //allFieldNames, // optional; wird aktuell nicht verwendet
}) => {
  if (!show) return null;

  // State für die Eingabefelder im Modal
  const [form, setForm] = useState(
    initialData || {
      distribution: "",
      parameterA: "",
      parameterB: "",
      extraParams: [] as string[],
    }
  );

  // Synchronisiert die Form-Daten mit den Initialdaten
  useEffect(() => {
    setForm(
      initialData || {
        distribution: "",
        parameterA: "",
        parameterB: "",
        extraParams: [] as string[],
      }
    );
  }, [initialData]);

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

  // Verfügbare Verteilungen nach Feldtyp
  const getAllowedDistributions = (type: string) => {
    switch (type) {
      case "String":
        return ["uniform", "categorical"];
      case "Date":
        return ["uniform"];
      case "Double":
        return ["normal", "uniform", "gamma", "lognormal", "exponential"];
      case "Integer":
        return ["uniform", "normal", "binomial", "poisson"];
      default:
        return ["normal", "uniform", "gamma"];
    }
  };

  // Input-Type
  const getInputType = () => {
    if (fieldType === "Date") return "date";
    if (fieldType === "Double") return "number";
    if (fieldType === "Integer") return "number";
    return "text";
  };

  // Platzhalter
  const getPlaceholder = (distribution: string, paramKey: string) => {
    if (fieldType === "Date") return "TT.MM.JJJJ";

    if (fieldType === "Double") {
      switch (distribution) {
        case "normal":
          return paramKey === "a" ? "Mittelwert (μ)" : "Std.Abweichung (σ)";
        case "uniform":
          return paramKey === "a" ? "Minimum" : "Maximum";
        case "gamma":
          return paramKey === "a" ? "Shape (k)" : "Scale (θ)";
        case "lognormal":
          return paramKey === "a" ? "log-μ" : "log-σ";
        case "exponential":
          return "Rate (λ)";
        default:
          return paramKey === "a" ? "Parameter A" : "Parameter B";
      }
    }

    if (fieldType === "Integer") {
      switch (distribution) {
        case "normal":
          return paramKey === "a" ? "Mittelwert (μ)" : "Std.Abweichung (σ)";
        case "uniform":
          return paramKey === "a" ? "Minimum" : "Maximum";
        case "binomial":
          return paramKey === "a" ? "Anzahl Versuche (n)" : "Erfolgswahrscheinlichkeit (p)";
        case "poisson":
          return "Rate (λ)";
        default:
          return paramKey === "a" ? "Parameter A" : "Parameter B";
      }
    }

    if (fieldType === "String") {
      if (distribution === "uniform") return "Werte (mit Komma)";
      if (distribution === "categorical")
        return paramKey === "a" ? "Werte (mit Komma)" : "Gewichte (mit Komma)";
    }

    return paramKey === "a" ? "Parameter A" : "Parameter B";
  };

  // Verteilungsnamen für die Anzeige
  const getDistributionLabel = (dist: string) => {
    switch (dist) {
      case "normal": return "Normalverteilung";
      case "uniform": return "Gleichverteilung";
      case "gamma": return "Gammaverteilung";
      case "lognormal": return "Log-Normalverteilung";
      case "exponential": return "Exponentialverteilung";
      case "categorical": return "Kategoriale Verteilung";
      case "binomial": return "Binomialverteilung";
      case "poisson": return "Poissonverteilung";
      default: return dist;
    }
  };

  // Soll Parameter B angezeigt werden?
  const shouldShowParameterB = (distribution: string) => {
    if (fieldType === "String" && distribution === "uniform") return false;
    if (distribution === "exponential") return false;
    if (fieldType === "Integer" && distribution === "poisson") return false;
    return true;
  };

  // Schrittweite
  const getStepValue = () => {
    if (fieldType === "Double") return "0.01";
    if (fieldType === "Integer") return "1";
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
        }}
      >
        {/* Titel */}
        <div className="d-flex align-items-start mb-4">
          <h3>Verteilung spezifizieren für {fieldType}</h3>
        </div>

        {/* Option 1 */}
        <div className="row mb-3">
          <div className="col-12">
            <h5 className="fw-bold">Option 1:</h5>
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

        {/* Option 2: Datei-Upload */}
        <div className="row mb-3">
          <div className="col-12">
            <h5 className="fw-bold">Option 2:</h5>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-4">
            <button
              className="btn w-100"
              style={{
                backgroundColor: "rgb(115, 67, 131)",
                color: "white",
                padding: "10px",
                fontSize: "16px",
              }}
            >
              Datei hochladen
            </button>
          </div>
        </div>

        {/* Aktionen */}
        <div className="text-center mt-4">
          <button
            className="me-3 btn btn-success px-4 py-2"
            onClick={() => onSave(form)}
            disabled={!form.distribution}
          >
            Speichern
          </button>
          <button className="btn btn-secondary px-4 py-2" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
