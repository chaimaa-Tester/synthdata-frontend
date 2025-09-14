import { useMemo, useState } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import { DistributionModal } from "./components/DistributionModal";
import { FieldRow } from "./components/FieldRow"; // ÄNDERUNG: FieldRow statt SortableFieldRow
import { FieldTableHeader } from "./components/FieldTableHeader";
import { ExportOptions } from "./components/ExportOptions";

// -------------------- Typen & Helpers --------------------

export type Row = {
  name: string;
  type: "String" | "Double" | "Date" | "Integer";
  dependency: string;
  distributionConfig: { // Klammern korrigiert
    distribution: string;
    parameterA: string; // parameterA nicht parameters
    parameterB: string; // parameterB nicht parameters  
    extraParams: string[]; // extraParams nicht extraterrans
    dependency: string;
  };
};

const makeDefaultRow = (): Row => ({
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

      {/* WICHTIGE ÄNDERUNG: FieldRow statt SortableFieldRow */}
      {rows.map((row, idx) => (
        <FieldRow
          key={idx}
          row={row}
          idx={idx}
          onChange={handleRowChange}
          onOpenModal={() => handleOpenModal(idx)}
          handleDeleteRow={handleDeleteRow}
          allFieldNames={allFieldNames} // Hier werden die Feldnamen übergeben
        />
      ))}

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
    </div>
  );
};