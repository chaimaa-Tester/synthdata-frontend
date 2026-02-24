/**
 * --------------------------------------------------------------------
 * Projekt: SynthData Wizard
 * Komponente: CustomDistributionCanvas
 * Autor: Burak Arabaci
 *
 *
 * Beschreibung:
 * Diese Komponente ermöglicht es dem Nutzer, eine eigene Verteilung per Maus
 * zu zeichnen. Die gezeichneten Punkte werden extrahiert, normalisiert,
 * reduziert (Downsampling) und geglättet (Gaussian Smoothing). Anschließend
 * wird das Ergebnis an das Backend gesendet, um eine passende Verteilung inkl.
 * Parameter zu fitten. Das Fit-Ergebnis wird angezeigt und kann gespeichert werden.
 *
 * Kernfunktionen:
 * - Zeichnen einer Kurve via ReactSketchCanvas
 * - Extraktion der Pfadpunkte und Normalisierung auf [0, 1]
 * - Downsampling zur Reduktion von Rauschen/Overfitting und Datenmenge
 * - Glättung der Y-Werte mittels Gauß-Filter (Smoothing)
 * - Backend-Call: POST /api/fit-distribution (Fit + Parameter + Fit-Kurve)
 * - Visualisierung: Nutzerkurve vs. Fit-Kurve (SVG Preview)
 * - Übergabe an Parent via onSave()
 *
 * Architekturprinzip:
 * - UI-State ist Single Source of Truth (fitLoading/fitResult/fitError etc.)
 * - Backend liefert die finale statistische Bewertung (best_distribution, p_value, parameters)
 * --------------------------------------------------------------------
 */

import React, { useRef, useState, useEffect } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";

/**
 * gaussianSmooth()
 * ----------------
 * Glättet ein Zahlenarray mittels Gauß-Kernel (1D Convolution).
 *
 * Zweck:
 * - Nutzerzeichnungen enthalten oft starkes Rauschen (zittrige Mausbewegungen).
 * - Glättung reduziert Ausreißer und erzeugt eine stabilere Kurve für den Fit.
 *
 * Parameter:
 * - arr: Eingabewerte (hier: Y-Werte der gezeichneten Kurve)
 * - sigma: Standardabweichung des Gauß-Kernels (größer = stärkere Glättung)
 *
 * Rückgabe:
 * - geglättetes Array gleicher Länge
 */
const gaussianSmooth = (arr: number[], sigma = 2): number[] => {
  const kernelRadius = Math.max(1, Math.floor(sigma * 3));
  const kernel: number[] = [];
  let kernelSum = 0;

  // Kernel berechnen (symmetrisch um 0)
  for (let i = -kernelRadius; i <= kernelRadius; i++) {
    const value = Math.exp(-0.5 * (i / sigma) ** 2);
    kernel.push(value);
    kernelSum += value;
  }

  // 1D-Faltung (Convolution) mit Rand-Clamping
  return arr.map((_, idx) => {
    let acc = 0;
    for (let k = -kernelRadius; k <= kernelRadius; k++) {
      const j = Math.min(arr.length - 1, Math.max(0, idx + k));
      acc += arr[j] * kernel[k + kernelRadius];
    }
    return acc / kernelSum;
  });
};

export const CustomDistributionCanvas = ({
  onSave,
}: {
  onSave: (data: { type: string; name: string; params: number[] }) => void;
}) => {
  /**
   * canvasRef:
   * Referenz auf ReactSketchCanvas, um:
   * - Pfade zu exportieren (exportPaths)
   * - Canvas zu leeren (clearCanvas)
   */
  const canvasRef = useRef<any>(null);

  // UI-/Request-States
  const [fitLoading, setFitLoading] = useState(false);
  const [fitResult, setFitResult] = useState<null | {
    best_distribution: string | null;
    p_value: number | null;
    parameters: number[] | null;
  }>(null);
  const [fitError, setFitError] = useState<string | null>(null);

  // UX: Hinweisbox beim ersten Render
  const [showHint, setShowHint] = useState(true);

  // Visualisierung: geglättete Nutzerpunkte (Preview) + vom Backend gelieferte Fit-Kurve
  const [previewPoints, setPreviewPoints] = useState<number[]>([]);
  const [fitCurve, setFitCurve] = useState<null | { x: number[]; y: number[] }>(
    null
  );

  /**
   * Initialer Reset (defensiv):
   * Bei Mount sorgt dies dafür, dass kein alter Zustand aus vorherigen
   * Render-Zyklen/Modal-Öffnungen übernommen wird.
   */
  useEffect(() => {
    setFitResult(null);
    setFitError(null);
    setPreviewPoints([]);
    setFitCurve(null);
    setFitLoading(false);
  }, []);

  /**
   * handleExtract()
   * ---------------
   * Extrahiert die gezeichnete Kurve, verarbeitet sie und ruft das Backend-Fitting auf.
   *
   * Verarbeitungsschritte:
   * 1) exportPaths() -> Rohpunkte aus allen Strokes
   * 2) min/max bestimmen und auf [0,1] normalisieren (X und Y)
   * 3) Downsampling (jeder 5. Punkt) zur Reduktion der Datenmenge
   * 4) Gaussian Smoothing auf den Y-Werten
   * 5) Backend-Request: POST /api/fit-distribution
   * 6) Ergebnis speichern und Fit-Kurve (optional) rendern
   */
  const handleExtract = async () => {
    const paths = await canvasRef.current?.exportPaths();
    if (!paths) return;

    // Rohpunkte aus allen Strokes zusammenführen
    const rawPoints: { x: number; y: number }[] = paths.flatMap(
      (stroke: any) =>
        Array.isArray(stroke.paths)
          ? stroke.paths.map((p: any) => ({ x: p.x as number, y: p.y as number }))
          : []
    );

    if (rawPoints.length === 0) {
      setFitError("Keine gültigen Punkte zum Verarbeiten gefunden.");
      return;
    }

    const xs = rawPoints.map((p) => p.x);
    const ys = rawPoints.map((p) => p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Normalisierung auf [0,1] (Schutz: Division durch 0 vermeiden)
    const normX = xs.map((x) => (x - minX) / (maxX - minX || 1));
    const normY = ys.map((y) => (y - minY) / (maxY - minY || 1));

    /**
     * Downsampling:
     * - reduziert die Anzahl an Punkten (Performance)
     * - wirkt als einfache Rauschunterdrückung
     */
    const downsampledIndices = normX.map((_, i) => i).filter((i) => i % 5 === 0);
    const downX = downsampledIndices.map((i) => normX[i]);
    const downY = downsampledIndices.map((i) => normY[i]);

    // Glättung der Y-Werte
    const smoothedY = gaussianSmooth(downY);

    // Preview: Nutzerkurve (geglättet) visualisieren
    setPreviewPoints(smoothedY);

    // Request-State vorbereiten
    setFitResult(null);
    setFitError(null);
    setFitLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/fit-distribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Backend erhält normalisierte X/Y-Punkte für das Fitting
        body: JSON.stringify({ x: downX, y: smoothedY }),
      });

      if (!response.ok) {
        // Fehlertext möglichst sinnvoll aus Backend lesen
        let msg = "Unbekannter Fehler";
        try {
          const err = await response.json();
          msg = err.error || msg;
        } catch {}
        setFitError(msg);
        setFitLoading(false);
        return;
      }

      const result = await response.json();

      setFitResult({
        best_distribution: result.best_distribution,
        p_value: result.p_value,
        parameters: result.parameters,
      });

      // Optional: Fit-Kurve (x/y) zur Visualisierung
      setFitCurve(result.fit_curve || null);
    } catch {
      setFitError("Verbindungsfehler oder Server nicht erreichbar.");
    } finally {
      setFitLoading(false);
    }
  };

  /**
   * handleClear()
   * -------------
   * Setzt Canvas und Ergebniszustände zurück.
   */
  const handleClear = () => {
    canvasRef.current?.clearCanvas();
    setFitResult(null);
    setFitError(null);
    setFitLoading(false);
    setPreviewPoints([]);
    setFitCurve(null);
  };

  return (
    <div className="space-y-4 text-white">
      {/* Inline CSS für den Loading-Spinner (einfacher, lokaler Ansatz) */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <h3 className="text-lg font-bold">🖊️ Eigene Verteilung zeichnen</h3>

      {/* Zeichenfläche */}
      <div style={{ border: "1px solid #aaa", width: "600px", height: "300px" }}>
        <ReactSketchCanvas
          ref={canvasRef}
          style={{ width: "600px", height: "300px" }}
          strokeColor="#e543f4"
          strokeWidth={2}
          canvasColor="#1f3558"
        />
      </div>

      {/* Hinweisbox (UX) */}
      {showHint && (
        <div
          style={{
            position: "relative",
            backgroundColor: "#2a406a",
            color: "#cbd5e1",
            fontSize: "0.9rem",
            padding: "6px 40px 6px 12px",
            borderRadius: "4px",
            maxWidth: "600px",
          }}
        >
          Zeichne eine Verteilung mit der Maus und klicke dann auf "Verteilung
          übernehmen".
          <button
            onClick={() => setShowHint(false)}
            aria-label="Hinweis schließen"
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: "#cbd5e1",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1.1rem",
              lineHeight: "1",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Aktionen */}
      <div className="flex gap-2">
        <button
          onClick={handleExtract}
          style={{
            padding: "8px 16px",
            background: "#4b0082",
            color: "white",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Verteilung übernehmen
        </button>

        <button
          onClick={handleClear}
          style={{
            padding: "8px 16px",
            background: "#555",
            color: "white",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Löschen
        </button>
      </div>

      {/* Feedback-Box */}
      <div>
        {fitLoading && (
          <div
            style={{
              marginTop: "10px",
              color: "#fff",
              background: "#2a406a",
              padding: "8px 14px",
              borderRadius: "6px",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                border: "3px solid #e543f4",
                borderTop: "3px solid transparent",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                animation: "spin 1s linear infinite",
              }}
            />
            <span>⏳ Verteilung wird berechnet…</span>
          </div>
        )}

        {fitError && (
          <div
            style={{
              marginTop: "10px",
              color: "#fff",
              background: "#8b2323",
              padding: "8px 14px",
              borderRadius: "6px",
              fontSize: "1rem",
              border: "1px solid #e57373",
            }}
          >
            <span style={{ color: "#ffbdbd" }}>❗ {fitError}</span>
          </div>
        )}

        {fitResult && fitResult.best_distribution && (
          <div
            style={{
              marginTop: "10px",
              background: "#22325a",
              color: "#e5e5e5",
              border: "1px solid #5e6fa6",
              borderRadius: "6px",
              padding: "10px 16px",
              fontSize: "0.97rem",
              maxWidth: "420px",
            }}
          >
            <div>
              <b>Erkannte Verteilung:</b>{" "}
              <span style={{ color: "#e543f4" }}>
                {fitResult.best_distribution}
              </span>
            </div>

            <div>
              <b>p-Wert:</b>{" "}
              <span
                title="Zeigt, wie gut deine gezeichnete Verteilung zur erkannten Verteilung passt. Werte nahe 1 = sehr gute Übereinstimmung."
                style={{ color: "#9eea8c", textDecoration: "underline dotted" }}
              >
                {fitResult.p_value !== null ? fitResult.p_value.toFixed(4) : "-"}
              </span>
            </div>

            <div>
              <b>Parameter:</b>{" "}
              <span style={{ fontFamily: "monospace", color: "#ffd166" }}>
                {Array.isArray(fitResult.parameters) &&
                fitResult.parameters.length > 0
                  ? "[" +
                    fitResult.parameters
                      .map((p) =>
                        typeof p === "number" && isFinite(p)
                          ? p.toFixed(4)
                          : "0.0000"
                      )
                      .join(", ") +
                    "]"
                  : "–"}
              </span>
            </div>
          </div>
        )}

        {/* Speichern & Schließen (nur sinnvoll nach Ergebnis oder Fehler) */}
        {(fitResult || fitError) && (
          <button
            onClick={() => {
              onSave({
                type: "custom",
                name: fitResult?.best_distribution || "custom",
                params: fitResult?.parameters || [],
              });
              window.dispatchEvent(new CustomEvent("closeCustomCanvas"));
            }}
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              background: "#444",
              color: "white",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Fenster schließen
          </button>
        )}
      </div>

      {/* SVG Preview: Nutzerkurve (pink) + Fit-Kurve (grün) */}
      {fitResult && previewPoints.length > 0 && (
        <svg
          width="600"
          height="120"
          style={{
            marginTop: "12px",
            background: "#162b44",
            borderRadius: "6px",
            border: "1px solid #3d4e6b",
          }}
        >
          {/* Nutzerzeichnung (geglättet) */}
          <polyline
            fill="none"
            stroke="#e543f4"
            strokeWidth="2"
            points={previewPoints
              .map((y, i) => `${(i / previewPoints.length) * 600},${100 - y * 100}`)
              .join(" ")}
          />

          {/* Fit-Kurve vom Backend (wenn vorhanden) */}
          {fitCurve &&
            fitCurve.x &&
            fitCurve.y &&
            fitCurve.x.length === fitCurve.y.length && (
              <polyline
                fill="none"
                stroke="#00ff99"
                strokeWidth="2"
                points={fitCurve.x
                  .map((xVal, i) => {
                    const x = xVal * 600;
                    const y = 100 - fitCurve.y[i] * 100;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            )}
        </svg>
      )}
    </div>
  );
};