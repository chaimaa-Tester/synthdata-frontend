import React, { useEffect, useState } from "react";

type ValueSource = "default" | "custom";

type ValueListModalProps = {
  show: boolean;
  onClose: () => void;
  fieldLabel: string;
  defaultValues: string[];
  valueSource: ValueSource;
  customValues: string[];
  onSave: (valueSource: ValueSource, customValues: string[]) => void;
};

export const ValueListModal: React.FC<ValueListModalProps> = ({
  show,
  onClose,
  fieldLabel,
  defaultValues,
  valueSource,
  customValues,
  onSave,
}) => {
  const [localSource, setLocalSource] = useState<ValueSource>(valueSource);
  const [valuesText, setValuesText] = useState("");

  useEffect(() => {
    setLocalSource(valueSource);
    setValuesText((customValues ?? []).join("\n"));
  }, [show, valueSource, customValues]);

  if (!show) return null;

  const handleSave = () => {
    const lines =
      localSource === "custom"
        ? valuesText
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0)
        : [];

    onSave(localSource, lines);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 2100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 24,
          width: "90%",
          maxWidth: 520,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h5 className="mb-3">Werteliste für „{fieldLabel}“</h5>

        <div className="mb-3">
          <strong>Standardliste von SynthData Wizard:</strong>
          {defaultValues.length > 0 ? (
            <ul style={{ marginTop: 8 }}>
              {defaultValues.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          ) : (
            <div className="text-muted" style={{ marginTop: 4 }}>
              Für diesen Feldtyp ist derzeit keine Standardliste hinterlegt.
            </div>
          )}
        </div>

        <div className="mb-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              id="valueSourceDefault"
              checked={localSource === "default"}
              onChange={() => setLocalSource("default")}
            />
            <label className="form-check-label" htmlFor="valueSourceDefault">
              Standardliste verwenden
            </label>
          </div>

          <div className="form-check mt-1">
            <input
              className="form-check-input"
              type="radio"
              id="valueSourceCustom"
              checked={localSource === "custom"}
              onChange={() => setLocalSource("custom")}
            />
            <label className="form-check-label" htmlFor="valueSourceCustom">
              Eigene Liste definieren
            </label>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">
            Eigene Werte (je Zeile ein Eintrag):
          </label>
          <textarea
            className="form-control"
            rows={6}
            disabled={localSource !== "custom"}
            value={valuesText}
            onChange={(e) => setValuesText(e.target.value)}
          />
        </div>

        <div className="d-flex justify-content-end gap-2 mt-3">
          <button className="btn btn-outline-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};
