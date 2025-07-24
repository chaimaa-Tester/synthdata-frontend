export const FieldTableHeader = () => (
  <div
    className="row mb-2 fw-bold flex-nowrap"
    style={{ overflowX: "auto", minWidth: 1200 }}
  >
    <div className="col-md-2">Feldname</div>
    <div className="col-md-2">Feldtyp</div>
    <div className="col-md-2">Abhängigkeit</div>
    <div className="col-md-3">Tabelle</div>
    <div className="col-md-3">Verteilung</div>
  </div>
);
