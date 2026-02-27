/**
 * --------------------------------------------------------------------
 * Projekt: SynthData Wizard
 * Komponente: ProfileSelector
 * Autor: Burak Arabaci, Chaimaa Karioui
 * 
 *
 * Beschreibung:
 * Die Komponente "ProfileSelector" dient der Verwaltung und Auswahl
 * von Benutzerprofilen innerhalb der Anwendung.
 *
 * Funktionale Aufgaben:
 * - Laden vorhandener Profile über eine REST-API
 * - Fallback auf localStorage bei Backend-Fehlern
 * - Erstellung neuer Profile (POST)
 * - Löschung bestehender Profile (DELETE)
 * - Auswahl eines Profils über Callback-Funktion
 *
 * Technische Umsetzung:
 * - React Functional Component
 * - Verwendung von Hooks (useState, useEffect)
 * - REST-Kommunikation via Fetch API
 * - Clientseitiges Caching mittels localStorage
 *
 * Architekturprinzip:
 * Die Komponente folgt dem Prinzip der "Single Source of Truth".
 * Der React-State (profiles) kontrolliert die UI.
 * Backend und localStorage dienen ausschließlich als Datenquellen.
 * --------------------------------------------------------------------
 */

import { useEffect, useState } from "react";

/**
 * Datenmodell eines Profils,
 * wie es vom Backend bereitgestellt wird.
 */
type Profile = {
  id: string;
  name: string;
};

/**
 * Schlüssel zur Speicherung der Profile im localStorage.
 */
const LOCAL_STORAGE_KEY = "profiles";

type ProfileSelectorProps = {
  onSelect: (profileId: string) => void;
  onCreate?: (profileId: string) => void;
  onNavigateToApp?: () => void;
  selectedProfileId?: string | null;
  show?: boolean;
  onClose?: () => void;
}; 

export const ProfileSelector = ({ onSelect, onCreate, show = true, onClose }: ProfileSelectorProps) => {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);

  /**
   * Controlled Input für die Profilerstellung.
   */
  const [newProfileName, setNewProfileName] = useState("");

  /**
   * Initiales Laden der Profile.
   *
   * Ablauf:
   * 1) Versuch, Daten vom Backend abzurufen
   * 2) Bei HTTP-Fehler oder Exception → Fallback auf localStorage
   */
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch("/api/profiles");

        if (response.ok) {
          const data: Profile[] = await response.json();
          setProfiles(data);

          // Aktualisierung des lokalen Caches
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        } else {
          // HTTP-Fehler (z.B. 500 oder 404)
          const storedProfiles = localStorage.getItem(LOCAL_STORAGE_KEY);
          setProfiles(storedProfiles ? JSON.parse(storedProfiles) : []);
        }
      } catch (error) {
        // Netzwerkfehler oder Backend nicht erreichbar
        console.error("Fehler beim Laden der Profile:", error);

        const storedProfiles = localStorage.getItem(LOCAL_STORAGE_KEY);
        setProfiles(storedProfiles ? JSON.parse(storedProfiles) : []);
      }
    };

    fetchProfiles();
  }, []);

  /**
   * Synchronisiert Änderungen des States mit dem localStorage.
   * Dadurch bleibt der Cache konsistent.
   */
  useEffect(() => {
    if (profiles !== null) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profiles));
    }
  }, [profiles]);

  /**
   * Erstellt ein neues Profil.
   *
   * Validierung:
   * - Name darf nicht leer sein
   * - profiles muss initial geladen sein
   */
  const createProfile = async () => {
    if (!newProfileName.trim() || profiles === null) return;

    try {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newProfileName.trim() }),
      });

      if (!response.ok) {
        return;
      }

      const newProfile: Profile = await response.json();

      // Funktionales State-Update zur Vermeidung von Race Conditions
      setProfiles((prev) => (prev ? [...prev, newProfile] : [newProfile]));
      setNewProfileName("");
      onCreate?.(newProfile.id);
    } catch (error) {
      console.error("Fehler beim Erstellen des Profils:", error);
    }
  };

  /**
   * Löscht ein Profil.
   *
   * Vorgehen:
   * - Best-effort DELETE im Backend
   * - Anschließend sofortiges Entfernen aus dem lokalen State
   */
  const deleteProfile = async (id: string) => {
    try {
      // Profil auch im Backend löschen
      await fetch(`/api/profiles/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Fehler beim Löschen im Backend:", error);
    }

    // Lokal entfernen
    setProfiles((prev) => {
      if (!prev) return prev;
      const updated = prev.filter((p) => p.id !== id);
      return updated;
    });
  };

  if (!show) return null;

  /**
   * Ladezustand:
   * Solange profiles noch null ist, wird nichts gerendert.
   */
  if (profiles === null) {
    return null;
  }

  return (
    <div
      style={{
        background: "rgb(31, 53, 88)",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h2>Wähle dein Profil</h2>

      {/* Darstellung der vorhandenen Profile */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 40 }}>
        {profiles.map((p) => (
          <div
            key={p.id}
            style={{
              background: "rgb(115, 67, 131)",
              borderRadius: 10,
              padding: "20px 40px",
              cursor: "pointer",
              fontSize: 18,
              fontWeight: "bold",
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Profil auswählen */}
            <span onClick={() => {onSelect(p.id); onClose?.()}} style={{ flex: 1 }}>
              {p.name}
            </span>

            {/* Löschbutton (stopPropagation verhindert gleichzeitige Auswahl) */}
            <button
              title="Profil löschen"
              onClick={(e) => {
                e.stopPropagation();
                deleteProfile(p.id);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: 14,
                marginLeft: 8,
                padding: 0,
              }}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {/* Bereich zur Profilerstellung */}
      <div style={{ marginTop: 50 }}>
        <input
          placeholder="Neuer Profilname"
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
          style={{ padding: 10, borderRadius: 5, border: "none" }}
        />
        <button
          className="btn btn-outline-light ms-2"
          onClick={createProfile}
        >
          Erstellen
        </button>
      </div>
    </div>
  );
};