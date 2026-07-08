import React, { useRef } from "react";
import { WORLD_SIZE, SCROLLBAR_SIZE } from "./editorConstants";

export default function EditorScrollbar({ orientation, stagePos, stageScale, stageSize, onScroll }) {
  const trackRef = useRef(null);
  const isDragging = useRef(false);
  const startMouse = useRef(0);
  const startScroll = useRef(0);

  const isHorizontal = orientation === "horizontal";
  const viewportSize = isHorizontal ? stageSize.width : stageSize.height;
  const worldScaled = WORLD_SIZE * stageScale;
  const trackLength = viewportSize - SCROLLBAR_SIZE;

  if (trackLength <= 0 || worldScaled <= viewportSize) return null;

  const thumbSize = Math.max(40, (viewportSize / worldScaled) * trackLength);

  const padding = 200;
  const maxOffset = worldScaled - viewportSize + padding * 2;
  const currentOffset = -((isHorizontal ? stagePos.x : stagePos.y) - padding);
  const ratio = Math.max(0, Math.min(1, currentOffset / maxOffset));
  const thumbPos = ratio * (trackLength - thumbSize);

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    startMouse.current = isHorizontal ? e.clientX : e.clientY;
    startScroll.current = thumbPos;

    const handleMouseMove = (moveE) => {
      if (!isDragging.current) return;
      const delta = (isHorizontal ? moveE.clientX : moveE.clientY) - startMouse.current;
      const newThumbPos = Math.max(0, Math.min(trackLength - thumbSize, startScroll.current + delta));
      const newRatio = newThumbPos / (trackLength - thumbSize);
      const newOffset = newRatio * maxOffset;
      const newStageVal = padding - newOffset;

      if (isHorizontal) {
        onScroll({ x: newStageVal, y: stagePos.y });
      } else {
        onScroll({ x: stagePos.x, y: newStageVal });
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTrackClick = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickPos = (isHorizontal ? e.clientX - rect.left : e.clientY - rect.top);
    const newThumbPos = Math.max(0, Math.min(trackLength - thumbSize, clickPos - thumbSize / 2));
    const newRatio = newThumbPos / (trackLength - thumbSize);
    const newOffset = newRatio * maxOffset;
    const newStageVal = padding - newOffset;

    if (isHorizontal) {
      onScroll({ x: newStageVal, y: stagePos.y });
    } else {
      onScroll({ x: stagePos.x, y: newStageVal });
    }
  };

  const trackStyle = isHorizontal
    ? { position: "absolute", bottom: 0, left: 0, right: SCROLLBAR_SIZE, height: SCROLLBAR_SIZE }
    : { position: "absolute", top: 0, right: 0, bottom: SCROLLBAR_SIZE, width: SCROLLBAR_SIZE };

  const thumbStyle = isHorizontal
    ? { position: "absolute", left: thumbPos, top: 2, width: thumbSize, height: SCROLLBAR_SIZE - 4, borderRadius: 5 }
    : { position: "absolute", top: thumbPos, left: 2, height: thumbSize, width: SCROLLBAR_SIZE - 4, borderRadius: 5 };

  return (
    <div
      ref={trackRef}
      style={trackStyle}
      className="bg-slate-300/30 z-20 cursor-pointer"
      onMouseDown={handleTrackClick}
    >
      <div
        style={thumbStyle}
        className="bg-slate-500/60 hover:bg-slate-600/80 transition-colors cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
