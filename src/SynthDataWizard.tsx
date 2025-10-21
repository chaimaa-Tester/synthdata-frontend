import { useMemo, useState } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import { DistributionModal } from "./components/DistributionModal";
import { SortableFieldRow } from "./components/SortableFieldRow";
import { FieldTableHeader } from "./components/FieldTableHeader";
import { ExportOptions } from "./components/ExportOptions";

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

// NEU: Nationalitätstyp definieren
type Nationality = 'german' | 'english' | 'french' | 'spanish' | 'turkish' | 'russian' | 'chinese' | 'japanese' | 'italian';

// NEU: Erweiterte Feldtypen für mimesis
type FieldType = "name" | "vorname" | "nachname" | "vollständigername" | "körpergröße" | "gewicht" | "Date" | "Integer" | "alter" | "geschlecht" | "adresse" | "straße" | "stadt" | "land" | "email" | "telefon" | "plz" | "hausnummer";

export type Row = {
  id: string;
  name: string;
  type: FieldType; // ✅ NEU: Erweiterte Feldtypen
  dependency: string;
  nationality: Nationality; // ✅ NEU: Nationalität hinzugefügt
  distributionConfig: {
    distribution: string;
    parameterA: string;
    parameterB: string;
    extraParams: string[];
    dependency: string;
    nationality?: Nationality; // ✅ Optional für Abwärtskompatibilität
  };
};

// ✅ NEU: Nationalitätsoptionen für Dropdown
const nationalityOptions: { value: Nationality; label: string; flag: string }[] = [
  { value: 'german', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'english', label: 'Englisch', flag: '🇺🇸' },
  { value: 'french', label: 'Französisch', flag: '🇫🇷' },
  { value: 'spanish', label: 'Spanisch', flag: '🇪🇸' },
  { value: 'turkish', label: 'Türkisch', flag: '🇹🇷' },
  { value: 'russian', label: 'Russisch', flag: '🇷🇺' },
  { value: 'chinese', label: 'Chinesisch', flag: '🇨🇳' },
  { value: 'japanese', label: 'Japanisch', flag: '🇯🇵' },
  { value: 'italian', label: 'Italienisch', flag: '🇮🇹' }
];

const makeDefaultRow = (): Row => ({
  id: `${Date.now()}-${Math.random()}`,
  name: "",
  type: "name",
  dependency: "",
  nationality: "german", // ✅ NEU: Default auf Deutsch
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

  // ✅ NEU: Nationalität ändern
  const handleNationalityChange = (idx: number, nationality: Nationality) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { 
        ...next[idx], 
        nationality 
      };
      return next;
    });
  };

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
          nationality: next[activeRowIdx].nationality // ✅ Nationalität mit speichern
        },
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
      // NEU: Nationalität an Backend senden
      const exportData = {
        rows: rows.map(row => ({
          ...row,
          nationality: row.nationality // Sicherstellen dass Nationalität mitgesendet wird
        })),
        rowCount,
        format,
        lineEnding
      };

      const response = await axios.post(
        "http://localhost:8000/api/export",
        exportData,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // NEU: Dateiname mit Timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `synthdata_${timestamp}.csv`;
      
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

  // ✅ NEU: Feldtyp-Optionen für mimesis
  const fieldTypeOptions: { value: FieldType; label: string }[] = [
    { value: "name", label: "Vollständiger Name" },
    { value: "vorname", label: "Vorname" },
    { value: "nachname", label: "Nachname" },
    { value: "vollständigername", label: "Vollständiger Name" },
    { value: "geschlecht", label: "Geschlecht" },
    { value: "alter", label: "Alter" },
    { value: "körpergröße", label: "Körpergröße" },
    { value: "gewicht", label: "Gewicht" },
    { value: "adresse", label: "Adresse" },
    { value: "straße", label: "Straße" },
    { value: "stadt", label: "Stadt" },
    { value: "land", label: "Land" },
    { value: "plz", label: "PLZ" },
    { value: "hausnummer", label: "Hausnummer" },
    { value: "email", label: "E-Mail" },
    { value: "telefon", label: "Telefon" },
    { value: "Date", label: "Datum" },
    { value: "Integer", label: "Ganzzahl" }
  ];

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
              handleDeleteRow={handleDeleteRow}
              allFieldNames={allFieldNames}
              onNationalityChange={(nationality) => handleNationalityChange(idx, nationality)} // ✅ NEU
              fieldTypeOptions={fieldTypeOptions} // ✅ NEU
              nationalityOptions={nationalityOptions} // ✅ NEU
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
          nationality={rows[activeRowIdx].nationality} // ✅ NEU: Nationalität an Modal übergeben
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