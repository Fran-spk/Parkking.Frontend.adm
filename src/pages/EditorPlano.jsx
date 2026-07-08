import React from "react";
import { Stage, Layer } from "react-konva";
import { Minus, Plus } from "lucide-react";
import { GRID_SIZE, SCROLLBAR_SIZE } from "../components/editor/editorConstants";
import PaletaComponentes from "../components/editor/PaletaComponentes";
import ComponenteGrafico from "../components/editor/ComponenteGrafico";
import EditorScrollbar from "../components/editor/EditorScrollbar";
import useEditorPlano from "../components/editor/useEditorPlano";

export default function EditorPlano() {
  const {
    elementos,
    selectedId,
    stageSize,
    stagePos,
    stageScale,
    containerRef,
    stageRef,
    selectShape,
    actualizarElemento,
    onElementDragStart,
    onElementDragEnd,
    zoomIn,
    zoomOut,
    resetZoom,
    handleDragOver,
    handleDrop,
    handleScrollbarScroll,
    checkDeselect,
  } = useEditorPlano();

  return (
    <div
      className="flex flex-col w-full bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200"
      style={{ height: 'calc(100vh - 5rem)' }}
    >
      <PaletaComponentes elementosCount={elementos.length} />

      <div
        ref={containerRef}
        id="stage-container"
        className="flex-1 relative bg-slate-200 overflow-hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)",
          backgroundSize: `${GRID_SIZE * stageScale}px ${GRID_SIZE * stageScale}px`,
          backgroundPosition: `${stagePos.x}px ${stagePos.y}px`
        }}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          className="absolute inset-0"
          x={stagePos.x}
          y={stagePos.y}
          scaleX={stageScale}
          scaleY={stageScale}
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
        >
          <Layer>
            {elementos.map((el) => (
              <ComponenteGrafico
                key={el.id}
                elemento={el}
                isSelected={el.id === selectedId}
                stageScale={stageScale}
                onSelect={() => selectShape(el.id)}
                onChange={(nuevasPropiedades) => actualizarElemento(el.id, nuevasPropiedades)}
                onDragStart={onElementDragStart}
                onDragEnd={onElementDragEnd}
              />
            ))}
          </Layer>
        </Stage>

        {/* Controles de Zoom */}
        <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 px-1 py-1">
          <button
            onClick={zoomOut}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="Alejar"
          >
            <Minus size={16} />
          </button>

          <button
            onClick={resetZoom}
            className="min-w-[52px] h-8 flex items-center justify-center rounded-lg text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors tabular-nums"
            title="Restablecer zoom"
          >
            {Math.round(stageScale * 100)}%
          </button>

          <button
            onClick={zoomIn}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="Acercar"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Scrollbars */}
        <EditorScrollbar
          orientation="horizontal"
          stagePos={stagePos}
          stageScale={stageScale}
          stageSize={stageSize}
          onScroll={handleScrollbarScroll}
        />
        <EditorScrollbar
          orientation="vertical"
          stagePos={stagePos}
          stageScale={stageScale}
          stageSize={stageSize}
          onScroll={handleScrollbarScroll}
        />

        <div
          className="absolute bg-slate-300/30 z-20"
          style={{ bottom: 0, right: 0, width: SCROLLBAR_SIZE, height: SCROLLBAR_SIZE }}
        />
      </div>
    </div>
  );
}
