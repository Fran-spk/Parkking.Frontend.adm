import { useState, useEffect, useRef, useCallback } from "react";
import { GRID_SIZE, WORLD_SIZE } from "./editorConstants";

export default function useEditorPlano() {
  const [elementos, setElementos] = useState([]);
  const [selectedId, selectShape] = useState(null);
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });
  const stageScale = viewport.scale;
  const stagePos = { x: viewport.x, y: viewport.y };
  const isDraggingElement = useRef(false);



  // ---- Limitar paneo ----
  const clampPosition = useCallback((x, y, scale) => {
    const padding = 200;
    const minX = Math.min(0, stageSize.width - WORLD_SIZE * scale) - padding;
    const maxX = padding;
    const minY = Math.min(0, stageSize.height - WORLD_SIZE * scale) - padding;
    const maxY = padding;

    return {
      x: Math.max(minX, Math.min(x, maxX)),
      y: Math.max(minY, Math.min(y, maxY))
    };
  }, [stageSize]);

  // ---- Resize del canvas ----
  useEffect(() => {
    const checkSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // ---- Drag over (prevenir default para permitir drop) ----
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // ---- Deseleccionar al clickear vacío ----
  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  // ---- Drop de componente desde la paleta ----
  const handleDrop = (e) => {
    e.preventDefault();
    const componentStr = e.dataTransfer.getData("componente");
    if (!componentStr) return;

    const componente = JSON.parse(componentStr);

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rawX = (x - stagePos.x) / stageScale - componente.ancho / 2;
    const rawY = (y - stagePos.y) / stageScale - componente.alto / 2;

    const nuevoElemento = {
      id: `${componente.id}-${Date.now()}`,
      assetName: componente.assetName,
      x: Math.round(rawX / GRID_SIZE) * GRID_SIZE,
      y: Math.round(rawY / GRID_SIZE) * GRID_SIZE,
      ancho: componente.ancho,
      alto: componente.alto,
      rotacion: 0
    };

    setElementos((prev) => [...prev, nuevoElemento]);
  };

  // ---- Scrollbar scroll handler ----
  const handleScrollbarScroll = useCallback((newPos) => {
    setViewport((prev) => {
      const clamped = clampPosition(newPos.x, newPos.y, prev.scale);
      return {
        ...prev,
        x: clamped.x,
        y: clamped.y
      };
    });
  }, [clampPosition]);

  // ---- Actualizar un elemento individual ----
  const actualizarElemento = (id, nuevasPropiedades) => {
    setElementos((prev) =>
      prev.map((el) => el.id === id ? { ...el, ...nuevasPropiedades } : el)
    );
  };

  // ---- Callbacks de drag para proteger teclado ----
  const onElementDragStart = () => { isDraggingElement.current = true; };
  const onElementDragEnd = () => { isDraggingElement.current = false; };

  // ---- Zoom programático (botones + / -) ----
  const applyZoom = useCallback((multiplier, targetScale) => {
    setViewport((prev) => {
      const newScale = targetScale !== undefined 
        ? targetScale 
        : Math.max(0.3, Math.min(3, prev.scale * multiplier));
      
      if (newScale === prev.scale && targetScale === undefined) return prev;

      // Zoom centrado en el viewport
      const centerX = stageSize.width / 2;
      const centerY = stageSize.height / 2;

      const mousePointTo = {
        x: (centerX - prev.x) / prev.scale,
        y: (centerY - prev.y) / prev.scale,
      };

      const rawPos = {
        x: centerX - mousePointTo.x * newScale,
        y: centerY - mousePointTo.y * newScale,
      };

      const newPos = clampPosition(rawPos.x, rawPos.y, newScale);
      return {
        scale: newScale,
        x: newPos.x,
        y: newPos.y
      };
    });
  }, [stageSize, clampPosition]);

  const zoomIn = useCallback(() => {
    applyZoom(1.2);
  }, [applyZoom]);

  const zoomOut = useCallback(() => {
    applyZoom(1 / 1.2);
  }, [applyZoom]);

  const resetZoom = useCallback(() => {
    applyZoom(undefined, 1);
  }, [applyZoom]);

  // ---- Teclado: borrar, clonar y zoom ----
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Zoom con teclas + y -
      if (e.key === '+' || e.key === '=' || e.key === 'Add') {
        e.preventDefault();
        zoomIn();
        return;
      }
      if (e.key === '-' || e.key === 'Subtract') {
        e.preventDefault();
        zoomOut();
        return;
      }

      if (!selectedId) return;
      if (isDraggingElement.current) return;

      // Borrar elemento
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setElementos((prev) => prev.filter((el) => el.id !== selectedId));
        selectShape(null);
      }

      // Clonar (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setElementos((prev) => {
          const elToClone = prev.find((el) => el.id === selectedId);
          if (!elToClone) return prev;

          const nuevoElemento = {
            ...elToClone,
            id: `${elToClone.assetName.split('.')[0]}-${Date.now()}`,
            x: elToClone.x + GRID_SIZE * 2,
            y: elToClone.y + GRID_SIZE * 2,
          };

          setTimeout(() => selectShape(nuevoElemento.id), 0);
          return [...prev, nuevoElemento];
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, zoomIn, zoomOut]);

  return {
    // Estado
    elementos,
    selectedId,
    stageSize,
    stagePos,
    stageScale,

    // Refs
    containerRef,
    stageRef,

    // Acciones
    selectShape,
    actualizarElemento,
    onElementDragStart,
    onElementDragEnd,

    // Zoom
    zoomIn,
    zoomOut,
    resetZoom,

    // Handlers de eventos
    handleDragOver,
    handleDrop,
    handleScrollbarScroll,
    checkDeselect,
  };
}
