import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";

export default function FiltroFechas({ desde, hasta, onDesdeChange, onHastaChange }) {
  const inputClass =
    "text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white cursor-pointer w-28";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400">Desde</span>
      <DatePicker
        selected={desde}
        onChange={onDesdeChange}
        locale={es}
        dateFormat="dd/MM/yyyy"
        placeholderText="—"
        isClearable
        className={inputClass}
      />
      <span className="text-xs text-gray-400">Hasta</span>
      <DatePicker
        selected={hasta}
        onChange={onHastaChange}
        locale={es}
        dateFormat="dd/MM/yyyy"
        placeholderText="—"
        isClearable
        minDate={desde ?? undefined}
        className={inputClass}
      />
    </div>
  );
}
