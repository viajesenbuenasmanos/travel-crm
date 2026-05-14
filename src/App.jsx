import { useState, useMemo, useEffect } from "react";

const SUPABASE_URL = "https://jaidnrxpbmqosiqfqzrg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphaWRucnhwYm1xb3NpcWZxenJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTk1MjIsImV4cCI6MjA5NDMzNTUyMn0.SAFcrpy20fyK3tiXd9_KaXGOTJ08hYJGvIbZ0wUqu0s";

const api = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) { const err = await res.text(); throw new Error(err); }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

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
  const initials = (name || "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["#0ea5e9", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#ef4444"];
  const color = colors[(name || "?").charCodeAt(0) % colors.length];
  return <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</div>;
}
function Badge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.prospecto;
  return <span style={{ background: cfg.bg, color: cfg.color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{cfg.label}</span>;
}
function Chip({ children, color = "#1a1814" }) {
  return <span style={{ background: color + "18", color, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3, margin: "2px" }}>{children}</span>;
}
function FL({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>{children}</div>;
}
function FI({ value, onChange, type = "text", placeholder, min }) {
  return <input type={type} value={value} min={min} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "9px 12px", border: "1px solid #e8e5e0", borderRadius: 8, fontSize: 13.5, fontFamily: "'DM Sans',sans-serif", outline: "none", background: "#f8f7f4", color: "#1a1814", marginBottom: 14 }} />;
}
function SD({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6, color: "#1a1814", borderBottom: "2px solid #f0ede8", paddingBottom: 6, marginBottom: 12, marginTop: 6 }}>{children}</div>;
}
function IR({ label, value }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 14px", borderBottom: "1px solid #e8e5e0", fontSize: 13.5 }}><span style={{ color: "#8c8680", fontWeight: 500 }}>{label}</span><span style={{ fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{value}</span></div>;
}
function IS({ title, children }) {
  return <div style={{ marginBottom: 16 }}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 7 }}>{title}</div><div style={{ background: "#f8f7f4", borderRadius: 10, overflow: "hidden" }}>{children}</div></div>;
}
function ParkToggle({ label, active, onToggle, parks, selected, onParkToggle, color }) {
  return (
    <div style={{ border: `1.5px solid ${active ? color : "#e8e5e0"}`, borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
      <button onClick={onToggle} style={{ width: "100%", padding: "10px 14px", background: active ? color : "#f8f7f4", color: active ? "#fff" : "#1a1814", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textAlign: "left", display: "flex", alignItems: "center", gap: 6 }}>
        {active ? "✅" : "⬜"} {label}
      </button>
      {active && <div style={{ padding: "10px 14px", background: "#fff" }}>
        <div style={{ fontSize: 11, color: "#8c8680", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>Parques incluidos:</div>
        {parks.map(p => <label key={p} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 13 }}><input type="checkbox" checked={selected.includes(p)} onChange={() => onParkToggle(p)} style={{ accentColor: color, width: 14, height: 14 }} />{p}</label>)}
      </div>}
    </div>
  );
}
function TripCard({ trip, onClick }) {
  const minors = trip.pax?.minors || []; const adults = trip.pax?.adults || 0;
  return (
    <div onClick={onClick} style={{ background: "#fff", border: "1px solid #e8e5e0", borderRadius: 12, padding: 16, marginBottom: 10, cursor: "pointer", transition: "all .15s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#1a1814"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e5e0"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div><div style={{ fontWeight: 700, fontSize: 15 }}>📍 {trip.destination || "Orlando"}</div>
          <div style={{ fontSize: 12, color: "#8c8680", marginTop: 2 }}>{trip.date ? new Date(trip.date + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "Sin fecha"}{trip.days ? ` · ${trip.days} días` : ""}</div></div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{ background: (TRIP_STATUS[trip.status]?.color || "#888") + "22", color: TRIP_STATUS[trip.status]?.color || "#888", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12 }}>{TRIP_STATUS[trip.status]?.label || trip.status}</span>
          {trip.amount > 0 && <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>USD {Number(trip.amount).toLocaleString()}</span>}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <Chip color="#0ea5e9">👥 {adults + minors.length} pax</Chip>
        <Chip color="#6366f1">🧑 {adults} adulto{adults !== 1 ? "s" : ""}</Chip>
        {minors.length > 0 && <Chip color="#ec4899">🧒 {minors.length} menor{minors.length !== 1 ? "es" : ""} ({minors.join(", ")} años)</Chip>}
        {trip.parks?.disney && <Chip color="#1565c0">🏰 Disney</Chip>}
        {trip.parks?.universal && <Chip color="#2e7d32">🎬 Universal</Chip>}
        {trip.hotel?.location === "dentro" && <Chip color="#7c3aed">🏨 Dentro del parque</Chip>}
        {trip.hotel?.location === "fuera" && <Chip color="#7c3aed">🏩 Fuera del parque</Chip>}
      </div>
    </div>
  );
}
function TripDetail({ trip, onClose }) {
  const minors = trip.pax?.minors || []; const adults = trip.pax?.adults || 0;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(2px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 480, maxWidth: "95vw", maxHeight: "85vh", overflowY: "auto", border: "1px solid #e8e5e0", boxShadow: "0 24px 64px rgba(0,0,0,0.15)", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div><div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>📍 {trip.destination || "Orlando"}</div>
            <div style={{ fontSize: 13, color: "#8c8680", marginTop: 3 }}>{trip.date ? new Date(trip.date + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "Sin fecha"}{trip.days ? ` · ${trip.days} días` : ""}</div></div>
          <button onClick={onClose} style={{ background: "#f0ede8", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>✕ Cerrar</button>
        </div>
        <IS title="👥 Pasajeros"><IR label="Total" value={`${adults + minors.length} personas`} /><IR label="Adultos" value={String(adults)} /><IR label="Menores" value={minors.length > 0 ? `${minors.length} (${minors.join(", ")} años)` : "Sin menores"} /></IS>
        <IS title="🎢 Parques"><IR label="Disney" value={trip.parks?.disney ? "✅ Sí" : "❌ No"} />{trip.parks?.disney && trip.parks?.disneyParks?.length > 0 && <IR label="Parques Disney" value={trip.parks.disneyParks.join(", ")} />}<IR label="Universal" value={trip.parks?.universal ? "✅ Sí" : "❌ No"} />{trip.parks?.universal && trip.parks?.universalParks?.length > 0 && <IR label="Parques Universal" value={trip.parks.universalParks.join(", ")} />}</IS>
        <IS title="🏨 Hotel"><IR label="Ubicación" value={trip.hotel?.location === "dentro" ? "Dentro del parque" : trip.hotel?.location === "fuera" ? "Fuera del parque" : "No especificado"} />{trip.hotel?.name && <IR label="Hotel" value={trip.hotel.name} />}</IS>
        <IS title="💰 Económico"><IR label="Estado" value={TRIP_STATUS[trip.status]?.label || trip.status} /><IR label="Monto" value={trip.amount ? `USD ${Number(trip.amount).toLocaleString()}` : "No especificado"} /></IS>
      </div>
    </div>
  );
}
function TripForm({ clientName, onSave, onClose }) {
  const [f, setF] = useState({ destination: "Orlando", date: "", days: "", status: "pendiente", amount: "", adults: 2, minorCount: 0, minorAges: [], disney: false, universal: false, disneyParks: [], universalParks: [], hotelLocation: "", hotelName: "" });
  const setMC = n => { const c = Math.max(0, parseInt(n) || 0); setF(p => ({ ...p, minorCount: c, minorAges: Array.from({ length: c }, (_, i) => p.minorAges[i] || "") })); };
  const tP = (type, park) => setF(p => { const k = type === "disney" ? "disneyParks" : "universalParks"; return { ...p, [k]: p[k].includes(park) ? p[k].filter(x => x !== park) : [...p[k], park] }; });
  const save = () => onSave({ destination: f.destination || "Orlando", date: f.date, days: parseInt(f.days) || 0, status: f.status, amount: parseFloat(f.amount) || 0, pax: { adults: parseInt(f.adults) || 0, minors: f.minorAges.map(a => parseInt(a) || 0).filter(a => a >= 0 && a <= 17) }, parks: { disney: f.disney, universal: f.universal, disneyParks: f.disney ? f.disneyParks : [], universalParks: f.universal ? f.universalParks : [] }, hotel: { location: f.hotelLocation, name: f.hotelName } });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(2px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 520, maxWidth: "96vw", maxHeight: "92vh", overflowY: "auto", border: "1px solid #e8e5e0", boxShadow: "0 24px 64px rgba(0,0,0,0.15)", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5, marginBottom: 20 }}>✈ Nuevo viaje — {clientName}</div>
        <SD>📍 Destino y fechas</SD><FL>Destino</FL><FI value={f.destination} onChange={v => setF(p => ({ ...p, destination: v }))} placeholder="Ej: Orlando" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><div><FL>Fecha aprox.</FL><FI type="date" value={f.date} onChange={v => setF(p => ({ ...p, date: v }))} /></div><div><FL>Días</FL><FI type="number" value={f.days} onChange={v => setF(p => ({ ...p, days: v }))} placeholder="Ej: 10" /></div></div>
        <SD>👥 Pasajeros</SD>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><div><FL>Adultos</FL><FI type="number" value={f.adults} onChange={v => setF(p => ({ ...p, adults: v }))} min={1} /></div><div><FL>Cant. menores</FL><FI type="number" value={f.minorCount} onChange={setMC} min={0} /></div></div>
        {f.minorCount > 0 && <div style={{ marginBottom: 14 }}><FL>Edades de los menores</FL><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{f.minorAges.map((age, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 12, color: "#8c8680" }}>Menor {i + 1}:</span><input type="number" min={0} max={17} value={age} onChange={e => { const a = [...f.minorAges]; a[i] = e.target.value; setF(p => ({ ...p, minorAges: a })); }} style={{ width: 58, padding: "7px 8px", border: "1px solid #e8e5e0", borderRadius: 7, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", textAlign: "center", background: "#f8f7f4" }} placeholder="edad" /></div>)}</div></div>}
        <SD>🎢 Parques</SD>
        <ParkToggle label="🏰 Disney" active={f.disney} onToggle={() => setF(p => ({ ...p, disney: !p.disney, disneyParks: [] }))} parks={DISNEY_PARKS} selected={f.disneyParks} onParkToggle={p => tP("disney", p)} color="#1565c0" />
        <ParkToggle label="🎬 Universal" active={f.universal} onToggle={() => setF(p => ({ ...p, universal: !p.universal, universalParks: [] }))} parks={UNIVERSAL_PARKS} selected={f.universalParks} onParkToggle={p => tP("universal", p)} color="#2e7d32" />
        <SD>🏨 Hotel</SD><FL>Ubicación</FL>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>{[["dentro", "🏰 Dentro del parque"], ["fuera", "🏩 Fuera del parque"]].map(([val, lbl]) => <button key={val} onClick={() => setF(p => ({ ...p, hotelLocation: val }))} style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${f.hotelLocation === val ? "#1a1814" : "#e8e5e0"}`, background: f.hotelLocation === val ? "#1a1814" : "#fff", color: f.hotelLocation === val ? "#fff" : "#1a1814", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>{lbl}</button>)}</div>
        <FL>Nombre del hotel (opcional)</FL><FI value={f.hotelName} onChange={v => setF(p => ({ ...p, hotelName: v }))} placeholder="Ej: Disney's Grand Floridian" />
        <SD>💰 Económico</SD>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 6 }}>
          <div><FL>Estado</FL><select value={f.status} onChange={e => setF(p => ({ ...p, status: e.target.value }))} style={{ width: "100%", padding: "9px 12px", border: "1px solid #e8e5e0", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", background: "#f8f7f4", color: "#1a1814", marginBottom: 14 }}>{Object.entries(TRIP_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          <div><FL>Monto (USD)</FL><FI type="number" value={f.amount} onChange={v => setF(p => ({ ...p, amount: v }))} placeholder="0" /></div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid #e8e5e0" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e8e5e0", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancelar</button>
          <button onClick={save} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#1a1814", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Guardar viaje</button>
        </div>
      </div>
    </div>
  );
}

export default function CRM() {
  const [view, setView] = useState("clientes");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [cs, ts, fs] = await Promise.all([api("clients?select=*&order=created_at.desc"), api("trips?select=*&order=created_at.desc"), api("follow_ups?select=*&order=created_at.desc")]);
      setClients(cs.map(c => ({ ...c, favoriteDestination: c.favorite_destination, trips: ts.filter(t => t.client_id === c.id), followUps: fs.filter(f => f.client_id === c.id) })));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filtered = useMemo(() => clients.filter(c => { const q = search.toLowerCase(); return (!q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.favorite_destination?.toLowerCase().includes(q)) && (filterStatus === "todos" || c.status === filterStatus); }), [clients, search, filterStatus]);
  const pendingFUs = useMemo(() => clients.flatMap(c => (c.followUps || []).filter(f => !f.done).map(f => ({ ...f, clientName: c.name, clientId: c.id }))), [clients]);
  const stats = useMemo(() => {
    const t = clients.flatMap(c => c.trips || []);
    return { total: clients.length, active: clients.filter(c => c.status === "activo").length, prospects: clients.filter(c => c.status === "prospecto").length, revenue: t.filter(x => x.status === "completado").reduce((s, x) => s + (x.amount || 0), 0), totalTrips: t.length, disneyOnly: t.filter(x => x.parks?.disney && !x.parks?.universal).length, universalOnly: t.filter(x => !x.parks?.disney && x.parks?.universal).length, both: t.filter(x => x.parks?.disney && x.parks?.universal).length, hotelIn: t.filter(x => x.hotel?.location === "dentro").length, hotelOut: t.filter(x => x.hotel?.location === "fuera").length, minors: t.reduce((s, x) => s + (x.pax?.minors?.length || 0), 0), pending: pendingFUs.length };
  }, [clients, pendingFUs]);

  async function saveTrip(data) {
    try {
      const [t] = await api("trips", { method: "POST", body: JSON.stringify({ ...data, client_id: selectedClient.id }) });
      setClients(p => p.map(c => c.id === selectedClient.id ? { ...c, trips: [...(c.trips || []), t] } : c));
      setSelectedClient(p => ({ ...p, trips: [...(p.trips || []), t] }));
      setShowTripForm(false);
    } catch (e) { console.error(e); alert("Error al guardar"); }
  }
  async function saveClient() {
    if (!clientForm.name) return;
    try {
      const [c] = await api("clients", { method: "POST", body: JSON.stringify({ name: clientForm.name, email: clientForm.email, phone: clientForm.phone, status: clientForm.status || "prospecto", favorite_destination: clientForm.favoriteDestination, notes: clientForm.notes }) });
      setClients(p => [{ ...c, favoriteDestination: c.favorite_destination, trips: [], followUps: [] }, ...p]);
      setShowClientModal(false);
    } catch (e) { console.error(e); alert("Error al guardar"); }
  }
  async function saveFU() {
    if (!fuForm.note) return;
    try {
      const [f] = await api("follow_ups", { method: "POST", body: JSON.stringify({ note: fuForm.note, date: fuForm.date, done: false, client_id: selectedClient.id }) });
      setClients(p => p.map(c => c.id === selectedClient.id ? { ...c, followUps: [...(c.followUps || []), f] } : c));
      setSelectedClient(p => ({ ...p, followUps: [...(p.followUps || []), f] }));
      setShowFUModal(false);
    } catch (e) { console.error(e); alert("Error al guardar"); }
  }
  async function toggleFU(clientId, fuId, done) {
    try {
      await api(`follow_ups?id=eq.${fuId}`, { method: "PATCH", body: JSON.stringify({ done: !done }), prefer: "return=minimal" });
      const upd = cs => cs.map(c => c.id === clientId ? { ...c, followUps: c.followUps.map(f => f.id === fuId ? { ...f, done: !done } : f) } : c);
      setClients(upd);
      if (selectedClient?.id === clientId) setSelectedClient(p => ({ ...p, followUps: p.followUps.map(f => f.id === fuId ? { ...f, done: !done } : f) }));
    } catch (e) { console.error(e); }
  }
  async function deleteClient(id) {
    if (!confirm("¿Eliminar este cliente y todos sus datos?")) return;
    try {
      await api(`clients?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
      setClients(p => p.filter(c => c.id !== id)); setSelectedClient(null); setView("clientes");
    } catch (e) { console.error(e); }
  }

  const iS = { width: "100%", padding: "9px 12px", border: "1px solid #e8e5e0", borderRadius: 8, fontSize: 13.5, fontFamily: "'DM Sans',sans-serif", color: "#1a1814", background: "#f8f7f4", outline: "none" };
  const navItems = [{ id: "clientes", icon: "👥", label: "Clientes" }, { id: "seguimiento", icon: "🔔", label: "Seguimiento", badge: pendingFUs.length }, { id: "stats", icon: "📊", label: "Estadísticas" }];

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: 16, color: "#8c8680", fontFamily: "'DM Sans',sans-serif" }}>Cargando tu CRM... ✈</div>;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..800;1,9..40,300..800&family=DM+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif}.crm-wrap{display:flex;height:100vh;background:#f8f7f4;font-family:'DM Sans',sans-serif;color:#1a1814}.sidebar{width:215px;background:#1a1814;display:flex;flex-direction:column;padding:24px 0;flex-shrink:0}.main{flex:1;display:flex;flex-direction:column;overflow:hidden}.topbar{padding:16px 24px;background:#fff;border-bottom:1px solid #e8e5e0;display:flex;align-items:center;justify-content:space-between}.content{flex:1;overflow-y:auto;padding:24px}.nav-btn{display:flex;align-items:center;gap:10px;padding:10px 20px;width:100%;background:none;border:none;color:rgba(255,255,255,0.5);font-size:13.5px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}.nav-btn:hover{color:#fff;background:rgba(255,255,255,0.07)}.nav-btn.active{color:#fff;background:rgba(255,255,255,0.13)}.nav-badge{background:#ef4444;color:#fff;font-size:10px;font-weight:700;border-radius:20px;padding:1px 6px;margin-left:auto}.tab-btn{padding:12px 16px;font-size:13px;font-weight:500;background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;color:#8c8680;font-family:'DM Sans',sans-serif;margin-bottom:-1px;transition:all .15s}.tab-btn.active{color:#1a1814;border-bottom-color:#1a1814;font-weight:700}.cc{background:#fff;border:1px solid #e8e5e0;border-radius:12px;padding:18px;cursor:pointer;transition:all .15s}.cc:hover{border-color:#1a1814;box-shadow:0 4px 16px rgba(0,0,0,0.06);transform:translateY(-1px)}.fuc{width:18px;height:18px;border:2px solid #e8e5e0;border-radius:4px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:2px;transition:all .15s;font-size:11px;color:transparent}.fuc.done{background:#1a1814;border-color:#1a1814;color:#fff}.sc{background:#fff;border:1px solid #e8e5e0;border-radius:12px;padding:18px}.es{text-align:center;padding:48px 24px;color:#8c8680;font-size:14px}.mo{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(2px)}.md{background:#fff;border-radius:14px;padding:24px;width:420px;max-width:95vw;border:1px solid #e8e5e0;box-shadow:0 20px 60px rgba(0,0,0,0.15);font-family:'DM Sans',sans-serif}`}</style>
      <div className="crm-wrap">
        <div className="sidebar">
          <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>✈ TravelCRM</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>Agencia de Viajes</div>
          </div>
          <nav style={{ padding: "16px 0", flex: 1 }}>
            {navItems.map(item => <button key={item.id} className={`nav-btn ${(view === item.id || (view === "detalle" && item.id === "clientes")) ? "active" : ""}`} onClick={() => { setView(item.id); if (item.id !== "detalle") setSelectedClient(null); }}><span>{item.icon}</span><span>{item.label}</span>{item.badge > 0 && <span className="nav-badge">{item.badge}</span>}</button>)}
          </nav>
          <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "rgba(255,255,255,0.28)", lineHeight: 1.6 }}>{stats.total} clientes · {stats.totalTrips} viajes</div>
        </div>
        <div className="main">
          {view === "clientes" && <>
            <div className="topbar"><div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Clientes</div><button onClick={() => { setClientForm({ name: "", email: "", phone: "", status: "prospecto", favoriteDestination: "Orlando", notes: "" }); setShowClientModal(true); }} style={{ background: "#1a1814", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>+ Nuevo cliente</button></div>
            <div className="content">
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}><input style={{ ...iS, flex: 1 }} placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)} /><select style={{ ...iS, width: "auto", cursor: "pointer" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="todos">Todos</option><option value="activo">Activos</option><option value="prospecto">Prospectos</option><option value="inactivo">Inactivos</option></select></div>
              {filtered.length === 0 ? <div className="es"><div style={{ fontSize: 40, marginBottom: 12 }}>🧳</div>No se encontraron clientes</div> :
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 14 }}>
                  {filtered.map(c => <div key={c.id} className="cc" onClick={() => { setSelectedClient(c); setView("detalle"); setActiveTab("info"); }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}><Avatar name={c.name || "?"} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div><div style={{ fontSize: 12, color: "#8c8680", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div></div></div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}><Badge status={c.status} /><span style={{ fontSize: 12, color: "#8c8680" }}>📍 {c.favorite_destination}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #e8e5e0", fontSize: 12, color: "#8c8680" }}><span>✈ {(c.trips || []).length} viaje{(c.trips || []).length !== 1 ? "s" : ""}</span><span>🔔 {(c.followUps || []).filter(f => !f.done).length} pendiente{(c.followUps || []).filter(f => !f.done).length !== 1 ? "s" : ""}</span></div>
                  </div>)}
                </div>}
            </div>
          </>}

          {view === "detalle" && selectedClient && <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", background: "#fff", borderBottom: "1px solid #e8e5e0", display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar name={selectedClient.name || "?"} size={46} />
              <div style={{ flex: 1 }}><button onClick={() => { setView("clientes"); setSelectedClient(null); }} style={{ background: "none", border: "none", fontSize: 12, color: "#8c8680", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: 0, marginBottom: 3 }}>← Volver</button><div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>{selectedClient.name}</div><div style={{ fontSize: 12, color: "#8c8680", marginTop: 2 }}>{selectedClient.phone} · {selectedClient.email}</div></div>
              <Badge status={selectedClient.status} />
              <button onClick={() => deleteClient(selectedClient.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>Eliminar</button>
            </div>
            <div style={{ display: "flex", padding: "0 24px", background: "#fff", borderBottom: "1px solid #e8e5e0" }}>
              {[["info", "📋 Info"], ["viajes", "✈ Viajes"], ["seguimiento", "🔔 Seguimiento"]].map(([t, l]) => <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{l}</button>)}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {activeTab === "info" && <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {[["Destino favorito", `📍 ${selectedClient.favorite_destination}`], ["Estado", null], ["Teléfono", selectedClient.phone], ["Email", selectedClient.email]].map(([label, val], i) => <div key={i}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>{label}</div>{i === 1 ? <Badge status={selectedClient.status} /> : <span style={{ fontSize: 14 }}>{val}</span>}</div>)}
                </div>
                {selectedClient.notes && <><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📝 Notas</div><div style={{ background: "#f0ede8", borderRadius: 10, padding: 14, fontSize: 13.5, lineHeight: 1.6 }}>{selectedClient.notes}</div></>}
              </>}
              {activeTab === "viajes" && <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Viajes ({(selectedClient.trips || []).length})</div><button onClick={() => setShowTripForm(true)} style={{ background: "#1a1814", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>+ Agregar viaje</button></div>
                {(selectedClient.trips || []).length === 0 ? <div className="es"><div style={{ fontSize: 36, marginBottom: 10 }}>✈</div>Sin viajes registrados</div> : (selectedClient.trips || []).map(t => <TripCard key={t.id} trip={t} onClick={() => setShowTripDetail(t)} />)}
              </>}
              {activeTab === "seguimiento" && <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Seguimientos</div><button onClick={() => { setFuForm({ date: "", note: "" }); setShowFUModal(true); }} style={{ background: "#1a1814", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>+ Agregar</button></div>
                {(selectedClient.followUps || []).length === 0 ? <div className="es"><div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>Sin seguimientos</div> : (selectedClient.followUps || []).map(f => <div key={f.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: "#fff", border: "1px solid #e8e5e0", borderRadius: 8, marginBottom: 8 }}><div className={`fuc ${f.done ? "done" : ""}`} onClick={() => toggleFU(selectedClient.id, f.id, f.done)}>{f.done ? "✓" : ""}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13.5, textDecoration: f.done ? "line-through" : "none", color: f.done ? "#8c8680" : "#1a1814" }}>{f.note}</div>{f.date && <div style={{ fontSize: 11.5, color: "#8c8680", marginTop: 2 }}>{new Date(f.date + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long" })}</div>}</div></div>)}
              </>}
            </div>
          </div>}

          {view === "seguimiento" && <>
            <div className="topbar"><div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Seguimientos pendientes</div></div>
            <div className="content">{pendingFUs.length === 0 ? <div className="es"><div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>¡Todo al día!</div> : pendingFUs.map(f => <div key={f.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 14, background: "#fff", border: "1px solid #e8e5e0", borderRadius: 10, marginBottom: 10 }}><div className={`fuc ${f.done ? "done" : ""}`} onClick={() => toggleFU(f.clientId, f.id, f.done)}>{f.done ? "✓" : ""}</div><div style={{ flex: 1 }}><div style={{ fontSize: 11.5, fontWeight: 700, color: "#8c8680", marginBottom: 3 }}>👤 {f.clientName}</div><div style={{ fontSize: 13.5 }}>{f.note}</div>{f.date && <div style={{ fontSize: 11.5, color: "#8c8680", marginTop: 2 }}>{new Date(f.date + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}</div>}</div><button onClick={() => { const c = clients.find(x => x.id === f.clientId); if (c) { setSelectedClient(c); setActiveTab("seguimiento"); setView("detalle"); } }} style={{ background: "none", border: "1px solid #e8e5e0", color: "#1a1814", padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Ver cliente</button></div>)}</div>
          </>}

          {view === "stats" && <>
            <div className="topbar"><div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Estadísticas</div></div>
            <div className="content"><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 14, marginBottom: 24 }}>
              {[{ v: stats.total, l: "Clientes totales", c: "#1a1814" }, { v: stats.active, l: "Activos", c: "#10b981" }, { v: stats.prospects, l: "Prospectos", c: "#f59e0b" }, { v: stats.totalTrips, l: "Viajes", c: "#1a1814" }, { v: stats.disneyOnly, l: "Solo Disney", c: "#1565c0" }, { v: stats.universalOnly, l: "Solo Universal", c: "#2e7d32" }, { v: stats.both, l: "Disney + Universal", c: "#7c3aed" }, { v: stats.hotelIn, l: "Hotel dentro parque", c: "#0ea5e9" }, { v: stats.hotelOut, l: "Hotel fuera parque", c: "#64748b" }, { v: stats.minors, l: "Menores registrados", c: "#ec4899" }, { v: stats.pending, l: "Seguimientos pend.", c: "#ef4444" }].map((s, i) => <div key={i} className="sc"><div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, fontFamily: "'DM Mono',monospace", color: s.c }}>{s.v}</div><div style={{ fontSize: 12, color: "#8c8680", marginTop: 4, fontWeight: 500 }}>{s.l}</div></div>)}
              <div className="sc" style={{ gridColumn: "span 2" }}><div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>USD {stats.revenue.toLocaleString()}</div><div style={{ fontSize: 12, color: "#8c8680", marginTop: 4, fontWeight: 500 }}>Ingresos (completados)</div></div>
            </div></div>
          </>}
        </div>
      </div>

      {showClientModal && <div className="mo" onClick={e => e.target === e.currentTarget && setShowClientModal(false)}><div className="md">
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>Nuevo cliente</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Nombre *</div><input style={iS} value={clientForm.name || ""} onChange={e => setClientForm(p => ({ ...p, name: e.target.value }))} placeholder="Nombre completo" /></div>
          <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Estado</div><select style={iS} value={clientForm.status || "prospecto"} onChange={e => setClientForm(p => ({ ...p, status: e.target.value }))}><option value="prospecto">Prospecto</option><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Email</div><input type="email" style={iS} value={clientForm.email || ""} onChange={e => setClientForm(p => ({ ...p, email: e.target.value }))} placeholder="email@ejemplo.com" /></div>
          <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Teléfono</div><input style={iS} value={clientForm.phone || ""} onChange={e => setClientForm(p => ({ ...p, phone: e.target.value }))} placeholder="+54 11 1234-5678" /></div>
        </div>
        <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Destino favorito</div><input style={iS} value={clientForm.favoriteDestination || ""} onChange={e => setClientForm(p => ({ ...p, favoriteDestination: e.target.value }))} placeholder="Ej: Orlando" /></div>
        <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Notas</div><textarea style={{ ...iS, resize: "vertical", minHeight: 72 }} value={clientForm.notes || ""} onChange={e => setClientForm(p => ({ ...p, notes: e.target.value }))} /></div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}><button onClick={() => setShowClientModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e8e5e0", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancelar</button><button onClick={saveClient} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1a1814", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Guardar</button></div>
      </div></div>}

      {showFUModal && <div className="mo" onClick={e => e.target === e.currentTarget && setShowFUModal(false)}><div className="md">
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>Nuevo seguimiento</div>
        <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Fecha</div><input type="date" style={iS} value={fuForm.date || ""} onChange={e => setFuForm(p => ({ ...p, date: e.target.value }))} /></div>
        <div style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>Nota *</div><textarea style={{ ...iS, resize: "vertical", minHeight: 80 }} value={fuForm.note || ""} onChange={e => setFuForm(p => ({ ...p, note: e.target.value }))} placeholder="Ej: Llamar para confirmar fechas" /></div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><button onClick={() => setShowFUModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e8e5e0", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancelar</button><button onClick={saveFU} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1a1814", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Guardar</button></div>
      </div></div>}

      {showTripForm && selectedClient && <TripForm clientName={selectedClient.name} onSave={saveTrip} onClose={() => setShowTripForm(false)} />}
      {showTripDetail && <TripDetail trip={showTripDetail} onClose={() => setShowTripDetail(null)} />}
    </>
  );
}
