/**
 * --------------------------------------------------------------------
 * Projekt: SynthData Wizard
 * Komponente: ExportOptions
 * Autor: Burak Arabaci
 *
 * Beschreibung:
 * Diese Komponente stellt die zentralen Export-Optionen für die
 * Datengenerierung bereit. Sie dient als reine Präsentations-
 * und Steuerkomponente (Controlled Component).
 *
 * Funktion:
 * - Konfiguration der Anzahl zu generierender Datensätze (rowCount)
 * - Auswahl des Exportformats (CSV, XLSX, JSON, SQL)
 * - Auswahl des Zeilenendes (CRLF oder LF)
 *
 * Architekturprinzip:
 * - Kein eigener State (stateless component)
 * - Alle Werte werden über Props gesteuert (Controlled Inputs)
 * - Änderungen werden unmittelbar an die Elternkomponente
 *   zurückgegeben (Unidirectional Data Flow)
 * --------------------------------------------------------------------
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
    style={{
      overflowX: "auto",
      minWidth: 1200, // ermöglicht horizontales Scrollen bei schmalen Viewports
    }}
  >
    {/* ------------------------------------------------------------
       Eingabefeld: Anzahl der zu generierenden Zeilen
       ------------------------------------------------------------
       - Nur positive Ganzzahlen erlaubt
       - Defensive Programmierung: parseInt + Fallback auf 0
       - Math.max(0, ...) verhindert negative Werte
    ------------------------------------------------------------ */}
    <div className="col-2">
      <label className="form-label">Zeilen:</label>
      <input
        type="number"
        className="form-control"
        value={rowCount}
        onChange={(e) => {
          const value = Math.max(0, parseInt(e.target.value) || 0);
          setRowCount(value);
        }}
      />
    </div>

    {/* ------------------------------------------------------------
       Auswahlfeld: Exportformat
       ------------------------------------------------------------
       - Steuert später die Backend-Exportlogik
       - Unterstützte Formate:
         CSV  → Textdatei mit Trennzeichen
         XLSX → Excel-Datei mit Sheet-Support
         JSON → Strukturierte Daten
         SQL  → Insert-Statements
    ------------------------------------------------------------ */}
    <div className="col-2">
      <label className="form-label">Format:</label>
      <select
        className="form-select"
        value={format}
        onChange={(e) => setFormat(e.target.value)}
      >
        <option>CSV</option>
        <option>XLSX</option>
        <option>JSON</option>
        <option>SQL</option>
      </select>
    </div>

    {/* ------------------------------------------------------------
       Auswahlfeld: Zeilenende
       ------------------------------------------------------------
       Relevant insbesondere für CSV-Exporte:
       - Windows (CRLF) → \r\n
       - Unix (LF)      → \n
       ------------------------------------------------------------ */}
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