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

// Props für das Modal
type DistributionModalProps = {
  show: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData: any;
  fieldType: string;
  allFieldNames?: string[];
};

// Hilfsfunktion zum Berechnen der Fit-Kurve Y-Werte
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
        const scale = parseFloat(params[0]);
        if (scale <= 0 || x < 0) {
          y = 0;
          break;
        }
        y = (1 / scale) * Math.exp(-x / scale);
        break;
      }
      case "gamma": {
        const shape = parseFloat(params[0]);
        const scale = parseFloat(params[1]);
        if (shape <= 0 || scale <= 0 || x < 0) {
          y = 0;
          break;
        }
        const gamma = (z: number): number => {
          if (z === 1) return 1;
          if (z === 0.5) return Math.sqrt(Math.PI);
          if (Number.isInteger(z)) {
            let f = 1;
            for (let i = 1; i < z; i++) f *= i;
            return f;
          }
          return 1;
        };
        const gammaVal = gamma(shape);
        y = (Math.pow(x, shape - 1) * Math.exp(-x / scale)) / (gammaVal * Math.pow(scale, shape));
        break;
      }
      case "lognorm": {
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

    y = y * totalCount * step;
    pdfs.push(y);
  }

  return pdfs;
};

// Hauptkomponente für das Modal zur Verteilungsspezifikation
export const DistributionModal: React.FC<DistributionModalProps> = ({
  show,
  onClose,
  onSave,
  initialData,
  fieldType,
}) => {
  if (!show) return null;

  // State für die Eingabefelder im Modal
  const [form, setForm] = useState(
    initialData || {
      distribution: "",
      parameterA: "",
      parameterB: "",
      extraParams: [] as string[],
    }
  );

  // Für Option 2: Datei-Upload und Spaltenauswahl
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [detectionResult, setDetectionResult] = useState<{
    best_distribution?: string;
    parameters: any[];
    values: number[];
    p_value: number;
    distribution?: string;
  } | null>(null);

  // Synchronisiert die Form-Daten mit den Initialdaten
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

  // Handler zum Ändern eines zusätzlichen Parameters
  const handleExtraParamChange = (idx: number, value: string) => {
    const newExtraParams = [...(form.extraParams || [])];
    newExtraParams[idx] = value;
    setForm({ ...form, extraParams: newExtraParams });
  };

  // Handler zum Hinzufügen eines weiteren Parameters
  const handleAddExtraParam = () => {
    setForm({ ...form, extraParams: [...(form.extraParams || []), ""] });
  };

  // ✅ NEU: Verfügbare Verteilungen erweitert für mimesis-Typen
  const getAllowedDistributions = (type: string) => {
    switch (type) {
      case "name":
      case "vorname":
      case "nachname":
      case "vollständigername":
        return ["categorical"];
      case "geschlecht":
      case "gender":
        return ["categorical"];
      case "Date":
      case "date":
        return ["uniform"];
      case "körpergröße":
      case "gewicht":
      case "float":
        return ["uniform", "normal"];
      case "Integer":
      case "integer":
      case "alter":
      case "plz":
      case "hausnummer":
        return ["uniform", "normal", "poisson"];
      case "adresse":
      case "straße":
      case "stadt":
      case "land":
      case "email":
      case "telefon":
        return ["categorical"]; // ✅ Neue Feldtypen
      default:
        return ["normal", "uniform", "gamma"];
    }
  };

  // Input-Type erweitert
  const getInputType = () => {
    if (fieldType.toLowerCase() === "date") return "date";
    if (["integer", "körpergröße", "alter", "plz", "hausnummer", "gewicht"].includes(fieldType.toLowerCase())) 
      return "number";
    return "text";
  };

  // ✅ NEU: Verbesserte Platzhalter für mimesis-Typen
  const getPlaceholder = (distribution: string, paramKey: string) => {
    const fieldTypeLower = fieldType.toLowerCase();
    
    if (fieldTypeLower === "date") return "TT.MM.JJJJ";

    if (["körpergröße", "integer", "alter", "plz", "hausnummer", "gewicht"].includes(fieldTypeLower)) {
      switch (distribution) {
        case "uniform":
          return paramKey === "a" ? "Minimum" : "Maximum";
        case "normal":
          return paramKey === "a" ? "Mittelwert (μ)" : "Std.Abweichung (σ)";
        case "poisson":
          return "Durchschnitt (λ)";
        default:
          return paramKey === "a" ? "Parameter A" : "Parameter B";
      }
    }

    if (["name", "vorname", "nachname", "vollständigername", "geschlecht", "adresse", "straße", "stadt", "land", "email", "telefon"].includes(fieldTypeLower)) {
      if (distribution === "categorical")
        return paramKey === "a" ? "Werte (mit Komma)" : "Gewichte (mit Komma)";
    }

    return paramKey === "a" ? "Parameter A" : "Parameter B";
  };

  // Verteilungsnamen für die Anzeige
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

  // Soll Parameter B angezeigt werden?
  const shouldShowParameterB = (distribution: string) => {
    if (distribution === "exponential") return false;
    if (distribution === "poisson") return false;
    if (["name", "vorname", "nachname", "geschlecht", "adresse", "straße", "stadt", "land", "email", "telefon"].includes(fieldType.toLowerCase()) && 
        distribution === "categorical") {
      return true; // ✅ Bei kategorialen Verteilungen für Namen etc. Parameter B für Gewichte anzeigen
    }
    return true;
  };

  // Schrittweite
  const getStepValue = () => {
    if (["körpergröße", "gewicht"].includes(fieldType.toLowerCase())) return "0.01";
    if (["integer", "alter", "plz", "hausnummer"].includes(fieldType.toLowerCase())) return "1";
    return undefined;
  };

  const allowedDistributions = getAllowedDistributions(fieldType);

  // Handler Datei-Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setColumns([]);
      setSelectedColumn("");
      setDetectionResult(null);

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
        setDetectionResult(data);

        if (data.best_distribution) {
          setForm({
            distribution: data.best_distribution,
            parameterA: data.parameters[0]?.toString() || "",
            parameterB: data.parameters[1]?.toString() || "",
            extraParams: data.parameters.slice(2).map((p: number) => p.toString()),
            nationality: form.nationality, // ✅ Nationalität beibehalten
          });
        }
      })
      .catch(() => {
        setDetectionResult(null);
      });
  };

  // Histogramm Daten vorbereiten
  const prepareChartData = () => {
    if (!detectionResult) return null;

    const values = detectionResult.values || [];
    if (values.length === 0) return null;

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const binCount = 10;
    const binWidth = (maxVal - minVal) / binCount;

    const bins: number[] = [];
    for (let i = 0; i < binCount; i++) {
      bins.push(minVal + i * binWidth);
    }

    const histCounts = new Array(binCount).fill(0);
    values.forEach((v) => {
      let idx = Math.floor((v - minVal) / binWidth);
      if (idx === binCount) idx = binCount - 1;
      if (idx >= 0 && idx < binCount) histCounts[idx]++;
    });

    const fitCurve = calculateFitCurve(
      detectionResult.best_distribution || detectionResult.distribution || "",
      detectionResult.parameters,
      bins,
      values.length
    );

    const labels = bins.map((b) => {
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

        {/* Option 1 */}
        <div className="row mb-3">
          <div className="col-12">
            <h5 className="fw-bold">Option 1: Manuelle Verteilungskonfiguration</h5>
          </div>
        </div>

        <div className="row mb-4 align-items-center">
          {/* Auswahl der Verteilung */}
          <div className="col-4">
            <select
              className="form-select"
              value={form.distribution}
              onChange={(e) => {
                const dist = e.target.value;
                setForm({
                  ...form,
                  distribution: dist,
                  parameterA: "",
                  parameterB: "",
                  extraParams: [],
                });
              }}
              disabled={allowedDistributions.length === 0}
            >
              <option value="">Verteilung wählen</option>
              {allowedDistributions.map((dist) => (
                <option key={dist} value={dist}>
                  {getDistributionLabel(dist)}
                </option>
              ))}
            </select>
          </div>

          {/* Hauptparameter */}
          {form.distribution && (
            <>
              <div className="col-3 ms-2">
                <input
                  className="form-control"
                  type={getInputType()}
                  value={form.parameterA}
                  onChange={(e) => setForm({ ...form, parameterA: e.target.value })}
                  placeholder={getPlaceholder(form.distribution, "a")}
                  step={getStepValue()}
                  style={{ minWidth: "200px" }}
                />
              </div>

              {shouldShowParameterB(form.distribution) && (
                <div className="col-3 ms-2">
                  <input
                    className="form-control"
                    type={getInputType()}
                    value={form.parameterB}
                    onChange={(e) => setForm({ ...form, parameterB: e.target.value })}
                    placeholder={getPlaceholder(form.distribution, "b")}
                    step={getStepValue()}
                    style={{ minWidth: "200px" }}
                  />
                </div>
              )}
            </>
          )}

          {/* Dynamische Zusatzparameter */}
          {(form.extraParams || []).map((param: any, idx: any) => (
            <div className="col-3 d-flex align-items-center ms-2" key={idx}>
              <input
                className="form-control"
                type="text"
                value={param}
                onChange={(e) => handleExtraParamChange(idx, e.target.value)}
                placeholder={`Zusatzparameter ${idx + 1}`}
                style={{ minWidth: "150px" }}
              />
              <button
                className="btn ms-1"
                style={{
                  backgroundColor: "rgb(115, 67, 131)",
                  color: "white",
                  fontSize: 20,
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
                onClick={() => {
                  const newExtraParams = [...(form.extraParams || [])];
                  newExtraParams.splice(idx, 1);
                  setForm({ ...form, extraParams: newExtraParams });
                }}
                title="Parameter entfernen"
              >
                ×
              </button>
            </div>
          ))}

          {/* Weiteren Parameter hinzufügen */}
          {form.distribution && (
            <div className="col-1 ms-2">
              <button
                className="btn"
                style={{
                  backgroundColor: "rgb(115, 67, 131)",
                  color: "white",
                  fontSize: 20,
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={handleAddExtraParam}
                title="Weiteren Parameter hinzufügen"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Option 2: Datei-Upload */}
        <div className="row mb-3">
          <div className="col-12">
            <h5 className="fw-bold">Option 2: Verteilung aus Datei erkennen</h5>
          </div>
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
                  detectionResult.best_distribution || detectionResult.distribution || ""
                )}
              </h6>
              <p>
                Parameter: {detectionResult.parameters.map((p) => p.toString()).join(", ")} <br />
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
            onClick={() => onSave({
              ...form,
            })}
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