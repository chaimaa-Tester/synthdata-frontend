import React, { useEffect, useState } from "react";

type Props = {
  show: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  targetName: string;
  targetType?: string;
  initialData?: any;
};

export const DependencyDistributionModal: React.FC<Props> = ({
  show,
  onClose,
  onSave,
  targetName,
  targetType,
  initialData,
}) => {
  if (!show) return null;

  const [distribution, setDistribution] = useState<string>(
    initialData?.distribution || "categorical"
  );
  const [values, setValues] = useState<string>(initialData?.parameterA || "");
  const [weights, setWeights] = useState<string>(initialData?.parameterB || "");

  useEffect(() => {
    setDistribution(initialData?.distribution || "categorical");
    setValues(initialData?.parameterA || "");
    setWeights(initialData?.parameterB || "");
  }, [initialData]);

  const handleSave = () => {
    if (!distribution) return;
    // einfache Validierung: bei categorical müssen values gesetzt sein
    if (distribution === "categorical" && !values.trim()) {
      alert(
        "Bitte Werte für die kategoriale Verteilung angeben (Komma-getrennt)."
      );
      return;
    }
    onSave({
      distribution,
      parameterA: values,
      parameterB: weights,
    });
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
          padding: 24,
          borderRadius: 8,
          minWidth: 520,
        }}
      >
        <h5>
          Abhängigkeits-Verteilung für: <strong>{targetName}</strong>
        </h5>
        <p style={{ marginTop: 0 }}>
          {targetType ? `Feldtyp: ${targetType}` : null}
        </p>

        <div style={{ marginTop: 12 }}>
          <label className="form-label">Verteilungstyp</label>
          <select
            className="form-select"
            value={distribution}
            onChange={(e) => setDistribution(e.target.value)}
          >
            <option value="categorical">
              Kategorial (Wahrscheinlichkeiten)
            </option>
          </select>
        </div>

        {distribution === "categorical" && (
          <>
            <div style={{ marginTop: 12 }}>
              <label className="form-label">Werte (Komma-getrennt)</label>
              <input
                className="form-control"
                value={values}
                onChange={(e) => setValues(e.target.value)}
                placeholder="z.B. weiblich,männlich,divers"
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label className="form-label">
                Gewichte (Komma-getrennt, optional)
              </label>
              <input
                className="form-control"
                value={weights}
                onChange={(e) => setWeights(e.target.value)}
                placeholder="z.B. 80,20"
              />
              <div className="form-text">
                Gewichte werden normalisiert, wenn nötig.
              </div>
            </div>
          </>
        )}

        <div
          style={{ marginTop: 18, display: "flex", justifyContent: "center" }}
        >
          <button className="btn btn-success me-3" onClick={handleSave}>
            Speichern
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};
