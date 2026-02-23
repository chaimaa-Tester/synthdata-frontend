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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();

  // Profil auswählen: setzt das Profil
  const handleSelectProfile = (id: string) => {
    localStorage.setItem("profileId", id);
    setProfileId(id);
    setShowProfileModal(false);
  };

  return (
    <>
      
      {/* Profile Modal - nur öffnen wenn User das Icon klickt */}
      <ProfileSelector
        onSelect={handleSelectProfile}
        onCreate={() => {}}
        onNavigateToApp={() => {}}
        selectedProfileId={profileId}
        show={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <Routes>
        <Route
          path="/"
          element={
            <SynthDataWizard 
              profileId={profileId ?? ""} 
              onOpenProfileModal={() => setShowProfileModal(true)}
            />
          }
        />
        <Route path="/app" element={<SynthDataWizard profileId={profileId ?? ""} onOpenProfileModal={() => setShowProfileModal(true)} />} />
      </Routes>
    </>
  );
};

// Der BrowserRouter ist jetzt die Hülle
export const App = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default App;