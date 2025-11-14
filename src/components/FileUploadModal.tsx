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

// Hilfsfunktion zum Berechnen der Fit-Kurve Y-Werte
const calculateFitCurve = (
  distribution: string,
  params: any,
  bins: number[],
  totalCount: number
) => {
  // Verteilungen: norm, expon, gamma, lognorm, uniform
  // params: je nach Verteilung unterschiedlich
  // totalCount: Gesamtanzahl der Werte (für Skalierung)

  // Für jede Verteilung müssen wir die PDF berechnen
  // Wir approximieren hier nur die gängigen Verteilungen mit einfachen Formeln

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
        if (std <= 0) {
          y = 0;
          break;
        }
        const coef = 1 / (std * Math.sqrt(2 * Math.PI));
        const exp = Math.exp(-0.5 * ((x - mean) / std) ** 2);
        y = coef * exp;
        break;
      }
      case "expon": {
        // params: [scale] (mean)
        const scale = parseFloat(params[0]);
        if (scale <= 0 || x < 0) {
          y = 0;
          break;
        }
        y = (1 / scale) * Math.exp(-x / scale);
        break;
      }
      case "gamma": {
        // params: [shape, scale]
        const shape = parseFloat(params[0]);
        const scale = parseFloat(params[1]);
        if (shape <= 0 || scale <= 0 || x < 0) {
          y = 0;
          break;
        }
        // Gamma PDF: x^(k-1) * exp(-x/θ) / (Γ(k) * θ^k)
        // Approximate Γ(k) with gamma function approximation or use 1 for simplicity
        // For simplicity, we use a rough approximation for Γ(k)
        const gamma = (z: number): number => {
          // Lanczos approximation or simple factorial for integers
          if (z === 1) return 1;
          if (z === 0.5) return Math.sqrt(Math.PI);
          // fallback: factorial for integers
          if (Number.isInteger(z)) {
            let f = 1;
            for (let i = 1; i < z; i++) f *= i;
            return f;
          }
          return 1; // fallback
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
        if (stdlog <= 0 || x <= 0) {
          y = 0;
          break;
        }
        y =
          (1 / (x * stdlog * Math.sqrt(2 * Math.PI))) *
          Math.exp(-((Math.log(x) - meanlog) ** 2) / (2 * stdlog * stdlog));
        break;
      }
      case "uniform": {
        // params: [min, max]
        const min = parseFloat(params[0]);
        const max = parseFloat(params[1]);
        if (max <= min) {
          y = 0;
          break;
        }
        y = x >= min && x <= max ? 1 / (max - min) : 0;
        break;
      }
      default:
        y = 0;
    }

    // Skalieren PDF auf Histogramm Höhe (Anzahl * Breite des Bin)
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
  if (!show) return null;

  const [form, setForm] = useState(
    initialData || {
      distribution: "",
      parameterA: "",
      parameterB: "",
      extraParams: [] as string[],
    }
  );

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [detectionResult, setDetectionResult] = useState<{
    best_distribution?: string;
    parameters: any[];
    values: number[];
    p_value: number;
    // allow legacy for robustness
    distribution?: string;
  } | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setColumns([]);
      setSelectedColumn("");
      setDetectionResult(null);

      // Datei an Backend senden, um Spalten zu erhalten
      const formData = new FormData();
      formData.append("file", file);

      fetch("http://localhost:8000/detect-distribution", {
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
          setColumns([]);
        });
    }
  };

  // Handler Spaltenauswahl
  const handleColumnSelect = (col: string) => {
    setSelectedColumn(col);
    setDetectionResult(null);

    if (!uploadedFile) return;

    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("column", col);

    fetch("http://localhost:8000/detect-distribution/column", {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Fehler bei der Verteilungserkennung");
        return res.json();
      })
      .then((data) => {
        // Erwartete Daten: { best_distribution, parameters, values, p_value }
        setDetectionResult(data);

        if (data.best_distribution) {
          setForm({
            distribution: data.best_distribution,
            parameterA: data.parameters[0]?.toString() || "",
            parameterB: data.parameters[1]?.toString() || "",
            extraParams: data.parameters
              .slice(2)
              .map((p: number) => p.toString()),
          });
        }
      })
      .catch(() => {
        setDetectionResult(null);
      });
  };

  const prepareChartData = () => {
    if (!detectionResult) return null;

    const values = detectionResult.values || [];
    if (values.length === 0) return null;

    // Histogramm mit 10 Bins
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const binCount = 10;
    const binWidth = (maxVal - minVal) / binCount;

    const bins: number[] = [];
    for (let i = 0; i < binCount; i++) {
      bins.push(minVal + i * binWidth);
    }

    // Histogramm zählen
    const histCounts = new Array(binCount).fill(0);
    values.forEach((v) => {
      let idx = Math.floor((v - minVal) / binWidth);
      if (idx === binCount) idx = binCount - 1; // Randfälle
      if (idx >= 0 && idx < binCount) histCounts[idx]++;
    });

    // Fit-Kurve für erkannte Verteilung
    const fitCurve = calculateFitCurve(
      detectionResult.best_distribution || detectionResult.distribution || "",
      detectionResult.parameters,
      bins,
      values.length
    );

    // Daten für Chart.js
    const labels = bins.map((b, i) => {
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

        {/* Anzeige der Ergebnisse und Chart */}
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
                {detectionResult.parameters.map((p) => p.toString()).join(", ")}{" "}
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
                          title: {
                            display: true,
                            text: "Häufigkeit",
                          },
                        },
                        x: {
                          title: {
                            display: true,
                            text: "Wertebereiche",
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          position: "top",
                        },
                        tooltip: {
                          mode: "index",
                          intersect: false,
                        },
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