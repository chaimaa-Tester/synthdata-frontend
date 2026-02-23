/**
 * Projekt: SynthData Wizard
 * Datei: SynthDataWizard.tsx
 * Autor: CHAIMAA KARIOUI
 * Autor: JAN KRÄMER
 *
 * Beschreibung:
 * Zentrale React-Komponente der Anwendung (Wizard-Ansicht).
 * Der Nutzer konfiguriert hier Datenfelder (Name, Typ, Verteilung, Abhängigkeiten, Wertelisten),
 * kann Reihen per Drag & Drop sortieren, Profile laden/automatisch speichern und Datensätze exportieren.
 *
 * Struktur:
 * - Typdefinitionen (Props, Row, ValueSource)
 * - Helper zur Initialisierung einer Default-Reihe
 * - State-Management für UI, Modals, Exportoptionen und XLSX-Sheets
 * - Handler-Funktionen für Interaktionen (Add/Delete/Change, Modals, Export, Profil Laden/Speichern)
 * - Rendering der UI inkl. dnd-kit, Modals und Export-Section
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import logo from "./assets/logo.png";

import { DistributionModal } from "./components/DistributionModal";
import { FileUploadModal } from "./components/FileUploadModal";
import { SortableFieldRow } from "./components/SortableFieldRow";
import { FieldTableHeader } from "./components/FieldTableHeader";
import { ExportOptions } from "./components/ExportOptions";
import {
  useCases,
  FieldType,
  getDefaultValuesForType,
  getLabelForType,
} from "./types/fieldTypes";
import { ValueListModal } from "./components/ValueListModal";
import { CustomDistributionCanvas } from "./components/CustomDistributionCanvas";
import { DependencyDistributionModal } from "./components/DependencyDistributionModal";
import { SheetManager } from "./types/SheetManager";
import type { ExportSheet } from "./types/SheetManager";

// dnd-kit
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

/**
 * SynthDataWizardProps
 *
 * Zweck:
 * Definiert die Eingabeparameter (Props) der Hauptkomponente.
 *
 * @property profileId          ID des aktuell aktiven Profils (für Laden/Speichern).
 * @property onOpenProfileModal Optionaler Callback zum Öffnen des Profil-Dialogs.
 */
interface SynthDataWizardProps {
  profileId: string;
  onOpenProfileModal?: () => void;
}

/**
 * ValueSource
 *
 * Zweck:
 * Markiert, ob die Werteliste eines Feldes aus Default-Werten stammt
 * oder vom Nutzer individuell definiert wurde.
 */
export type ValueSource = "default" | "custom";

/**
 * Row
 *
 * Zweck:
 * Repräsentiert eine Tabellenzeile / Felddefinition im Wizard.
 *
 * Felder:
 * @property id                 Eindeutige ID der Zeile (wichtig für React-Keys und dnd-kit).
 * @property name               Nutzerdefinierter Feldname (Spaltenname im Export).
 * @property type               Feldtyp (aus zentralen FieldType-Definitionen).
 * @property dependency         Abhängigkeit zu einem anderen Feld (z. B. BMI hängt von Größe/Gewicht ab).
 * @property distributionConfig Parameterisierung der Verteilung/Generatorlogik.
 * @property valueSource        Quelle der Werteliste (default/custom).
 * @property customValues       Nutzerdefinierte Werte (wenn valueSource="custom").
 */
export type Row = {
  id: string;
  name: string;
  type: FieldType;
  dependency: string;

  distributionConfig: {
    distribution: string;
    parameterA: string;
    parameterB: string;
    extraParams?: string[];
    dependency?: string;
    name_source?: "western" | "regional";
    country?: string;
  };

  valueSource?: ValueSource;
  customValues?: string[];
};

/**
 * makeDefaultRow
 *
 * Zweck:
 * Erzeugt eine neue, leere Standardzeile für den Wizard.
 *
 * Implementierung:
 * - id basiert auf Date.now() + Math.random(), um schnelle Kollisionen zu vermeiden.
 * - type ist initial leer (cast auf FieldType, weil UI später setzt).
 * - distributionConfig wird initial als leere Struktur angelegt.
 */
const makeDefaultRow = (): Row => ({
  id: `${Date.now()}-${Math.random()}`,
  name: "",
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

// -------------------- Hauptkomponente --------------------

/**
 * SynthDataWizard
 *
 * Zweck:
 * Zentrale UI für die Konfiguration synthetischer Daten und Export.
 *
 * Implementierungsübersicht:
 * - rows verwaltet alle Felddefinitionen
 * - Modals (Distribution, Upload, Dependency, ValueList, CustomDraw) sind zustandsbasiert
 * - Drag & Drop Sortierung erfolgt über dnd-kit (arrayMove)
 * - Profil-Laden via GET, Auto-Speichern via POST mit Debounce
 * - Export sendet Konfiguration an Backend und lädt die Datei als Blob herunter
 */
export const SynthDataWizard: React.FC<SynthDataWizardProps> = ({
  profileId,
  onOpenProfileModal,
}) => {
  // -------------------- State: Zeilen und Exportoptionen --------------------

  /**
   * rows
   *
   * Zweck:
   * Enthält alle konfigurierten Feldzeilen. Initial werden drei leere Zeilen angelegt.
   */
  const [rows, setRows] = useState<Row[]>([
    makeDefaultRow(),
    makeDefaultRow(),
    makeDefaultRow(),
  ]);

  /**
   * rowCount / format / lineEnding
   *
   * Zweck:
   * Globale Exportoptionen:
   * - rowCount: Anzahl zu generierender Datensätze
   * - format: Exportformat (z. B. CSV/XLSX)
   * - lineEnding: Zeilenendungen (Windows CRLF, etc.)
   */
  const [rowCount, setRowCount] = useState<number>(10);
  const [format, setFormat] = useState<string>("CSV");
  const [lineEnding, setLineEnding] = useState<string>("Windows(CRLF)");

  // -------------------- State: Modal-Steuerung --------------------

  /**
   * showModal / showUploadModal / activeRowIdx
   *
   * Zweck:
   * Steuert die Anzeige der Modals für Verteilungen und Upload.
   * activeRowIdx definiert, welche Zeile gerade bearbeitet wird.
   */
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);

  /**
   * showValueListModal / valueListRowIdx
   *
   * Zweck:
   * Steuert die Anzeige des ValueListModals (Default- oder Custom-Werte).
   */
  const [showValueListModal, setShowValueListModal] = useState(false);
  const [valueListRowIdx, setValueListRowIdx] = useState<number | null>(null);

  /**
   * showCustomDraw / activeFieldIndex
   *
   * Zweck:
   * Steuert die Anzeige der Zeichenfläche für eine benutzerdefinierte Verteilung.
   */
  const [showCustomDraw, setShowCustomDraw] = useState<boolean>(false);
  const [_activeFieldIndex, setActiveFieldIndex] = useState<number | null>(null);

  // -------------------- State: XLSX Sheet-Konfiguration --------------------

  /**
   * sheets
   *
   * Zweck:
   * Konfiguration mehrerer Sheets für XLSX-Export.
   * Initial ist ein fixiertes Sheet "Daten" vorhanden, das nicht editierbar ist.
   */
  const [sheets, setSheets] = useState<ExportSheet[]>(() => [
    {
      id: "data",
      name: "Daten",
      fieldNames: [],
      locked: true,
    },
  ]);

  // -------------------- Handler: Custom-Draw --------------------

  /**
   * handleCustomDraw
   *
   * Zweck:
   * Öffnet die Zeichenfläche (CustomDistributionCanvas) für eine bestimmte Zeile.
   *
   * @param idx Index der Zeile, für die gezeichnet werden soll.
   */
  const handleCustomDraw = (idx: number) => {
    setActiveFieldIndex(idx);
    setShowCustomDraw(true);
  };

  /**
   * handleCustomDrawSave
   *
   * Zweck:
   * Callback nach dem Speichern einer gezeichneten Verteilung.
   * Schließt die Zeichenfläche und setzt den aktiven Index zurück.
   *
   * @param data Ergebnisdaten aus der Zeichenfläche (strukturabhängig vom Canvas).
   */
  const handleCustomDrawSave = (data: any) => {
    console.log("Custom distribution saved:", data);
    setShowCustomDraw(false);
    setActiveFieldIndex(null);
  };

  // -------------------- Drag & Drop (dnd-kit) --------------------

  /**
   * sensors
   *
   * Zweck:
   * Initialisiert PointerSensor für Drag & Drop Interaktionen.
   */
  const sensors = useSensors(useSensor(PointerSensor));

  /**
   * handleDragEnd
   *
   * Zweck:
   * Wird ausgelöst, wenn ein Drag & Drop Vorgang beendet wurde.
   * Sortiert rows entsprechend der neuen Position (arrayMove).
   *
   * Implementierungsdetails:
   * - Prüft, ob ein gültiges "over"-Target existiert
   * - Bestimmt Quell- und Zielindex über IDs
   * - Reorder über arrayMove() aus dnd-kit/sortable
   *
   * @param event DragEndEvent von dnd-kit.
   */
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

  // -------------------- Handler: CRUD auf rows --------------------

  /**
   * handleAddRow
   *
   * Zweck:
   * Fügt eine neue leere Zeile hinzu.
   */
  const handleAddRow = () => setRows((prev) => [...prev, makeDefaultRow()]);

  /**
   * handleRowChange
   *
   * Zweck:
   * Aktualisiert ein Feld einer bestimmten Zeile.
   *
   * Implementierung:
   * - kopiert rows in ein neues Array
   * - überschreibt das Feld in next[idx]
   *
   * @param idx   Index der Zeile.
   * @param field Name des zu ändernden Feldes (z. B. "name", "type", "dependency").
   * @param value Neuer Wert.
   */
  const handleRowChange = (idx: number, field: string, value: any) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value } as Row;
      return next;
    });
  };

  /**
   * handleDeleteRow
   *
   * Zweck:
   * Löscht eine Zeile anhand ihres Index.
   *
   * @param idx Index der zu löschenden Zeile.
   */
  const handleDeleteRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  // -------------------- Handler: Distribution-Modal --------------------

  /**
   * handleOpenModal
   *
   * Zweck:
   * Öffnet das DistributionModal für eine Zeile.
   *
   * @param idx Index der Zeile.
   */
  const handleOpenModal = (idx: number) => {
    setActiveRowIdx(idx);
    setShowModal(true);
  };

  /**
   * handleCloseModal
   *
   * Zweck:
   * Schließt das DistributionModal und setzt activeRowIdx zurück.
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setActiveRowIdx(null);
  };

  /**
   * openUploadModal
   *
   * Zweck:
   * Öffnet das FileUploadModal für eine Zeile.
   *
   * @param idx Index der Zeile.
   */
  const openUploadModal = (idx: number) => {
    setActiveRowIdx(idx);
    setShowUploadModal(true);
  };

  /**
   * closeUploadModal
   *
   * Zweck:
   * Schließt das FileUploadModal und setzt activeRowIdx zurück.
   */
  const closeUploadModal = () => {
    setShowUploadModal(false);
    setActiveRowIdx(null);
  };

  /**
   * handleSaveDistribution
   *
   * Zweck:
   * Speichert die Verteilungskonfiguration (distributionConfig) in der aktiven Zeile.
   *
   * Implementierungsdetails:
   * - Wenn activeRowIdx null ist, wird abgebrochen.
   * - distributionConfig wird gesetzt/überschrieben.
   * - name_source und country werden dabei beibehalten, falls sie im neuen Objekt fehlen
   *   (Fallback auf vorhandene Werte).
   * - dependency wird ebenfalls aktualisiert (Fallback auf bestehende Werte).
   * - danach wird das Modal geschlossen und activeRowIdx zurückgesetzt.
   *
   * @param distributionData Datenobjekt aus dem DistributionModal.
   */
  const handleSaveDistribution = (distributionData: any) => {
    if (activeRowIdx === null) return;

    setRows((prev) => {
      const next = [...prev];
      next[activeRowIdx] = {
        ...next[activeRowIdx],
        distributionConfig: {
          ...distributionData,
          name_source:
            distributionData.name_source ||
            next[activeRowIdx].distributionConfig?.name_source,
          country:
            distributionData.country ||
            next[activeRowIdx].distributionConfig?.country,
        },
        dependency:
          distributionData?.dependency ?? next[activeRowIdx].dependency ?? "",
      };
      return next;
    });

    setShowModal(false);
    setActiveRowIdx(null);
  };

  // -------------------- Handler: Dependency-Modal --------------------

  /**
   * showDepModal / depModalRowIdx / depTargetName / depTargetType
   *
   * Zweck:
   * Zustände für das DependencyDistributionModal.
   * - depTargetName/depTargetType definieren das Ziel-Feld, auf das sich die Abhängigkeit bezieht.
   */
  const [showDepModal, setShowDepModal] = useState(false);
  const [depModalRowIdx, setDepModalRowIdx] = useState<number | null>(null);
  const [depTargetName, setDepTargetName] = useState<string>("");
  const [depTargetType, setDepTargetType] = useState<string>("");

  /**
   * handleOpenDependencyModal
   *
   * Zweck:
   * Öffnet das DependencyDistributionModal für eine Zeile.
   *
   * Implementierungsdetails:
   * - Liest dependency aus der Zeile, nutzt nur den ersten Eintrag (vor erstem Komma)
   * - Sucht die Zielzeile über Namen (r.name === depRaw)
   * - Setzt depTargetType anhand des gefundenen Feldtyps
   * - Öffnet das Modal
   *
   * @param rowIdx Index der Zeile, die eine Abhängigkeit definieren soll.
   */
  const handleOpenDependencyModal = (rowIdx: number) => {
    const depRaw = (rows[rowIdx].dependency || "").split(",")[0]?.trim() || "";
    if (!depRaw) {
      alert("Bitte zuerst eine Abhängigkeit wählen.");
      return;
    }

    const targetIdx = rows.findIndex((r) => r.name === depRaw);
    const targetType = targetIdx !== -1 ? rows[targetIdx].type : "";

    setDepModalRowIdx(rowIdx);
    setDepTargetName(depRaw);
    setDepTargetType(targetType);
    setShowDepModal(true);
  };

  /**
   * handleCloseDepModal
   *
   * Zweck:
   * Schließt das DependencyDistributionModal und setzt die Zielzustände zurück.
   */
  const handleCloseDepModal = () => {
    setShowDepModal(false);
    setDepModalRowIdx(null);
    setDepTargetName("");
    setDepTargetType("");
  };

  /**
   * handleSaveDependencyDistribution
   *
   * Zweck:
   * Speichert eine Abhängigkeits-Verteilung in der Zielzeile bzw. in der aktiven Zeile.
   *
   * Implementierungsdetails:
   * - Wenn kein depTargetName gesetzt ist, wird abgebrochen und Modal geschlossen.
   * - Sucht Zielzeile anhand des Feldnamens (depTargetName).
   * - Falls Zielzeile existiert: distributionConfig der Zielzeile wird erweitert/überschrieben.
   * - Zusätzlich wird in der ursprünglichen Zeile (depModalRowIdx) die dependency gesetzt.
   * - Falls Zielzeile nicht existiert: distributionConfig wird in depModalRowIdx gesetzt.
   *
   * @param distConfig Verteilungskonfiguration aus dem DependencyDistributionModal.
   */
  const handleSaveDependencyDistribution = (distConfig: any) => {
    if (!depTargetName) {
      handleCloseDepModal();
      return;
    }

    setRows((prev) => {
      const next = [...prev];
      const targetIdx = next.findIndex((r) => r.name === depTargetName);

      if (targetIdx !== -1) {
        next[targetIdx] = {
          ...next[targetIdx],
          distributionConfig: {
            ...next[targetIdx].distributionConfig,
            ...distConfig,
          },
        };

        if (depModalRowIdx !== null && next[depModalRowIdx]) {
          next[depModalRowIdx] = {
            ...next[depModalRowIdx],
            dependency: depTargetName,
          };
        }
      } else if (depModalRowIdx !== null) {
        next[depModalRowIdx] = {
          ...next[depModalRowIdx],
          distributionConfig: {
            ...next[depModalRowIdx].distributionConfig,
            ...distConfig,
          },
          dependency: depTargetName || next[depModalRowIdx].dependency,
        };
      }

      return next;
    });

    handleCloseDepModal();
  };

  // -------------------- Handler: ValueList-Modal --------------------

  /**
   * handleOpenValueListModal
   *
   * Zweck:
   * Öffnet das ValueListModal für eine Zeile.
   *
   * @param rowIdx Index der Zeile.
   */
  const handleOpenValueListModal = (rowIdx: number) => {
    setValueListRowIdx(rowIdx);
    setShowValueListModal(true);
  };

  /**
   * handleCloseValueListModal
   *
   * Zweck:
   * Schließt das ValueListModal und setzt den Index zurück.
   */
  const handleCloseValueListModal = () => {
    setShowValueListModal(false);
    setValueListRowIdx(null);
  };

  /**
   * handleSaveValueList
   *
   * Zweck:
   * Speichert Default- oder Custom-Wertelisten in der aktuellen Zeile.
   *
   * @param valueSource  "default" oder "custom".
   * @param customValues Werte, die gespeichert werden sollen (nur relevant bei "custom").
   */
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

  /**
   * handleEditValuesFromUseCaseModal
   *
   * Zweck:
   * Speichert Werte, die direkt aus dem UseCaseModal übernommen/editiert wurden.
   * Setzt zusätzlich:
   * - type auf den ausgewählten Feldtyp
   * - valueSource abhängig von newValues (custom wenn Liste nicht leer)
   *
   * @param rowIdx     Index der Zeile.
   * @param fieldType  Neuer Feldtyp.
   * @param newValues  Neue Werte.
   */
  const handleEditValuesFromUseCaseModal = (
    rowIdx: number,
    fieldType: FieldType,
    newValues: string[]
  ) => {
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

  // -------------------- Helper: UseCase-ID Mapping --------------------

  /**
   * getUseCaseIdForFieldType
   *
   * Zweck:
   * Ermittelt zu einem FieldType die passende UseCase-ID aus der zentralen useCases-Konfiguration.
   *
   * Implementierungsdetails:
   * - Prüft sowohl uc.fields (flache Struktur) als auch uc.fieldGroups (gruppierte Struktur)
   * - Gibt die erste gefundene uc.id zurück, sonst null
   *
   * @param fieldType Feldtyp, der gemappt werden soll.
   * @returns UseCase-ID oder null.
   */
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

  // -------------------- Export --------------------

  /**
   * handleExport
   *
   * Zweck:
   * Erstellt das Export-Objekt (exportData), sendet es an das Backend und lädt die Datei herunter.
   *
   * Implementierungsdetails:
   * 1) Alle FieldTypes aus rows sammeln
   * 2) Daraus eindeutige usedUseCaseIds ableiten (Set), um Backend-seitig nur relevante Use Cases zu aktivieren
   * 3) exportData zusammenbauen (rows, rowCount, format, lineEnding, usedUseCaseIds, optional sheets)
   * 4) POST /api/export (responseType="blob")
   * 5) Blob in ObjectURL umwandeln und Download über temporären <a>-Link starten
   *
   * Fehlerbehandlung:
   * - console.error + alert() bei Exportfehlern
   */
  const handleExport = async () => {
    try {
      const allFieldTypes = rows.map((row) => row.type);

      const usedUseCaseIds = Array.from(
        new Set(allFieldTypes.map(getUseCaseIdForFieldType).filter(Boolean) as string[])
      );

      const exportData = {
        rows: rows.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          dependency: r.dependency,
          distributionConfig: r.distributionConfig,
          valueSource: r.valueSource ?? "default",
          customValues: r.customValues ?? [],
        })),
        rowCount,
        format,
        lineEnding,
        usedUseCaseIds,
        sheets: format.toUpperCase() === "XLSX" ? sheets : undefined,
      };

      const response = await axios.post(
        "/api/export",
        exportData,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      link.download = `synthdata_${timestamp}.` + exportData.format.toLowerCase();

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Fehler beim Export:", error);
      alert("Fehler beim Exportieren");
    }
  };

  // -------------------- Ableitungen: Feldnamen --------------------

  /**
   * allFieldNames
   *
   * Zweck:
   * Liefert eine eindeutige Liste aller aktuell vergebenen Feldnamen.
   * Wird z. B. für Dependency-Auswahl und SheetManager benötigt.
   *
   * Implementierung:
   * - trim() entfernt Leerzeichen
   * - filter entfernt leere Namen
   * - Set entfernt Duplikate
   */
  const allFieldNames = useMemo(() => {
    const names = rows
      .map((r) => (r.name || "").trim())
      .filter((n) => n.length > 0);
    return Array.from(new Set(names));
  }, [rows]);

  // -------------------- Profil: Laden --------------------

  /**
   * Profil laden (useEffect)
   *
   * Zweck:
   * Lädt gespeicherte Profildaten vom Backend, sobald profileId vorhanden ist oder sich ändert.
   *
   * Implementierung:
   * - GET /profiles/{profileId}/data
   * - setzt rows, rowCount, format, lineEnding, wenn Daten vorhanden sind
   */
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await axios.get(
          `/api/profiles/${profileId}/data`
        );
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

  // -------------------- Profil: Auto-Speichern --------------------

  /**
   * lastSaved / lastSavedDataRef
   *
   * Zweck:
   * - lastSaved: UI-Anzeige „Zuletzt gespeichert“
   * - lastSavedDataRef: verhindert unnötige Speichervorgänge, wenn sich Daten nicht geändert haben
   */
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const lastSavedDataRef = useRef<string>("");

  /**
   * Auto-Speichern (useEffect)
   *
   * Zweck:
   * Speichert Profiländerungen automatisch mit Debounce (1 Sekunde).
   *
   * Implementierungsdetails:
   * - serialisiert relevante Daten via JSON.stringify
   * - vergleicht gegen lastSavedDataRef.current
   * - wartet 1000ms, dann POST /profiles/{profileId}/data
   * - cleanup löscht Timeout bei schnellen Änderungen
   */
  useEffect(() => {
    if (!profileId) return;

    const currentData = JSON.stringify({ rows, rowCount, format, lineEnding });
    if (currentData === lastSavedDataRef.current) return;

    const timeout = setTimeout(async () => {
      try {
        await axios.post(`/api/profiles/${profileId}/data`, {
          rows,
          rowCount,
          format,
          lineEnding,
        });
        lastSavedDataRef.current = currentData;
        setLastSaved(new Date());
        console.log("Profil-Daten gespeichert");
      } catch (err) {
        console.error("Fehler beim Speichern der Profildaten:", err);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [rows, rowCount, format, lineEnding, profileId]);

  // -------------------- Render --------------------

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          width: "100%",
        }}
      >
        <div className="d-flex align-items-center mb-4">
          <img src={logo} alt="SynthData Wizard Logo" height={110} />
          <div>
            <h3 className="ms-3">
              SynthData
              <br />
              <span style={{ color: "rgb(229, 67, 244)" }}>Wizard</span>
            </h3>
          </div>
        </div>

        <button
          onClick={onOpenProfileModal}
          title="Profil erstellen"
          style={{
            background: "rgb(135, 87, 155)",
            border: "none",
            color: "white",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "background 200ms ease",
            fontSize: 14,
            marginLeft: "Auto",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgb(155, 107, 175)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgb(135, 87, 155)")}
        >
          👤 <span style={{ fontSize: 12 }}>▼</span>
        </button>
      </div>

      <FieldTableHeader />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                handleEditValuesFromUseCaseModal(idx, fieldType, newValues)
              }
            />
          ))}
        </SortableContext>
      </DndContext>

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
          initialData={(() => {
            const t = rows.find((r) => r.name === depTargetName);
            return t ? t.distributionConfig : undefined;
          })()}
        />
      )}

      {activeRowIdx !== null && (
        <FileUploadModal
          show={showUploadModal}
          onClose={closeUploadModal}
          onSave={handleSaveDistribution}
          initialData={rows[activeRowIdx].distributionConfig}
          fieldType={rows[activeRowIdx].type}
        />
      )}

      {showValueListModal && valueListRowIdx !== null && (
        <ValueListModal
          show={showValueListModal}
          onClose={handleCloseValueListModal}
          fieldLabel={rows[valueListRowIdx].name || getLabelForType(rows[valueListRowIdx].type)}
          defaultValues={getDefaultValuesForType(rows[valueListRowIdx].type)}
          valueSource={rows[valueListRowIdx].valueSource ?? "default"}
          customValues={rows[valueListRowIdx].customValues ?? []}
          onSave={handleSaveValueList}
        />
      )}

      <div className="mb-4 px-3">
        <button className="btn btn-outline-light" onClick={handleAddRow}>
          + Neue Reihe
        </button>
      </div>

      <ExportOptions
        rowCount={rowCount}
        setRowCount={setRowCount}
        format={format}
        setFormat={setFormat}
        lineEnding={lineEnding}
        setLineEnding={setLineEnding}
      />

      {format.toUpperCase() === "XLSX" && (
        <div className="my-3">
          <SheetManager
            sheets={sheets}
            setSheets={setSheets}
            availableFieldNames={allFieldNames}
            title="Sheets konfigurieren"
          />
        </div>
      )}

      <div className="flex-nowrap" style={{ overflowX: "auto", minWidth: 1200 }}>
        <button
          className="btn btn-lg px-4"
          style={{ backgroundColor: "rgb(115, 67, 131)", color: "white" }}
          onClick={handleExport}
        >
          Exportieren
        </button>
      </div>

      <div className="mt-2" style={{ color: "#ccc", fontSize: "0.9em" }}>
        {lastSaved ? `Zuletzt gespeichert: ${lastSaved.toLocaleTimeString()}` : "Noch nicht gespeichert"}
      </div>

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
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            }}
          >
            <CustomDistributionCanvas onSave={handleCustomDrawSave} />
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