import React from "react";

type DistributionModalProps = {
  show: boolean;
  onClose: () => void;
};

export const DistributionModal: React.FC<DistributionModalProps> = ({
  show,
  onClose,
}) => {
  if (!show) return null;

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
          minWidth: 300,
        }}
      >
        <h4>Verteilung spezifizieren</h4>
        <p>Hier kannst du die Verteilung einstellen...</p>
        <button className="btn btn-secondary" onClick={onClose}>
          Schließen
        </button>
      </div>
    </div>
  );
};
