import { useState } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import { DistributionModal } from "./components/DistributionModal";
import { SortableFieldRow } from "./components/SortableFieldRow";
import { FieldTableHeader } from "./components/FieldTableHeader";
import { ExportOptions } from "./components/ExportOptions";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// Standardstruktur für eine Zeile im Datensatz
const defaultRow = {
  name: "",
  type: "String",
  dependency: "",
  distributionConfig: {
    distribution: "",
    parameterA: "",
    parameterB: "",
    extraParams: [],
  },
};

const defaultSheet = {
  name: "Sheet1",
  rows: [defaultRow, defaultRow, defaultRow],
};

// Hauptkomponente für den SynthData Wizard
export const SynthDataWizard = () => {
  // NEU: State für mehrere Tabellenblätter
  const [sheets, setSheets] = useState([defaultSheet]);
  const [rowCount, setRowCount] = useState(10);
  const [format, setFormat] = useState("CSV");
  const [lineEnding, setLineEnding] = useState("Windows(CRLF)");
  const [showModal, setShowModal] = useState(false);
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);

  // NEU: Zeile zu einem bestimmten Tabellenblatt hinzufügen
  const handleAddRow = (sheetIdx: number) => {
    const newSheets = [...sheets];
    newSheets[sheetIdx].rows.push({ ...defaultRow });
    setSheets(newSheets);
  };

  // NEU: Tabellenblatt hinzufügen
  const handleAddSheet = () => {
    setSheets([
      ...sheets,
      {
        name: `Sheet${sheets.length + 1}`,
        rows: [defaultRow],
      },
    ]);
  };

  // Aktualisiert ein Feld in einer bestimmten Zeile
  const handleRowChange = (idx: number, field: string, value: any) => {
    const newRows = [...rows];
    newRows[idx] = { ...newRows[idx], [field]: value };
    setRows(newRows);
  };

  // Löscht eine Zeile aus der Tabelle
  const handleDeleteRow = (idx: number) => {
    setRows((rows) => rows.filter((_, i) => i !== idx));
  };

  // Öffnet das Modal zur Verteilungsspezifikation für eine bestimmte Zeile
  const handleOpenModal = (idx: number) => {
    setActiveRowIdx(idx);
    setShowModal(true);
  };

  // Schließt das Modal, ohne Änderungen zu speichern
  const handleCloseModal = () => {
    if (activeRowIdx === null) return;
    const newRows = [...rows];
    newRows[activeRowIdx] = {
      ...newRows[activeRowIdx],
    };
    setRows(newRows);
    setShowModal(false);
    setActiveRowIdx(null);
  };

  // Speichert die im Modal eingegebenen Verteilungsdaten in der aktiven Zeile
  const handleSaveDistribution = (distributionData: any) => {
    if (activeRowIdx === null) return;
    const newRows = [...rows];
    newRows[activeRowIdx] = {
      ...newRows[activeRowIdx],
      distributionConfig: distributionData,
    };
    setRows(newRows);
    setShowModal(false);
    setActiveRowIdx(null);
  };

  // NEU: Export sendet jetzt alle Sheets ans Backend
  const handleExport = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/export",
        {
          sheets, // <-- mehrere Tabellenblätter
          rowCount,
          format,
          lineEnding,
        },
        {
          responseType: "blob",
        }
      );

      // Erstellt die Datei und startet den Download
      const blob = new Blob([response.data], {
        type:
          format === "XLSX"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = format === "XLSX" ? "synthdata.xlsx" : "synthdata.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Fehler beim Export:", error);
      alert("Fehler beim Exportieren");
    }
  };

  // Initialisiert die Drag-and-Drop-Sensoren für die Zeilen
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Render der Hauptoberfläche
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      // Handler für das Verschieben von Zeilen per Drag-and-Drop
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) {
          const oldIndex = active.id;
          const newIndex = over.id;
          const newRows = arrayMove(rows, Number(oldIndex), Number(newIndex));
          setRows(newRows);
        }
      }}
    >
      <div
        className="px-5 py-5 text-white"
        style={{
          overflowX: "auto",
          overflowY: "auto",
          background: "rgb(31, 53, 88)",
          minHeight: "100vh",
        }}
      >
        {/* Kopfbereich mit Logo und Titel */}
        <div className="d-flex align-items-center">
          <img src={logo} alt="SynthData Wizard Logo" height={110} />
          <h3 className="">
            SynthData
            <br /> <span style={{ color: "rgb(229, 67, 244)" }}>Wizard</span>
          </h3>
        </div>

        {/* Tabellenkopf */}
        <FieldTableHeader />

        {/* NEU: Zeige alle Sheets und deren Rows... */}
        {sheets.map((sheet, sheetIdx) => (
          <div key={sheetIdx}>
            <h4>{sheet.name}</h4>
            {/* Sortierbare Zeilen mit Drag-and-Drop */}
            <SortableContext
              items={sheet.rows.map((_, idx) => idx)}
              strategy={verticalListSortingStrategy}
            >
              {sheet.rows.map((row, idx) => (
                <SortableFieldRow
                  key={idx}
                  id={idx}
                  row={row}
                  idx={idx}
                  onChange={handleRowChange}
                  onOpenModal={() => handleOpenModal(idx)}
                  handleDeleteRow={handleDeleteRow}
                />
              ))}
            </SortableContext>

            {/* Button zum Hinzufügen einer neuen Zeile */}
            <div className="mb-4 px-3">
              <button
                className="btn btn-outline-light"
                onClick={() => handleAddRow(sheetIdx)}
              >
                + Neue Reihe in {sheet.name}
              </button>
            </div>
          </div>
        ))}

        {/* Modal zur Verteilungsspezifikation */}
        <DistributionModal
          show={showModal}
          onClose={handleCloseModal}
          onSave={handleSaveDistribution}
          initialData={
            activeRowIdx !== null
              ? rows[activeRowIdx].distributionConfig
              : undefined
          }
          fieldType={activeRowIdx !== null ? rows[activeRowIdx].type : ""}
        />

        {/* NEU: Button zum Hinzufügen eines neuen Tabellenblatts */}
        <div className="mb-4 px-3">
          <button className="btn btn-outline-light" onClick={handleAddSheet}>
            + Neues Tabellenblatt
          </button>
        </div>

        {/* Export-Optionen für das Datenformat */}
        <ExportOptions
          rowCount={rowCount}
          setRowCount={setRowCount}
          format={format}
          setFormat={setFormat}
          lineEnding={lineEnding}
          setLineEnding={setLineEnding}
        />

        {/* Exportieren-Button am Seitenende */}
        <div
          className="flex-nowrap"
          style={{ overflowX: "auto", minWidth: 1200 }}
        >
          <button
            className="btn btn-lg px-4"
            style={{ backgroundColor: "rgb(115, 67, 131)", color: "white" }}
            onClick={handleExport}
          >
            Exportieren
          </button>
        </div>
      </div>
    </DndContext>
  );
};
