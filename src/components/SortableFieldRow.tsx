/*
Autoren: Jan Krämer, Chaimaa Karioui

Beschreibung:
Diese Komponente dient als Wrapper für die normalen FieldRows und implementiert die Funktionalitäten zum Drag&Drop verschieben der Zeilen.
Es werden die benötigten Properties gesetzt und dann an die FieldRows weiter gegeben.
*/


import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FieldRow } from "./FieldRow";
import { FieldType } from "../types/fieldTypes";

// FieldType wird jetzt im UseCaseModal definiert

export type SortableFieldRowProps = {
  id: string;
  row: any;
  idx: number;
  onChange: (idx: number, field: string, value: any) => void;
  onOpenModal: (idx: number) => void;
  onCustomDraw: (idx:number) => void;
  onOpenUploadModal: (idx:number) => void;
  onOpenDependencyModal: (idx: number) => void;
  handleDeleteRow: (idx: number) => void;
  onOpenValueEditor?: (idx: number) => void;
  onEditValuesFromUseCaseModal?: (fieldType: FieldType, newValues: string[]) => void;
  allFieldNames: string[];
  dragHandleProps?: any;
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
      />
    </div>
  );
};

