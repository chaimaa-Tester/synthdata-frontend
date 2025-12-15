// src/SheetManager.tsx
import React, { useMemo, useState } from "react";

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

  // Fenster schließen/öffnen
  collapsible?: boolean;    // default: true
  defaultOpen?: boolean;    // default: true

  // Styling (dein dunkles Blau)
  darkBgColor?: string;     // default: "rgb(31, 53, 88)"
};

export const SheetManager: React.FC<SheetManagerProps> = ({
  sheets,
  setSheets,
  availableFieldNames,
  title = "Sheets konfigurieren",
  collapsible = true,
  defaultOpen = true,
  darkBgColor = "rgb(31, 53, 88)",
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const activeSheet = sheets[activeIdx];

  const safeFieldNames = useMemo(
    () =>
      Array.from(
        new Set(
          (availableFieldNames || [])
            .map((n) => (n || "").trim())
            .filter((n) => n.length > 0)
        )
      ),
    [availableFieldNames]
  );

  // ------- Helpers -------
  const setActiveSheetFields = (nextFieldNames: string[]) => {
    if (!activeSheet) return;
    if (activeSheet.locked) return; // FIX = nicht editierbar

    const nextSheets = sheets.map((s, i) =>
      i === activeIdx ? { ...s, fieldNames: nextFieldNames } : s
    );
    setSheets(nextSheets);
  };

  const toggleField = (fieldName: string) => {
    if (!activeSheet) return;
    if (activeSheet.locked) return;

    const isSelected = activeSheet.fieldNames.includes(fieldName);
    const nextFieldNames = isSelected
      ? activeSheet.fieldNames.filter((f) => f !== fieldName)
      : [...activeSheet.fieldNames, fieldName];

    setActiveSheetFields(nextFieldNames);
  };

  const selectAll = () => {
    if (!activeSheet) return;
    if (activeSheet.locked) return;
    setActiveSheetFields([...safeFieldNames]);
  };

  const selectNone = () => {
    if (!activeSheet) return;
    if (activeSheet.locked) return;
    setActiveSheetFields([]);
  };

  const addSheet = () => {
    const newSheet: ExportSheet = {
      id: `sheet-${Date.now()}`,
      name: `Sheet ${sheets.length + 1}`,
      fieldNames: [],
      locked: false,
    };
    const next = [...sheets, newSheet];
    setSheets(next);
    setActiveIdx(next.length - 1);
    setIsOpen(true);
  };

  const deleteSheet = (idx: number) => {
    if (!sheets[idx] || sheets[idx].locked) return;

    const nextSheets = sheets.filter((_, i) => i !== idx);
    setSheets(nextSheets);

    if (nextSheets.length === 0) {
      setActiveIdx(0);
      return;
    }
    if (activeIdx >= nextSheets.length) setActiveIdx(nextSheets.length - 1);
  };

  const renameActive = (value: string) => {
    if (!activeSheet) return;
    if (activeSheet.locked) return;

    const nextSheets = sheets.map((s, i) =>
      i === activeIdx ? { ...s, name: value } : s
    );
    setSheets(nextSheets);
  };

  const isLocked = !!activeSheet?.locked;

  // Blau-Badge wie „Neues Sheet“
  const badgeStyle: React.CSSProperties = {
    backgroundColor: darkBgColor,
    color: "white",
    border: "1px solid rgba(255,255,255,0.25)",
    fontWeight: 600,
  };

  return (
    <div className="row g-3">
      <div className="col-12 d-flex align-items-center justify-content-between">
        <h5 className="mb-0">{title}</h5>

        {collapsible && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setIsOpen((v) => !v)}
            title={isOpen ? "Schließen" : "Öffnen"}
            style={{
              backgroundColor: darkBgColor,
              color: "white",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            {isOpen ? "✕" : "▾"}
          </button>
        )}
      </div>

      {!isOpen ? null : (
        <>
          {/* Linke Seite: Sheet-Liste */}
          <div className="col-12 col-md-4">
            <div className="card" style={{ background: "#f8f9fa" }}>
              <div className="card-body">
                <h6 className="card-title mb-3">Sheets</h6>

                <div className="list-group list-group-flush mb-3">
                  {sheets.map((sheet, idx) => (
                    <button
                      key={sheet.id}
                      type="button"
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                        activeIdx === idx ? "active" : ""
                      }`}
                      onClick={() => setActiveIdx(idx)}
                      style={{
                        backgroundColor:
                          activeIdx === idx ? "rgb(115, 67, 131)" : "transparent",
                        color: activeIdx === idx ? "white" : "black",
                        borderColor: "rgba(0,0,0,0.06)",
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sheet.name}
                      </span>

                      <span className="d-flex align-items-center gap-2">
                        {sheet.locked && (
                          <span className="badge" style={badgeStyle}>
                            Fix
                          </span>
                        )}
                        {!sheet.locked && (
                          <span
                            role="button"
                            title="Sheet löschen"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSheet(idx);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            🗑️
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Button: Dunkelblau wie Hintergrund */}
                <button
                  type="button"
                  className="btn btn-sm w-100"
                  onClick={addSheet}
                  style={{
                    backgroundColor: darkBgColor,
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
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
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="card-title mb-2">Sheet-Name</h6>

                  {isLocked ? (
                    <span className="badge" style={badgeStyle}>
                      Fix
                    </span>
                  ) : (
                    <span className="badge" style={badgeStyle}>
                      Editierbar
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  className="form-control mb-3"
                  value={activeSheet?.name || ""}
                  onChange={(e) => renameActive(e.target.value)}
                  disabled={isLocked}
                />

                <h6 className="card-title mb-2">Felder</h6>

                <div className="d-flex gap-2 mb-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={selectAll}
                    disabled={isLocked}
                  >
                    Alle Felder
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={selectNone}
                    disabled={isLocked}
                  >
                    Keine
                  </button>
                </div>

                <div className="list-group" style={{ maxHeight: 300, overflowY: "auto" }}>
                  {safeFieldNames.length === 0 ? (
                    <div className="text-muted p-2">Keine Feldnamen vorhanden.</div>
                  ) : (
                    safeFieldNames.map((name) => {
                      const checked = !!activeSheet?.fieldNames?.includes(name);
                      return (
                        <label
                          key={name}
                          className="list-group-item d-flex gap-2 align-items-center"
                          style={{
                            cursor: isLocked ? "not-allowed" : "pointer",
                            opacity: isLocked ? 0.7 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={checked}
                            disabled={isLocked}
                            onChange={() => toggleField(name)}
                          />
                          <span>{name}</span>
                        </label>
                      );
                    })
                  )}
                </div>

                {!isLocked && activeSheet && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger mt-3"
                    onClick={() => deleteSheet(activeIdx)}
                  >
                    Sheet löschen
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
