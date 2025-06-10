import { useState } from "react";
import logo from "./assets/logo.png";
import { DistributionModal } from "./components/DistributionModal";

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
  const [lineEnding, setLineEnding] = useState("CRLF");
  const [showModal, setShowModal] = useState(false);

  const handleAddRow = () => setRows([...rows, defaultRow]);
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);


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

      <div className="row mb-3 fw-bold">
        <div className="col-md-2">Feldname</div>
        <div className="col-md-2">Feldtyp</div>
        <div className="col-md-2">Abhängigkeit</div>
        <div className="col-md-3">Tabelle</div>
        <div className="col-md-3">Verteilung</div>
      </div>

      {rows.map((row, idx) => (
        <div className="row mb-2 align-items-center" key={idx}>
          <div className="col-md-2">
            <input className="form-control" />
          </div>
          <div className="col-md-2">
            <select className="form-select">
              <option>String</option>
              <option>Zahl</option>
              <option>Datum</option>
            </select>
          </div>
          <div className="col-md-2">
            <input className="form-control"></input>
          </div>
          <div className="col-md-3 d-flex align-items-start">
            <input type="checkbox" className="form-check-input me-2" />
            <label className="form-check-label">In Tabelle anzeigen</label>
          </div>
          <div className="col-md-3">
            <button
              className="btn"
              style={{
                backgroundColor: "rgb(115, 67, 131)",
                color: "white",
                fontSize: 20,
              }}
              onClick={handleOpenModal}        
            >
              Verteilung spezifizieren
            </button>
          </div>
        </div>
      ))}

      <DistributionModal show={showModal} onClose={handleCloseModal} />

      <div className="d-flex gap-3 mb-4">
        <button className="btn btn-outline-light" onClick={handleAddRow}>
          + Füge neue Reihe hinzu
        </button>
      </div>

      <div className="row text-white mb-4">
        <div className="col-md-4">
          <label className="form-label me-2">Zeilen:</label>
          <input
            type="number"
            className="form-control"
            value={rowCount}
            onChange={(e) => setRowCount(parseInt(e.target.value))}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label me-2">Format:</label>
          <select
            className="form-select"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option>CSV</option>
            <option>Excel</option>
            <option>JSON</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label me-2">Zeilenende:</label>
          <select
            className="form-select"
            value={lineEnding}
            onChange={(e) => setLineEnding(e.target.value)}
          >
            <option>Windows(CRLF)</option>
            <option>Unix(LF)</option>
          </select>
        </div>
      </div>

      <div className="text-center">
        <button
          className="btn btn-lg px-5"
          style={{ backgroundColor: "rgb(115, 67, 131)", color: "white" }}
        >
          Exportieren
        </button>
      </div>
    </div>
  );
};
