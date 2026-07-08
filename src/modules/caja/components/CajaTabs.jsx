const TABS = [
  { id: "movimientos", label: "Movimientos" },
  { id: "conceptos", label: "Conceptos" },
  { id: "auditoria", label: "Auditoría" },
];

export default function CajaTabs({ activeTab, onChange }) {
  return (
    <div className="flex gap-1 border-b border-gray-100 px-5">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`text-sm font-medium px-3 py-3 border-b-2 transition-colors -mb-px ${
            activeTab === tab.id
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
