import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FieldRow } from "./FieldRow";

/**
 * SortableFieldRow ist ein Wrapper für FieldRow, der die Drag-and-Drop-Funktionalität
 * von dnd-kit bereitstellt. Jede Zeile kann damit per Griff verschoben werden.
 *
 * Hinweis zu Option A (Auto-Vervollständigung):
 * Die <datalist id="fieldname-options"> wird global in SynthDataWizard gerendert.
 * In FieldRow sollte das Abhängigkeits-Input einfach das Attribut list="fieldname-options" haben.
 */

type SortableFieldRowProps = any; // Wenn du FieldRow-Props typisieren willst:
                                  // type SortableFieldRowProps = React.ComponentProps<typeof FieldRow> & { id: string | number };

export const SortableFieldRow: React.FC<SortableFieldRowProps> = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: props.id, // Eindeutige ID für jede Zeile
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* Drag-Listener als dragHandleProps an FieldRow weiterreichen */}
      <FieldRow {...props} dragHandleProps={listeners} />
    </div>
  );
};
