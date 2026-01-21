import { useEffect, useState } from "react";

type Profile = {
  id: string;
  name: string;
};

const LOCAL_STORAGE_KEY = "profiles";

export const ProfileSelector = ({ 
  onSelect, 
  show = true,
  onClose,
  onCreate,
  onNavigateToApp,
  selectedProfileId
}: { 
  onSelect: (profileId: string) => void;
  show?: boolean;
  onClose?: () => void;
  onCreate?: (profileId: string) => void;
  onNavigateToApp?: () => void;
  selectedProfileId?: string | null;
}) => {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [newProfileName, setNewProfileName] = useState("");

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch("http://localhost:8000/profiles");
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
      const response = await fetch("http://localhost:8000/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newProfileName.trim() }),
      });
      if (!response.ok) {
        console.error("Fehler beim Erstellen:", response.statusText);
        return;
      }
      const newProfile = await response.json();
      setProfiles((prev) => (prev ? [...prev, newProfile] : [newProfile]));
      setNewProfileName("");
      
      // Automatisch das neue Profil auswählen
      if (onSelect) {
        onSelect(newProfile.id);
      }
    } catch (error) {
      console.error("Fehler beim Erstellen:", error);
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      await fetch(`http://localhost:8000/profiles/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Fehler beim Löschen im Backend:", error);
    }

    setProfiles((prev) => {
      if (!prev) return prev;
      const updated = prev.filter((p) => p.id !== id);
      return updated;
    });
  };

  if (profiles === null) {
    return null;
  }

  // MODAL - nur anzeigen wenn show === true
  if (!show) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgb(31, 53, 88)",
          color: "white",
          borderRadius: 12,
          padding: "40px",
          maxWidth: 700,
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <h2 style={{ margin: 0 }}>Wähle dein Profil</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: 28,
              cursor: "pointer",
              padding: 0,
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 30 }}>
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
                transition: "background 200ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgb(135, 87, 155)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgb(115, 67, 131)")}
            >
              <span 
                onClick={() => {
                  onSelect(p.id);
                  onClose?.();
                }} 
                style={{ flex: 1 }}
              >
                {p.name}
              </span>
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

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 20 }}>
          <input
            placeholder="Neuer Profilname"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && createProfile()}
            style={{ padding: 10, borderRadius: 5, border: "none", marginRight: 10 }}
          />
          <button
            className="btn btn-outline-light"
            onClick={createProfile}
          >
            Erstellen
          </button>
        </div>
      </div>
    </div>
  );
};