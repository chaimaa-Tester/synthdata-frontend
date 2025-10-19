import React, { useRef } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";

export const CustomDistributionCanvas = ({ onSave }: { onSave: (points: number[]) => void }) => {
  const canvasRef = useRef<any>(null);

  const handleExtract = async () => {
    const paths = await canvasRef.current?.exportPaths();
    if (!paths) return;

    // Sammle alle y-Werte
    const yPoints = paths.flatMap((path: any) => path.points.map((p: any) => p.y));
    const maxY = Math.max(...yPoints);
    const normalized = yPoints.map((y: number) => 1 - y / maxY);

    onSave(normalized);
  };

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
  };

  return (
    <div className="space-y-4 text-white">
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
    </div>
  );
};