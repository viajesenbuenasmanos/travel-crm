import { useState, useMemo } from "react";

const initialClients = [
  {
    id: 1,
    name: "María González",
    email: "maria@email.com",
    phone: "+54 11 4567-8901",
    status: "activo",
    favoriteDestination: "Orlando",
    notes: "Prefiere vuelos directos. Le gustan los hoteles dentro del parque.",
    trips: [
      {
        id: 1,
        destination: "Orlando",
        date: "2024-12-10",
        days: 10,
        status: "confirmado",
        amount: 5800,
        pax: { adults: 2, minors: [8, 11] },
        parks: {
          disney: true,
          universal: true,
          disneyParks: ["Magic Kingdom", "EPCOT", "Hollywood Studios"],
          universalParks: ["Universal Studios", "Islands of Adventure"],
        },
        hotel: { location: "dentro", name: "Disney's Grand Floridian" },
      },
    ],
    followUps: [
      { id: 1, date: "2024-11-01", note: "Confirmar traslado aeropuerto", done: false },
    ],
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    email: "carlos@email.com",
    phone: "+54 11 5678-9012",
    status: "prospecto",
    favoriteDestination: "Orlando",
    notes: "Viaja con familia numerosa. Busca hotel cerca de los parques.",
    trips: [],
    followUps: [
      { id: 1, date: "2024-10-25", note: "Enviar presupuesto Disney diciembre", done: false },
    ],
  },
];

const STATUS_CONFIG = {
  activo: { label: "Activo", color: "#10b981", bg: "#d1fae5" },
  prospecto: { label: "Prospecto", color: "#f59e0b", bg: "#fef3c7" },
  inactivo: { label: "Inactivo", color: "#6b7280", bg: "#f3f4f6" },
};

const TRIP_STATUS = {
  completado: { label: "Completado", color: "#10b981" },
  confirmado: { label: "Confirmado", color: "#3b82f6" },
  pendiente: { label: "Pendiente", color: "#f59e0b" },
  cancelado: { label: "Cancelado", color: "#ef4444" },
};

const DISNEY_PARKS = ["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom"];
const UNIVERSAL_PARKS = ["Universal Studios", "Islands of Adventure", "Epic Universe"];

function Avatar({ name, size = 38 }) {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["#0ea5e9", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#ef4444"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Badge({ status }) {
  const cfg = STATUS_CONFIG[status];
  return <span style={{ background: cfg.bg, color: cfg.color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{cfg.label}</span>;
}

function Chip({ children, color = "#1a1814" }) {
  return <span style={{ background: color + "18", color, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3, margin: "2px" }}>{children}</span>;
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>{children}</div>;
}

function FInput({ value, onChange, type = "text", placeholder, min, style = {} }) {
  return (
    <input type={type} value={value} min={min} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "9px 12px", border: "1px solid #e8e5e0", borderRadius: 8, fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", outline: "none", background: "#f8f7f4", color: "#1a1814", ...style }} />
  );
}

function SectionDivider({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6, color: "#1a1814", borderBottom: "2px solid #f0ede8", paddingBottom: 6, marginBottom: 12, marginTop: 6 }}>{children}</div>;
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 14px", borderBottom: "1px solid #e8e5e0", fontSize: 13.5 }}>
      <span style={{ color: "#8c8680", fontWeight: 500 }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

function InfoSection({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 7 }}>{title}</div>
      <div style={{ background: "#f8f7f4", borderRadius: 10, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function ParkToggle({ label, active, onToggle, parks, selected, onParkToggle, color }) {
  return (
    <div style={{ border: `1.5px solid ${active ? color : "#e8e5e0"}`, borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
      <button onClick={onToggle} style={{ width: "100%", padding: "10px 14px", background: active ? color : "#f8f7f4", color: active ? "#fff" : "#1a1814", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left", display: "flex", alignItems: "center", gap: 6 }}>
        <span>{active ? "✅" : "⬜"}</span> {label}
      </button>
      {active && (
        <div style={{ padding: "10px 14px", background: "#fff" }}>
          <div style={{ fontSize: 11, color: "#8c8680", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>Parques incluidos:</div>
          {parks.map(p => (
            <label key={p} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 13 }}>
              <input type="checkbox" checked={selected.includes(p)} onChange={() => onParkToggle(p)} style={{ accentColor: color, width: 14, height: 14 }} />
              {p}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function TripCard({ trip, onClick }) {
  const minors = trip.pax?.minors || [];
  const adults = trip.pax?.adults || 0;
  const hasDisney = trip.parks?.disney;
  const hasUniversal = trip.parks?.universal;
  const hotelIn = trip.hotel?.location === "dentro";
  const hotelOut = trip.hotel?.location === "fuera";

  return (
    <div onClick={onClick}
      style={{ background: "#fff", border: "1px solid #e8e5e0", borderRadius: 12, padding: 16, marginBottom: 10, cursor: "pointer", transition: "all .15s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#1a1814"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e5e0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>📍 {trip.destination || "Orlando"}</div>
          <div style={{ fontSize: 12, color: "#8c8680", marginTop: 2 }}>
            {trip.date ? new Date(trip.date + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "Sin fecha"}
            {trip.days ? ` · ${trip.days} días` : ""}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{ background: (TRIP_STATUS[trip.status]?.color || "#888") + "22", color: TRIP_STATUS[trip.status]?.color || "#888", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12 }}>
            {TRIP_STATUS[trip.status]?.label || trip.status}
          </span>
          {trip.amount > 0 && <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>USD {Number(trip.amount).toLocaleString()}</span>}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <Chip color="#0ea5e9">👥 {adults + minors.length} pax</Chip>
        <Chip color="#6366f1">🧑 {adults} adulto{adults !== 1 ? "s" : ""}</Chip>
        {minors.length > 0 && <Chip color="#ec4899">🧒 {minors.length} menor{minors.length !== 1 ? "es" : ""} ({minors.join(", ")} años)</Chip>}
        {hasDisney && <Chip color="#1565c0">🏰 Disney</Chip>}
        {hasUniversal && <Chip color="#2e7d32">🎬 Universal</Chip>}
        {!hasDisney && !hasUniversal && <Chip color="#888">Sin parques</Chip>}
        {hotelIn && <Chip color="#7c3aed">🏨 Dentro del parque</Chip>}
        {hotelOut && <Chip color="#7c3aed">🏩 Fuera del parque</Chip>}
      </div>
    </div>
  );
}

function TripDetail({ trip, onClose }) {
  const minors = trip.pax?.minors || [];
  const adults = trip.pax?.adults || 0;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(2px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 480, maxWidth: "95vw", maxHeight: "85vh", overflowY: "auto", border: "1px solid #e8e5e0", boxShadow: "0 24px 64px rgba(0,0,0,0.15)", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>📍 {trip.destination || "Orlando"}</div>
            <div style={{ fontSize: 13, color: "#8c8680", marginTop: 3 }}>
              {trip.date ? new Date(trip.date + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "Sin fecha"}
              {trip.days ? ` · ${trip.days} días` : ""}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#f0ede8", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>✕ Cerrar</button>
        </div>

        <InfoSection title="👥 Pasajeros">
          <InfoRow label="Total pasajeros" value={`${adults + minors.length} personas`} />
          <InfoRow label="Adultos" value={String(adults)} />
          <InfoRow label="Menores" value={minors.length > 0 ? `${minors.length} (${minors.join(", ")} años)` : "Sin menores"} />
        </InfoSection>

        <InfoSection title="🎢 Parques">
          <InfoRow label="Disney" value={trip.parks?.disney ? "✅ Sí" : "❌ No"} />
          {trip.parks?.disney && trip.parks?.disneyParks?.length > 0 &&
            <InfoRow label="Parques Disney" value={trip.parks.disneyParks.join(", ")} />}
          <InfoRow label="Universal" value={trip.parks?.universal ? "✅ Sí" : "❌ No"} />
          {trip.parks?.universal && trip.parks?.universalParks?.length > 0 &&
            <InfoRow label="Parques Universal" value={trip.parks.universalParks.join(", ")} />}
        </InfoSection>

        <InfoSection title="🏨 Hotel">
          <InfoRow label="Ubicación" value={trip.hotel?.location === "dentro" ? "Dentro del parque" : trip.hotel?.location === "fuera" ? "Fuera del parque" : "No especificado"} />
          {trip.hotel?.name && <InfoRow label="Hotel" value={trip.hotel.name} />}
        </InfoSection>

        <InfoSection title="💰 Económico">
          <InfoRow label="Estado" value={TRIP_STATUS[trip.status]?.label || trip.status} />
          <InfoRow label="Monto" value={trip.amount ? `USD ${Number(trip.amount).toLocaleString()}` : "No especificado"} />
        </InfoSection>
      </div>
    </div>
  );
}

function TripForm({ clientName, onSave, onClose }) {
  const [form, setForm] = useState({
    destination: "Orlando", date: "", days: "", status: "pendiente", amount: "",
    adults: 2, minorCount: 0, minorAges: [],
    disney: false, universal: false, disneyParks: [], universalParks: [],
    hotelLocation: "", hotelName: "",
  });

  const setMinorCount = (n) => {
    const count = Math.max(0, parseInt(n) || 0);
    const ages = Array.from({ length: count }, (_, i) => form.minorAges[i] || "");
    setForm(p => ({ ...p, minorCount: count, minorAges: ages }));
  };

  const togglePark = (type, park) => {
    setForm(p => {
      const key = type === "disney" ? "disneyParks" : "universalParks";
      const arr = p[key].includes(park) ? p[key].filter(x => x !== park) : [...p[key], park];
      return { ...p, [key]: arr };
    });
  };

  const handleSave = () => {
    const minorAges = form.minorAges.map(a => parseInt(a) || 0).filter(a => a >= 0 && a <= 17);
    onSave({
      id: Date.now(),
      destination: form.destination || "Orlando",
      date: form.date, days: parseInt(form.days) || 0,
      status: form.status, amount: parseFloat(form.amount) || 0,
      pax: { adults: parseInt(form.adults) || 0, minors: minorAges },
      parks: { disney: form.disney, universal: form.universal, disneyParks: form.disney ? form.disneyParks : [], universalParks: form.universal ? form.universalParks : [] },
      hotel: { location: form.hotelLocation, name: form.hotelName },
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(2px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 520, maxWidth: "96vw", maxHeight: "92vh", overflowY: "auto", border: "1px solid #e8e5e0", boxShadow: "0 24px 64px rgba(0,0,0,0.15)", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5, marginBottom: 20 }}>✈ Nuevo viaje — {clientName}</div>

        <SectionDivider>📍 Destino y fechas</SectionDivider>
        <FieldLabel>Destino</FieldLabel>
        <FInput value={form.destination} onChange={v => setForm(p => ({ ...p, destination: v }))} placeholder="Ej: Orlando" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><FieldLabel>Fecha aprox. de viaje</FieldLabel><FInput type="date" value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} /></div>
          <div><FieldLabel>Cantidad de días</FieldLabel><FInput type="number" value={form.days} onChange={v => setForm(p => ({ ...p, days: v }))} placeholder="Ej: 10" /></div>
        </div>

        <SectionDivider>👥 Pasajeros</SectionDivider>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><FieldLabel>Adultos</FieldLabel><FInput type="number" value={form.adults} onChange={v => setForm(p => ({ ...p, adults: v }))} min={1} /></div>
          <div><FieldLabel>Cantidad de menores</FieldLabel><FInput type="number" value={form.minorCount} onChange={setMinorCount} min={0} /></div>
        </div>
        {form.minorCount > 0 && (
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>Edades de los menores (años)</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {form.minorAges.map((age, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 12, color: "#8c8680" }}>Menor {i + 1}:</span>
                  <input type="number" min={0} max={17} value={age}
                    onChange={e => { const ages = [...form.minorAges]; ages[i] = e.target.value; setForm(p => ({ ...p, minorAges: ages })); }}
                    style={{ width: 58, padding: "7px 8px", border: "1px solid #e8e5e0", borderRadius: 7, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", textAlign: "center", background: "#f8f7f4" }}
                    placeholder="edad" />
                </div>
              ))}
            </div>
          </div>
        )}

        <SectionDivider>🎢 Parques</SectionDivider>
        <ParkToggle label="🏰 Disney" active={form.disney}
          onToggle={() => setForm(p => ({ ...p, disney: !p.disney, disneyParks: [] }))}
          parks={DISNEY_PARKS} selected={form.disneyParks}
          onParkToggle={p => togglePark("disney", p)} color="#1565c0" />
        <ParkToggle label="🎬 Universal" active={form.universal}
          onToggle={() => setForm(p => ({ ...p, universal: !p.universal, universalParks: [] }))}
          parks={UNIVERSAL_PARKS} selected={form.universalParks}
          onParkToggle={p => togglePark("universal", p)} color="#2e7d32" />

        <SectionDivider>🏨 Hotel</SectionDivider>
        <FieldLabel>Ubicación del hotel</FieldLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[["dentro", "🏰 Dentro del parque"], ["fuera", "🏩 Fuera del parque"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setForm(p => ({ ...p, hotelLocation: val }))}
              style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${form.hotelLocation === val ? "#1a1814" : "#e8e5e0"}`, background: form.hotelLocation === val ? "#1a1814" : "#fff", color: form.hotelLocation === val ? "#fff" : "#1a1814", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all .15s" }}>
              {lbl}
            </button>
          ))}
        </div>
        <FieldLabel>Nombre del hotel (opcional)</FieldLabel>
        <FInput value={form.hotelName} onChange={v => setForm(p => ({ ...p, hotelName: v }))} placeholder="Ej: Disney's Grand Floridian" />

        <SectionDivider>💰 Económico</SectionDivider>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 6 }}>
          <div>
            <FieldLabel>Estado</FieldLabel>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #e8e5e0", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", background: "#f8f7f4", color: "#1a1814" }}>
              {Object.entries(TRIP_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div><FieldLabel>Monto (USD)</FieldLabel><FInput type="number" value={form.amount} onChange={v => setForm(p => ({ ...p, amount: v }))} placeholder="0" /></div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid #e8e5e0" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e8e5e0", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Cancelar</button>
          <button onClick={handleSave} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#1a1814", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Guardar viaje</button>
        </div>
      </div>
    </div>
  );
}

export default function CRM() {
  const [view, setView] = useState("clientes");
  const [clients, setClients] = useState(initialClients);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [showTripForm, setShowTripForm] = useState(false);
  const [showTripDetail, setShowTripDetail] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showFUModal, setShowFUModal] = useState(false);
  const [clientForm, setClientForm] = useState({});
  const [fuForm, setFuForm] = useState({});

  const filtered = useMemo(() => clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.favoriteDestination.toLowerCase().includes(q);
    return matchSearch && (filterStatus === "todos" || c.status === filterStatus);
  }), [clients, search, filterStatus]);

  const pendingFollowUps = useMemo(() =>
    clients.flatMap(c => c.followUps.filter(f => !f.done).map(f => ({ ...f, clientName: c.name, clientId: c.id })))
  , [clients]);

  const stats = useMemo(() => {
    const allTrips = clients.flatMap(c => c.trips);
    return {
      total: clients.length,
      active: clients.filter(c => c.status === "activo").length,
      prospects: clients.filter(c => c.status === "prospecto").length,
      revenue: allTrips.filter(t => t.status === "completado").reduce((s, t) => s + (t.amount || 0), 0),
      totalTrips: allTrips.length,
      disneyOnly: allTrips.filter(t => t.parks?.disney && !t.parks?.universal).length,
      universalOnly: allTrips.filter(t => !t.parks?.disney && t.parks?.universal).length,
      both: allTrips.filter(t => t.parks?.disney && t.parks?.universal).length,
      hotelInside: allTrips.filter(t => t.hotel?.location === "dentro").length,
      hotelOutside: allTrips.filter(t => t.hotel?.location === "fuera").length,
      totalMinors: allTrips.reduce((s, t) => s + (t.pax?.minors?.length || 0), 0),
      pending: pendingFollowUps.length,
    };
  }, [clients, pendingFollowUps]);

  function saveTrip(trip) {
    setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, trips: [...c.trips, trip] } : c));
    setSelectedClient(prev => ({ ...prev, trips: [...prev.trips, trip] }));
    setShowTripForm(false);
  }

  function saveClient() {
    if (!clientForm.name) return;
    setClients(prev => [...prev, { ...clientForm, id: Date.now(), trips: [], followUps: [] }]);
    setShowClientModal(false);
  }

  function saveFU() {
    if (!fuForm.note) return;
    const newFU = { ...fuForm, id: Date.now(), done: false };
    setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, followUps: [...c.followUps, newFU] } : c));
    setSelectedClient(prev => ({ ...prev, followUps: [...prev.followUps, newFU] }));
    setShowFUModal(false);
  }

  function toggleFU(clientId, fuId) {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, followUps: c.followUps.map(f => f.id === fuId ? { ...f, done: !f.done } : f) } : c));
    if (selectedClient?.id === clientId)
      setSelectedClient(prev => ({ ...prev, followUps: prev.followUps.map(f => f.id === fuId ? { ...f, done: !f.done } : f) }));
  }

  const navItems = [
    { id: "clientes", icon: "👥", label: "Clientes" },
    { id: "seguimiento", icon: "🔔", label: "Seguimiento", badge: pendingFollowUps.length },
    { id: "stats", icon: "📊", label: "Estadísticas" },
  ];

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #e8e5e0", borderRadius: 8, fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", color: "#1a1814", background: "#f8f7f4", outline: "none" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..800;1,9..40,300..800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .crm-wrap { display: flex; height: 100vh; background: #f8f7f4; font-family: 'DM Sans', sans-serif; color: #1a1814; }
        .sidebar { width: 215px; background: #1a1814; display: flex; flex-direction: column; padding: 24px 0; flex-shrink: 0; }
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .topbar { padding: 16px 24px; background: #fff; border-bottom: 1px solid #e8e5e0; display: flex; align-items: center; justify-content: space-between; }
        .content { flex: 1; overflow-y: auto; padding: 24px; }
        .nav-btn { display: flex; align-items: center; gap: 10px; padding: 10px 20px; width: 100%; background: none; border: none; color: rgba(255,255,255,0.5); font-size: 13.5px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .15s; }
        .nav-btn:hover { color: #fff; background: rgba(255,255,255,0.07); }
        .nav-btn.active { color: #fff; background: rgba(255,255,255,0.13); }
        .nav-badge { background: #ef4444; color: #fff; font-size: 10px; font-weight: 700; border-radius: 20px; padding: 1px 6px; margin-left: auto; }
        .tab-btn { padding: 12px 16px; font-size: 13px; font-weight: 500; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; color: #8c8680; font-family: 'DM Sans', sans-serif; margin-bottom: -1px; transition: all .15s; }
        .tab-btn.active { color: #1a1814; border-bottom-color: #1a1814; font-weight: 700; }
        .client-card { background: #fff; border: 1px solid #e8e5e0; border-radius: 12px; padding: 18px; cursor: pointer; transition: all .15s; }
        .client-card:hover { border-color: #1a1814; box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }
        .fu-check { width: 18px; height: 18px; border: 2px solid #e8e5e0; border-radius: 4px; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; margin-top: 2px; transition: all .15s; font-size: 11px; color: transparent; }
        .fu-check.done { background: #1a1814; border-color: #1a1814; color: #fff; }
        .stat-card { background: #fff; border: 1px solid #e8e5e0; border-radius: 12px; padding: 18px; }
        .empty-state { text-align: center; padding: 48px 24px; color: #8c8680; font-size: 14px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); }
        .modal { background: #fff; border-radius: 14px; padding: 24px; width: 420px; max-width: 95vw; border: 1px solid #e8e5e0; box-shadow: 0 20px 60px rgba(0,0,0,0.15); font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="crm-wrap">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>✈ TravelCRM</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>Agencia de Viajes</div>
          </div>
          <nav style={{ padding: "16px 0", flex: 1 }}>
            {navItems.map(item => (
              <button key={item.id} className={`nav-btn ${(view === item.id || (view === "detalle" && item.id === "clientes")) ? "active" : ""}`}
                onClick={() => { setView(item.id); if (item.id !== "detalle") setSelectedClient(null); }}>
                <span>{item.icon}</span><span>{item.label}</span>
                {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
              </button>
            ))}
          </nav>
          <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "rgba(255,255,255,0.28)", lineHeight: 1.6 }}>
            {stats.total} clientes · {stats.totalTrips} viajes
          </div>
        </div>

        {/* MAIN */}
        <div className="main">

          {/* CLIENTES */}
          {view === "clientes" && (
            <>
              <div className="topbar">
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Clientes</div>
                <button onClick={() => { setClientForm({ name: "", email: "", phone: "", status: "prospecto", favoriteDestination: "Orlando", notes: "" }); setShowClientModal(true); }}
                  style={{ background: "#1a1814", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  + Nuevo cliente
                </button>
              </div>
              <div className="content">
                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  <input style={{ ...inputStyle, flex: 1 }} placeholder="🔍 Buscar por nombre, email o destino..." value={search} onChange={e => setSearch(e.target.value)} />
                  <select style={{ ...inputStyle, width: "auto", cursor: "pointer" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="todos">Todos</option>
                    <option value="activo">Activos</option>
                    <option value="prospecto">Prospectos</option>
                    <option value="inactivo">Inactivos</option>
                  </select>
                </div>
                {filtered.length === 0 ? (
                  <div className="empty-state"><div style={{ fontSize: 40, marginBottom: 12 }}>🧳</div>No se encontraron clientes</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 14 }}>
                    {filtered.map(c => (
                      <div key={c.id} className="client-card" onClick={() => { setSelectedClient(c); setView("detalle"); setActiveTab("info"); }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                          <Avatar name={c.name} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: "#8c8680", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <Badge status={c.status} />
                          <span style={{ fontSize: 12, color: "#8c8680" }}>📍 {c.favoriteDestination}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #e8e5e0", fontSize: 12, color: "#8c8680" }}>
                          <span>✈ {c.trips.length} viaje{c.trips.length !== 1 ? "s" : ""}</span>
                          <span>🔔 {c.followUps.filter(f => !f.done).length} pendiente{c.followUps.filter(f => !f.done).length !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* DETALLE CLIENTE */}
          {view === "detalle" && selectedClient && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "16px 24px", background: "#fff", borderBottom: "1px solid #e8e5e0", display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar name={selectedClient.name} size={46} />
                <div style={{ flex: 1 }}>
                  <button onClick={() => { setView("clientes"); setSelectedClient(null); }} style={{ background: "none", border: "none", fontSize: 12, color: "#8c8680", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: 0, marginBottom: 3 }}>← Volver</button>
                  <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>{selectedClient.name}</div>
                  <div style={{ fontSize: 12, color: "#8c8680", marginTop: 2 }}>{selectedClient.phone} · {selectedClient.email}</div>
                </div>
                <Badge status={selectedClient.status} />
              </div>
              <div style={{ display: "flex", padding: "0 24px", background: "#fff", borderBottom: "1px solid #e8e5e0" }}>
                {[["info", "📋 Info"], ["viajes", "✈ Viajes"], ["seguimiento", "🔔 Seguimiento"]].map(([t, lbl]) => (
                  <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{lbl}</button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                {activeTab === "info" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                      {[["Destino favorito", `📍 ${selectedClient.favoriteDestination}`], ["Estado", null], ["Teléfono", selectedClient.phone], ["Email", selectedClient.email]].map(([label, val], i) => (
                        <div key={i}>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>{label}</div>
                          {i === 1 ? <Badge status={selectedClient.status} /> : <span style={{ fontSize: 14 }}>{val}</span>}
                        </div>
                      ))}
                    </div>
                    {selectedClient.notes && <>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📝 Notas</div>
                      <div style={{ background: "#f0ede8", borderRadius: 10, padding: 14, fontSize: 13.5, lineHeight: 1.6 }}>{selectedClient.notes}</div>
                    </>}
                  </>
                )}
                {activeTab === "viajes" && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>Viajes ({selectedClient.trips.length})</div>
                      <button onClick={() => setShowTripForm(true)} style={{ background: "#1a1814", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Agregar viaje</button>
                    </div>
                    {selectedClient.trips.length === 0
                      ? <div className="empty-state"><div style={{ fontSize: 36, marginBottom: 10 }}>✈</div>Sin viajes registrados</div>
                      : selectedClient.trips.map(t => <TripCard key={t.id} trip={t} onClick={() => setShowTripDetail(t)} />)
                    }
                  </>
                )}
                {activeTab === "seguimiento" && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>Seguimientos</div>
                      <button onClick={() => { setFuForm({ date: "", note: "" }); setShowFUModal(true); }} style={{ background: "#1a1814", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Agregar</button>
                    </div>
                    {selectedClient.followUps.length === 0
                      ? <div className="empty-state"><div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>Sin seguimientos</div>
                      : selectedClient.followUps.map(f => (
                        <div key={f.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: "#fff", border: "1px solid #e8e5e0", borderRadius: 8, marginBottom: 8 }}>
                          <div className={`fu-check ${f.done ? "done" : ""}`} onClick={() => toggleFU(selectedClient.id, f.id)}>{f.done ? "✓" : ""}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, textDecoration: f.done ? "line-through" : "none", color: f.done ? "#8c8680" : "#1a1814" }}>{f.note}</div>
                            {f.date && <div style={{ fontSize: 11.5, color: "#8c8680", marginTop: 2 }}>{new Date(f.date + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long" })}</div>}
                          </div>
                        </div>
                      ))
                    }
                  </>
                )}
              </div>
            </div>
          )}

          {/* SEGUIMIENTO GLOBAL */}
          {view === "seguimiento" && (
            <>
              <div className="topbar"><div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Seguimientos pendientes</div></div>
              <div className="content">
                {pendingFollowUps.length === 0
                  ? <div className="empty-state"><div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>¡Todo al día! Sin seguimientos pendientes.</div>
                  : pendingFollowUps.map(f => (
                    <div key={f.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 14, background: "#fff", border: "1px solid #e8e5e0", borderRadius: 10, marginBottom: 10 }}>
                      <div className={`fu-check ${f.done ? "done" : ""}`} onClick={() => toggleFU(f.clientId, f.id)}>{f.done ? "✓" : ""}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8c8680", marginBottom: 3 }}>👤 {f.clientName}</div>
                        <div style={{ fontSize: 13.5 }}>{f.note}</div>
                        {f.date && <div style={{ fontSize: 11.5, color: "#8c8680", marginTop: 2 }}>{new Date(f.date + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}</div>}
                      </div>
                      <button onClick={() => { const c = clients.find(cl => cl.id === f.clientId); if (c) { setSelectedClient(c); setActiveTab("seguimiento"); setView("detalle"); } }}
                        style={{ background: "none", border: "1px solid #e8e5e0", color: "#1a1814", padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                        Ver cliente
                      </button>
                    </div>
                  ))
                }
              </div>
            </>
          )}

          {/* ESTADÍSTICAS */}
          {view === "stats" && (
            <>
              <div className="topbar"><div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Estadísticas</div></div>
              <div className="content">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 14, marginBottom: 24 }}>
                  {[
                    { val: stats.total, label: "Clientes totales", color: "#1a1814" },
                    { val: stats.active, label: "Clientes activos", color: "#10b981" },
                    { val: stats.prospects, label: "Prospectos", color: "#f59e0b" },
                    { val: stats.totalTrips, label: "Viajes registrados", color: "#1a1814" },
                    { val: stats.disneyOnly, label: "Solo Disney", color: "#1565c0" },
                    { val: stats.universalOnly, label: "Solo Universal", color: "#2e7d32" },
                    { val: stats.both, label: "Disney + Universal", color: "#7c3aed" },
                    { val: stats.hotelInside, label: "Hotel dentro parque", color: "#0ea5e9" },
                    { val: stats.hotelOutside, label: "Hotel fuera parque", color: "#64748b" },
                    { val: stats.totalMinors, label: "Menores registrados", color: "#ec4899" },
                    { val: stats.pending, label: "Seguimientos pend.", color: "#ef4444" },
                  ].map((s, i) => (
                    <div key={i} className="stat-card">
                      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, fontFamily: "'DM Mono', monospace", color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: 12, color: "#8c8680", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                    </div>
                  ))}
                  <div className="stat-card" style={{ gridColumn: "span 2" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'DM Mono', monospace" }}>USD {stats.revenue.toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: "#8c8680", marginTop: 4, fontWeight: 500 }}>Ingresos (viajes completados)</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL NUEVO CLIENTE */}
      {showClientModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowClientModal(false)}>
          <div className="modal">
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>Nuevo cliente</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Nombre *</div>
                <input style={inputStyle} value={clientForm.name || ""} onChange={e => setClientForm(p => ({ ...p, name: e.target.value }))} placeholder="Nombre completo" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Estado</div>
                <select style={inputStyle} value={clientForm.status || "prospecto"} onChange={e => setClientForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="prospecto">Prospecto</option><option value="activo">Activo</option><option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Email</div>
                <input type="email" style={inputStyle} value={clientForm.email || ""} onChange={e => setClientForm(p => ({ ...p, email: e.target.value }))} placeholder="email@ejemplo.com" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Teléfono</div>
                <input style={inputStyle} value={clientForm.phone || ""} onChange={e => setClientForm(p => ({ ...p, phone: e.target.value }))} placeholder="+54 11 1234-5678" />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Destino favorito</div>
              <input style={inputStyle} value={clientForm.favoriteDestination || ""} onChange={e => setClientForm(p => ({ ...p, favoriteDestination: e.target.value }))} placeholder="Ej: Orlando" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Notas</div>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} value={clientForm.notes || ""} onChange={e => setClientForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => setShowClientModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e8e5e0", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
              <button onClick={saveClient} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1a1814", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SEGUIMIENTO */}
      {showFUModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowFUModal(false)}>
          <div className="modal">
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>Nuevo seguimiento</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Fecha</div>
              <input type="date" style={inputStyle} value={fuForm.date || ""} onChange={e => setFuForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Nota *</div>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={fuForm.note || ""} onChange={e => setFuForm(p => ({ ...p, note: e.target.value }))} placeholder="Ej: Llamar para confirmar fechas" />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowFUModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e8e5e0", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
              <button onClick={saveFU} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1a1814", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* FORM VIAJE */}
      {showTripForm && selectedClient && (
        <TripForm clientName={selectedClient.name} onSave={saveTrip} onClose={() => setShowTripForm(false)} />
      )}

      {/* DETALLE VIAJE */}
      {showTripDetail && (
        <TripDetail trip={showTripDetail} onClose={() => setShowTripDetail(null)} />
      )}
    </>
  );
}
