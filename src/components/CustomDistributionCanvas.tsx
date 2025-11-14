import React, { useRef, useState, useEffect } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";

export const CustomDistributionCanvas = ({ onSave }: { onSave: (data: { type: string; name: string; params: number[] }) => void }) => {
  const canvasRef = useRef<any>(null);
  const [fitLoading, setFitLoading] = useState(false);
  const [fitResult, setFitResult] = useState<null | {
    best_distribution: string | null,
    p_value: number | null,
    parameters: number[] | null,
  }>(null);
  const [fitError, setFitError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [previewPoints, setPreviewPoints] = useState<number[]>([]);
  const [fitCurve, setFitCurve] = useState<null | { x: number[]; y: number[] }>(null);

  useEffect(() => {
    setFitResult(null);
    setFitError(null);
    setPreviewPoints([]);
    setFitCurve(null);
    setFitLoading(false);
  }, []);

  const handleExtract = async () => {
    const paths = await canvasRef.current?.exportPaths();
    if (!paths) return;

    // Sammle alle y-Werte aus den Pfaden
    const yPoints = paths.flatMap((stroke: any) => {
      if (Array.isArray(stroke.paths) && stroke.paths.length > 0) {
        return stroke.paths.map((p: any) => p.y);
      }
      return [];
    });
    console.log("Extrahierte Y-Punkte:", yPoints);
    if (yPoints.length === 0) {
      setFitError("Keine gültigen Punkte zum Verarbeiten gefunden.");
      return;
    }
    const minY = Math.min(...yPoints);
    const maxY = Math.max(...yPoints);
    const normalized = yPoints.map((y: number) => (y - minY) / (maxY - minY || 1));
    // Werte glätten (einfacher Moving Average)
    const smoothed = normalized.map((val: number, idx: number, arr: number[]) => {
      const start = Math.max(0, idx - 2);
      const end = Math.min(arr.length, idx + 3);
      const window = arr.slice(start, end);
      return (window.reduce((a, b) => a + b, 0)) / window.length;
    });
    setPreviewPoints(smoothed);

    // Distribution Fit: Feedback-Logik
    setFitResult(null);
    setFitError(null);
    setFitLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/fit-distribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: smoothed }),
      });
      if (!response.ok) {
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
      // onSave(normalized);  <-- entfernt
      setFitCurve(result.fit_curve || null);
    } catch (e: any) {
      setFitError("Verbindungsfehler oder Server nicht erreichbar.");
    } finally {
      setFitLoading(false);
    }
  };

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
    setFitResult(null);
    setFitError(null);
    setFitLoading(false);
  };

  return (
    <div className="space-y-4 text-white">
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <h3 className="text-lg font-bold">🖊️ Eigene Verteilung zeichnen</h3>

      <div style={{ border: "1px solid #aaa", width: "600px", height: "300px" }}>
        <ReactSketchCanvas
          ref={canvasRef}
          style={{ width: "600px", height: "300px" }}
          strokeColor="#e543f4"
          strokeWidth={2}
          canvasColor="#1f3558"
        />
      </div>

      {showHint && (
        <div style={{ position: "relative", backgroundColor: "#2a406a", color: "#cbd5e1", fontSize: "0.9rem", padding: "6px 40px 6px 12px", borderRadius: "4px", maxWidth: "600px" }}>
          Zeichne eine Verteilung mit der Maus und klicke dann auf "Verteilung übernehmen".
          <button
            onClick={() => setShowHint(false)}
            aria-label="Hinweis schließen"
            style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#cbd5e1", cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem", lineHeight: "1" }}
          >
            ×
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleExtract}
          style={{
            padding: "8px 16px",
            background: "#4b0082",
            color: "white",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer"
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
            cursor: "pointer"
          }}
        >
          Löschen
        </button>
      </div>
      {/* Feedback-Box */}
      <div>
        {fitLoading && (
          <div style={{ marginTop: "10px", color: "#fff", background: "#2a406a", padding: "8px 14px", borderRadius: "6px", fontSize: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              border: "3px solid #e543f4",
              borderTop: "3px solid transparent",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              animation: "spin 1s linear infinite"
            }} />
            <span>⏳ Verteilung wird berechnet…</span>
          </div>
        )}
        {fitError && (
          <div style={{ marginTop: "10px", color: "#fff", background: "#8b2323", padding: "8px 14px", borderRadius: "6px", fontSize: "1rem", border: "1px solid #e57373" }}>
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
              maxWidth: "420px"
            }}
          >
            <div>
              <b>Erkannte Verteilung:</b> <span style={{ color: "#e543f4" }}>{fitResult.best_distribution}</span>
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
                {Array.isArray(fitResult.parameters) && fitResult.parameters.length > 0
                  ? "[" + fitResult.parameters.map((p) =>
                      typeof p === "number" && isFinite(p) ? p.toFixed(4) : "0.0000"
                    ).join(", ") + "]"
                  : "–"}
              </span>
            </div>
          </div>
        )}
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
              cursor: "pointer"
            }}
          >
            Fenster schließen
          </button>
        )}
      </div>
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
          {/* Nutzerzeichnung */}
          <polyline
            fill="none"
            stroke="#e543f4"
            strokeWidth="2"
            points={previewPoints
              .map((y, i) => `${(i / previewPoints.length) * 600},${100 - y * 100}`)
              .join(" ")}
          />
          {fitCurve && fitCurve.x && fitCurve.y && fitCurve.x.length === fitCurve.y.length && (
            <polyline
              fill="none"
              stroke="#00ff99"
              strokeWidth="2"
              points={fitCurve.x.map((xVal, i) => {
                const x = xVal * 600;
                const y = 100 - fitCurve.y[i] * 100;
                return `${x},${y}`;
              }).join(" ")}
            />
          )}
        </svg>
      )}
    </div>
  );
};