import React, { useEffect, useMemo, useRef, useState } from "react";
import { UseCaseModal } from "./UseCaseModal";
import { getLabelForType } from "../types/fieldTypes";

type Props = {
  row: any;
  idx: number;
  onChange: (idx: number, field: string, value: any) => void;
  onOpenModal: (idx: number) => void;
  onOpenDependencyModal?: (idx: number) => void;
  handleDeleteRow: (idx: number) => void;
  allFieldNames: string[];
  dragHandleProps?: any;
};

export const FieldRow: React.FC<Props> = ({
  row,
  idx,
  onChange,
  onOpenModal,
  onOpenDependencyModal,
  handleDeleteRow,
  allFieldNames,
  dragHandleProps,
}) => {
  const parseDeps = (text: string): string[] =>
    (text || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const toCommaString = (arr: string[]) =>
    Array.from(new Set(arr.filter(Boolean))).join(", ");

  const allOptions: string[] = useMemo(() => {
    return allFieldNames.filter((name) => name && name !== row.name);
  }, [allFieldNames, row.name]);

  const [selected, setSelected] = useState<string[]>(() => parseDeps(row.dependency));
  useEffect(() => {
    setSelected(parseDeps(row.dependency));
  }, [row.dependency]);

  const updateSelection = (next: string[]) => {
    setSelected(next);
    onChange(idx, "dependency", toCommaString(next));
  };

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  
  // NEU: Use Case Modal State
  const [showUseCaseModal, setShowUseCaseModal] = useState(false);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const isChecked = (opt: string) => selected.includes(opt);
  const toggle = (opt: string) => {
    const next = isChecked(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];
    updateSelection(next);
  };

  const selectAll = () => updateSelection(allOptions);
  const clearAll = () => updateSelection([]);

  const label =
    selected.length === 0
      ? "Abhängigkeiten wählen"
      : selected.join(", ");

  return (
    <div
      className="row mb-2 align-items-center flex-nowrap"
      style={{ minWidth: 1400 }} // NEU: Breite angepasst für neue Spalte
    >
      {/* Drag Handle */}
      <div 
        className="col-auto d-flex align-items-center px-0"
        {...(dragHandleProps || {})}
        style={{
          cursor: "grab",
          userSelect: "none",
          padding: "6px 8px"
        }}
        role="button"
        aria-label="Drag Handle"
        onMouseDown={(e) => e.preventDefault()}
      >
        <span style={{ fontSize: 20, opacity: 0.8 }}>☰</span>
      </div>

      {/* Feldname */}
      <div className="col-2">
        <input
          className="form-control"
          value={row.name}
          onChange={(e) => onChange(idx, "name", e.target.value)}
          placeholder="Feldname"
        />
      </div>

      {/* Feldtyp - wie Feldname */}
      <div className="col-2">
        <input
          className="form-control"
          value={getLabelForType(row.type) || "Feldtyp wählen"}
          readOnly
          onClick={() => setShowUseCaseModal(true)}
          style={{
            cursor: "pointer",
            backgroundColor: "white",
            color: row.type ? "black" : "#6c757d"
          }}
          placeholder="Feldtyp wählen"
        />
      </div>

      {/* Abhängigkeit Dropdown */}
      <div
        className="col-2"
        ref={rootRef}
        style={{ position: "relative", minWidth: 240 }}
      >
        <button
          type="button"
          className="form-control text-start d-flex align-items-center justify-content-between"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          style={{ cursor: "pointer", backgroundColor: "white" }}
          title={label}
        >
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "90%",
            }}
          >
            {label}
          </span>
          <span style={{ opacity: 0.8 }}>▾</span>
        </button>

        {open && (
          <div
            role="menu"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              zIndex: 1000,
              background: "white",
              color: "black",
              borderRadius: 8,
              marginTop: 6,
              boxShadow:
                "0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)",
              border: "1px solid rgba(0,0,0,.1)",
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            <div
              className="d-flex justify-content-between align-items-center px-2 py-1 border-bottom"
            >
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={selectAll}
              >
                Alle auswählen
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={clearAll}
              >
                Keine
              </button>
            </div>

            <div style={{ padding: 6 }}>
              {allOptions.length === 0 && (
                <div style={{ padding: "8px 10px", color: "#666" }}>
                  Keine Felder vorhanden
                </div>
              )}
              {allOptions.map((opt) => (
                <label
                  key={opt}
                  className="d-flex align-items-center"
                  style={{
                    padding: "6px 10px",
                    gap: 8,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={isChecked(opt)}
                    onChange={() => toggle(opt)}
                    style={{ cursor: "pointer" }}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Verteilung & Löschen */}
      <div className="col-3 d-flex align-items-center">
        <button
          className="btn me-3"
          style={{
            backgroundColor: "rgb(115, 67, 131)",
            color: "white",
            minWidth: "150px"
          }}
          onClick={() => onOpenModal(idx)}
          title="Verteilung und Parameter konfigurieren"
        >
          Standard-Verteilung
        </button>

        <button
            className="btn"
            onClick={() => onOpenDependencyModal && onOpenDependencyModal(idx)}
            disabled={!row.dependency}
            title={row.dependency ? "Abhängigkeits-Verteilung festlegen" : "Zuerst Abhängigkeit wählen"}
            style={{
              backgroundColor: row.dependency ? "rgb(115,67,131)" : "rgba(255,255,255,0.12)",
              color: "white",
            }}
          >
            Abhängigkeits-Verteilung
          </button>
        
        {/* Löschen-Button (direkt neben Verteilung) */}
        <button
          type="button"
          className="btn ms-3"
          aria-label="Delete"
          style={{ padding: 0, background: "none", border: "none", marginLeft: 8 }}
          onClick={() => handleDeleteRow(idx)}
          title="Zeile löschen"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            fill="white"
            viewBox="0 0 16 16"
          >
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5.5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6zm2 .5a.5.5 0 0 1 .5-.5.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6z" />
            <path
              fillRule="evenodd"
              d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1H14a1 1 0 0 1 1 1zm-3-1a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0-.5.5V3h3V2zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118z"
            />
          </svg>
          </button>
        </div>

        {/* NEU: Use Case Modal */}
        <UseCaseModal
          show={showUseCaseModal}
          onClose={() => setShowUseCaseModal(false)}
          onSelectField={(fieldType) => {
            onChange(idx, "type", fieldType);
            setShowUseCaseModal(false);
          }}
        />
    </div>
  );
};