import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FieldRow } from "./FieldRow";

/**
 * SortableFieldRow ist ein Wrapper für FieldRow, der die Drag-and-Drop-Funktionalität
 * von dnd-kit bereitstellt. Jede Zeile kann damit per Griff verschoben werden.
 * Die Komponente erhält alle Props von FieldRow und ergänzt sie um die notwendigen
 * Eigenschaften für das Sortieren.
 */
export const SortableFieldRow = (props: any) => {
  // useSortable stellt alle nötigen Handler und Styles für Drag-and-Drop bereit
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.id, // Eindeutige ID für jede Zeile
  });

  return (
    <div
      ref={setNodeRef} // Referenz für dnd-kit, damit die Zeile verschiebbar ist
      style={{
        // Visuelle Animation und Transparenz beim Ziehen
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes} // Zusätzliche Attribute für Barrierefreiheit und dnd-kit
    >
      {/* Übergibt die Drag-and-Drop-Listener als dragHandleProps an FieldRow */}
      <FieldRow {...props} dragHandleProps={listeners} />
    </div>
  );
};
