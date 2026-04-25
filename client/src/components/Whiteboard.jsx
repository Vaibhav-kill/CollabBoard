import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Circle, Arrow, Text, Transformer } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import { useSocket } from '../context/SocketContext';
import { throttle } from '../utils/helpers';

const THROTTLE_MS = 16; // ~60fps

function getRelativePointerPosition(stage) {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  const pos = stage.getPointerPosition();
  return transform.point(pos);
}

function renderElement(el, isSelected, onSelect, transformerRef, stageRef) {
  const commonProps = {
    id: el.id,
    key: el.id,
    stroke: el.stroke,
    strokeWidth: el.strokeWidth,
    opacity: el.opacity ?? 1,
    draggable: false,
    onClick: () => onSelect(el.id),
    onTap: () => onSelect(el.id),
  };

  switch (el.type) {
    case 'pen':
    case 'eraser':
      return (
        <Line
          {...commonProps}
          points={el.points}
          tension={0.4}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation={el.type === 'eraser' ? 'destination-out' : 'source-over'}
          fill="transparent"
        />
      );
    case 'line':
      return <Line {...commonProps} points={el.points} lineCap="round" />;
    case 'arrow':
      return (
        <Arrow
          {...commonProps}
          points={el.points}
          pointerLength={10}
          pointerWidth={8}
          fill={el.stroke}
        />
      );
    case 'rect':
      return (
        <Rect
          {...commonProps}
          x={el.x} y={el.y}
          width={el.width} height={el.height}
          fill={el.fill ?? 'transparent'}
          cornerRadius={el.cornerRadius ?? 0}
        />
      );
    case 'circle':
      return (
        <Circle
          {...commonProps}
          x={el.x} y={el.y}
          radius={el.radius}
          fill={el.fill ?? 'transparent'}
        />
      );
    case 'text':
      return (
        <Text
          {...commonProps}
          x={el.x} y={el.y}
          text={el.text}
          fontSize={el.fontSize ?? 18}
          fontFamily="Inter, sans-serif"
          fill={el.stroke}
        />
      );
    default:
      return null;
  }
}

export default function Whiteboard({
  tool,
  stroke,
  strokeWidth,
  opacity,
  fill,
  userId,
  onUndo,
  undoStack,
}) {
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const isDrawing = useRef(false);
  const currentId = useRef(null);
  const lastPoints = useRef([]);

  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Pan / Zoom
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });

  const { emit, on } = useSocket();

  // ── Sync from socket ─────────────────────────────────────────
  useEffect(() => {
    const unsubs = [
      on('init-state', ({ elements: els }) => setElements(els)),
      on('draw-start', ({ element }) => {
        setElements((prev) =>
          prev.find((e) => e.id === element.id) ? prev : [...prev, element]
        );
      }),
      on('draw-step', ({ elementId, points }) => {
        setElements((prev) =>
          prev.map((el) => (el.id === elementId ? { ...el, points } : el))
        );
      }),
      on('draw-end', ({ element }) => {
        setElements((prev) => {
          const filtered = prev.filter((e) => e.id !== element.id);
          return [...filtered, element];
        });
      }),
      on('element-update', ({ element }) => {
        setElements((prev) =>
          prev.map((el) => (el.id === element.id ? element : el))
        );
      }),
      on('element-delete', ({ elementId }) => {
        setElements((prev) => prev.filter((el) => el.id !== elementId));
      }),
      on('clear-board', () => setElements([])),
      on('undo', () => {
        // handled in parent via onUndo callback
      }),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, [on]);

  // ── Undo: expose current elements for parent ────────────────
  useEffect(() => {
    if (undoStack !== undefined) {
      // Parent calls this; we let server handle broadcast
    }
  }, [undoStack]);

  // Throttled draw-step emitter
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const emitDrawStep = useCallback(
    throttle((elementId, userId, points) => {
      emit('draw-step', { elementId, userId, points });
    }, THROTTLE_MS),
    [emit]
  );

  // ── Pointer Down ─────────────────────────────────────────────
  const handlePointerDown = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Pan with Hand tool or middle mouse
    if (tool === 'hand' || e.evt.button === 1) {
      isPanning.current = true;
      panStart.current = stage.getPointerPosition();
      panOrigin.current = { ...stagePos };
      return;
    }

    if (tool === 'select' || tool === 'text') {
      if (e.target === stage) setSelectedId(null);
      return;
    }

    isDrawing.current = true;
    currentId.current = uuidv4();
    const pos = getRelativePointerPosition(stage);
    lastPoints.current = [pos.x, pos.y];

    const base = {
      id: currentId.current,
      userId,
      stroke,
      strokeWidth,
      opacity,
      fill,
    };

    let newEl;
    switch (tool) {
      case 'pen':
      case 'eraser':
        newEl = { ...base, type: tool, points: [pos.x, pos.y] };
        break;
      case 'line':
        newEl = { ...base, type: 'line', points: [pos.x, pos.y, pos.x, pos.y] };
        break;
      case 'arrow':
        newEl = { ...base, type: 'arrow', points: [pos.x, pos.y, pos.x, pos.y] };
        break;
      case 'rect':
        newEl = { ...base, type: 'rect', x: pos.x, y: pos.y, width: 0, height: 0 };
        break;
      case 'circle':
        newEl = { ...base, type: 'circle', x: pos.x, y: pos.y, radius: 0 };
        break;
      default:
        return;
    }

    setElements((prev) => [...prev, newEl]);
    emit('draw-start', { element: newEl });
  };

  // ── Pointer Move ─────────────────────────────────────────────
  const handlePointerMove = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Cursor broadcast (always)
    const rawPos = stage.getPointerPosition();
    emit('cursor-move', rawPos);

    // Panning
    if (isPanning.current) {
      const pos = stage.getPointerPosition();
      const dx = pos.x - panStart.current.x;
      const dy = pos.y - panStart.current.y;
      setStagePos({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
      return;
    }

    if (!isDrawing.current || !currentId.current) return;

    const pos = getRelativePointerPosition(stage);

    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== currentId.current) return el;
        switch (el.type) {
          case 'pen':
          case 'eraser':
            return { ...el, points: [...el.points, pos.x, pos.y] };
          case 'line':
          case 'arrow':
            return { ...el, points: [el.points[0], el.points[1], pos.x, pos.y] };
          case 'rect': {
            const x = Math.min(lastPoints.current[0], pos.x);
            const y = Math.min(lastPoints.current[1], pos.y);
            return {
              ...el,
              x,
              y,
              width: Math.abs(pos.x - lastPoints.current[0]),
              height: Math.abs(pos.y - lastPoints.current[1]),
            };
          }
          case 'circle': {
            const dx = pos.x - lastPoints.current[0];
            const dy = pos.y - lastPoints.current[1];
            return { ...el, radius: Math.sqrt(dx * dx + dy * dy) };
          }
          default:
            return el;
        }
      })
    );

    // Throttled step
    const el = elements.find((e) => e.id === currentId.current);
    if (el) {
      const updated = (() => {
        switch (el.type) {
          case 'pen':
          case 'eraser':
            return [...el.points, pos.x, pos.y];
          case 'line':
          case 'arrow':
            return [el.points[0], el.points[1], pos.x, pos.y];
          default:
            return el.points;
        }
      })();
      emitDrawStep(currentId.current, userId, updated);
    }
  };

  // ── Pointer Up ───────────────────────────────────────────────
  const handlePointerUp = () => {
    if (isPanning.current) { isPanning.current = false; return; }
    if (!isDrawing.current) return;
    isDrawing.current = false;

    const el = elements.find((e) => e.id === currentId.current);
    if (el) {
      emit('draw-end', { element: el });
    }
    currentId.current = null;
  };

  // ── Wheel Zoom ───────────────────────────────────────────────
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.06;
    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * scaleBy, 8)
      : Math.max(oldScale / scaleBy, 0.1);

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // ── Export ───────────────────────────────────────────────────
  useEffect(() => {
    window.__exportCanvas = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const dataURL = stage.toDataURL({ pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = `whiteboard-${Date.now()}.png`;
      a.click();
    };
  }, []);

  const cursorClass =
    tool === 'hand' ? (isPanning.current ? 'panning' : '') : `tool-${tool}`;

  return (
    <div
      className={`canvas-area ${cursorClass}`}
      style={{ width: '100%', height: '100%' }}
    >
      <Stage
        ref={stageRef}
        width={window.innerWidth - 72 - 240}
        height={window.innerHeight - 56}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onWheel={handleWheel}
        style={{ display: 'block' }}
      >
        <Layer ref={layerRef}>
          {elements.map((el) =>
            renderElement(el, el.id === selectedId, setSelectedId, null, stageRef)
          )}
        </Layer>
      </Stage>

      {/* Zoom indicator */}
      <div className="zoom-indicator">
        <button className="zoom-btn" onClick={() => setStageScale((s) => Math.max(s / 1.2, 0.1))}>−</button>
        <span>{Math.round(stageScale * 100)}%</span>
        <button className="zoom-btn" onClick={() => setStageScale((s) => Math.min(s * 1.2, 8))}>+</button>
        <button className="zoom-btn" title="Reset" onClick={() => { setStageScale(1); setStagePos({ x: 0, y: 0 }); }}>⊙</button>
      </div>
    </div>
  );
}
