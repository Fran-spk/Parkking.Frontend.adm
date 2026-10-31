import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { landingService } from "../services/landingService";
import { applyColorMarca, COLOR_MARCA_DEFAULT } from "../theme/parkking.theme.js";

const FRANJA = [
  "Abonos",
  "Rotativo",
  "Reservas",
  "Cuenta corriente",
  "Cocheras",
  "Reportes",
  "Permisos",
  "Capacitación gratuita",
];

const MAIL = "parkking.arg@gmail.com";
const WHATSAPP = "5493416522832";
const WHATSAPP_TEXTO = "341 652-2832";

const inputClass =
  "w-full px-3 py-2.5 text-sm border border-line-strong bg-surface-muted text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand focus:bg-surface-card";

const MODULOS = [
  {
    titulo: "Abonos",
    bajada: "La cochera deja de vivir en una planilla.",
    puntos: [
      "Cliente, plaza, vehículos y precio del período",
      "La cuota del mes se genera sola",
      "Recargo sugerido: se confirma al cobrar",
      "Contrato en PDF y documentos del abono",
      "Sabés quién está al día y quién debe",
    ],
  },
  {
    titulo: "Rotativo",
    bajada: "El auto de paso se cobra con la lista de la playa.",
    puntos: [
      "Ingreso por patente, tipo y hora",
      "Tarifa por fracción, tope o día completo",
      "Libre, o por zona con cupo",
      "Tolerancia y descuento antes del primer cobro",
      "Ticket de ingreso. Si es abonado, la estadía sale en cero",
    ],
  },
  {
    titulo: "Reservas",
    bajada: "La seña y la cochera prometida quedan registradas.",
    puntos: [
      "Alta con fecha, cochera y seña",
      "Seña pendiente visible en el día",
      "Al vencer, el sistema la cierra o la pasa a abono",
    ],
  },
  {
    titulo: "Caja",
    bajada: "Cada peso del turno tiene nombre y hora.",
    puntos: [
      "Cuenta corriente del estacionamiento y del cliente",
      "Cobros, señas, estadías, cargos y gastos",
      "Ajustes y reintegros, con signo",
      "Grupos para rendir por rubro",
      "El movimiento guarda quién lo cargó",
    ],
  },
  {
    titulo: "Cocheras",
    bajada: "El mapa del local, no un número suelto.",
    puntos: [
      "Cochera, categoría y ocupación",
      "Zonas de abono, aparte de las del rotativo",
      "Tipos de vehículo propios de la playa",
    ],
  },
  {
    titulo: "El día y los reportes",
    bajada: "El dueño mira. El contador recibe el archivo.",
    puntos: [
      "Ocupación, deuda y recaudado de hoy",
      "Abonos y rotativo, separados en el mes",
      "PDF del resumen y Excel de pagos",
      "Envío por mail",
      "Aviso de deuda al operador, el día que definas",
    ],
  },
];

const BENEFICIOS = [
  {
    titulo: "El día, sin llamar a la cabina",
    texto: "Ocupación, autos adentro, quién debe y lo recaudado hoy. En una pantalla, con los datos de esa playa.",
  },
  {
    titulo: "El abonado no paga dos veces",
    texto: "Si la patente tiene un abono activo, la estadía sale en cero. El auto de paso se cobra con la lista de fracciones.",
  },
  {
    titulo: "La cuota aparece sola",
    texto: "El período del abono se arma cada mes. Si hay recargo, el sistema lo sugiere y el operador lo confirma al cobrar.",
  },
  {
    titulo: "La caja deja rastro",
    texto: "Cobro, seña, gasto, ajuste y reintegro quedan en la cuenta, con quién los cargó y a qué hora.",
  },
  {
    titulo: "El playero opera en el teléfono",
    texto: "Ingreso, buscar y cobro en el celular. El panel completo queda en el escritorio. Una sola playa, dos pantallas.",
  },
  {
    titulo: "Papel cuando hace falta",
    texto: "Recibo al cobrar, contrato del abono en PDF, resumen del día y Excel de pagos para mandar por mail.",
  },
];

const PREGUNTAS = [
  {
    q: "¿Dónde se usa hoy?",
    a: "En estacionamientos de Rosario y alrededores. Cada playa entra a su propio espacio: cocheras, gente y cuenta no se comparten.",
  },
  {
    q: "¿Es para el que estaciona el auto?",
    a: "No. Es el sistema del estacionamiento. Lo usa el dueño, la administración y el playero.",
  },
  {
    q: "¿Sirve si tengo abonos y también rotativo?",
    a: "Sí. Los dos conviven. La patente del abono activo no paga la estadía. El resto se cobra al salir.",
  },
  {
    q: "¿El playero necesita otra aplicación?",
    a: "No. En el teléfono se abre el modo playa desde el navegador: ingreso, buscar patente y cobro. Se puede instalar como una app.",
  },
  {
    q: "¿Puedo tener más de un local?",
    a: "Sí. Cada sucursal es un estacionamiento aparte. El usuario elige a cuál entra.",
  },
  {
    q: "¿Quién ve qué?",
    a: "Hay grupos y permisos. Se puede dejar el ingreso y el cobro en la playa, y la administración de tarifas o usuarios en la oficina.",
  },
  {
    q: "¿La capacitación se cobra?",
    a: "No. La capacitación es gratuita: al dueño, a la administración y al playero, con la operatoria de esa playa.",
  },
  {
    q: "¿Cómo arranco?",
    a: "Pedís la demo con el nombre de la playa. La recorremos con tu operatoria y la capacitación entra sin cargo.",
  },
];

const PASOS = [
  ["01", "Pedís la demo", "Nombre de la playa y un mail. Te escribimos por ahí o por WhatsApp."],
  ["02", "La vemos con tu operatoria", "Abonos, rotativo y la caja, con cómo cobra esa playa."],
  ["03", "Capacitación gratuita", "Dueño, administración y playero. Entra sin cargo."],
];

function Marca({ clara = false, oro = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`w-8 h-8 flex items-center justify-center ${
          oro
            ? "bg-[#c6a15a] text-[#2a210c]"
            : clara
              ? "bg-brand-foreground text-brand"
              : "bg-brand text-brand-foreground"
        }`}
      >
        <span className="text-sm font-black leading-none">P</span>
      </span>
      <span className={`text-sm font-black tracking-tight ${clara ? "text-brand-foreground" : "text-ink"}`}>
        Parkking
      </span>
    </span>
  );
}

export default function Landing() {
  const [nombre, setNombre] = useState("");
  const [estacionamiento, setEstacionamiento] = useState("");
  const [mail, setMail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);

  useEffect(() => {
    applyColorMarca(COLOR_MARCA_DEFAULT);
    document.title = "Parkking — La playa y la caja, en el mismo sistema";
    return () => {
      document.title = "Parkking";
    };
  }, []);

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setEnviando(true);
    try {
      const texto = await landingService.consultar({
        nombre,
        estacionamiento,
        mail,
        mensaje,
      });
      setOk(texto);
      setNombre("");
      setEstacionamiento("");
      setMail("");
      setMensaje("");
    } catch (err) {
      setError(err.message || "No se pudo enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div id="top" className="min-h-screen bg-surface-page text-ink">
      <header className="sticky top-0 z-20 bg-surface-card/95 backdrop-blur-sm border-b border-[#c6a15a]/50">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-6">
          <a href="#top" className="shrink-0">
            <Marca oro />
          </a>
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-ink-muted">
            <a href="#beneficios" className="hover:text-ink">
              Beneficios
            </a>
            <a href="#que-podes-hacer" className="hover:text-ink">
              Qué podés hacer
            </a>
            <a href="#preguntas" className="hover:text-ink">
              Preguntas
            </a>
            <a href="#control" className="hover:text-ink">
              Control
            </a>
            <a href="#contacto" className="hover:text-ink">
              Demo
            </a>
          </nav>
          <a
            href="#contacto"
            className="px-3 py-1.5 text-xs font-bold bg-[#c6a15a] text-[#2a210c] hover:bg-[#d4b56a]"
          >
            Pedir demo
          </a>
        </div>
      </header>

      <section className="pk-land-hero relative overflow-hidden bg-brand text-brand-foreground">
        <div className="max-w-6xl mx-auto px-5 py-20 sm:py-28 grid lg:grid-cols-[1.15fr_0.85fr] gap-14 lg:gap-20 items-end">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#c6a15a]">
              Gestión de estacionamientos · Rosario
            </p>
            <h1 className="mt-4 text-[2.15rem] sm:text-5xl font-black tracking-tight leading-[1.05]">
              La playa entera. Abonos, rotativo y la caja.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-brand-soft leading-relaxed max-w-xl">
              Un sistema para el dueño que quiere ver el día, y para el playero que tiene que cobrarlo. Hoy se usa en
              estacionamientos de Rosario y alrededores.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-[#c6a15a] text-[#2a210c] hover:bg-[#d4b56a]"
              >
                Pedir una demo
                <ArrowRight size={16} />
              </a>
              <a href="#que-podes-hacer" className="text-sm font-semibold text-brand-soft hover:text-brand-foreground">
                Ver qué podés hacer
              </a>
            </div>
          </div>

          <div className="relative border border-[#c6a15a]/50 shadow-[0_0_0_1px_rgba(198,161,90,0.15),0_24px_60px_-24px_rgba(198,161,90,0.45)]">
            <div className="absolute -top-px left-0 right-0 h-1 bg-[#c6a15a]" />
            <div className="px-4 py-3 border-b border-white/10 flex items-baseline justify-between gap-3">
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-brand-soft">Hoy en la playa</p>
              <p className="text-[11px] text-brand-soft">Ejemplo</p>
            </div>
            <dl className="grid grid-cols-2">
              {[
                ["Cocheras ocupadas", "42 / 60"],
                ["Abonos activos", "38"],
                ["Autos adentro", "11"],
                ["Recaudado hoy", "$ 186.000"],
              ].map(([label, valor], i) => (
                <div
                  key={label}
                  className={`px-4 py-4 ${i % 2 === 0 ? "border-r border-white/10" : ""} ${
                    i < 2 ? "border-b border-white/10" : ""
                  }`}
                >
                  <dt className="text-[11px] font-semibold text-brand-soft">{label}</dt>
                  <dd className="mt-1.5 text-2xl font-black tabular-nums tracking-tight text-[#c6a15a]">{valor}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-[#8a6d32] bg-[#c6a15a]" aria-label="Qué incluye Parkking">
        <div className="pk-marquee-track flex w-max py-4">
          {[0, 1].map((copia) => (
            <div key={copia} className="flex shrink-0 items-center">
              {FRANJA.map((item) => (
                <span
                  key={`${copia}-${item}`}
                  className="px-8 text-[11px] font-bold tracking-[0.16em] uppercase text-[#2a210c]"
                >
                  {item}
                  <span className="ml-8 text-[#6e5420]" aria-hidden>
                    ·
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section id="beneficios" className="bg-surface-muted border-b border-line">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="max-w-2xl">
            <p className="pk-label text-[#8a6d32]">Beneficios</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
              Lo que el dueño deja de adivinar
            </h2>
            <p className="mt-3 text-sm sm:text-base text-ink-muted leading-relaxed">
              Menos planilla, más rastro. La playa sigue cobrando como cobra. Parkking deja el movimiento a la vista.
            </p>
          </div>
          <ol className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-line-strong border border-line-strong">
            {BENEFICIOS.map((b, i) => (
              <li key={b.titulo} className="pk-land-card bg-surface-card p-6">
                <p className="text-[11px] font-bold tracking-[0.14em] text-[#8a6d32]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-base font-black tracking-tight">{b.titulo}</h3>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">{b.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="que-podes-hacer" className="max-w-6xl mx-auto px-5 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Descubrí todo lo que podés hacer con nuestro sistema
          </h2>
          <p className="mt-3 text-sm sm:text-base text-ink-muted leading-relaxed">
            Abonos, autos de paso, reservas, cocheras, la caja y el día de la playa. Hecho para el estacionamiento, no
            para un comercio cualquiera.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-2 gap-px bg-line-strong border border-line-strong">
          {MODULOS.map((m) => (
            <article key={m.titulo} className="pk-land-card bg-surface-card p-6 sm:p-8">
              <h3 className="text-lg font-black tracking-tight">{m.titulo}</h3>
              <p className="mt-1 text-sm font-semibold text-ink">{m.bajada}</p>
              <ul className="mt-4 space-y-2">
                {m.puntos.map((p) => (
                  <li key={p} className="text-sm text-ink-muted leading-relaxed pl-3 border-l-2 border-[#c6a15a]">
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="operacion" className="bg-brand text-brand-foreground">
        <div className="max-w-6xl mx-auto px-5 py-20 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#c6a15a]">Operación</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">
              El playero cobra. El dueño ve el número.
            </h2>
            <p className="mt-4 text-brand-soft leading-relaxed max-w-md">
              En el celular se abre el modo playa: ingreso, buscar patente y cobro. En el escritorio queda el panel,
              con el color de tu marca.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Patente, tiempo adentro y saldo del momento",
                "El abonado no paga la estadía",
                "El ticket de ingreso se reimprime",
                "La misma playa, sin otra aplicación",
              ].map((linea) => (
                <li key={linea} className="flex gap-3">
                  <span className="text-[#c6a15a]">—</span>
                  <span>{linea}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative bg-brand-strong border border-[#c6a15a]/40 max-w-sm w-full mx-auto shadow-[0_24px_50px_-20px_rgba(198,161,90,0.35)]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#c6a15a]" />
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
              <Marca clara />
              <span className="text-xs font-semibold tabular-nums">14:32</span>
            </div>
            <div className="px-4 py-8 text-center">
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-brand-soft">Rotativo</p>
              <p className="mt-2 text-2xl font-black tracking-tight">AB 123 CD</p>
              <p className="mt-1 text-xs text-brand-soft">Adentro · 1 h 12 min</p>
              <p className="mt-5 text-3xl font-black tabular-nums text-[#c6a15a]">$ 4.500</p>
              <p className="mt-1 text-[11px] text-brand-soft">Saldo al momento · ejemplo</p>
            </div>
            <div className="grid grid-cols-3 text-[11px] font-bold text-center border-t border-white/10">
              <div className="py-3 text-brand-foreground bg-white/10">Ingreso</div>
              <div className="py-3 text-brand-soft">Buscar</div>
              <div className="py-3 text-brand-soft">Cobrar</div>
            </div>
          </div>
        </div>
      </section>

      <section id="control" className="max-w-6xl mx-auto px-5 py-20">
        <div className="max-w-2xl">
          <p className="pk-label text-[#8a6d32]">Control</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">La playa con reglas, no con memoria</h2>
        </div>
        <div className="mt-10 grid sm:grid-cols-3 gap-px bg-line-strong border border-line-strong">
          {[
            [
              "Quién puede qué",
              "Ingreso, cobro, tarifas, usuarios. Cada grupo ve su parte. El administrador ve el resto.",
            ],
            [
              "Más de una sucursal",
              "El mismo usuario entra a otra playa. Cocheras, gente y cuenta no se mezclan.",
            ],
            [
              "Tu marca en pantalla",
              "Color, datos del titular y reglas de contrato, recibo y aviso de deuda. Por estacionamiento.",
            ],
          ].map(([titulo, texto]) => (
            <article key={titulo} className="pk-land-card bg-surface-card p-6 sm:p-7">
              <h3 className="text-base font-black tracking-tight">{titulo}</h3>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">{texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="preguntas" className="border-t border-line bg-surface-muted">
        <div className="max-w-6xl mx-auto px-5 py-20 grid lg:grid-cols-[0.8fr_1.2fr] gap-12">
          <div>
            <p className="pk-label text-[#8a6d32]">Preguntas frecuentes</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">Antes de pedir la demo</h2>
            <p className="mt-4 text-sm text-ink-muted leading-relaxed">
              Parkking ya está en playas de Rosario y alrededores. Si la tuya cobra abono, rotativo o las dos cosas,
              estas son las respuestas cortas.
            </p>
          </div>
          <dl className="border-t border-line-strong">
            {PREGUNTAS.map((item) => (
              <div key={item.q} className="pk-land-faq border-b border-line-strong py-5">
                <dt className="text-sm font-bold">{item.q}</dt>
                <dd className="mt-2 text-sm text-ink-muted leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-line bg-brand text-brand-foreground">
        <div className="max-w-6xl mx-auto px-5 py-16 grid md:grid-cols-3 gap-10">
          {PASOS.map(([n, titulo, texto]) => (
            <div key={n}>
              <p className="text-3xl font-black tracking-tight text-[#c6a15a]">{n}</p>
              <h2 className="mt-2 text-lg font-black tracking-tight">{titulo}</h2>
              <p className="mt-2 text-sm text-brand-soft leading-relaxed">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contacto" className="border-t border-[#c6a15a]/40 bg-surface-card">
        <div className="max-w-6xl mx-auto px-5 py-20 grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20">
          <div>
            <p className="pk-label text-[#8a6d32]">Demo</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">La abrimos con tu playa</h2>
            <p className="mt-4 text-sm sm:text-base text-ink-muted leading-relaxed max-w-md">
              Contanos cocheras, si cobrás rotativo y si hay más de un local. Te mostramos abonos, estadías y la caja
              con la operatoria de tu estacionamiento. La capacitación es gratuita.
            </p>
            <p className="mt-6 text-sm font-semibold">Abonos. Rotativo. Reservas. Caja. Reportes.</p>
            <div className="mt-8 flex flex-col items-start gap-3 text-sm">
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border border-[#c6a15a]/70 px-3 py-2 font-bold text-ink hover:bg-[#c6a15a]/15"
              >
                WhatsApp {WHATSAPP_TEXTO}
              </a>
              <a
                href={`mailto:${MAIL}`}
                className="inline-flex items-center gap-2 border border-[#c6a15a]/70 px-3 py-2 font-bold text-ink hover:bg-[#c6a15a]/15"
              >
                {MAIL}
              </a>
            </div>
          </div>
          <form onSubmit={enviar} className="relative border border-[#c6a15a]/60 bg-surface-page p-6 sm:p-7 space-y-4 shadow-[0_20px_50px_-28px_rgba(198,161,90,0.8)]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#c6a15a]" />
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="pk-label block">Nombre</span>
                <input
                  className={inputClass}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  autoComplete="name"
                  disabled={enviando}
                />
              </label>
              <label className="space-y-1.5">
                <span className="pk-label block">Mail</span>
                <input
                  type="email"
                  className={inputClass}
                  value={mail}
                  onChange={(e) => setMail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="tu@mail.com"
                  disabled={enviando}
                />
              </label>
            </div>
            <label className="space-y-1.5 block">
              <span className="pk-label block">Estacionamiento</span>
              <input
                className={inputClass}
                value={estacionamiento}
                onChange={(e) => setEstacionamiento(e.target.value)}
                placeholder="Nombre de la playa"
                disabled={enviando}
              />
            </label>
            <label className="space-y-1.5 block">
              <span className="pk-label block">Cómo es la playa</span>
              <textarea
                className={`${inputClass} min-h-[96px] resize-y`}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Cocheras, rotativo, sucursales, cómo cobran hoy"
                disabled={enviando}
              />
            </label>
            {error && <p className="text-xs text-danger-ink">{error}</p>}
            {ok && <p className="text-xs text-success-ink">{ok}</p>}
            <button
              type="submit"
              disabled={enviando}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#c6a15a] text-[#2a210c] text-sm font-bold hover:bg-[#d4b56a] disabled:opacity-60"
            >
              {enviando ? "Enviando…" : "Quiero ver Parkking"}
            </button>
          </form>
        </div>
      </section>

      <a
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-30 bg-[#128C7E] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_30px_-8px_rgba(18,140,126,0.8)] hover:bg-[#0f7a6e]"
      >
        WhatsApp
      </a>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-5 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-faint">
          <span>© {new Date().getFullYear()} Parkking</span>
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="font-semibold hover:text-ink">
              WhatsApp {WHATSAPP_TEXTO}
            </a>
            <a href={`mailto:${MAIL}`} className="font-semibold hover:text-ink">
              {MAIL}
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
