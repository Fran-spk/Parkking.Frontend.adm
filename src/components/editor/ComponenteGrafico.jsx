import React, { useState, useEffect, useRef } from "react";
import { Image as KonvaImage, Transformer } from "react-konva";
import { GRID_SIZE } from "./editorConstants";

const ComponenteGrafico = ({ elemento, isSelected, onSelect, onChange, onDragStart, onDragEnd: onDragEndCb, stageScale = 1 }) => {
  const [image, setImage] = useState(null);
  const shapeRef = useRef();
  const trRef = useRef();

  // Attach transformer
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  useEffect(() => {
    const img = new window.Image();
    img.src = `/assets/blueprint/${elemento.assetName}`;
    img.onload = () => {
      setImage(img);
    };
  }, [elemento.assetName]);

  return (
    <>
      <KonvaImage
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={() => {
          onChange({
            ...elemento,
            rotacion: ((elemento.rotacion || 0) + 90) % 360
          });
        }}
        onDblTap={() => {
          onChange({
            ...elemento,
            rotacion: ((elemento.rotacion || 0) + 90) % 360
          });
        }}
        ref={shapeRef}
        image={image}
        offsetX={elemento.ancho / 2}
        offsetY={elemento.alto / 2}
        x={elemento.x + elemento.ancho / 2}
        y={elemento.y + elemento.alto / 2}
        width={elemento.ancho}
        height={elemento.alto}
        rotation={elemento.rotacion || 0}
        draggable
        onDragStart={() => { if (onDragStart) onDragStart(); }}
        onDragEnd={(e) => {
          const rawX = e.target.x() - elemento.ancho / 2;
          const rawY = e.target.y() - elemento.alto / 2;

          onChange({
            ...elemento,
            x: Math.round(rawX / GRID_SIZE) * GRID_SIZE,
            y: Math.round(rawY / GRID_SIZE) * GRID_SIZE,
          });
          if (onDragEndCb) onDragEndCb();
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          node.scaleX(1);
          node.scaleY(1);

          const rawWidth = Math.max(GRID_SIZE, elemento.ancho * scaleX);
          const newWidth = Math.round(rawWidth / GRID_SIZE) * GRID_SIZE;

          const rawHeight = Math.max(GRID_SIZE, elemento.alto * scaleY);
          const newHeight = Math.round(rawHeight / GRID_SIZE) * GRID_SIZE;

          const rawX = node.x() - newWidth / 2;
          const rawY = node.y() - newHeight / 2;

          onChange({
            ...elemento,
            x: Math.round(rawX / GRID_SIZE) * GRID_SIZE,
            y: Math.round(rawY / GRID_SIZE) * GRID_SIZE,
            ancho: newWidth,
            alto: newHeight,
            rotacion: Math.round(node.rotation())
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          resizeEnabled={
            elemento.assetName === "pared.svg" ||
            elemento.assetName === "area-techada.svg" ||
            elemento.assetName === "area-aire-libre.svg"
          }
          rotateEnabled={false}
          enabledAnchors={
            elemento.assetName === "pared.svg"
              ? ['middle-left', 'middle-right']
              : ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']
          }
          boundBoxFunc={(oldBox, newBox) => {
            // Los valores llegan en coordenadas de pantalla (escalados por zoom)
            // El mínimo permitido es 1 cuadrado de grid en coordenadas de pantalla
            const minSize = GRID_SIZE * stageScale;
            if (newBox.width < minSize || newBox.height < minSize) {
              return oldBox;
            }
            return newBox;
          }}
          anchorSize={10}
          borderDash={[6, 2]}
        />
      )}
    </>
  );
};

export default ComponenteGrafico;
