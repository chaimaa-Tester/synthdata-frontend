import React, { useEffect, useState } from "react";

// Props für das Modal: Sichtbarkeit, Callback zum Schließen/Speichern und Initialdaten
type DistributionModalProps = {
  show: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData: any;
};

// Standardstruktur für die Verteilungsdaten
const defaultRow = {
  distribution: "",
  parameterA: "",
  parameterB: "",
};

// Hauptkomponente für das Modal zur Verteilungsspezifikation
export const DistributionModal: React.FC<DistributionModalProps> = ({
  show,
  onClose,
  onSave,
  initialData,
}) => {
  // Modal wird nicht gerendert, wenn es nicht sichtbar sein soll
  if (!show) return null;

  // State für die Eingabefelder im Modal
  const [form, setForm] = useState(
    initialData || {
      distribution: "",
      parameterA: "",
      parameterB: "",
      extraParams: [],
    }
  );

  // Synchronisiert die Form-Daten mit den Initialdaten, wenn sich die Zeile ändert
  useEffect(() => {
    setForm(
      initialData || {
        distribution: "",
        parameterA: "",
        parameterB: "",
        extraParams: [],
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

  // Beispiel für weitere Optionen (z.B. Datei-Upload)
  const [rows, setRows] = useState([defaultRow]);
  const onChange = (idx: number, field: string, value: any) => {
    const newRows = [...rows];
    newRows[idx] = { ...newRows[idx], [field]: value };
    setRows(newRows);
  };

  // Labels für die Parameter je nach gewählter Verteilung
  const distributionParams: Record<string, { a: string; b: string }> = {
    normal: { a: "μ", b: "σ" },
    equal: { a: "Min", b: "Max" },
    gamma: { a: "μ", b: "σ" },
  };

  // Gibt die passenden Platzhalter für die Parameter zurück
  const getParamLabels = (distribution: string) =>
    distributionParams[distribution] || { a: "μ:", b: "σ:" };

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
          minWidth: 1200,
        }}
      >
        {/* Titel des Modals */}
        <div className="d-flex align-items-start">
          <h3>Verteilung spezifizieren</h3>
        </div>

        {/* Option 1: Verteilung und Parameter */}
        <div className="row mb-2 fw-bold flex-nowrap">
          <div className="col-md-2">Option 1:</div>
        </div>

        <div className="row mb-2 align-items-center">
          {/* Auswahl der Verteilung */}
          <div className="col-3">
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
            >
              <option value="normal">Normalverteilung</option>
              <option value="equal">Gleichverteilung</option>
              <option value="gamma">Gammaverteilung</option>
            </select>
          </div>
          {/* Eingabefelder für die Hauptparameter */}
          <div className="col-1">
            <input
              className="form-control"
              value={form.parameterA}
              onChange={(e) => setForm({ ...form, parameterA: e.target.value })}
              placeholder={getParamLabels(form.distribution).a}
            />
          </div>
          <div className="col-1">
            <input
              className="form-control"
              value={form.parameterB}
              onChange={(e) => setForm({ ...form, parameterB: e.target.value })}
              placeholder={getParamLabels(form.distribution).b}
            />
          </div>
          {/* Dynamisch generierte zusätzliche Parameter */}
          {(form.extraParams || []).map((param: any, idx: any) => (
            <div className="col-1" key={idx}>
              <input
                className="form-control"
                value={param}
                onChange={(e) => handleExtraParamChange(idx, e.target.value)}
              />
            </div>
          ))}
          {/* Button zum Hinzufügen eines weiteren Parameters */}
          <div className="col-1">
            <button
              className="btn"
              style={{
                backgroundColor: "rgb(115, 67, 131)",
                color: "white",
                fontSize: 20,
              }}
              onClick={handleAddExtraParam}
              title="Weiteren Parameter hinzufügen"
            >
              +
            </button>
          </div>
        </div>

        {/* Option 2: Beispiel für weitere Aktionen, z.B. Datei-Upload */}
        <div className="row mb-2 fw-bold flex-nowrap">
          <div className="col-md-2">Option 2:</div>
        </div>

        {rows.map((row, idx) => (
          <div className="row mb-2 align-items-center" key={idx}>
            <div className="col-3">
              <button
                className="btn me-3"
                style={{
                  backgroundColor: "rgb(115, 67, 131)",
                  color: "white",
                  fontSize: 20,
                }}
              >
                Datei hochladen
              </button>
            </div>
          </div>
        ))}

        {/* Buttons zum Speichern oder Schließen des Modals */}
        <div className="text-center">
          <button className="me-1 btn btn-success" onClick={() => onSave(form)}>
            Speichern
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
