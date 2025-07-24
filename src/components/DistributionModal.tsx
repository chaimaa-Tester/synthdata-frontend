import React, { useEffect, useState } from "react";

type DistributionModalProps = {
  show: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData: any;
};

const defaultRow = {
  distribution: "",
  parameterA: "",
  parameterB: "",
};

export const DistributionModal: React.FC<DistributionModalProps> = ({
  show,
  onClose,
  onSave,
  initialData,
}) => {
  if (!show) return null;

  const [form, setForm] = useState(
    initialData || { distribution: "", parameterA: "", parameterB: "" }
  );

  useEffect(() => {
    setForm(
      initialData || { distribution: "", parameterA: "", parameterB: "" }
    );
  }, [initialData]);

  const [rows, setRows] = useState([defaultRow]);
  const onChange = (idx: number, field: string, value: any) => {
    const newRows = [...rows];
    newRows[idx] = { ...newRows[idx], [field]: value };
    setRows(newRows);
  };

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
        <div className="d-flex align-items-start">
          <h3>Verteilung spezifizieren</h3>
        </div>

        <div className="row mb-2 fw-bold flex-nowrap">
          <div className="col-md-2">Option 1:</div>
        </div>

        {rows.map((row, idx) => (
          <div className="row mb-2 align-items-center" key={idx}>
            <div className="col-3">
              <select
                className="form-select"
                value={row.distribution}
                onChange={(e) => onChange(idx, "distribution", e.target.value)}
              >
                <option value="normal">Normalverteilung</option>
                <option value="equal">Gleichverteilung</option>
                <option value="gamma">Gammaverteilung</option>
              </select>
            </div>
            <div className="col-1">
              <input
                className="form-control"
                value={row.parameterA}
                onChange={(e) => onChange(idx, "parameterA", e.target.value)}
                placeholder="a:"
              />
            </div>
            <div className="col-1">
              <input
                className="form-control"
                value={row.parameterB}
                onChange={(e) => onChange(idx, "parameterB", e.target.value)}
                placeholder="b:"
              />
            </div>
          </div>
        ))}

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
        <div className="text-center">
          {/* Speicher Funktion funktioniert noch nicht, muss analysiert werden. */}
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
