export const FieldRow = ({
  row,
  idx,
  onChange,
  onOpenModal,
}: {
  row: any;
  idx: number;
  onChange: (idx: number, field: string, value: any) => void;
  onOpenModal: () => void;
}) => (
  <div
    className="row mb-2 align-items-center flex-nowrap"
    style={{ overflowX: "auto", minWidth: 1200 }}
    key={idx}
  >
    <div className="col-2">
      <input
        className="form-control"
        value={row.name}
        onChange={(e) => onChange(idx, "name", e.target.value)}
      />
    </div>
    <div className="col-2">
      <select
        className="form-select"
        value={row.type}
        onChange={(e) => onChange(idx, "type", e.target.value)}
      >
        <option value="String">Text</option>
        <option value="Zahl">Zahl</option>
        <option value="Datum">Datum</option>
      </select>
    </div>
    <div className="col-2">
      <input
        className="form-control"
        value={row.dependency}
        onChange={(e) => onChange(idx, "dependency", e.target.value)}
      />
    </div>
    <div className="col-3 d-flex align-items-start">
      <input
        type="checkbox"
        className="form-check-input me-2"
        checked={row.showInTable}
        onChange={(e) => onChange(idx, "showInTable", e.target.checked)}
      />
      <label className="form-check-label">In Tabelle anzeigen</label>
    </div>
    <div className="col-3">
      <button
        className="btn"
        style={{
          backgroundColor: "rgb(115, 67, 131)",
          color: "white",
          fontSize: 20,
        }}
        onClick={onOpenModal}
      >
        Verteilung spezifizieren
      </button>
    </div>
  </div>
);
