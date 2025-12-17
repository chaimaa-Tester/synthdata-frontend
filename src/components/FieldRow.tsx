import React, { useEffect, useMemo, useRef, useState } from "react";
import { UseCaseModal } from "./UseCaseModal";
import { getLabelForType, getDefaultValuesForType, FieldType } from "../types/fieldTypes";
import { NameSourceModal } from "./NameSourceModal"; // <-- eigenes Modal für Namensquelle

type Props = {
  row: any;
  idx: number;
  onChange: (idx: number, field: string, value: any) => void;
  onOpenModal: (idx: number) => void;
  onCustomDraw: (idx: number) => void;
  onOpenUploadModal: (idx:  number) => void;
  onOpenDependencyModal?: (idx: number) => void;
  handleDeleteRow: (idx: number) => void;
  allFieldNames: string[];
  dragHandleProps?: any;
  onOpenValueEditor?: (idx: number) => void;
  onEditValuesFromUseCaseModal?: (fieldType: FieldType, newValues: string[]) => void;
};

export const FieldRow: React.FC<Props> = ({
  row,
  idx,
  onChange,
  onOpenModal,
  onCustomDraw,
  onOpenUploadModal,
  onOpenDependencyModal,
  handleDeleteRow,
  allFieldNames,
  dragHandleProps,
  onOpenValueEditor,
  onEditValuesFromUseCaseModal
}) => {
  // Abhängigkeiten (Dropdown)
  const parseDeps = (text: string): string[] =>
    (text || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const toCommaString = (arr: string[]) =>
    Array.from(new Set(arr.filter(Boolean))).join(", ");

  const allOptions: string[] = useMemo(
    () => allFieldNames.filter((name) => name && name !== row.name),
    [allFieldNames, row.name]
  );

  const [selected, setSelected] = useState<string[]>(() =>
   
    parseDeps(row.dependency)
  
  );

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
  // Namensquellen-Auswahl (für firstname/lastname/fullname)
  const [showNameSourceModal, setShowNameSourceModal] = useState(false);
  // Premium UI states for the reset button
  const [resetHover, setResetHover] = useState(false);
  const [resetActive, setResetActive] = useState(false);

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
    selected.length === 0 ? "Abhängigkeiten wählen" : selected.join(", ");

  // --- Distribution mode locking ---
  type DistributionMode =
    | "standard"
    | "upload"
    | "custom"
    | "dependency"
    | null;

  const distributionMode: DistributionMode = (row?.distributionMode ??
    null) as DistributionMode;
  const isLocked = distributionMode !== null;

  const setDistributionMode = (mode: Exclude<DistributionMode, null>) => {
    // persist on row so the lock survives re-renders
    if (row?.distributionMode !== mode) {
      onChange(idx, "distributionMode", mode);
    }
  };

  const clearDistributionMode = () => {
    onChange(idx, "distributionMode", null);
  };

  const isDisabledByMode = (mode: Exclude<DistributionMode, null>) => {
    return isLocked && distributionMode !== mode;
  };

  const isActiveMode = (mode: Exclude<DistributionMode, null>) =>
    distributionMode === mode;
  // Anzeige im Feldtyp-Feld:
  // – Basislabel aus fieldTypes
  // – bei Regex zusätzlich erstes Muster / bei Listen erster Wert
  const typeLabelBase = getLabelForType(row.type);
  const firstCustom =
    row.customValues && row.customValues.length > 0
      ? String(row.customValues[0])
      : "";
  const typeExtra =
    firstCustom && row.type === "regex"
      ? ` – ${firstCustom}`
      : firstCustom && row.type !== "regex"
      ? ` (${firstCustom})`
      : "";
  const typeDisplay = typeLabelBase + typeExtra;

  // Name-Felder (für 🌐-Icon)
  const isNameField = ["firstname", "lastname", "fullname"].includes(row.type);

  // Feldtypen, bei denen die Werteliste editierbar ist (Stift in der Tabellenzeile)
  const editableFieldTypes = useMemo(
    () => [
      "containerTyp",
      "attributeSize",
      "attributeStatus",
      "attributeDirection",
      "service_route",
      "enum",
      "list",
      "regex",
    ],
    []
  );
  const isEditableFieldType = (t: string | undefined) =>
    !!t && editableFieldTypes.includes(t);

  return (
    <div className="row mb-2 align-items-center">
      {/* Drag Handle */}
      <div
        className="col-auto d-flex align-items-center px-0"
        {...(dragHandleProps || {})}
        style={{
          cursor: "grab",
          userSelect: "none",
          padding: "6px 8px",
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

      {/* Feldtyp (nur lesen, öffnet UseCase-Modal) */}
      <div className="col-2" style={{ position: "relative" }}>
        <input
          className="form-control"
          value={typeDisplay}
          readOnly
          onClick={() => setShowUseCaseModal(true)}
          style={{
            cursor: "pointer",
            backgroundColor: "White",
            color: row.type ? "black" : "#00070eff",
          }}
          placeholder="Feldtyp wählen"
        />

        {isNameField && (
  <span
    onClick={() => setShowNameSourceModal(true)}
    style={{
      position: "absolute",
      right: 20,
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: 18,
      cursor: "pointer",
      color: "rgb(115, 67, 131)",          // dezentes Grau
      opacity: 0.65,
      userSelect: "none",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.65")}
    title="Namensquelle auswählen"
  >
    🌍
  </span>
)}

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
            <div className="d-flex justify-content-between align-items-center px-2 py-1 border-bottom">
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

      {/* Visual divider between definition and distribution */}
      <div
        className="col-auto d-flex align-items-center"
        style={{
          padding: "0 12px",
        }}
      >
        <div
          style={{
            width: 1,
            height: 42,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
            borderRadius: 1,
          }}
        />
      </div>

      {/* Verteilung & Aktionen */}
      <div className="col-4 d-flex align-items-center">
        <button
          className="btn me-3"
      {/* Verteilung & Löschen */}
      <div className="col-3 d-flex align-items-center">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 14px",
            borderRadius: 18,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
            transition:
              "background 160ms ease, box-shadow 160ms ease, transform 120ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "inset 0 0 0 1px rgba(255,255,255,0.14), 0 8px 22px rgba(0,0,0,0.22)";
            (e.currentTarget as HTMLDivElement).style.transform =
              "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "inset 0 0 0 1px rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLDivElement).style.transform =
              "translateY(0)";
          }}
        >
          <button
            className="btn me-3"
            style={{
              backgroundColor: isActiveMode("standard")
                ? "rgb(135, 87, 155)"
                : "rgb(115, 67, 131)",
              color: "white",
              minWidth: "160px",
              boxShadow: isActiveMode("standard")
                ? "0 0 0 2px rgba(190,140,255,0.45)"
                : undefined,
            }}
            onClick={() => {
              setDistributionMode("standard");
              onOpenModal(idx);
            }}
            title={
              isDisabledByMode("standard")
                ? "Verteilung bereits festgelegt – zuerst zurücksetzen"
                : "Verteilung und Parameter konfigurieren"
            }
            disabled={isDisabledByMode("standard")}
          >
            Standard-Verteilung
          </button>
          <button
            className="btn me-3"
            style={{
              backgroundColor: isActiveMode("upload")
                ? "rgb(135, 87, 155)"
                : "rgb(115, 67, 131)",
              color: "white",
              minWidth: "160px",
              boxShadow: isActiveMode("upload")
                ? "0 0 0 2px rgba(190,140,255,0.45)"
                : undefined,
            }}
            onClick={() => {
              setDistributionMode("upload");
              onOpenUploadModal(idx);
            }}
            disabled={isDisabledByMode("upload")}
            title={
              isDisabledByMode("upload")
                ? "Verteilung bereits festgelegt – zuerst zurücksetzen"
                : "Verteilung aus Daten berechnen"
            }
          >
            Verteilung berechnen
          </button>
          <button
            className="btn me-3"
            style={{
              backgroundColor: isActiveMode("custom")
                ? "rgb(135, 87, 155)"
                : "rgb(115, 67, 131)",
              color: "white",
              minWidth: "160px",
              boxShadow: isActiveMode("custom")
                ? "0 0 0 2px rgba(190,140,255,0.45)"
                : undefined,
            }}
            onClick={() => {
              setDistributionMode("custom");
              onCustomDraw(idx);
            }}
            disabled={isDisabledByMode("custom")}
            title={
              isDisabledByMode("custom")
                ? "Verteilung bereits festgelegt – zuerst zurücksetzen"
                : "Eigene Verteilung manuell definieren"
            }
          >
            Eigene Verteilung zeichnen
          </button>

          <button
            className="btn"
            onClick={() => {
              setDistributionMode("dependency");
              onOpenDependencyModal && onOpenDependencyModal(idx);
            }}
            disabled={!row.dependency || isDisabledByMode("dependency")}
            title={
              !row.dependency
                ? "Zuerst Abhängigkeit wählen"
                : isDisabledByMode("dependency")
                ? "Verteilung bereits festgelegt – zuerst zurücksetzen"
                : "Abhängigkeits-Verteilung festlegen"
            }
            style={{
              backgroundColor: isActiveMode("dependency")
                ? "rgb(135, 87, 155)"
                : row.dependency
                ? "rgb(115,67,131)"
                : "rgba(255,255,255,0.12)",
              color: "white",
              boxShadow: isActiveMode("dependency")
                ? "0 0 0 2px rgba(190,140,255,0.45)"
                : undefined,
            }}
          >
            Abhängigkeits-Verteilung
          </button>

          {isLocked && (
            <button
              type="button"
              className="btn btn-sm ms-2"
              onClick={clearDistributionMode}
              onMouseEnter={() => setResetHover(true)}
              onMouseLeave={() => {
                setResetHover(false);
                setResetActive(false);
              }}
              onMouseDown={() => setResetActive(true)}
              onMouseUp={() => setResetActive(false)}
              title="Auswahl zurücksetzen (alle Verteilungs-Buttons wieder aktivieren)"
              style={{
                backgroundColor: resetActive
                  ? "rgba(255,255,255,0.16)"
                  : resetHover
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(255,255,255,0.08)",
                border: resetActive
                  ? "1px solid rgba(255,255,255,0.30)"
                  : resetHover
                  ? "1px solid rgba(255,255,255,0.24)"
                  : "1px solid rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.94)",
                padding: "6px 10px",
                borderRadius: 12,
                lineHeight: 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                boxShadow: resetHover
                  ? "0 8px 18px rgba(0,0,0,0.18)"
                  : "0 6px 14px rgba(0,0,0,0.12)",
                transform: resetActive ? "translateY(1px)" : "translateY(0)",
                transition:
                  "background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 90ms ease",
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 14, opacity: 0.95 }}>
                ↺
              </span>
              Zurücksetzen
            </button>
          )}

          {/* Löschen-Button (direkt neben Verteilung) */}
          <button
            type="button"
            className="btn ms-3"
            aria-label="Delete"
            style={{
              padding: 0,
              background: "none",
              border: "none",
              marginLeft: 8,
              fontSize: "22px",
              cursor: "pointer",
            }}
            onClick={() => handleDeleteRow(idx)}
            title="Zeile löschen"
          >
            🗑️
          </button>
        </div>

          {/* weitere Action-Buttons (Upload, Draw, etc.) */}
      </div>

      {/* UseCaseModal */}
        {showUseCaseModal && (
        <UseCaseModal
          show={showUseCaseModal}
          onClose={() => setShowUseCaseModal(false)}
          onSelectField={(fieldType) => {
              onChange(idx, "type", fieldType);
              const defaults = getDefaultValuesForType(fieldType);
              if (defaults.length > 0 && !row.customValues) {
                onChange(idx, "valueSource", "default");
                onChange(idx, "customValues", defaults);
              }
              setShowUseCaseModal(false);
            }}
            onEditValues={(fieldType, newValues) => {
              if (onEditValuesFromUseCaseModal) {
              onEditValuesFromUseCaseModal(fieldType, newValues);
              }
            setShowUseCaseModal(false);
          }}
            currentRow={row}
        />
        )}

        {/* NameSourceModal (für 🌐) */}
        {showNameSourceModal && (
          <NameSourceModal
            show={showNameSourceModal}
            onClose={() => setShowNameSourceModal(false)}
            onSelect={(selection) => {
              // NameSourceSelection hat { source_type, country }
              onChange(idx, "nameSource", selection.source_type);
              if (selection.country) {
                onChange(idx, "nameCountry", selection.country);
              }
              setShowNameSourceModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};
