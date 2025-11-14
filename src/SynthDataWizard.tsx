import { useEffect } from "react";
import { useMemo, useState, useRef } from "react";
interface SynthDataWizardProps {
  profileId: string;
}
import axios from "axios";
import logo from "./assets/logo.png";
import { DistributionModal } from "./components/DistributionModal";
// import FieldRow from sortable wrapper statt direkter FieldRow
import { SortableFieldRow } from "./components/SortableFieldRow"; // <-- GEÄNDERT: Sortable wrapper import
import { FieldTableHeader } from "./components/FieldTableHeader";
import { ExportOptions } from "./components/ExportOptions";
import { CustomDistributionCanvas } from "./components/CustomDistributionCanvas";

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




// -------------------- Typen & Helpers --------------------

export type Row = {
  id: string; // <-- NEU: eindeutige id für Drag & Drop
  name: string;
  type: "String" | "Double" | "Date" | "Integer";
  dependency: string;
  distributionConfig: {
    distribution: string;
    parameterA: string;
    parameterB: string;
    extraParams: string[];
    dependency: string;
  };
};

const makeDefaultRow = (): Row => ({
  id: `${Date.now()}-${Math.random()}`, // <-- NEU: einfache eindeutige id
  name: "",
  type: "String",
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

export const SynthDataWizard: React.FC<SynthDataWizardProps> = ({ profileId }) => {
  const [rows, setRows] = useState<Row[]>([
    makeDefaultRow(),
    makeDefaultRow(),
    makeDefaultRow(),
  ]);
  console.log("Aktives Profil:", profileId);

  // States
  const [rowCount, setRowCount] = useState<number>(10);
  const [format, setFormat] = useState<string>("CSV");
  const [lineEnding, setLineEnding] = useState<string>("Windows(CRLF)");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);
  // State for custom draw modal
  const [showCustomDraw, setShowCustomDraw] = useState<boolean>(false);
  const [activeFieldIndex, setActiveFieldIndex] = useState<number | null>(null);
  // Handler for opening custom draw modal
  const handleCustomDraw = (idx: number) => {
    setActiveFieldIndex(idx);
    setShowCustomDraw(true);
  };

  // Handler for saving from custom draw modal
  const handleCustomDrawSave = (data: any) => {
    // Log the data
    console.log("Custom distribution saved:", data);
    setShowCustomDraw(false);
    setActiveFieldIndex(null);
  };

  const sensors = useSensors(useSensor(PointerSensor));

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
        distributionConfig: { ...distributionData },
        dependency:
          distributionData?.dependency ?? next[activeRowIdx].dependency ?? "",
      };
      return next;
    });
    setShowModal(false);
    setActiveRowIdx(null);
  };

  const handleExport = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/export",
        { rows, rowCount, format, lineEnding },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "synthdata.csv";
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
    return Array.from(new Set(names)); // deduplizieren
  }, [rows]);

  // ===================== Profileinstellungen speichern & laden =====================

  // Beim Laden: vorhandene Einstellungen aus dem Backend holen
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/profiles/${profileId}/data`);
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

  // NEU: State für letzten Speicherzeitpunkt
  // Letzter Speicherzeitpunkt
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  // Ref für den letzten gespeicherten JSON-String
  const lastSavedDataRef = useRef<string>("");

  // Beim Ändern: automatisch speichern mit Debounce und Vergleich
  useEffect(() => {
    if (!profileId) return;

    const currentData = JSON.stringify({ rows, rowCount, format, lineEnding });
    if (currentData === lastSavedDataRef.current) {
      // Keine Änderung seit letztem Speichern
      return;
    }

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
        console.log(" Profil-Daten gespeichert");
      } catch (err) {
        console.error("Fehler beim Speichern der Profildaten:", err);
      }
    }, 1000); // speichert nach 1 Sekunde Inaktivität

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
      {/* Kopf */}
      <div className="d-flex align-items-center">
        <img src={logo} alt="SynthData Wizard Logo" height={110} />
        <h3 className="ms-3">
          SynthData
          <br />
          <span style={{ color: "rgb(229, 67, 244)" }}>Wizard</span>
        </h3>
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
              id={row.id} // wichtig für dnd-kit
              row={row}
              idx={idx}
              onChange={handleRowChange}
              onOpenModal={() => handleOpenModal(idx)}
              handleDeleteRow={handleDeleteRow}
              allFieldNames={allFieldNames}
              onCustomDraw={() => handleCustomDraw(idx)}
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
      </div>
      {/* Anzeige des letzten Speicherzeitpunkts */}
      <div className="mt-2" style={{ color: "#ccc", fontSize: "0.9em" }}>
        {lastSaved ? `Zuletzt gespeichert: ${lastSaved.toLocaleTimeString()}` : "Noch nicht gespeichert"}
      </div>
      {/* Custom Distribution Modal */}
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
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)"
            }}
          >
            <CustomDistributionCanvas
              onSave={handleCustomDrawSave}
              // Weitere relevante Props je nach Bedarf
            />
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