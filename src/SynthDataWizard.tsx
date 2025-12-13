import { useEffect } from "react";
import { useMemo, useState, useRef } from "react";
interface SynthDataWizardProps {
  profileId: string;
}
import axios from "axios";
import logo from "./assets/logo.png";
import { DistributionModal } from "./components/DistributionModal";
import { FileUploadModal } from "./components/FileUploadModal";
import { SortableFieldRow } from "./components/SortableFieldRow";
import { FieldTableHeader } from "./components/FieldTableHeader";
import { ExportOptions } from "./components/ExportOptions";
import { CustomDistributionCanvas } from "./components/CustomDistributionCanvas";
import { DependencyDistributionModal } from "./components/DependencyDistributionModal";
import { useCases, FieldType, getDefaultValuesForType, getLabelForType } from "./types/fieldTypes";
import { ValueListModal } from "./components/ValueListModal";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
// -------------------- Typen & Helpers --------------------

// Use Cases werden jetzt im UseCaseModal verwaltet

export type ValueSource = "default" | "custom";

export type Row = {
  id: string;
  // 'name' ist der frei editierbare Feldname (z.B. "vorname", "email" oder beliebiger Label).
  // Wichtig: Der Name wird hauptsächlich zur Anzeige und als Referenz für Abhängigkeiten verwendet,
  // nicht um das Verhalten/UseCase zu bestimmen.
  name: string;

  // 'type' ist der FELDTYP und bestimmt das Verhalten, die verfügbaren Verteilungen
  // und welche UseCase-ID später verwendet wird. Der Typ ist die entscheidende Information
  // für Logik/Export, nicht der Name.
  type: FieldType;

  // 'dependency' speichert gegebenenfalls den Namen eines anderen Feldes, von dem dieses Feld abhängt.
  dependency: string;

  distributionConfig: {
    distribution: string;
    parameterA: string;
    parameterB: string;
    extraParams?: string[];
    dependency?: string;
  };

  // NEU: für Felder mit auswählbarer Werteliste (z. B. Containertyp, Service-Route)
  valueSource?: ValueSource;   // "default" = unsere Liste, "custom" = eigene Liste des Users
  customValues?: string[];     // vom User definierte Werte
};


const makeDefaultRow = (): Row => ({
  id: `${Date.now()}-${Math.random()}`,
  // Standardname leer: der User kann hier beliebigen Text eingeben.
  name: "",
  // Standard-Feldtyp ist leer, bis der User einen Feldtyp wählt.
  type: "" as FieldType,
  dependency: "",
  distributionConfig: {
    distribution: "",
    parameterA: "",
    parameterB: "",
    extraParams: [],
    dependency: "",
  },
  valueSource: "default",
  customValues: [],
});


// -------------------- Komponente --------------------

export const SynthDataWizard: React.FC<SynthDataWizardProps> = ({ profileId }) => {
  const [rows, setRows] = useState<Row[]>([
    makeDefaultRow(),
    makeDefaultRow(),
    makeDefaultRow(),
  ]);
  console.log("Aktives Profil:", profileId);

  // States
  const [rowCount, setRowCount] = useState<number>(10);
  const [format, setFormat] = useState<string>("CSV");
  const [lineEnding, setLineEnding] = useState<string>("Windows(CRLF)");
  const [showModal, setShowModal] = useState<boolean>(false);
  // Upload-Modal (bestehende Funktionalität)
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null)
    // NEU: Wertelisten-Editor (Stift)
  const [showValueListModal, setShowValueListModal] = useState(false);
  const [valueListRowIdx, setValueListRowIdx] = useState<number | null>(null);

  // State for custom draw modal
  const [showCustomDraw, setShowCustomDraw] = useState<boolean>(false);
  const [ activeFieldIndex, setActiveFieldIndex] = useState<number | null>(null);
  // Handler for opening custom draw modal
  const handleCustomDraw = (idx: number) => {
    setActiveFieldIndex(idx);
    setShowCustomDraw(true);
  };

  // Handler for saving from custom draw modal
  const handleCustomDrawSave = (data: any) => {
    // Log the data
    console.log("Custom distribution saved:", data);
    setShowCustomDraw(false);
    setActiveFieldIndex(null);
  };

  const sensors = useSensors(useSensor(PointerSensor));
  const [showDepModal, setShowDepModal] = useState(false);
  const [depModalRowIdx, setDepModalRowIdx] = useState<number | null>(null);
  const [depTargetName, setDepTargetName] = useState<string>("");
  const [depTargetType, setDepTargetType] = useState<string>("");

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setRows((prev) => {
      const oldIndex = prev.findIndex((r) => r.id === active.id);
      const newIndex = prev.findIndex((r) => r.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleAddRow = () =>
    setRows((prev) => [...prev, makeDefaultRow()]);

  // Beim Ändern einer Zelle werden die Werte direkt in 'rows' gesetzt.
  // KEINE Validierung des Feldnamens hier — der User kann beliebigen Text im 'name' eingeben.
  // Entscheidend für das Verhalten ist weiterhin 'type'.
  const handleRowChange = (idx: number, field: string, value: any) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value } as Row;
      return next;
    });
  };

  const handleDeleteRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleOpenModal = (idx: number) => {
    setActiveRowIdx(idx);
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setActiveRowIdx(null);
  };

  const openUploadModal = (idx:number) => {
    setActiveRowIdx(idx)
    setShowUploadModal(true)
  }

  const closeUploadModal = () => {
    setShowUploadModal(false)
    setActiveRowIdx(null)
  }

  const handleSaveDistribution = (distributionData: any) => {
    if (activeRowIdx === null) return;
    setRows((prev) => {
      const next = [...prev];
      next[activeRowIdx] = {
        ...next[activeRowIdx],
        distributionConfig: { 
          ...distributionData,
        },
        // Falls die Distribution eine Abhängigkeit enthält, speichern wir diese auch als top-level 'dependency'
        dependency:
          distributionData?.dependency ?? next[activeRowIdx].dependency ?? "",
      };
      return next;
    });
    setShowModal(false);
    setActiveRowIdx(null);
  };

  const handleOpenDependencyModal = (rowIdx: number) => {
    // Die Abhängigkeit wird über den FELDNAMEN referenziert (nicht über den Feldtyp).
    // Hier wird aus dem dependency-String der erste Name extrahiert — dieser Name muss
    // mit einem existierenden rows[].name übereinstimmen, damit die Abhängigkeit funktioniert.
    const depRaw = (rows[rowIdx].dependency || "").split(",")[0]?.trim() || "";
    if (!depRaw) {
      alert("Bitte zuerst eine Abhängigkeit wählen.");
      return;
    }
    // Suche das Zielfeld per Name
    const targetIdx = rows.findIndex((r) => r.name === depRaw);
    // Für das Modal geben wir neben dem Namen auch den Typ des Targets mit — der Typ bestimmt dann,
    // welche Verteilungen für das Ziel sinnvoll sind (z.B. 'geschlecht' hat Wahrscheinlichkeiten).
    const targetType = targetIdx !== -1 ? rows[targetIdx].type : "";
    setDepModalRowIdx(rowIdx);
    setDepTargetName(depRaw);
    setDepTargetType(targetType);
    setShowDepModal(true);
  };
    const handleOpenValueListModal = (rowIdx: number) => {
    setValueListRowIdx(rowIdx);
    setShowValueListModal(true);
  };

  const handleCloseValueListModal = () => {
    setShowValueListModal(false);
    setValueListRowIdx(null);
  };

  const handleSaveValueList = (valueSource: "default" | "custom", customValues: string[]) => {
    if (valueListRowIdx === null) return;
    setRows((prev) => {
      const next = [...prev];
      next[valueListRowIdx] = {
        ...next[valueListRowIdx],
        valueSource,
        customValues,
      };
      return next;
    });
    setShowValueListModal(false);
    setValueListRowIdx(null);
  };

  const handleEditValuesFromUseCaseModal = (rowIdx: number, fieldType: FieldType, newValues: string[]) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIdx] = {
        ...next[rowIdx],
        type: fieldType,
        valueSource: newValues.length ? "custom" : "default",
        customValues: newValues,
      };
      return next;
    });
  };

  const handleCloseDepModal = () => {
    setShowDepModal(false);
    setDepModalRowIdx(null);
    setDepTargetName("");
    setDepTargetType("");
  };

  // NEU: Speichert die vom Modal definierte Verteilung auf das Target-Feld (so wird z.B. 'geschlecht' auf 80/20 gesetzt)
  const handleSaveDependencyDistribution = (distConfig: any) => {
    // distConfig: { distribution, parameterA, parameterB, ... }
    if (!depTargetName) {
      handleCloseDepModal();
      return;
    }
    setRows((prev) => {
      const next = [...prev];
      // Ziel wird per FELDNAME gefunden
      const targetIdx = next.findIndex((r) => r.name === depTargetName);
      if (targetIdx !== -1) {
        // Auf dem Ziel-Feld die Konfiguration ergänzen
        next[targetIdx] = {
          ...next[targetIdx],
          distributionConfig: {
            ...next[targetIdx].distributionConfig,
            ...distConfig,
          },
        };
        // Und sicherstellen, dass das anfragende Feld die dependency als Namen recorded.
        // WICHTIG: die Verknüpfung zwischen Feldern läuft über Namen, nicht über Typen.
        if (depModalRowIdx !== null && next[depModalRowIdx]) {
          next[depModalRowIdx] = {
            ...next[depModalRowIdx],
            dependency: depTargetName,
          };
        }
      } else if (depModalRowIdx !== null) {
        // Fallback: wenn Zielname nicht existiert, speichern wir die Konfig beim anfragenden Row
        next[depModalRowIdx] = {
          ...next[depModalRowIdx],
          distributionConfig: {
            ...next[depModalRowIdx].distributionConfig,
            ...distConfig,
          },
          // Auch hier wird die Abhängigkeit als Name gespeichert.
          dependency: depTargetName || next[depModalRowIdx].dependency,
        };
      }
      return next;
    });
    handleCloseDepModal();
  }; 

  // Diese Funktion mappt einen FELDTYP (type) auf die passende UseCase-ID.
  // WICHTIG: Hier wird ausschliesslich 'type' (nicht 'name') verwendet, um zu entscheiden,
  // welche UseCase(s) für den Export relevant sind.
  const getUseCaseIdForFieldType = (fieldType: FieldType): string | null => {
    for (const uc of useCases) {
      if (uc.fields && uc.fields.some((field: any) => field.value === fieldType)) {
        return uc.id;
      }
      if (uc.fieldGroups) {
        for (const g of uc.fieldGroups) {
          if (g.fields.some((field: any) => field.value === fieldType)) {
            return uc.id;
          }
        }
      }
    }
    return null;
  };


  const handleExport = async () => {
    try {
      // Hinzufügen der Use Case ID zum Export-Objekt
      // Hier werden ALLE Feldtypen gesammelt und dann auf UseCase-IDs gemappt.
      // Das bedeutet: selbst wenn der Benutzer dem Feld einen beliebigen Namen gegeben hat,
      // entscheidet der FELDTYP (rows[].type) welche UseCases gebraucht werden.
      const allFieldTypes = rows.map(row => row.type)

      // Filtern der eindeutigen Use Case IDs, die tatsächlich verwendet werden
      const usedUseCaseIds = Array.from(new Set(
        allFieldTypes
          .map(getUseCaseIdForFieldType)
          .filter(Boolean) as string[]
      ))
      
      const exportData = {
        rows: rows.map(r => ({
          id: r.id,
          name: r.name,
          type: r.type,
          dependency: r.dependency,
          distributionConfig: r.distributionConfig,
          valueSource: r.valueSource ?? "default",
          customValues: r.customValues ?? []
        })),
        rowCount,
        format,
        lineEnding,
        usedUseCaseIds
      };

      const response = await axios.post(
        "http://localhost:8000/api/export",
        exportData,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // NEU: Dateiname mit Timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `synthdata_${timestamp}.` + exportData.format.toLowerCase();
      
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Fehler beim Export:", error);
      alert("Fehler beim Exportieren");
    }
  };

  // Alle aktuell eingegebenen Feldnamen (ohne leere) → für das Dropdown
  // Hinweis: Das Dropdown zeigt FELDNAMEN zur Auswahl an (z.B. für Dependencies).
  // Diese Liste dient rein zur Auswahl/Anzeige — die eigentliche Logik nutzt den FELDTYP.
  const allFieldNames = useMemo(() => {
    const names = rows
      .map((r) => (r.name || "").trim())
      .filter((n) => n.length > 0);
    return Array.from(new Set(names));
  }, [rows]);

  // ===================== Profileinstellungen speichern & laden =====================

  // Beim Laden: vorhandene Einstellungen aus dem Backend holen
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/profiles/${profileId}/data`);
        if (res.data?.data) {
          const d = res.data.data;
          if (d.rows) setRows(d.rows);
          if (d.rowCount) setRowCount(d.rowCount);
          if (d.format) setFormat(d.format);
          if (d.lineEnding) setLineEnding(d.lineEnding);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Profildaten:", err);
      }
    };
    if (profileId) fetchProfileData();
  }, [profileId]);

  // NEU: State für letzten Speicherzeitpunkt
  // Letzter Speicherzeitpunkt
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  // Ref für den letzten gespeicherten JSON-String
  const lastSavedDataRef = useRef<string>("");

  // Beim Ändern: automatisch speichern mit Debounce und Vergleich
  useEffect(() => {
    if (!profileId) return;

    const currentData = JSON.stringify({ rows, rowCount, format, lineEnding });
    if (currentData === lastSavedDataRef.current) {
      // Keine Änderung seit letztem Speichern
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        await axios.post(`http://localhost:8000/profiles/${profileId}/data`, {
          rows,
          rowCount,
          format,
          lineEnding,
        });
        lastSavedDataRef.current = currentData;
        setLastSaved(new Date());
        console.log(" Profil-Daten gespeichert");
      } catch (err) {
        console.error("Fehler beim Speichern der Profildaten:", err);
      }
    }, 1000); // speichert nach 1 Sekunde Inaktivität

    return () => clearTimeout(timeout);
  }, [rows, rowCount, format, lineEnding, profileId]);

  return (
    <div
      className="px-5 py-5 text-white"
      style={{
        overflowX: "auto",
        overflowY: "auto",
        background: "rgb(31, 53, 88)",
        minHeight: "100vh",
      }}
    >
      {/* Kopf */}
      <div className="d-flex align-items-center mb-4">
        <img src={logo} alt="SynthData Wizard Logo" height={110} />
        <div>
          <h3 className="ms-3">
            SynthData
            <br />
            <span style={{ color: "rgb(229, 67, 244)" }}>Wizard</span>
          </h3>
          {/* Beschreibung entfernt auf Wunsch */}
        </div>
      </div>

      
      <FieldTableHeader />

      {/* NEU: DnD-Wrapper + SortableContext */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          {rows.map((row, idx) => (
            <SortableFieldRow
              key={row.id}
              id={row.id}
              row={row}
              idx={idx}
              onChange={handleRowChange}
              onOpenModal={() => handleOpenModal(idx)}
              onOpenDependencyModal={() => handleOpenDependencyModal(idx)}
              handleDeleteRow={handleDeleteRow}
              allFieldNames={allFieldNames}
              onCustomDraw={() => handleCustomDraw(idx)}
              onOpenUploadModal={() => openUploadModal(idx)}
              onOpenValueEditor={handleOpenValueListModal}
              onEditValuesFromUseCaseModal={(fieldType, newValues) =>
                handleEditValuesFromUseCaseModal(idx, fieldType, newValues)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Modal */}
      {activeRowIdx !== null && (
        <DistributionModal
          show={showModal}
          onClose={handleCloseModal}
          onSave={handleSaveDistribution}
          initialData={rows[activeRowIdx].distributionConfig}
          fieldType={rows[activeRowIdx].type}
          allFieldNames={allFieldNames}
        />
      )}

      {showDepModal && depModalRowIdx !== null && (
        <DependencyDistributionModal
          show={showDepModal}
          onClose={handleCloseDepModal}
          onSave={handleSaveDependencyDistribution}
          targetName={depTargetName}
          targetType={depTargetType}
          initialData={
            // falls Ziel-Feld existiert, übergebe dessen aktuelle config
            (() => {
              const t = rows.find((r) => r.name === depTargetName);
              return t ? t.distributionConfig : undefined;
            })()
          }
        />
      )}

      {/* Upload Modal */}
      {activeRowIdx !== null && (
        <FileUploadModal
          show={showUploadModal}
          onClose={closeUploadModal}
          onSave={handleSaveDistribution}
          initialData={rows[activeRowIdx].distributionConfig}
          fieldType={rows[activeRowIdx].type}
        />
      )}

      {/* Wertelisten-Editor (Stift) */}
      {showValueListModal && valueListRowIdx !== null && (
        <ValueListModal
          show={showValueListModal}
          onClose={handleCloseValueListModal}
          fieldLabel={
            rows[valueListRowIdx].name ||
            getLabelForType(rows[valueListRowIdx].type)
          }
          defaultValues={getDefaultValuesForType(rows[valueListRowIdx].type)}
          valueSource={rows[valueListRowIdx].valueSource ?? "default"}
          customValues={rows[valueListRowIdx].customValues ?? []}
          onSave={handleSaveValueList}
        />
      )}

      {/* Neue Reihe */}
      <div className="mb-4 px-3">
        <button className="btn btn-outline-light" onClick={handleAddRow}>
          + Neue Reihe
        </button>
      </div>

      {/* Export-Optionen */}
      <ExportOptions
        rowCount={rowCount}
        setRowCount={setRowCount}
        format={format}
        setFormat={setFormat}
        lineEnding={lineEnding}
        setLineEnding={setLineEnding}
      />

      {/* Export */}
      <div className="flex-nowrap" style={{ overflowX: "auto", minWidth: 1200 }}>
        <button
          className="btn btn-lg px-4"
          style={{ backgroundColor: "rgb(115, 67, 131)", color: "white" }}
          onClick={handleExport}
        >
          Exportieren
        </button>
        
      </div>
      {/* Anzeige des letzten Speicherzeitpunkts */}
      <div className="mt-2" style={{ color: "#ccc", fontSize: "0.9em" }}>
        {lastSaved ? `Zuletzt gespeichert: ${lastSaved.toLocaleTimeString()}` : "Noch nicht gespeichert"}
      </div>
      {/* Custom Distribution Modal */}
      {showCustomDraw && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#22304f",
              padding: "32px 24px",
              borderRadius: "16px",
              minWidth: 350,
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)"
            }}
          >
            <CustomDistributionCanvas
              onSave={handleCustomDrawSave}
              // Weitere relevante Props je nach Bedarf
            />
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button
                className="btn btn-outline-light"
                onClick={() => {
                  setShowCustomDraw(false);
                  setActiveFieldIndex(null);
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};