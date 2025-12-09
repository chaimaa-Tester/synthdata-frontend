import React, { useState } from "react";
import { NAME_REGIONS, NAME_COUNTRIES } from "../types/nameSources";

type NameSourceModalProps = {
  show: boolean;
  onClose: () => void;
  onSelect: (source: string) => void;
};

export const NameSourceModal: React.FC<NameSourceModalProps> = ({
  show,
  onClose,
  onSelect,
}) => {
  const [mode, setMode] = useState<"western" | "regional">("regional");
  const [country, setCountry] = useState<string>("");

  if (!show) return null;

  const accent = "rgb(115, 67, 131)";

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1050,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className="modal-content bg-white rounded"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%",
          maxWidth: 480,
          padding: "1.5rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
        }}
      >
        <h4 className="mb-2"> Test-Namensquellen anpassen</h4>
        <p className="text-muted mb-3">
          Wählen Sie eine Region oder ein Land für die Namensgenerierung.
        </p>

        {/* Region-Buttons */}
        <div className="d-flex gap-2 mb-3">
          {NAME_REGIONS.map((r) => {
            const active = mode === r.value;
            return (
              <button
                key={r.value}
                type="button"
                className="btn"
                onClick={() => setMode(r.value as "western" | "regional")}
                style={{
                  backgroundColor: active ? accent : "transparent",
                  color: active ? "white" : accent,
                  border: `1px solid ${accent}`,
                  padding: "0.25rem 0.75rem",
                  fontSize: "0.9rem",
                  borderRadius: 999,
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Länderauswahl nur bei "regional" */}
        {mode === "regional" && (
          <select
            className="form-select"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">Land wählen…</option>
            {NAME_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        <div className="d-flex justify-content-end mt-3 gap-2">
          <button
            className="btn"
            onClick={onClose}
            type="button"
            style={{
              backgroundColor: "transparent",
              color: "rgb(115, 67, 131)",
              border: "1px solid #ced4da",
            }}
          >
            Abbrechen
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => {
              const value = mode === "western" ? "western" : country;
              onSelect(value);
              onClose();
            }}
            disabled={mode === "regional" && !country}
            style={{
              backgroundColor:
                mode === "regional" && !country ? "#e0d5ea" : accent,
              color: "white",
              border: "1px solid " + accent,
              opacity: mode === "regional" && !country ? 0.7 : 1,
            }}
          >
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
};
