import { useState } from "react";
import { SynthDataWizard } from "./SynthDataWizard";
import { ProfileSelector } from "./components/ProfileSelector";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

//  Neue Komponente, die innerhalb des Routers läuft
const AppRoutes = () => {
  const [profileId, setProfileId] = useState<string | null>(localStorage.getItem("profileId"));
  const navigate = useNavigate();

  // Profil auswählen: setzt das Profil und leitet weiter zur Hauptseite
  const handleSelectProfile = (id: string) => {
    localStorage.setItem("profileId", id);
    setProfileId(id);
    navigate("/app");
  };

  // Profil erstellen: speichert Profil, KEIN Navigate
  const handleCreateProfile = (id: string) => {
    // Hier wird angenommen, dass das neue Profil bereits in localStorage gespeichert werden soll
    // (genaue Logik ggf. anpassen, falls andere Datenstruktur benötigt)
    // Nur Beispiel: Profile-Liste als Array in localStorage
    const profiles = JSON.parse(localStorage.getItem("profiles") || "[]");
    if (!profiles.includes(id)) {
      profiles.push(id);
      localStorage.setItem("profiles", JSON.stringify(profiles));
    }
    // KEIN navigate!
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProfileSelector
            onSelect={handleSelectProfile}
            onCreate={handleCreateProfile}
            // Neue Prop: Übergib navigate-Funktion für manuelles Navigieren
            onNavigateToApp={() => navigate("/app")}
            selectedProfileId={profileId}
          />
        }
      />
      <Route path="/app" element={<SynthDataWizard profileId={profileId ?? ""} />} />
    </Routes>
  );
};

// Der BrowserRouter ist jetzt die Hülle
export const App = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default App;