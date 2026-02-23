import { useEffect, useState } from "react";

type Profile = {
  id: string;
  name: string;
};

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
  const [newProfileName, setNewProfileName] = useState("");

useEffect(() => {
  const fetchProfiles = async () => {
    try {
      const response = await fetch("/api/profiles");
      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      } else {
        const storedProfiles = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedProfiles) {
          setProfiles(JSON.parse(storedProfiles));
        } else {
          setProfiles([]);
        }
      }
    } catch (error) {
      console.error("Fehler beim Laden der Profile:", error);
      const storedProfiles = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedProfiles) {
        setProfiles(JSON.parse(storedProfiles));
      } else {
        setProfiles([]);
      }
    }
  };
  fetchProfiles();
}, []);

  useEffect(() => {
    if (profiles !== null) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profiles));
    }
  }, [profiles]);

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
        // Fehlerbehandlung (optional)
        return;
      }
      const newProfile = await response.json();
      setProfiles((prev) => (prev ? [...prev, newProfile] : [newProfile]));
      setNewProfileName("");
      onCreate?.(newProfile.id);
    } catch (error) {
      // Fehlerbehandlung (optional)
    }
  };

  // Löschfunktion für Profile
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

  if (profiles === null) {
    return null; // oder ein Ladezustand
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
            <span onClick={() => onSelect(p.id)} style={{ flex: 1 }}>{p.name}</span>
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