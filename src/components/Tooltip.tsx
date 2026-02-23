/**
 * Autor: CHAIMAA KARIOUI
 
 *
 * Beschreibung:
 * Wiederverwendbare Tooltip-Komponente für das Frontend.
 * Zeigt bei Hover über ein beliebiges Element (children)
 * einen frei definierbaren Inhalt (content) oberhalb des Elements an.
 *
 * Ziel:
 * - Einheitliche Tooltip-Darstellung im gesamten Projekt
 * - Keine externe Bibliothek notwendig
 * - Saubere Hover-Logik mit Verzögerung beim Ausblenden
 */

import React, { useState, ReactNode, useRef, useEffect } from "react";

/**
 * Props-Definition für Tooltip.
 *
 * @property content   Inhalt des Tooltips (Text oder JSX).
 * @property children  Das Element, über dem der Tooltip erscheinen soll.
 * @property className Optionale CSS-Klasse für den Wrapper.
 */
type Props = {
  content: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Tooltip-Komponente
 *
 * Funktionsweise:
 * - Der Tooltip wird sichtbar, wenn die Maus das Element betritt.
 * - Beim Verlassen wird eine kleine Verzögerung (150ms) genutzt,
 *   um flackerndes Verhalten zu vermeiden.
 * - Die Position wird dynamisch anhand der Bildschirmkoordinaten
 *   des Referenzelements berechnet.
 */
export const Tooltip: React.FC<Props> = ({ content, children, className }) => {
  /**
   * visible:
   * Steuert die Sichtbarkeit des Tooltips.
   */
  const [visible, setVisible] = useState(false);

  /**
   * ref:
   * Referenz auf das Wrapper-DIV, um dessen Position
   * im Viewport berechnen zu können.
   */
  const ref = useRef<HTMLDivElement | null>(null);

  /**
   * hideTimeout:
   * Speichert eine Timeout-ID für verzögertes Ausblenden.
   * Wird genutzt, um sanfte Übergänge beim Hover zu ermöglichen.
   */
  const hideTimeout = useRef<number | null>(null);

  /**
   * pos:
   * Speichert die berechnete Position des Tooltips.
   * left = horizontale Mitte des Referenzelements
   * top  = obere Kante des Referenzelements
   */
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  /**
   * Effekt zur Positionsberechnung.
   *
   * Wird ausgelöst, wenn visible sich ändert.
   * - Wenn Tooltip sichtbar ist und ref existiert:
   *   -> Berechnung via getBoundingClientRect()
   * - Wenn nicht sichtbar:
   *   -> Position zurücksetzen
   */
  useEffect(() => {
    if (!visible || !ref.current) {
      setPos(null);
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    setPos({
      left: rect.left + rect.width / 2,
      top: rect.top,
    });
  }, [visible]);

  /**
   * Cleanup-Effekt.
   *
   * Zweck:
   * Verhindert Memory-Leaks, indem beim Unmount
   * ein eventuell noch laufender Timeout gelöscht wird.
   */
  useEffect(() => {
    return () => {
      if (hideTimeout.current) {
        window.clearTimeout(hideTimeout.current);
      }
    };
  }, []);

  return (
    <div
      style={{ display: "inline-block", position: "relative" }}
      ref={ref}
      className={className}
      onMouseEnter={() => {
        // Falls ein Hide-Timeout aktiv ist -> abbrechen
        if (hideTimeout.current) {
          window.clearTimeout(hideTimeout.current);
          hideTimeout.current = null;
        }
        setVisible(true);
      }}
      onMouseLeave={() => {
        // Verzögerung, um Wechsel vom Element in den Tooltip zu ermöglichen
        hideTimeout.current = window.setTimeout(() => setVisible(false), 150);
      }}
    >
      {children}

      {visible && (
        <div
          onMouseEnter={() => {
            // Timeout abbrechen, wenn Maus in Tooltip wechselt
            if (hideTimeout.current) {
              window.clearTimeout(hideTimeout.current);
              hideTimeout.current = null;
            }
            setVisible(true);
          }}
          onMouseLeave={() => {
            hideTimeout.current = window.setTimeout(
              () => setVisible(false),
              150
            );
          }}
          style={{
            position: "fixed",
            left: pos ? pos.left : 0,
            top: pos ? pos.top - 8 : 0,
            transform: "translate(-50%, -100%)",
            background: "rgb(31, 53, 88)",
            color: "white",
            padding: "8px 10px",
            borderRadius: 10,
            zIndex: 20000,
            maxWidth: 320,
            boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
            fontSize: 13,
            lineHeight: 1.3,
            pointerEvents: "auto",
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};
