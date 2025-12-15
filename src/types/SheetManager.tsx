import React, { useState } from "react";

export type ExportSheet = {
  id: string;
  name: string;
  fieldNames: string[];
  locked?: boolean;
};

type SheetManagerProps = {
  sheets: ExportSheet[];
  setSheets: (next: ExportSheet[]) => void;
  availableFieldNames: string[];
  title?: string;
};

export const SheetManager: React.FC<SheetManagerProps> = ({
  sheets,
  setSheets,
  availableFieldNames,
  title = "Sheets konfigurieren",
}) => {
  const [activeIdx, setActiveIdx] = useState(0);

  const activeSheet = sheets[activeIdx];

  const toggleField = (fieldName: string) => {
    if (!activeSheet) return;
    const isSelected = activeSheet.fieldNames.includes(fieldName);
    const nextFieldNames = isSelected
      ? activeSheet.fieldNames.filter((f) => f !== fieldName)
      : [...activeSheet.fieldNames, fieldName];

    const nextSheets = sheets.map((s, i) =>
      i === activeIdx ? { ...s, fieldNames: nextFieldNames } : s
    );
    setSheets(nextSheets);
  };

  const selectAll = () => {
    if (!activeSheet) return;
    const nextSheets = sheets.map((s, i) =>
      i === activeIdx ? { ...s, fieldNames: [...availableFieldNames] } : s
    );
    setSheets(nextSheets);
  };

  const selectNone = () => {
    if (!activeSheet) return;
    const nextSheets = sheets.map((s, i) =>
      i === activeIdx ? { ...s, fieldNames: [] } : s
    );
    setSheets(nextSheets);
  };

  const addSheet = () => {
    const newSheet: ExportSheet = {
      id: `sheet-${Date.now()}`,
      name: `Sheet ${sheets.length}`,
      fieldNames: [],
      locked: false,
    };
    setSheets([...sheets, newSheet]);
  };

  const deleteSheet = (idx: number) => {
    if (sheets[idx].locked) return;
    const nextSheets = sheets.filter((_, i) => i !== idx);
    setSheets(nextSheets);
    if (activeIdx >= nextSheets.length) setActiveIdx(nextSheets.length - 1);
  };

  return (
    <div className="row g-3">
      <div className="col-12">
        <h5 className="mb-3">{title}</h5>
      </div>

      {/* Linke Seite: Sheet-Liste */}
      <div className="col-12 col-md-4">
        <div className="card" style={{ background: "#f8f9fa" }}>
          <div className="card-body">
            <h6 className="card-title mb-3">Sheets</h6>
            <div className="list-group list-group-flush mb-3">
              {sheets.map((sheet, idx) => (
                <button
                  key={sheet.id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                    activeIdx === idx ? "active" : ""
                  }`}
                  onClick={() => setActiveIdx(idx)}
                  style={{
                    backgroundColor: activeIdx === idx ? "rgb(115, 67, 131)" : "transparent",
                    color: activeIdx === idx ? "white" : "black",
                  }}
                >
                  <span>{sheet.name}</span>
                  {sheet.locked && <span className="badge bg-secondary">Fix</span>}
                </button>
              ))}
            </div>
            <button
              className="btn btn-sm btn-primary w-100"
              onClick={addSheet}
            >
              + Neues Sheet
            </button>
          </div>
        </div>
      </div>

      {/* Rechte Seite: Sheet-Konfiguration */}
      <div className="col-12 col-md-8">
        <div className="card">
          <div className="card-body">
            <h6 className="card-title mb-2">Sheet-Name</h6>
            <input
              type="text"
              className="form-control mb-3"
              value={activeSheet?.name || ""}
              onChange={(e) => {
                if (!activeSheet) return;
                const nextSheets = sheets.map((s, i) =>
                  i === activeIdx ? { ...s, name: e.target.value } : s
                );
                setSheets(nextSheets);
              }}
              disabled={activeSheet?.locked}
            />

            <h6 className="card-title mb-2">Felder</h6>
            <div className="d-flex gap-2 mb-3">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={selectAll}
              >
                Alle Felder
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={selectNone}
              >
                Keine
              </button>
            </div>

            <div
              className="list-group"
              style={{ maxHeight: 300, overflowY: "auto" }}
            >
              {availableFieldNames.length === 0 ? (
                <div className="text-muted p-2">Keine Feldnamen vorhanden.</div>
              ) : (
                availableFieldNames.map((name) => {
                  const checked = activeSheet?.fieldNames.includes(name);
                  return (
                    <label
                      key={name}
                      className="list-group-item d-flex gap-2 align-items-center"
                    >
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={checked}
                        onChange={() => toggleField(name)}
                      />
                      <span>{name}</span>
                    </label>
                  );
                })
              )}
            </div>

            {activeSheet && !activeSheet.locked && (
              <button
                className="btn btn-sm btn-danger mt-3"
                onClick={() => deleteSheet(activeIdx)}
              >
                Sheet löschen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
