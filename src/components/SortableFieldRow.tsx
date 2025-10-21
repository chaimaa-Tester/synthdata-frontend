import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FieldRow } from "./FieldRow";

type Nationality = 'german' | 'english' | 'french' | 'spanish' | 'turkish' | 'russian' | 'chinese' | 'japanese' | 'italian';
type FieldType = "name" | "vorname" | "nachname" | "vollständigername" | "körpergröße" | "gewicht" | "Date" | "Integer" | "alter" | "geschlecht" | "adresse" | "straße" | "stadt" | "land" | "email" | "telefon" | "plz" | "hausnummer";

export type SortableFieldRowProps = {
  id: string;
  row: any;
  idx: number;
  onChange: (idx: number, field: string, value: any) => void;
  onOpenModal: (idx: number) => void;
  handleDeleteRow: (idx: number) => void;
  allFieldNames: string[]; // GEÄNDERT: Required gemacht (kein ? mehr)
  dragHandleProps?: any;
  onNationalityChange: (nationality: Nationality) => void;
  fieldTypeOptions: { value: FieldType; label: string }[];
  nationalityOptions: { value: Nationality; label: string; flag: string }[];
};

export const SortableFieldRow: React.FC<SortableFieldRowProps> = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: props.id,
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <FieldRow 
        {...props} 
        dragHandleProps={listeners}
        onNationalityChange={props.onNationalityChange} // KORREKT: onNationalityChange
        fieldTypeOptions={props.fieldTypeOptions}
        nationalityOptions={props.nationalityOptions}
      />
    </div>
  );
};