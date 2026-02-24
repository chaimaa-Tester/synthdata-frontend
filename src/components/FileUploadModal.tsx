/**
 * --------------------------------------------------------------------
 * Projekt: SynthData Wizard
 * Komponente: FileUploadModal
 * Autor: Burak Arabaci
 * 
 *
 * Beschreibung:
 * Diese Modal-Komponente ermöglicht es, eine CSV/XLSX-Datei hochzuladen und für
 * eine ausgewählte Spalte automatisch eine passende Wahrscheinlichkeitsverteilung
 * erkennen zu lassen (Distribution Detection). Die erkannten Parameter werden
 * anschließend in ein Formular übernommen und können gespeichert werden.
 *
 * Kernfunktionen:
 * - Datei-Upload (CSV/XLSX) und Laden der verfügbaren Spalten vom Backend
 * - Auswahl einer Spalte und Aufruf der Distribution-Erkennung im Backend
 * - Anzeige der Ergebnisse inkl. Histogramm und Fit-Kurve (Chart.js)
 * - Übergabe der erkannten Konfiguration an den Parent via onSave()
 *
 * Backend-Endpunkte:
 * - POST /detect-distribution           -> liefert Spaltennamen
 * - POST /detect-distribution/column    -> liefert best_distribution, parameters, values, p_value
 *
 * Technische Umsetzung:
 * - React Functional Component (Hooks: useState, useEffect)
 * - Chart.js + react-chartjs-2 zur Visualisierung
 * - Robustes UI-Verhalten (Reset von States bei Datei-/Spaltenwechsel)
 * --------------------------------------------------------------------
 */

import React, { useEffect, useState } from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

/**
 * Registrierung der benötigten Chart.js Module.
 * (Chart.js arbeitet modular; unregistrierte Elemente werden nicht gerendert.)
 */
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

type FileUploadModalProps = {
  show: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData: any;
  fieldType: any;
};

/**
 * calculateFitCurve()
 * -------------------
 * Berechnet Y-Werte einer approximierten Fit-Kurve für ein Histogramm.
 *
 * Zweck:
 * - Visualisierung der vom Backend erkannten Verteilung direkt im Frontend
 * - Skalierung auf Histogramm-Höhe (Anzahl Werte * Bin-Breite)
 *
 * Hinweis:
 * - Diese Implementierung approximiert PDFs für gängige Verteilungen.
 * - Die „Gamma-Funktion“ ist hier nur vereinfacht; die Fit-Kurve ist als visuelle
 *   Orientierung gedacht, nicht als mathematisch perfekter Plot.
 */
const calculateFitCurve = (
  distribution: string,
  params: any,
  bins: number[],
  totalCount: number
) => {
  const pdfs: number[] = [];
  const step = bins[1] - bins[0];

  for (let i = 0; i < bins.length; i++) {
    const x = bins[i] + step / 2;
    let y = 0;

    switch (distribution) {
      case "norm": {
        // params: [mean, std]
        const mean = parseFloat(params[0]);
        const std = parseFloat(params[1]);
        if (std <= 0) break;

        const coef = 1 / (std * Math.sqrt(2 * Math.PI));
        const exp = Math.exp(-0.5 * ((x - mean) / std) ** 2);
        y = coef * exp;
        break;
      }

      case "expon": {
        // params: [scale]
        const scale = parseFloat(params[0]);
        if (scale <= 0 || x < 0) break;

        y = (1 / scale) * Math.exp(-x / scale);
        break;
      }

      case "gamma": {
        // params: [shape, scale]
        const shape = parseFloat(params[0]);
        const scale = parseFloat(params[1]);
        if (shape <= 0 || scale <= 0 || x < 0) break;

        // Gamma PDF: x^(k-1) * exp(-x/θ) / (Γ(k) * θ^k)
        const gamma = (z: number): number => {
          if (z === 1) return 1;
          if (z === 0.5) return Math.sqrt(Math.PI);
          if (Number.isInteger(z)) {
            let f = 1;
            for (let i = 1; i < z; i++) f *= i;
            return f;
          }
          return 1; // vereinfachter Fallback
        };

        const gammaVal = gamma(shape);
        y =
          (Math.pow(x, shape - 1) * Math.exp(-x / scale)) /
          (gammaVal * Math.pow(scale, shape));
        break;
      }

      case "lognorm": {
        // params: [meanlog, stdlog]
        const meanlog = parseFloat(params[0]);
        const stdlog = parseFloat(params[1]);
        if (stdlog <= 0 || x <= 0) break;

        y =
          (1 / (x * stdlog * Math.sqrt(2 * Math.PI))) *
          Math.exp(-((Math.log(x) - meanlog) ** 2) / (2 * stdlog * stdlog));
        break;
      }

      case "uniform": {
        // params: [min, max]
        const min = parseFloat(params[0]);
        const max = parseFloat(params[1]);
        if (max <= min) break;

        y = x >= min && x <= max ? 1 / (max - min) : 0;
        break;
      }

      default:
        y = 0;
    }

    // Skalierung: PDF -> erwartete Häufigkeit pro Bin
    y = y * totalCount * step;
    pdfs.push(y);
  }

  return pdfs;
};

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  show,
  onClose,
  onSave,
  initialData,
  fieldType,
}) => {
  /**
   * Modal-Visibility: wenn show=false, wird nichts gerendert.
   * (Verhindert unnötiges Rendering und State-Updates im Hintergrund.)
   */
  if (!show) return null;

  /**
   * form: gespeicherte Distribution-Konfiguration, die an den Parent übergeben wird.
   * Initialisierung erfolgt aus initialData oder Default-Werten.
   */
  const [form, setForm] = useState(
    initialData || {
      distribution: "",
      parameterA: "",
      parameterB: "",
      extraParams: [] as string[],
    }
  );

  // UI-States für Datei-Upload und Erkennung
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>("");

  /**
   * detectionResult: Ergebnis der Backend-Erkennung.
   * Enthält u.a. Rohwerte (values) für Histogramm + Parameter der Verteilung.
   */
  const [detectionResult, setDetectionResult] = useState<{
    best_distribution?: string;
    parameters: any[];
    values: number[];
    p_value: number;
    distribution?: string; // Legacy-Fallback
  } | null>(null);

  /**
   * Synchronisiert das lokale Formular, wenn initialData vom Parent wechselt.
   * Typischer Fall: Modal wird für ein anderes Feld erneut geöffnet.
   */
  useEffect(() => {
    setForm(
      initialData || {
        distribution: "",
        parameterA: "",
        parameterB: "",
        extraParams: [] as string[],
      }
    );
  }, [initialData]);

  /**
   * Mappt interne Distribution-Codes auf UI-Labels.
   * (Hilft bei verständlicher Anzeige im Modal.)
   */
  const getDistributionLabel = (dist: string) => {
    switch (dist) {
      case "normal":
        return "Normalverteilung";
      case "uniform":
        return "Gleichverteilung";
      case "gamma":
        return "Gammaverteilung";
      case "lognormal":
        return "Log-Normalverteilung";
      case "exponential":
        return "Exponentialverteilung";
      case "poisson":
        return "Poisson-Verteilung";
      case "categorical":
        return "Kategoriale Verteilung";
      default:
        return dist;
    }
  };

  /**
   * handleFileChange()
   * ------------------
   * - Speichert die ausgewählte Datei im State
   * - Resettet UI States (columns, selectedColumn, detectionResult)
   * - Sendet die Datei an das Backend, um verfügbare Spalten zu ermitteln
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      setUploadedFile(file);
      setColumns([]);
      setSelectedColumn("");
      setDetectionResult(null);

      const formData = new FormData();
      formData.append("file", file);

      fetch("/detect-distribution", {
        method: "POST",
        body: formData,
      })
        .then((res) => {
          if (!res.ok) throw new Error("Fehler beim Laden der Spalten");
          return res.json();
        })
        .then((data) => {
          if (data.columns && Array.isArray(data.columns)) {
            setColumns(data.columns);
          } else {
            setColumns([]);
          }
        })
        .catch(() => {
          // Robustheit: bei Fehlern leere Liste statt UI-Crash
          setColumns([]);
        });
    }
  };

  /**
   * handleColumnSelect()
   * -------------------
   * - Setzt die gewählte Spalte
   * - Ruft die Backend-Verteilungserkennung für diese Spalte auf
   * - Übernimmt erkannte Parameter in das lokale Formular (form)
   */
  const handleColumnSelect = (col: string) => {
    setSelectedColumn(col);
    setDetectionResult(null);

    if (!uploadedFile) return;

    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("column", col);

    fetch("/detect-distribution/column", {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Fehler bei der Verteilungserkennung");
        return res.json();
      })
      .then((data) => {
        setDetectionResult(data);

        // Übernahme der erkannten Werte in die Form-Struktur
        if (data.best_distribution) {
          setForm({
            distribution: data.best_distribution,
            parameterA: data.parameters[0]?.toString() || "",
            parameterB: data.parameters[1]?.toString() || "",
            extraParams: data.parameters.slice(2).map((p: number) => p.toString()),
          });
        }
      })
      .catch(() => {
        setDetectionResult(null);
      });
  };

  /**
   * prepareChartData()
   * -----------------
   * Erzeugt Chart.js kompatible Daten:
   * - Histogramm (10 Bins) aus detectionResult.values
   * - Fit-Kurve basierend auf erkannten Parametern
   */
  const prepareChartData = () => {
    if (!detectionResult) return null;

    const values = detectionResult.values || [];
    if (values.length === 0) return null;

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const binCount = 10;

    // Hinweis: bei minVal == maxVal wäre binWidth 0 → in echten Projekten abfangen
    const binWidth = (maxVal - minVal) / binCount;

    const bins: number[] = [];
    for (let i = 0; i < binCount; i++) {
      bins.push(minVal + i * binWidth);
    }

    const histCounts = new Array(binCount).fill(0);
    values.forEach((v) => {
      let idx = Math.floor((v - minVal) / binWidth);
      if (idx === binCount) idx = binCount - 1; // Randfälle
      if (idx >= 0 && idx < binCount) histCounts[idx]++;
    });

    const fitCurve = calculateFitCurve(
      detectionResult.best_distribution || detectionResult.distribution || "",
      detectionResult.parameters,
      bins,
      values.length
    );

    // Daten für Chart.js
    const labels = bins.map((b, _i) => {
      const end = b + binWidth;
      return `${b.toFixed(2)} - ${end.toFixed(2)}`;
    });

    return {
      labels,
      datasets: [
        {
          type: "bar" as const,
          label: "Histogramm",
          data: histCounts,
          backgroundColor: "rgba(115, 67, 131, 0.7)",
          borderWidth: 1,
          yAxisID: "y",
        },
        {
          type: "line" as const,
          label: "Fit-Kurve",
          data: fitCurve,
          borderColor: "red",
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          yAxisID: "y",
        },
      ],
    };
  };

  const chartData = prepareChartData();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "white",
          color: "black",
          padding: 30,
          borderRadius: 10,
          minWidth: 800,
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Titel */}
        <div className="d-flex align-items-start mb-4">
          <h3>Verteilung berechnen lassen für {fieldType}</h3>
        </div>

        {/* Upload + Spaltenauswahl */}
        <div className="row mb-2 align-items-center">
          <div className="col-4">
            <input
              type="file"
              accept=".csv,.xlsx"
              className="form-control"
              onChange={handleFileChange}
              title="CSV oder XLSX Datei auswählen"
            />
          </div>

          <div className="col-4">
            {columns.length > 0 && (
              <select
                className="form-select"
                value={selectedColumn}
                onChange={(e) => handleColumnSelect(e.target.value)}
              >
                <option value="">Spalte wählen</option>
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Ergebnisse + Chart */}
        {detectionResult && (
          <div className="row mt-3">
            <div className="col-12">
              <h6>
                Erkannte Verteilung:{" "}
                {getDistributionLabel(
                  detectionResult.best_distribution ||
                    detectionResult.distribution ||
                    ""
                )}
              </h6>

              <p>
                Parameter:{" "}
                {detectionResult.parameters.map((p) => p.toString()).join(", ")}
                <br />
                p-Wert: {detectionResult.p_value.toFixed(4)}
              </p>

              {chartData && (
                <div style={{ maxWidth: "700px", maxHeight: "400px" }}>
                  <Chart
                    type="bar"
                    data={chartData}
                    options={{
                      responsive: true,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: "Häufigkeit" },
                        },
                        x: {
                          title: { display: true, text: "Wertebereiche" },
                        },
                      },
                      plugins: {
                        legend: { position: "top" },
                        tooltip: { mode: "index", intersect: false },
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aktionen */}
        <div className="text-center mt-4">
          <button
            className="me-3 btn btn-success px-4 py-2"
            onClick={() => onSave(form)}
            disabled={!form.distribution}
          >
            Speichern
          </button>
          <button className="btn btn-secondary px-4 py-2" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};