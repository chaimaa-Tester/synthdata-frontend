/**
 * FieldTableHeader-Komponente
 *
 * Stellt die Kopfzeile der Feld-Tabelle dar.
 * Die Spaltenüberschriften sind:
 * - Feldname
 * - Feldtyp
 * - Abhängigkeit
 * - Verteilung
 *
 * Das Layout ist horizontal scrollbar, falls die Spalten nicht auf den Bildschirm passen.
 */
export const FieldTableHeader = () => (
  <div
    className="row mb-2 fw-bold flex-nowrap"
    style={{ overflowX: "auto", minWidth: 1200 }} // Ermöglicht horizontales Scrollen bei vielen Spalten
  >
    {/* Spaltenüberschrift für den Namen des Feldes */}
    <div className="col-md-2 px-4">Feldname</div>
    {/* Spaltenüberschrift für den Typ des Feldes */}
    <div className="col-md-2 px-4">Feldtyp</div>
    {/* Spaltenüberschrift für die Abhängigkeit */}
    <div className="col-md-2 px-4">Abhängigkeit</div>
    {/* Spaltenüberschrift für die Verteilung */}
    <div className="col-md-3 px-4">Verteilung</div>
  </div>
);
