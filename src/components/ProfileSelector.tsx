import { useEffect, useState } from "react";

type Profile = {
  id: string;
  name: string;
};

const LOCAL_STORAGE_KEY = "profiles";

export const ProfileSelector = ({ onSelect }: { onSelect: (profileId: string) => void }) => {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [newProfileName, setNewProfileName] = useState("");

  useEffect(() => {
    try {
      const storedProfiles = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedProfiles) {
        setProfiles(JSON.parse(storedProfiles));
      } else {
        setProfiles([]);
      }
    } catch {
      setProfiles([]);
    }
  }, []);

  useEffect(() => {
    if (profiles !== null) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profiles));
    }
  }, [profiles]);

  const createProfile = () => {
    if (!newProfileName.trim() || profiles === null) return;
    const newProfile: Profile = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProfileName.trim(),
    };
    setProfiles((prev) => (prev ? [...prev, newProfile] : [newProfile]));
    // onSelect(newProfile.id);
    setNewProfileName("");
  };

  // Löschfunktion für Profile
  const deleteProfile = (id: string) => {
    setProfiles((prev) => {
      if (!prev) return prev;
      const updated = prev.filter((p) => p.id !== id);
      // localStorage wird durch useEffect aktualisiert
      return updated;
    });
  };

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