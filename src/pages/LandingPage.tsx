/*import { useState } from "react";
import { ProfileSelector } from "../components/ProfileSelector";

export const LandingPage = ({ onSelectProfile }: { onSelectProfile: (profileId: string) => void }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "rgb(31, 53, 88)", color: "white", padding: "40px" }}>
      <h1>Willkommen zu SynthData</h1>
      <p>Erkunde unsere Features und erstelle synthetische Daten...</p>

      <button
        onClick={() => setShowProfileModal(true)}
        style={{
          padding: "12px 24px",
          fontSize: 16,
          backgroundColor: "rgb(135, 87, 155)",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          marginTop: 20,
        }}
      >
        Zum Profil
      </button>

      <ProfileSelector
        show={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSelect={(profileId) => {
          onSelectProfile(profileId);
          setShowProfileModal(false);
        }}
      />
    </div>
  );
}; */