/**
 * ExportOptions-Komponente
 *
 * Stellt die Eingabefelder für die Export-Einstellungen bereit:
 * - Anzahl der zu generierenden Zeilen
 * - Exportformat (CSV, Excel, JSON)
 * - Zeilenende (Windows oder Unix)
 *
 * Die Werte werden über Props aus der Elternkomponente gesteuert und bei Änderung zurückgegeben.
 */
export const ExportOptions = ({
  rowCount,
  setRowCount,
  format,
  setFormat,
  lineEnding,
  setLineEnding,
}: {
  rowCount: number;
  setRowCount: (n: number) => void;
  format: string;
  setFormat: (f: string) => void;
  lineEnding: string;
  setLineEnding: (l: string) => void;
}) => (
  <div
    className="row mb-3 flex-nowrap"
    style={{ overflowX: "auto", minWidth: 1200 }} // Layout für horizontales Scrollen bei vielen Feldern
  >
    {/* Eingabefeld für die Anzahl der Zeilen */}
    <div className="col-2">
      <label className="form-label">Zeilen:</label>
      <input
        type="number"
        className="form-control" 
        value={rowCount}
       onChange={(e) => {
    const value = Math.max(0, parseInt(e.target.value) || 0); // nur positive Zahlen zulassen 
    
      setRowCount(value);
    }}
      />
    </div>
    {/* Auswahlfeld für das Exportformat */}
    <div className="col-2">
      <label className="form-label">Format:</label>
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
    {/* Auswahlfeld für das Zeilenende */}
    <div className="col-2">
      <label className="form-label">Zeilenende:</label>
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
);
