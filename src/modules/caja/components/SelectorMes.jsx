import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";

export default function SelectorMes({ mes, onChange }) {
  return (
    <DatePicker
      selected={mes}
      onChange={onChange}
      locale={es}
      dateFormat="MMMM yyyy"
      showMonthYearPicker
      showFullMonthYearPicker
      className="text-sm font-medium border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white cursor-pointer"
    />
  );
}
