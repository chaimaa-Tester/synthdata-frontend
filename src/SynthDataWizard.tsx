import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import logo from "./assets/logo.png";

import { DistributionModal } from "./components/DistributionModal";
import { FileUploadModal } from "./components/FileUploadModal";
import { SortableFieldRow } from "./components/SortableFieldRow";
import { FieldTableHeader } from "./components/FieldTableHeader";
import { ExportOptions } from "./components/ExportOptions";
import {
  useCases,
  FieldType,
  getDefaultValuesForType,
  getLabelForType,
} from "./types/fieldTypes";
import { ValueListModal } from "./components/ValueListModal";
import { CustomDistributionCanvas } from "./components/CustomDistributionCanvas";
import { DependencyDistributionModal } from "./components/DependencyDistributionModal";
import { SheetManager } from "./types/SheetManager";
import type { ExportSheet } from "./types/SheetManager";

// dnd-kit
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

// -------------------- Typen & Helpers --------------------

// Use Cases werden jetzt im UseCaseModal verwaltet

interface SynthDataWizardProps {
  profileId: string;
}

export type ValueSource = "default" | "custom";

export type Row = {
  id: string;
  name: string;
  type: FieldType;
  dependency: string;

  distributionConfig: {
    distribution: string;
    parameterA: string;
    parameterB: string;
    extraParams?: string[];
    dependency?: string;
    name_source?: "western" | "regional";
    country?: string;
  };

  valueSource?: ValueSource;
  customValues?: string[];
};

const makeDefaultRow = (): Row => ({
  id: `${Date.now()}-${Math.random()}`,
  name: "",
  type: "" as FieldType,
  dependency: "",
  distributionConfig: {
    distribution: "",
    parameterA: "",
    parameterB: "",
    extraParams: [],
    dependency: "",
  },
  valueSource: "default",
  customValues: [],
});

export const SynthDataWizard: React.FC<SynthDataWizardProps> = ({
  profileId,
}) => {
  const [rows, setRows] = useState<Row[]>([
    makeDefaultRow(),
    makeDefaultRow(),
    makeDefaultRow(),
  ]);
  console.log("Aktives Profil:", profileId);

  const [rowCount, setRowCount] = useState<number>(10);
  const [format, setFormat] = useState<string>("CSV");
  const [lineEnding, setLineEnding] = useState<string>("Windows(CRLF)");

  const [showModal, setShowModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);

  const [showValueListModal, setShowValueListModal] = useState(false);
  const [valueListRowIdx, setValueListRowIdx] = useState<number | null>(null);

  const [showCustomDraw, setShowCustomDraw] = useState<boolean>(false);
  const [activeFieldIndex, setActiveFieldIndex] = useState<number | null>(null);

  // XLSX Sheets
  const [sheets, setSheets] = useState<ExportSheet[]>(() => [
    {
      id: "data",
      name: "Daten",
      fieldNames: [],
      locked: true,
    },
  ]);

  const handleCustomDraw = (idx: number) => {
    setActiveFieldIndex(idx);
    setShowCustomDraw(true);
  };

  const handleCustomDrawSave = (data: any) => {
    console.log("Custom distribution saved:", data);
    setShowCustomDraw(false);
    setActiveFieldIndex(null);
  };

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

  const handleAddRow = () => setRows((prev) => [...prev, makeDefaultRow()]);

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

  const openUploadModal = (idx: number) => {
    setActiveRowIdx(idx);
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
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
          name_source:
            distributionData.name_source ||
            next[activeRowIdx].distributionConfig?.name_source,
          country:
            distributionData.country ||
            next[activeRowIdx].distributionConfig?.country,
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

  const handleOpenValueListModal = (rowIdx: number) => {
    setValueListRowIdx(rowIdx);
    setShowValueListModal(true);
  };

  const handleCloseValueListModal = () => {
    setShowValueListModal(false);
    setValueListRowIdx(null);
  };

  const handleSaveValueList = (
    valueSource: "default" | "custom",
    customValues: string[]
  ) => {
    if (valueListRowIdx === null) return;
    setRows((prev) => {
      const next = [...prev];
      next[valueListRowIdx] = {
        ...next[valueListRowIdx],
        valueSource,
        customValues,
      };
      return next;
    });
    setShowValueListModal(false);
    setValueListRowIdx(null);
  };

  const handleEditValuesFromUseCaseModal = (rowIdx: number, fieldType: FieldType, newValues: string[]) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIdx] = {
        ...next[rowIdx],
        type: fieldType,
        valueSource: newValues.length ? "custom" : "default",
        customValues: newValues,
      };
      return next;
    });
  };

  const handleCloseDepModal = () => {
    setShowDepModal(false);
    setDepModalRowIdx(null);
    setDepTargetName("");
    setDepTargetType("");
  };

  const handleSaveDependencyDistribution = (distConfig: any) => {
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

        if (depModalRowIdx !== null && next[depModalRowIdx]) {
          next[depModalRowIdx] = {
            ...next[depModalRowIdx],
            dependency: depTargetName,
          };
        }
      } else if (depModalRowIdx !== null) {
        next[depModalRowIdx] = {
          ...next[depModalRowIdx],
          distributionConfig: {
            ...next[depModalRowIdx].distributionConfig,
            ...distConfig,
          },
          dependency: depTargetName || next[depModalRowIdx].dependency,
        };
      }

      return next;
    });

    handleCloseDepModal();
  };

  // Diese Funktion mappt einen FELDTYP (type) auf die passende UseCase-ID.
  // WICHTIG: Hier wird ausschliesslich 'type' (nicht 'name') verwendet, um zu entscheiden,
  // welche UseCase(s) für den Export relevant sind.
  const getUseCaseIdForFieldType = (fieldType: FieldType): string | null => {
    for (const uc of useCases) {
      if (
        uc.fields &&
        uc.fields.some((field: any) => field.value === fieldType)
      ) {
        return uc.id;
      }
      if (uc.fieldGroups) {
        for (const g of uc.fieldGroups) {
          if (g.fields.some((field: any) => field.value === fieldType)) {
            return uc.id;
          }
        }
      }
    }
    return null;
  };

  const handleExport = async () => {
    try {
      // Hinzufügen der Use Case ID zum Export-Objekt
      // Hier werden ALLE Feldtypen gesammelt und dann auf UseCase-IDs gemappt.
      // Das bedeutet: selbst wenn der Benutzer dem Feld einen beliebigen Namen gegeben hat,
      // entscheidet der FELDTYP (rows[].type) welche UseCases gebraucht werden.
      const allFieldTypes = rows.map(row => row.type)

      // Filtern der eindeutigen Use Case IDs, die tatsächlich verwendet werden
      const usedUseCaseIds = Array.from(new Set(
        allFieldTypes
          .map(getUseCaseIdForFieldType)
          .filter(Boolean) as string[]
      ))
      
      const exportData = {
        rows: rows.map(r => ({
          id: r.id,
          name: r.name,
          type: r.type,
          dependency: r.dependency,
          distributionConfig: r.distributionConfig,
          valueSource: r.valueSource ?? "default",
          customValues: r.customValues ?? []
        })),
        rowCount,
        format,
        lineEnding,
        usedUseCaseIds,
        sheets: format.toUpperCase() === "XLSX" ? sheets : undefined,
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

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      link.download = `synthdata_${timestamp}.` + exportData.format.toLowerCase();

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Fehler beim Export:", error);
      alert("Fehler beim Exportieren");
    }
  };

  const allFieldNames = useMemo(() => {
    const names = rows
      .map((r) => (r.name || "").trim())
      .filter((n) => n.length > 0);
    return Array.from(new Set(names));
  }, [rows]);

  // Profile laden
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/profiles/${profileId}/data`
        );
        if (res.data?.data) {
          const d = res.data.data;
          if (d.rows) setRows(d.rows);
          if (d.rowCount) setRowCount(d.rowCount);
          if (d.format) setFormat(d.format);
          if (d.lineEnding) setLineEnding(d.lineEnding);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Profildaten:", err);
      }
    };
    if (profileId) fetchProfileData();
  }, [profileId]);

  // Auto-Speichern
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const lastSavedDataRef = useRef<string>("");

  useEffect(() => {
    if (!profileId) return;

    const currentData = JSON.stringify({ rows, rowCount, format, lineEnding });
    if (currentData === lastSavedDataRef.current) return;

    const timeout = setTimeout(async () => {
      try {
        await axios.post(`http://localhost:8000/profiles/${profileId}/data`, {
          rows,
          rowCount,
          format,
          lineEnding,
        });
        lastSavedDataRef.current = currentData;
        setLastSaved(new Date());
        console.log("Profil-Daten gespeichert");
      } catch (err) {
        console.error("Fehler beim Speichern der Profildaten:", err);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [rows, rowCount, format, lineEnding, profileId]);

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
      <div className="d-flex align-items-center mb-4">
        <img src={logo} alt="SynthData Wizard Logo" height={110} />
        <div>
          <h3 className="ms-3">
            SynthData
            <br />
            <span style={{ color: "rgb(229, 67, 244)" }}>Wizard</span>
          </h3>
        </div>
      </div>

      <FieldTableHeader />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={rows.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
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
              onCustomDraw={() => handleCustomDraw(idx)}
              onOpenUploadModal={() => openUploadModal(idx)}
              onOpenValueEditor={handleOpenValueListModal}
              onEditValuesFromUseCaseModal={(fieldType, newValues) =>
                handleEditValuesFromUseCaseModal(idx, fieldType, newValues)}
            />
          ))}
        </SortableContext>
      </DndContext>

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
          initialData={(() => {
            const t = rows.find((r) => r.name === depTargetName);
            return t ? t.distributionConfig : undefined;
          })()}
        />
      )}

      {activeRowIdx !== null && (
        <FileUploadModal
          show={showUploadModal}
          onClose={closeUploadModal}
          onSave={handleSaveDistribution}
          initialData={rows[activeRowIdx].distributionConfig}
          fieldType={rows[activeRowIdx].type}
        />
      )}

      {showValueListModal && valueListRowIdx !== null && (
        <ValueListModal
          show={showValueListModal}
          onClose={handleCloseValueListModal}
          fieldLabel={
            rows[valueListRowIdx].name ||
            getLabelForType(rows[valueListRowIdx].type)
          }
          defaultValues={getDefaultValuesForType(rows[valueListRowIdx].type)}
          valueSource={rows[valueListRowIdx].valueSource ?? "default"}
          customValues={rows[valueListRowIdx].customValues ?? []}
          onSave={handleSaveValueList}
        />
      )}

      <div className="mb-4 px-3">
        <button className="btn btn-outline-light" onClick={handleAddRow}>
          + Neue Reihe
        </button>
      </div>

      <ExportOptions
        rowCount={rowCount}
        setRowCount={setRowCount}
        format={format}
        setFormat={setFormat}
        lineEnding={lineEnding}
        setLineEnding={setLineEnding}
      />

      {format.toUpperCase() === "XLSX" && (
        <div className="my-3">
          <SheetManager
            sheets={sheets}
            setSheets={setSheets}
            availableFieldNames={allFieldNames}
            title="Sheets konfigurieren"
          />
        </div>
      )}

      <div className="flex-nowrap" style={{ overflowX: "auto", minWidth: 1200 }}>
        <button
          className="btn btn-lg px-4"
          style={{ backgroundColor: "rgb(115, 67, 131)", color: "white" }}
          onClick={handleExport}
        >
          Exportieren
        </button>
      </div>

      <div className="mt-2" style={{ color: "#ccc", fontSize: "0.9em" }}>
        {lastSaved
          ? `Zuletzt gespeichert: ${lastSaved.toLocaleTimeString()}`
          : "Noch nicht gespeichert"}
      </div>

      {showCustomDraw && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#22304f",
              padding: "32px 24px",
              borderRadius: "16px",
              minWidth: 350,
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            }}
          >
            <CustomDistributionCanvas onSave={handleCustomDrawSave} />
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button
                className="btn btn-outline-light"
                onClick={() => {
                  setShowCustomDraw(false);
                  setActiveFieldIndex(null);
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
