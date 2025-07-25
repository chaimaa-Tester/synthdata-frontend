export const FieldRow = ({
  row,
  idx,
  onChange,
  onOpenModal,
  handleDeleteRow,
}: {
  row: any;
  idx: number;
  onChange: (idx: number, field: string, value: any) => void;
  onOpenModal: (idx: number) => void;
  handleDeleteRow: (idx: number) => void;
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
        <option value="String">String</option>
        <option value="Double">Double</option>
        <option value="Date">Date</option>
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
        checked={row.DoNotShowInTable}
        onChange={(e) => onChange(idx, "DoNotShowInTable", e.target.checked)}
      />
      <label className="form-check-label">Nicht in Tabelle anzeigen</label>
    </div>
    <div className="col-3 d-flex align-items-center">
      <button
        className="btn me-3"
        style={{
          backgroundColor: "rgb(115, 67, 131)",
          color: "white",
          fontSize: 20,
        }}
        onClick={() => onOpenModal(idx)}
      >
        Verteilung spezifizieren
      </button>
      <button
        type="button"
        className="btn"
        aria-label="Delete"
        style={{ padding: 0, background: "none", border: "none" }}
        onClick={() => handleDeleteRow(idx)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          fill="white"
          viewBox="0 0 16 16"
        >
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5.5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6zm2 .5a.5.5 0 0 1 .5-.5.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6z" />
          <path
            fillRule="evenodd"
            d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2h3.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1H14a1 1 0 0 1 1 1zm-3-1a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0-.5.5V3h3V2zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118z"
          />
        </svg>
      </button>
    </div>
  </div>
);
