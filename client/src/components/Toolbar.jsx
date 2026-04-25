const TOOLS = [
  { id: 'select',  icon: '⬚',  label: 'Select' },
  { id: 'pen',     icon: '✏️',  label: 'Pen'    },
  { id: 'eraser',  icon: '⬜',  label: 'Erase'  },
  { id: 'line',    icon: '╱',   label: 'Line'   },
  { id: 'arrow',   icon: '→',   label: 'Arrow'  },
  { id: 'rect',    icon: '▭',   label: 'Rect'   },
  { id: 'circle',  icon: '○',   label: 'Circle' },
  { id: 'text',    icon: 'T',   label: 'Text'   },
  { id: 'hand',    icon: '✋',  label: 'Pan'    },
];

export default function Toolbar({ tool, setTool }) {
  return (
    <div className="toolbar">
      {TOOLS.map((t, i) => (
        <button
          key={t.id}
          data-tip={t.label}
          className={`tool-btn${tool === t.id ? ' active' : ''}`}
          onClick={() => setTool(t.id)}
          aria-label={t.label}
          aria-pressed={tool === t.id}
          id={`tool-${t.id}`}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{t.icon}</span>
          <span className="tool-label">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
