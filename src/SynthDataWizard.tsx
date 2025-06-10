import { useState } from 'react';
import logo from './assets/logo.png'

const defaultRow = {
  name: '',
  type: '',
  dependency: '',
  showInTable: false,
};

export const SynthDataWizard = () => {
  const [rows, setRows] = useState([defaultRow, defaultRow, defaultRow, defaultRow]);
  const [rowCount, setRowCount] = useState(1000);
  const [format, setFormat] = useState('CSV');
  const [lineEnding, setLineEnding] = useState('CRLF');

  const handleAddRow = () => setRows([...rows, defaultRow]);

  return (
    <div className="container py-5 text-white" style={{
      background: 'linear-gradient(to bottom,rgb(66, 3, 81),rgb(14, 75, 205))',
      minHeight: '100vh',
    }}>
      <div className="d-flex align-items-center">
        <img src={logo} alt="SynthData Wizard Logo" height={110}/*setzt die Größe des Logos*/ />
        <h3 className="">SynthData<br /> <span style={{color: '#9155bd'}}>Wizard</span></h3>
      </div>

      <div className="row mb-3 fw-bold">
        <div className="col-md-2">Feldname</div>
        <div className="col-md-2">Feldtyp</div>
        <div className="col-md-2">Abhängigkeit</div>
        <div className="col-md-3">Tabelle</div>
        <div className="col-md-3">Verteilung</div>
      </div>

      {rows.map((row, idx) => (
        <div className="row mb-2 align-items-start" key={idx}>
          <div className="col-md-2">
            <input className="form-control" />            
          </div>
          <div className="col-md-2">
            <select className="form-select">
              <option></option>
              <option>String</option>
              <option>Zahl</option>
              <option>Datum</option>
            </select>          
          </div>
          <div className="col-md-2">
            <input className='form-control'></input>
          </div>
          <div className="col-md-3 d-flex align-items-start">
            <input type="checkbox" className="form-check-input me-2" />
            <label className="form-check-label">In Tabelle anzeigen</label>
          </div>
          <div className="col-md-3">
            <button className="btn btn-success">Verteilung spezifizieren</button>
          </div>
        </div>
      ))}

      <div className="d-flex gap-3 mb-4">
        <button className="btn btn-outline-light" onClick={handleAddRow}>+ Füge neue Reihe hinzu</button>
      </div>

      <div className="row text-white mb-4">
        <div className="col-md-4">
          <label className="form-label me-2">Zeilen:</label>
          <input
            type="number"
            className="form-control d-inline-block w-30"
            value={rowCount}
            onChange={(e) => setRowCount(parseInt(e.target.value))}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label me-2">Format:</label>
          <select className="form-select" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option>CSV</option>
            <option>Excel</option>
            <option>JSON</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label me-2">Zeilenende:</label>
          <select className="form-select" value={lineEnding} onChange={(e) => setLineEnding(e.target.value)}>
            <option>CRLF</option>
            <option>LF</option>
          </select>
        </div>
      </div>

      <div className="text-center">
        <button className="btn btn-success btn-lg px-5">Exportieren</button>
      </div>
    </div>
  );
};
