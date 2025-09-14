/**
 * FieldTableHeader-Komponente
 *
 * Stellt die Kopfzeile der Feld-Tabelle dar.
 * Die Spaltenüberschriften sind:
 * - (Draghandle)
 * - Feldname
 * - Feldtyp
 * - Abhängigkeit
 * - Verteilung
 * - (Löschen)
 *
 * Das Layout ist horizontal scrollbar, falls die Spalten nicht auf den Bildschirm passen.
 */
export const FieldTableHeader = () => (
  <div
    className="row mb-2 fw-bold flex-nowrap"
    style={{ minWidth: 1200 }}
  >
    <div className="col-auto px-2"></div>
    <div className="col-2 px-3">Feldname</div>
    <div className="col-2 px-3">Feldtyp</div>
    <div className="col-2 px-3">Abhängigkeit</div>
    <div className="col-1 px-5">Verteilung</div>
    <div className="col-auto px-2"></div>
  </div>
);
