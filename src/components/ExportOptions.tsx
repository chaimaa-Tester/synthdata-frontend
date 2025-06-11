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
    style={{ overflowX: "auto", minWidth: 1200 }}
  >
    <div className="col-4">
      <label className="form-label">Zeilen:</label>
      <input
        type="number"
        className="form-control"
        value={rowCount}
        onChange={(e) => setRowCount(parseInt(e.target.value))}
      />
    </div>
    <div className="col-4">
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
    <div className="col-4">
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
