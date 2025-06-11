import { useState } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import { DistributionModal } from "./components/DistributionModal";
import { FieldRow } from "./components/FieldRow";
import { FieldTableHeader } from "./components/FieldTableHeader";
import { ExportOptions } from "./components/ExportOptions";

const defaultRow = {
  name: "",
  type: "",
  dependency: "",
  showInTable: false,
};

export const SynthDataWizard = () => {
  const [rows, setRows] = useState([
    defaultRow,
    defaultRow,
    defaultRow,
    defaultRow,
  ]);
  const [rowCount, setRowCount] = useState(1);
  const [format, setFormat] = useState("CSV");
  const [lineEnding, setLineEnding] = useState("Windows(CRLF)");
  const [showModal, setShowModal] = useState(false);

  const handleAddRow = () => setRows([...rows, defaultRow]);
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleRowChange = (idx: number, field: string, value: any) => {
    const newRows = [...rows];
    newRows[idx] = { ...newRows[idx], [field]: value };
    setRows(newRows);
  };

  const handleExport = async () => {
    try{
      await axios.post("http://localhost:8000/api/my-endpoint", {
      rows,
      rowCount,
      format,
      lineEnding,
      });
      alert("Export erfolgreich!");
    } catch (error) {
      alert("Fehler beim Exportieren");
    }    
  };

  return (
    <div
      className="px-5 py-5 text-white"
      style={{
        background:
          "linear-gradient(to bottom,rgb(111, 5, 138),rgb(14, 205, 135))",
        minHeight: "100vh",
      }}
    >
      <div className="d-flex align-items-center">
        <img
          src={logo}
          alt="SynthData Wizard Logo"
          height={110} /*setzt die Größe des Logos*/
        />
        <h3 className="">
          SynthData
          <br /> <span style={{ color: "rgb(229, 67, 244)" }}>Wizard</span>
        </h3>
      </div>

      <FieldTableHeader />

      {rows.map((row, idx) => (
        <FieldRow
          key={idx}
          row={row}
          idx={idx}
          onChange={handleRowChange}
          onOpenModal={handleOpenModal}
        />
      ))}

      <DistributionModal show={showModal} onClose={handleCloseModal} />

      <div className="mb-4">
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

      <div className="text-center">
        <button
          className="btn btn-lg px-5"
          style={{ backgroundColor: "rgb(115, 67, 131)", color: "white" }}
          onClick={handleExport}
        >
          Exportieren
        </button>
      </div>
    </div>
  );
};
