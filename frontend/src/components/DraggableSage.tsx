import React from "react";

export default function DraggableSage({
  src,
  onDropTaskId,
  children
}: {
  src: string;
  onDropTaskId: (taskId: string) => void;
  children: React.ReactNode;
}) {
  // minimal HTML5 drag-drop
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", "sage");
      }}
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
    >
      <img src={src} alt="sage" style={{ height: 44 }} />
      {children}
    </div>
  );
}
