import { useMemo, useState } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import { DistributionModal } from "./components/DistributionModal";
import { SortableFieldRow } from "./components/SortableFieldRow";
import { FieldTableHeader } from "./components/FieldTableHeader";
import { ExportOptions } from "./components/ExportOptions";
import { useCases } from "./components/UseCaseModal"
// NEU: dnd-kit imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { DependencyDistributionModal } from "./components/DependencyDistributionModal";

// -------------------- Typen & Helpers --------------------

// NEU: Use Case basierte Feldtypen 
type FieldType = 
  // Basis-Felder (verwendet in mehreren Use Cases)
  | "name" | "vorname" | "nachname" | "geschlecht" | "alter" | "email" | "telefon" | "Date" | "Integer" 
  
  // Gesundheitswesen Use Case

  | "körpergröße" | "gewicht" | "Body-Mass-Index" | "gewichtdiagnose" 

  // Finanzwesen Use Case


  | "kontonummer" | "transaktionsdatum" | "transaktionsart" | "betrag"

  // Containerlogistik Use Case

  | "unitName" | "timeIn" | "timeOut" | "attributeSizes" | "attributeStatus"
  
  | "attributeWeights" | "attributeDirections" | "inboundCarrierId" 
  
  | "outboundCarrierId" | "serviceId" | "linerId";

// Use Cases werden jetzt im UseCaseModal verwaltet

export type Row = {
  id: string;
  name: string;
  type: FieldType; //  NEU: Erweiterte Feldtypen
  dependency: string;
  distributionConfig: {
    distribution: string;
    parameterA: string;
    parameterB: string;
    extraParams?: string[];
    dependency?: string;
  };
};

const makeDefaultRow = (): Row => ({
  id: `${Date.now()}-${Math.random()}`,
  name: "",
  type: "name",
  dependency: "",
  distributionConfig: {
    distribution: "",
    parameterA: "",
    parameterB: "",
    extraParams: [],
    dependency: "",
  },
});

// -------------------- Komponente --------------------

export const SynthDataWizard = () => {
  const [rows, setRows] = useState<Row[]>([
    makeDefaultRow(),
    makeDefaultRow(),
    makeDefaultRow(),
  ]);

  const [rowCount, setRowCount] = useState<number>(10);
  const [format, setFormat] = useState<string>("CSV");
  const [lineEnding, setLineEnding] = useState<string>("Windows(CRLF)");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));
  const [showDepModal, setShowDepModal] = useState(false);
  const [depModalRowIdx, setDepModalRowIdx] = useState<number | null>(null);
  const [depTargetName, setDepTargetName] = useState<string>("");
  const [depTargetType, setDepTargetType] = useState<string>("");

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setRows((prev) => {
      const oldIndex = prev.findIndex((r) => r.id === active.id);
      const newIndex = prev.findIndex((r) => r.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleAddRow = () =>
    setRows((prev) => [...prev, makeDefaultRow()]);

  const handleRowChange = (idx: number, field: string, value: any) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value } as Row;
      return next;
    });
  };

  const handleDeleteRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleOpenModal = (idx: number) => {
    setActiveRowIdx(idx);
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setActiveRowIdx(null);
  };
  
  const handleSaveDistribution = (distributionData: any) => {
    if (activeRowIdx === null) return;
    setRows((prev) => {
      const next = [...prev];
      next[activeRowIdx] = {
        ...next[activeRowIdx],
        distributionConfig: { 
          ...distributionData,
        },
        dependency:
          distributionData?.dependency ?? next[activeRowIdx].dependency ?? "",
      };
      return next;
    });
    setShowModal(false);
    setActiveRowIdx(null);
  };

  const handleOpenDependencyModal = (rowIdx: number) => {
    const depRaw = (rows[rowIdx].dependency || "").split(",")[0]?.trim() || "";
    if (!depRaw) {
      alert("Bitte zuerst eine Abhängigkeit wählen.");
      return;
    }
    const targetIdx = rows.findIndex((r) => r.name === depRaw);
    const targetType = targetIdx !== -1 ? rows[targetIdx].type : "";
    setDepModalRowIdx(rowIdx);
    setDepTargetName(depRaw);
    setDepTargetType(targetType);
    setShowDepModal(true);
  };

  const handleCloseDepModal = () => {
    setShowDepModal(false);
    setDepModalRowIdx(null);
    setDepTargetName("");
    setDepTargetType("");
  };

  // NEU: Speichert die vom Modal definierte Verteilung auf das Target-Feld (so wird z.B. 'geschlecht' auf 80/20 gesetzt)
  const handleSaveDependencyDistribution = (distConfig: any) => {
    // distConfig: { distribution, parameterA, parameterB, ... }
    if (!depTargetName) {
      handleCloseDepModal();
      return;
    }
    setRows((prev) => {
      const next = [...prev];
      const targetIdx = next.findIndex((r) => r.name === depTargetName);
      if (targetIdx !== -1) {
        next[targetIdx] = {
          ...next[targetIdx],
          distributionConfig: {
            ...next[targetIdx].distributionConfig,
            ...distConfig,
          },
        };
        // Ensure that any row which requested this dependency actually records
        // the dependency at top-level (so export and backend get the correct
        // dependency column name). depModalRowIdx is the requesting row.
        if (depModalRowIdx !== null && next[depModalRowIdx]) {
          next[depModalRowIdx] = {
            ...next[depModalRowIdx],
            dependency: depTargetName,
          };
        }
      } else if (depModalRowIdx !== null) {
        // Fallback: wenn Target nicht gefunden, speichere beim anfragenden Row
        next[depModalRowIdx] = {
          ...next[depModalRowIdx],
          distributionConfig: {
            ...next[depModalRowIdx].distributionConfig,
            ...distConfig,
          },
          // Also ensure the dependency name is set explicitly when saving here
          dependency: depTargetName || next[depModalRowIdx].dependency,
        };
      }
      return next;
    });
    handleCloseDepModal();
  }; 

  // Validate that name-like fields have a proper dependency on a 'geschlecht' field
  const validateDependencies = (rowsToCheck: Row[]) => {
    const errors: string[] = [];
    const nameLike: FieldType[] = ["name", "vorname", "nachname"];
    for (const r of rowsToCheck) {
      if (nameLike.includes(r.type)) {
        const depRaw = (r.dependency || "").split(",")[0]?.trim() || "";
        if (!depRaw) {
          errors.push(`Feld '${r.name || "(kein Name)"}' vom Typ '${r.type}' hat keine Abhängigkeit definiert.`);
          continue;
        }
        const target = rowsToCheck.find((t) => t.name === depRaw);
        if (!target) {
          errors.push(`Feld '${r.name || "(kein Name)"}' hängt von '${depRaw}', dieses Feld existiert aber nicht.`);
          continue;
        }
        if (target.type !== "geschlecht") {
          errors.push(`Feld '${r.name || "(kein Name)"}' hängt von '${depRaw}', hat aber Typ '${target.type}' (erwartet 'geschlecht').`);
        }
      }
    }
    return errors;
  };

  const getUseCaseIdForFieldType = (fieldType: FieldType): string | null => {
    for (const uc of useCases) {
      if (uc.fields.some(field => field.value === fieldType)) {
        return uc.id;
      }
    }
    return null;
  }


  const handleExport = async () => {
    try {
      // Pre-export validation: ensure name-like fields depend on a 'geschlecht' field
      const depProblems = validateDependencies(rows);
      if (depProblems.length > 0) {
        alert("Bitte beheben Sie die folgenden Abhängigkeits-Probleme vor dem Export:\n\n" + depProblems.join("\n"));
        return;
      }

      // Hinzufügen der Use Case ID zum Export-Objekt
      const allFieldTypes = rows.map(row => row.type)

      // Filtern der eindeutigen Use Case IDs, die tatsächlich verwendet werden
      const usedUseCaseIds = Array.from(new Set(
        allFieldTypes
          .map(getUseCaseIdForFieldType)
          .filter(Boolean) as string[]
      ))
      
      const exportData = {
        rows: rows.map(row => ({
          ...row,
        })),
        rowCount,
        format,
        lineEnding,
        usedUseCaseIds
      };

      const response = await axios.post(
        "http://localhost:8000/api/export",
        exportData,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // NEU: Dateiname mit Timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `synthdata_${timestamp}.` + exportData.format.toLowerCase();
      
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Fehler beim Export:", error);
      alert("Fehler beim Exportieren");
    }
  };

  // Alle aktuell eingegebenen Feldnamen (ohne leere) → für das Dropdown
  const allFieldNames = useMemo(() => {
    const names = rows
      .map((r) => (r.name || "").trim())
      .filter((n) => n.length > 0);
    return Array.from(new Set(names));
  }, [rows]);

  return (
    <div
      className="px-5 py-5 text-white"
      style={{
        overflowX: "auto",
        overflowY: "auto",
        background: "rgb(31, 53, 88)",
        minHeight: "100vh",
      }}
    >
      {/* Kopf */}
      <div className="d-flex align-items-center mb-4">
        <img src={logo} alt="SynthData Wizard Logo" height={110} />
        <div>
          <h3 className="ms-3">
            SynthData
            <br />
            <span style={{ color: "rgb(229, 67, 244)" }}>Wizard</span>
          </h3>
          {/* Beschreibung entfernt auf Wunsch */}
        </div>
      </div>

      
      <FieldTableHeader />

      {/* NEU: DnD-Wrapper + SortableContext */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          {rows.map((row, idx) => (
            <SortableFieldRow
              key={row.id}
              id={row.id}
              row={row}
              idx={idx}
              onChange={handleRowChange}
              onOpenModal={() => handleOpenModal(idx)}
              onOpenDependencyModal={() => handleOpenDependencyModal(idx)}
              handleDeleteRow={handleDeleteRow}
              allFieldNames={allFieldNames}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Modal */}
      {activeRowIdx !== null && (
        <DistributionModal
          show={showModal}
          onClose={handleCloseModal}
          onSave={handleSaveDistribution}
          initialData={rows[activeRowIdx].distributionConfig}
          fieldType={rows[activeRowIdx].type}
          allFieldNames={allFieldNames}
        />
      )}

      {showDepModal && depModalRowIdx !== null && (
        <DependencyDistributionModal
          show={showDepModal}
          onClose={handleCloseDepModal}
          onSave={handleSaveDependencyDistribution}
          targetName={depTargetName}
          targetType={depTargetType}
          initialData={
            // falls Ziel-Feld existiert, übergebe dessen aktuelle config
            (() => {
              const t = rows.find((r) => r.name === depTargetName);
              return t ? t.distributionConfig : undefined;
            })()
          }
        />
      )}

      {/* Neue Reihe */}
      <div className="mb-4 px-3">
        <button className="btn btn-outline-light" onClick={handleAddRow}>
          + Neue Reihe
        </button>
      </div>

      {/* Export-Optionen */}
      <ExportOptions
        rowCount={rowCount}
        setRowCount={setRowCount}
        format={format}
        setFormat={setFormat}
        lineEnding={lineEnding}
        setLineEnding={setLineEnding}
      />

      {/* Export */}
      <div className="flex-nowrap" style={{ overflowX: "auto", minWidth: 1200 }}>
        <button
          className="btn btn-lg px-4"
          style={{ backgroundColor: "rgb(115, 67, 131)", color: "white" }}
          onClick={handleExport}
        >
          Exportieren
        </button>
        
        {/* Aktive Nationalitäten Anzeige entfernt auf Wunsch */}
      </div>
    </div>
  );
};