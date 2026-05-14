import { useState, useMemo, useEffect } from "react";

const SUPABASE_URL = "https://jaidnrxpbmqosiqfqzrg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphaWRucnhwYm1xb3NpcWZxenJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTk1MjIsImV4cCI6MjA5NDMzNTUyMn0.SAFcrpy20fyK3tiXd9_KaXGOTJ08hYJGvIbZ0wUqu0s";

const api = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": options.prefer || "return=representation", ...options.headers },
    ...options,
  });
  if (!res.ok) { const err = await res.text(); throw new Error(err); }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

const STAGES = [
  { id: "lead", label: "Lead", color: "#6366f1", bg: "#eef2ff", emoji: "🔵" },
  { id: "cotizado", label: "Cotizado", color: "#f59e0b", bg: "#fef3c7", emoji: "🟡" },
  { id: "negociacion", label: "Negociación", color: "#f97316", bg: "#fff7ed", emoji: "🟠" },
  { id: "confirmado", label: "Compra confirmada", color: "#10b981", bg: "#d1fae5", emoji: "🟢" },
  { id: "realizado", label: "Viaje realizado", color: "#8b5cf6", bg: "#ede9fe", emoji: "✅" },
];

const DISNEY_PARKS = ["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom"];
const UNIVERSAL_PARKS = ["Universal Studios", "Islands of Adventure", "Epic Universe"];

const SERVICES = [
  { id: "tickets_disney", label: "Entradas Disney", icon: "🏰", color: "#1565c0" },
  { id: "tickets_universal", label: "Entradas Universal", icon: "🎬", color: "#2e7d32" },
  { id: "hotel_disney", label: "Hospedaje dentro de Disney", icon: "🏨", color: "#1565c0" },
  { id: "hotel_universal", label: "Hospedaje dentro de Universal", icon: "🏨", color: "#2e7d32" },
  { id: "hotel_orlando", label: "Hospedaje fuera (Orlando)", icon: "🏩", color: "#0ea5e9" },
  { id: "hotel_otro", label: "Hospedaje otro destino", icon: "🏖", color: "#ec4899" },
  { id: "auto", label: "Alquiler de auto", icon: "🚗", color: "#7c3aed" },
];

// Follow-up reminder logic
function getAutoReminders(client, trips) {
  const reminders = [];
  const today = new Date();
  today.setHours(0,0,0,0);

  trips.forEach(trip => {
    if (!trip.date) return;
    const tripDate = new Date(trip.date + "T00:00:00");
    const daysUntil = Math.ceil((tripDate - today) / (1000 * 60 * 60 * 24));

    if (client.stage === "confirmado") {
      if (daysUntil <= 30 && daysUntil > 7) reminders.push({ type: "auto", text: `⏰ Faltan ${daysUntil} días para el viaje — recordar DIMO en breve`, urgent: false });
      if (daysUntil <= 7 && daysUntil > 0) reminders.push({ type: "auto", text: `🚨 ¡Faltan ${daysUntil} días! Enviar DIMO ahora`, urgent: true });
      if (daysUntil === 0) reminders.push({ type: "auto", text: `✈ ¡Hoy viaja ${client.name}!`, urgent: true });
    }
    if (client.stage === "realizado") {
      const daysSince = Math.abs(daysUntil);
      if (daysSince >= 3 && daysSince <= 10) reminders.push({ type: "auto", text: `⭐ Pedir review a ${client.name} — ya viajó hace ${daysSince} días`, urgent: false });
    }
  });

  // Stage-based reminders using updated_at
  if (client.stage === "lead" || client.stage === "cotizado") {
    const updated = new Date(client.updated_at || client.created_at);
    const daysSince = Math.ceil((today - updated) / (1000 * 60 * 60 * 24));
    if (daysSince >= 3) reminders.push({ type: "auto", text: `💬 Sin actividad hace ${daysSince} días — hacer seguimiento por WhatsApp`, urgent: daysSince >= 7 });
  }

  return reminders;
}

function Avatar({ name, size = 38 }) {
  const initials = (name || "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["#0ea5e9", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#ef4444"];
  const color = colors[(name || "?").charCodeAt(0) % colors.length];
  return <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</div>;
}

function StageBadge({ stage }) {
  const s = STAGES.find(x => x.id === stage) || STAGES[0];
  return <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{s.emoji} {s.label}</span>;
}

function Chip({ children, color = "#1a1814" }) {
  return <span style={{ background: color + "18", color, padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3, margin: "2px" }}>{children}</span>;
}

function FL({ children }) { return <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>{children}</div>; }
function FI({ value, onChange, type = "text", placeholder, min, style: s = {} }) {
  return <input type={type} value={value} min={min} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "9px 12px", border: "1px solid #e8e5e0", borderRadius: 8, fontSize: 13.5, fontFamily: "'DM Sans',sans-serif", outline: "none", background: "#f8f7f4", color: "#1a1814", marginBottom: 14, ...s }} />;
}
function SD({ children }) { return <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6, color: "#1a1814", borderBottom: "2px solid #f0ede8", paddingBottom: 6, marginBottom: 12, marginTop: 14 }}>{children}</div>; }

function ServiceToggle({ service, active, onToggle, extra, onExtra }) {
  return (
    <div style={{ border: `1.5px solid ${active ? service.color : "#e8e5e0"}`, borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      <button onClick={onToggle} style={{ width: "100%", padding: "10px 14px", background: active ? service.color : "#f8f7f4", color: active ? "#fff" : "#1a1814", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{service.icon}</span> {service.label} <span style={{ marginLeft: "auto" }}>{active ? "✅" : "⬜"}</span>
      </button>
      {active && service.id === "tickets_disney" && (
        <div style={{ padding: "10px 14px", background: "#fff" }}>
          <div style={{ fontSize: 11, color: "#8c8680", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>Parques:</div>
          {["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom"].map(p => (
            <label key={p} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, cursor: "pointer", fontSize: 13 }}>
              <input type="checkbox" checked={(extra || []).includes(p)} onChange={() => { const arr = (extra || []); onExtra(arr.includes(p) ? arr.filter(x => x !== p) : [...arr, p]); }} style={{ accentColor: service.color }} /> {p}
            </label>
          ))}
        </div>
      )}
      {active && service.id === "tickets_universal" && (
        <div style={{ padding: "10px 14px", background: "#fff" }}>
          <div style={{ fontSize: 11, color: "#8c8680", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>Parques:</div>
          {["Universal Studios", "Islands of Adventure", "Epic Universe"].map(p => (
            <label key={p} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, cursor: "pointer", fontSize: 13 }}>
              <input type="checkbox" checked={(extra || []).includes(p)} onChange={() => { const arr = (extra || []); onExtra(arr.includes(p) ? arr.filter(x => x !== p) : [...arr, p]); }} style={{ accentColor: service.color }} /> {p}
            </label>
          ))}
        </div>
      )}
      {active && (service.id === "hotel_otro") && (
        <div style={{ padding: "10px 14px", background: "#fff" }}>
          <input value={extra || ""} onChange={e => onExtra(e.target.value)} placeholder="Ej: Punta Cana, Miami..." style={{ width: "100%", padding: "8px 10px", border: "1px solid #e8e5e0", borderRadius: 7, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", background: "#f8f7f4" }} />
        </div>
      )}
    </div>
  );
}

function TripForm({ clientName, trip, onSave, onClose }) {
  const isEdit = !!trip;
  const [f, setF] = useState({
    date: trip?.date || "", days: trip?.days || "", status: trip?.status || "pendiente", amount: trip?.amount || "",
    adults: trip?.pax?.adults || 2, minorCount: trip?.pax?.minors?.length || 0, minorAges: trip?.pax?.minors || [],
    services: trip?.services || {},
    notes: trip?.notes || "",
  });

  const setMC = n => { const c = Math.max(0, parseInt(n) || 0); setF(p => ({ ...p, minorCount: c, minorAges: Array.from({ length: c }, (_, i) => p.minorAges[i] || "") })); };
  const toggleService = id => setF(p => ({ ...p, services: { ...p.services, [id]: !p.services[id] } }));
  const setExtra = (id, val) => setF(p => ({ ...p, services: { ...p.services, [id + "_extra"]: val } }));

  const save = () => onSave({
    date: f.date, days: parseInt(f.days) || 0, status: f.status, amount: parseFloat(f.amount) || 0,
    pax: { adults: parseInt(f.adults) || 0, minors: f.minorAges.map(a => parseInt(a) || 0).filter(a => a >= 0 && a <= 17) },
    services: f.services, notes: f.notes,
  });

  const iS = { width: "100%", padding: "9px 12px", border: "1px solid #e8e5e0", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", background: "#f8f7f4", color: "#1a1814" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(2px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 540, maxWidth: "96vw", maxHeight: "92vh", overflowY: "auto", border: "1px solid #e8e5e0", boxShadow: "0 24px 64px rgba(0,0,0,0.15)", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5, marginBottom: 20 }}>{isEdit ? "✏️ Editar viaje" : "✈ Nueva cotización"} — {clientName}</div>

        <SD>📅 Fechas</SD>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><FL>Fecha aprox. de viaje</FL><FI type="date" value={f.date} onChange={v => setF(p => ({ ...p, date: v }))} /></div>
          <div><FL>Cantidad de días</FL><FI type="number" value={f.days} onChange={v => setF(p => ({ ...p, days: v }))} placeholder="Ej: 10" /></div>
        </div>

        <SD>👥 Pasajeros</SD>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><FL>Adultos</FL><FI type="number" value={f.adults} onChange={v => setF(p => ({ ...p, adults: v }))} min={1} /></div>
          <div><FL>Cant. menores</FL><FI type="number" value={f.minorCount} onChange={setMC} min={0} /></div>
        </div>
        {f.minorCount > 0 && <div style={{ marginBottom: 14 }}><FL>Edades de los menores</FL><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{f.minorAges.map((age, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 12, color: "#8c8680" }}>Menor {i+1}:</span><input type="number" min={0} max={17} value={age} onChange={e => { const a = [...f.minorAges]; a[i] = e.target.value; setF(p => ({ ...p, minorAges: a })); }} style={{ width: 58, padding: "7px 8px", border: "1px solid #e8e5e0", borderRadius: 7, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", textAlign: "center", background: "#f8f7f4" }} placeholder="edad" /></div>)}</div></div>}

        <SD>🛎 Servicios solicitados</SD>
        {SERVICES.map(sv => (
          <ServiceToggle key={sv.id} service={sv} active={!!f.services[sv.id]}
            onToggle={() => toggleService(sv.id)}
            extra={f.services[sv.id + "_extra"]}
            onExtra={val => setExtra(sv.id, val)} />
        ))}

        <SD>💰 Económico</SD>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><FL>Estado</FL>
            <select value={f.status} onChange={e => setF(p => ({ ...p, status: e.target.value }))} style={{ ...iS, marginBottom: 14 }}>
              <option value="pendiente">Pendiente</option><option value="cotizado">Cotizado</option><option value="confirmado">Confirmado</option><option value="completado">Completado</option><option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div><FL>Monto (USD)</FL><FI type="number" value={f.amount} onChange={v => setF(p => ({ ...p, amount: v }))} placeholder="0" /></div>
        </div>

        <SD>📝 Notas</SD>
        <textarea value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} placeholder="Observaciones, preferencias, detalles..." style={{ ...iS, resize: "vertical", minHeight: 72, marginBottom: 14 }} />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid #e8e5e0" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e8e5e0", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancelar</button>
          <button onClick={save} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#1a1814", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function ClientForm({ client, onSave, onClose }) {
  const isEdit = !!client;
  const [f, setF] = useState({ name: client?.name || "", email: client?.email || "", phone: client?.phone || "", stage: client?.stage || "lead", notes: client?.notes || "" });
  const iS = { width: "100%", padding: "9px 12px", border: "1px solid #e8e5e0", borderRadius: 8, fontSize: 13.5, fontFamily: "'DM Sans',sans-serif", outline: "none", background: "#f8f7f4", color: "#1a1814" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, width: 440, maxWidth: "95vw", border: "1px solid #e8e5e0", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>{isEdit ? "✏️ Editar cliente" : "👤 Nuevo cliente"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ marginBottom: 14 }}><FL>Nombre *</FL><input style={iS} value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="Nombre completo" /></div>
          <div style={{ marginBottom: 14 }}><FL>Etapa</FL>
            <select style={iS} value={f.stage} onChange={e => setF(p => ({ ...p, stage: e.target.value }))}>
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ marginBottom: 14 }}><FL>Email</FL><input type="email" style={iS} value={f.email} onChange={e => setF(p => ({ ...p, email: e.target.value }))} placeholder="email@ejemplo.com" /></div>
          <div style={{ marginBottom: 14 }}><FL>Teléfono</FL><input style={iS} value={f.phone} onChange={e => setF(p => ({ ...p, phone: e.target.value }))} placeholder="+54 11 1234-5678" /></div>
        </div>
        <div style={{ marginBottom: 14 }}><FL>Notas</FL><textarea style={{ ...iS, resize: "vertical", minHeight: 72 }} value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} /></div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e8e5e0", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancelar</button>
          <button onClick={() => onSave(f)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1a1814", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function TripCard({ trip, onEdit, onClick }) {
  const svc = trip.services || {};
  const activeServices = SERVICES.filter(s => svc[s.id]);
  const minors = trip.pax?.minors || [];
  const adults = trip.pax?.adults || 0;
  const tripStatusColors = { pendiente: "#f59e0b", cotizado: "#3b82f6", confirmado: "#10b981", completado: "#8b5cf6", cancelado: "#ef4444" };
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e5e0", borderRadius: 12, padding: 16, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ cursor: "pointer" }} onClick={onClick}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {trip.date ? new Date(trip.date + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "Sin fecha"}
            {trip.days ? ` · ${trip.days} días` : ""}
          </div>
          <div style={{ fontSize: 12, color: "#8c8680", marginTop: 2 }}>👥 {adults + minors.length} pax{minors.length > 0 ? ` (${minors.length} menor${minors.length > 1 ? "es" : ""}: ${minors.join(", ")} años)` : ""}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {trip.amount > 0 && <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>USD {Number(trip.amount).toLocaleString()}</span>}
          <span style={{ background: (tripStatusColors[trip.status] || "#888") + "22", color: tripStatusColors[trip.status] || "#888", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12 }}>{trip.status}</span>
          <button onClick={onEdit} style={{ background: "#f0ede8", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>✏️</button>
        </div>
      </div>
      {activeServices.length > 0 && <div style={{ display: "flex", flexWrap: "wrap" }}>{activeServices.map(s => <Chip key={s.id} color={s.color}>{s.icon} {s.label}{s.id === "hotel_otro" && svc[s.id + "_extra"] ? ` — ${svc[s.id + "_extra"]}` : ""}</Chip>)}</div>}
      {trip.notes && <div style={{ marginTop: 8, fontSize: 12.5, color: "#6b7280", background: "#f8f7f4", borderRadius: 8, padding: "8px 10px" }}>📝 {trip.notes}</div>}
    </div>
  );
}

export default function CRM() {
  const [view, setView] = useState("pipeline");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showFUModal, setShowFUModal] = useState(false);
  const [fuForm, setFuForm] = useState({});
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [cs, ts, fs] = await Promise.all([api("clients?select=*&order=created_at.desc"), api("trips?select=*&order=created_at.desc"), api("follow_ups?select=*&order=created_at.desc")]);
      setClients(cs.map(c => ({ ...c, trips: ts.filter(t => t.client_id === c.id), followUps: fs.filter(f => f.client_id === c.id) })));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const allReminders = useMemo(() => clients.flatMap(c => getAutoReminders(c, c.trips || []).map(r => ({ ...r, clientName: c.name, clientId: c.id }))), [clients]);
  const manualPending = useMemo(() => clients.flatMap(c => (c.followUps || []).filter(f => !f.done).map(f => ({ ...f, clientName: c.name, clientId: c.id, type: "manual" }))), [clients]);
  const totalAlerts = allReminders.filter(r => r.urgent).length + manualPending.length;

  const filtered = useMemo(() => clients.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q);
  }), [clients, search]);

  const stats = useMemo(() => {
    const t = clients.flatMap(c => c.trips || []);
    return {
      total: clients.length,
      byStage: STAGES.map(s => ({ ...s, count: clients.filter(c => c.stage === s.id).length })),
      revenue: t.filter(x => x.status === "completado").reduce((s, x) => s + (x.amount || 0), 0),
      totalTrips: t.length,
    };
  }, [clients]);

  async function loadDocs(clientId) {
    setDocsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/documentos`, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: `cliente_${clientId}/`, limit: 100 }),
      });
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); setDocs([]); }
    setDocsLoading(false);
  }

  async function uploadDoc(file) {
    if (!file || !selectedClient) return;
    setUploadingDoc(true);
    try {
      const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `cliente_${selectedClient.id}/${Date.now()}_${safeName}`;
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/documentos/${path}`, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": file.type || "application/octet-stream", "x-upsert": "true" },
        body: file,
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("Upload error:", err);
        alert("Error al subir: " + err);
      } else {
        await loadDocs(selectedClient.id);
      }
    } catch (e) { console.error(e); alert("Error al subir el archivo"); }
    setUploadingDoc(false);
  }

  async function deleteDoc(filePath) {
    if (!confirm("¿Eliminar este archivo?")) return;
    try {
      await fetch(`${SUPABASE_URL}/storage/v1/object/documentos/${filePath}`, {
        method: "DELETE",
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
      });
      await loadDocs(selectedClient.id);
    } catch (e) { console.error(e); }
  }

  function getDocUrl(filePath) {
    return `${SUPABASE_URL}/storage/v1/object/documentos/${filePath}?apikey=${SUPABASE_KEY}`;
  }

  async function saveClient(data) {
    try {
      if (editingClient) {
        const [updated] = await api(`clients?id=eq.${editingClient.id}`, { method: "PATCH", body: JSON.stringify({ name: data.name, email: data.email, phone: data.phone, stage: data.stage, notes: data.notes, updated_at: new Date().toISOString() }) });
        setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...updated, trips: c.trips, followUps: c.followUps } : c));
        if (selectedClient?.id === editingClient.id) setSelectedClient(prev => ({ ...prev, ...updated }));
      } else {
        const [newC] = await api("clients", { method: "POST", body: JSON.stringify({ name: data.name, email: data.email, phone: data.phone, stage: data.stage || "lead", notes: data.notes }) });
        setClients(prev => [{ ...newC, trips: [], followUps: [] }, ...prev]);
      }
      setShowClientForm(false); setEditingClient(null);
    } catch (e) { console.error(e); alert("Error al guardar"); }
  }

  async function saveTrip(data) {
    try {
      if (editingTrip) {
        const [updated] = await api(`trips?id=eq.${editingTrip.id}`, { method: "PATCH", body: JSON.stringify(data) });
        setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, trips: c.trips.map(t => t.id === editingTrip.id ? updated : t) } : c));
        setSelectedClient(prev => ({ ...prev, trips: prev.trips.map(t => t.id === editingTrip.id ? updated : t) }));
      } else {
        const [newT] = await api("trips", { method: "POST", body: JSON.stringify({ ...data, client_id: selectedClient.id }) });
        setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, trips: [...(c.trips || []), newT] } : c));
        setSelectedClient(prev => ({ ...prev, trips: [...(prev.trips || []), newT] }));
      }
      setShowTripForm(false); setEditingTrip(null);
    } catch (e) { console.error(e); alert("Error al guardar"); }
  }

  async function saveFU() {
    if (!fuForm.note) return;
    try {
      const [f] = await api("follow_ups", { method: "POST", body: JSON.stringify({ note: fuForm.note, date: fuForm.date, done: false, client_id: selectedClient.id }) });
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, followUps: [...(c.followUps || []), f] } : c));
      setSelectedClient(prev => ({ ...prev, followUps: [...(prev.followUps || []), f] }));
      setShowFUModal(false);
    } catch (e) { console.error(e); alert("Error"); }
  }

  async function toggleFU(clientId, fuId, done) {
    try {
      await api(`follow_ups?id=eq.${fuId}`, { method: "PATCH", body: JSON.stringify({ done: !done }), prefer: "return=minimal" });
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, followUps: c.followUps.map(f => f.id === fuId ? { ...f, done: !done } : f) } : c));
      if (selectedClient?.id === clientId) setSelectedClient(prev => ({ ...prev, followUps: prev.followUps.map(f => f.id === fuId ? { ...f, done: !done } : f) }));
    } catch (e) { console.error(e); }
  }

  async function updateStage(clientId, stage) {
    try {
      await api(`clients?id=eq.${clientId}`, { method: "PATCH", body: JSON.stringify({ stage, updated_at: new Date().toISOString() }), prefer: "return=minimal" });
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, stage, updated_at: new Date().toISOString() } : c));
      if (selectedClient?.id === clientId) setSelectedClient(prev => ({ ...prev, stage, updated_at: new Date().toISOString() }));
    } catch (e) { console.error(e); }
  }

  async function deleteClient(id) {
    if (!confirm("¿Eliminar este cliente y todos sus datos?")) return;
    try {
      await api(`clients?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
      setClients(prev => prev.filter(c => c.id !== id)); setSelectedClient(null); setView("pipeline");
    } catch (e) { console.error(e); }
  }

  const iS = { width: "100%", padding: "9px 12px", border: "1px solid #e8e5e0", borderRadius: 8, fontSize: 13.5, fontFamily: "'DM Sans',sans-serif", color: "#1a1814", background: "#f8f7f4", outline: "none" };
  const navItems = [
    { id: "pipeline", icon: "🗂", label: "Pipeline" },
    { id: "clientes", icon: "👥", label: "Clientes" },
    { id: "alertas", icon: "🔔", label: "Alertas", badge: totalAlerts },
    { id: "stats", icon: "📊", label: "Estadísticas" },
  ];

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontSize: 16, color: "#8c8680", fontFamily: "'DM Sans',sans-serif" }}>Cargando tu CRM... ✈</div>;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..800;1,9..40,300..800&family=DM+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif}.crm{display:flex;height:100vh;background:#f8f7f4;font-family:'DM Sans',sans-serif;color:#1a1814}.sb{width:215px;background:#1a1814;display:flex;flex-direction:column;padding:24px 0;flex-shrink:0}.mn{flex:1;display:flex;flex-direction:column;overflow:hidden}.tb{padding:16px 24px;background:#fff;border-bottom:1px solid #e8e5e0;display:flex;align-items:center;justify-content:space-between}.ct{flex:1;overflow-y:auto;padding:24px}.nb{display:flex;align-items:center;gap:10px;padding:10px 20px;width:100%;background:none;border:none;color:rgba(255,255,255,0.5);font-size:13.5px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}.nb:hover{color:#fff;background:rgba(255,255,255,0.07)}.nb.active{color:#fff;background:rgba(255,255,255,0.13)}.nbg{background:#ef4444;color:#fff;font-size:10px;font-weight:700;border-radius:20px;padding:1px 6px;margin-left:auto}.tbb{padding:12px 16px;font-size:13px;font-weight:500;background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;color:#8c8680;font-family:'DM Sans',sans-serif;margin-bottom:-1px;transition:all .15s}.tbb.active{color:#1a1814;border-bottom-color:#1a1814;font-weight:700}.cc{background:#fff;border:1px solid #e8e5e0;border-radius:12px;padding:16px;cursor:pointer;transition:all .15s;margin-bottom:10px}.cc:hover{border-color:#1a1814;box-shadow:0 4px 16px rgba(0,0,0,0.06);transform:translateY(-1px)}.fuc{width:18px;height:18px;border:2px solid #e8e5e0;border-radius:4px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:2px;transition:all .15s;font-size:11px;color:transparent}.fuc.done{background:#1a1814;border-color:#1a1814;color:#fff}.sc{background:#fff;border:1px solid #e8e5e0;border-radius:12px;padding:18px}.es{text-align:center;padding:48px 24px;color:#8c8680;font-size:14px}.pipeline-col{background:#f0ede8;border-radius:12px;padding:14px;min-width:200px;flex:1}`}</style>
      <div className="crm">
        <div className="sb">
          <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>✈ TravelCRM</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>Agencia de Viajes</div>
          </div>
          <nav style={{ padding: "16px 0", flex: 1 }}>
            {navItems.map(item => <button key={item.id} className={`nb ${(view === item.id || (view === "detalle" && item.id === "clientes")) ? "active" : ""}`} onClick={() => { setView(item.id); if (item.id !== "detalle") setSelectedClient(null); }}><span>{item.icon}</span><span>{item.label}</span>{item.badge > 0 && <span className="nbg">{item.badge}</span>}</button>)}
          </nav>
          <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "rgba(255,255,255,0.28)", lineHeight: 1.6 }}>{stats.total} clientes · {stats.totalTrips} viajes</div>
        </div>

        <div className="mn">
          {/* PIPELINE */}
          {view === "pipeline" && <>
            <div className="tb"><div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Pipeline</div><button onClick={() => { setEditingClient(null); setShowClientForm(true); }} style={{ background: "#1a1814", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>+ Nuevo cliente</button></div>
            <div className="ct">
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                {STAGES.map(stage => {
                  const stageClients = filtered.filter(c => c.stage === stage.id);
                  return (
                    <div key={stage.id} className="pipeline-col">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 14 }}>{stage.emoji}</span>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{stage.label}</span>
                        <span style={{ background: stage.color + "22", color: stage.color, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "1px 8px", marginLeft: "auto" }}>{stageClients.length}</span>
                      </div>
                      {stageClients.length === 0 ? <div style={{ fontSize: 12, color: "#8c8680", textAlign: "center", padding: "20px 0" }}>Sin clientes</div> :
                        stageClients.map(c => {
                          const autoR = getAutoReminders(c, c.trips || []);
                          const manualR = (c.followUps || []).filter(f => !f.done);
                          const hasUrgent = autoR.some(r => r.urgent);
                          return (
                            <div key={c.id} className="cc" onClick={() => { setSelectedClient(c); setView("detalle"); setActiveTab("info"); }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                <Avatar name={c.name || "?"} size={32} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                                  <div style={{ fontSize: 11, color: "#8c8680", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.phone || c.email}</div>
                                </div>
                                {hasUrgent && <span style={{ fontSize: 16 }}>🚨</span>}
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8c8680" }}>
                                <span>✈ {(c.trips || []).length} viaje{(c.trips || []).length !== 1 ? "s" : ""}</span>
                                {(autoR.length + manualR.length) > 0 && <span style={{ color: "#ef4444", fontWeight: 600 }}>🔔 {autoR.length + manualR.length}</span>}
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          </>}

          {/* CLIENTES */}
          {view === "clientes" && <>
            <div className="tb"><div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Clientes</div><button onClick={() => { setEditingClient(null); setShowClientForm(true); }} style={{ background: "#1a1814", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>+ Nuevo cliente</button></div>
            <div className="ct">
              <input style={{ ...iS, marginBottom: 20, display: "block" }} placeholder="🔍 Buscar por nombre, teléfono o email..." value={search} onChange={e => setSearch(e.target.value)} />
              {filtered.length === 0 ? <div className="es"><div style={{ fontSize: 40, marginBottom: 12 }}>🧳</div>No se encontraron clientes</div> :
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 14 }}>
                  {filtered.map(c => <div key={c.id} className="cc" onClick={() => { setSelectedClient(c); setView("detalle"); setActiveTab("info"); }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}><Avatar name={c.name || "?"} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div><div style={{ fontSize: 12, color: "#8c8680", marginTop: 1 }}>{c.phone}</div></div></div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #e8e5e0" }}><StageBadge stage={c.stage} /><span style={{ fontSize: 12, color: "#8c8680" }}>✈ {(c.trips || []).length} viaje{(c.trips || []).length !== 1 ? "s" : ""}</span></div>
                  </div>)}
                </div>}
            </div>
          </>}

          {/* DETALLE */}
          {view === "detalle" && selectedClient && <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 24px", background: "#fff", borderBottom: "1px solid #e8e5e0", display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar name={selectedClient.name || "?"} size={44} />
              <div style={{ flex: 1 }}>
                <button onClick={() => { setView("pipeline"); setSelectedClient(null); }} style={{ background: "none", border: "none", fontSize: 12, color: "#8c8680", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: 0, marginBottom: 2 }}>← Volver</button>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5 }}>{selectedClient.name}</div>
                <div style={{ fontSize: 12, color: "#8c8680", marginTop: 1 }}>{selectedClient.phone} · {selectedClient.email}</div>
              </div>
              <StageBadge stage={selectedClient.stage} />
              <button onClick={() => { setEditingClient(selectedClient); setShowClientForm(true); }} style={{ background: "#f0ede8", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>✏️ Editar</button>
              <button onClick={() => deleteClient(selectedClient.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "7px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Eliminar</button>
            </div>

            {/* Stage selector */}
            <div style={{ padding: "10px 24px", background: "#f8f7f4", borderBottom: "1px solid #e8e5e0", display: "flex", gap: 6, overflowX: "auto" }}>
              {STAGES.map(s => <button key={s.id} onClick={() => updateStage(selectedClient.id, s.id)} style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${selectedClient.stage === s.id ? s.color : "#e8e5e0"}`, background: selectedClient.stage === s.id ? s.bg : "#fff", color: selectedClient.stage === s.id ? s.color : "#8c8680", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>{s.emoji} {s.label}</button>)}
            </div>

            <div style={{ display: "flex", padding: "0 24px", background: "#fff", borderBottom: "1px solid #e8e5e0" }}>
              {[["info", "📋 Info"], ["viajes", "✈ Viajes"], ["seguimiento", "🔔 Seguimiento"], ["docs", "📁 Documentos"]].map(([t, l]) => <button key={t} className={`tbb ${activeTab === t ? "active" : ""}`} onClick={() => { setActiveTab(t); if (t === "docs") loadDocs(selectedClient.id); }}>{l}</button>)}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {activeTab === "info" && <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {[["Teléfono", selectedClient.phone || "—"], ["Email", selectedClient.email || "—"]].map(([label, val]) => <div key={label}><div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c8680", marginBottom: 5 }}>{label}</div><span style={{ fontSize: 14 }}>{val}</span></div>)}
                </div>
                {selectedClient.notes && <><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📝 Notas</div><div style={{ background: "#f0ede8", borderRadius: 10, padding: 14, fontSize: 13.5, lineHeight: 1.6 }}>{selectedClient.notes}</div></>}
                {/* Auto reminders */}
                {getAutoReminders(selectedClient, selectedClient.trips || []).length > 0 && <>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, marginTop: 20 }}>⚡ Alertas automáticas</div>
                  {getAutoReminders(selectedClient, selectedClient.trips || []).map((r, i) => <div key={i} style={{ background: r.urgent ? "#fef2f2" : "#f8f7f4", border: `1px solid ${r.urgent ? "#fecaca" : "#e8e5e0"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13, color: r.urgent ? "#dc2626" : "#1a1814" }}>{r.text}</div>)}
                </>}
              </>}

              {activeTab === "viajes" && <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Viajes / Cotizaciones ({(selectedClient.trips || []).length})</div>
                  <button onClick={() => { setEditingTrip(null); setShowTripForm(true); }} style={{ background: "#1a1814", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>+ Nueva cotización</button>
                </div>
                {(selectedClient.trips || []).length === 0 ? <div className="es"><div style={{ fontSize: 36, marginBottom: 10 }}>✈</div>Sin viajes registrados</div>
                  : (selectedClient.trips || []).map(t => <TripCard key={t.id} trip={t} onEdit={() => { setEditingTrip(t); setShowTripForm(true); }} onClick={() => {}} />)}
              </>}

              {activeTab === "seguimiento" && <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Seguimientos</div>
                  <button onClick={() => { setFuForm({ date: "", note: "" }); setShowFUModal(true); }} style={{ background: "#1a1814", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>+ Agregar</button>
                </div>
                {(selectedClient.followUps || []).length === 0 ? <div className="es"><div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>Sin seguimientos manuales</div>
                  : (selectedClient.followUps || []).map(f => <div key={f.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: "#fff", border: "1px solid #e8e5e0", borderRadius: 8, marginBottom: 8 }}>
                    <div className={`fuc ${f.done ? "done" : ""}`} onClick={() => toggleFU(selectedClient.id, f.id, f.done)}>{f.done ? "✓" : ""}</div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, textDecoration: f.done ? "line-through" : "none", color: f.done ? "#8c8680" : "#1a1814" }}>{f.note}</div>{f.date && <div style={{ fontSize: 11.5, color: "#8c8680", marginTop: 2 }}>{new Date(f.date + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long" })}</div>}</div>
                  </div>)}
              </>}

              {activeTab === "docs" && <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Documentos</div>
                  <label style={{ background: "#1a1814", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    {uploadingDoc ? "Subiendo..." : "+ Subir archivo"}
                    <input type="file" style={{ display: "none" }} onChange={e => e.target.files[0] && uploadDoc(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
                  </label>
                </div>
                <div style={{ fontSize: 12, color: "#8c8680", marginBottom: 14 }}>PDF, imágenes, Word, Excel — todo vale</div>
                {docsLoading ? <div className="es"><div style={{ fontSize: 30, marginBottom: 10 }}>⏳</div>Cargando...</div>
                  : docs.length === 0 ? <div className="es"><div style={{ fontSize: 36, marginBottom: 10 }}>📁</div>Sin documentos adjuntos</div>
                  : docs.filter(d => d.name).map(d => {
                    const filePath = `cliente_${selectedClient.id}/${d.name}`;
                    const displayName = d.name.replace(/^\d+_/, "");
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(d.name);
                    const isPdf = /\.pdf$/i.test(d.name);
                    const icon = isPdf ? "📄" : isImage ? "🖼" : "📎";
                    const sizeKB = d.metadata?.size ? Math.round(d.metadata.size / 1024) : null;
                    return (
                      <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#fff", border: "1px solid #e8e5e0", borderRadius: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 22 }}>{icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
                          {sizeKB && <div style={{ fontSize: 11.5, color: "#8c8680", marginTop: 2 }}>{sizeKB} KB</div>}
                        </div>
                        <a href={getDocUrl(filePath)} target="_blank" rel="noreferrer" style={{ background: "#f0ede8", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textDecoration: "none", color: "#1a1814", fontWeight: 600 }}>Ver</a>
                        <button onClick={() => deleteDoc(filePath)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>🗑</button>
                      </div>
                    );
                  })
                }
              </>}
            </div>
          </div>}

          {/* ALERTAS */}
          {view === "alertas" && <>
            <div className="tb"><div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Alertas y seguimientos</div></div>
            <div className="ct">
              {allReminders.length === 0 && manualPending.length === 0 ? <div className="es"><div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>¡Todo al día!</div> : <>
                {allReminders.length > 0 && <>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#8c8680", textTransform: "uppercase", letterSpacing: 0.5 }}>⚡ Alertas automáticas</div>
                  {allReminders.map((r, i) => <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 14, background: r.urgent ? "#fef2f2" : "#fff", border: `1px solid ${r.urgent ? "#fecaca" : "#e8e5e0"}`, borderRadius: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8c8680", marginBottom: 3 }}>👤 {r.clientName}</div>
                      <div style={{ fontSize: 13.5, color: r.urgent ? "#dc2626" : "#1a1814" }}>{r.text}</div>
                    </div>
                    <button onClick={() => { const c = clients.find(x => x.id === r.clientId); if (c) { setSelectedClient(c); setActiveTab("info"); setView("detalle"); } }} style={{ background: "none", border: "1px solid #e8e5e0", color: "#1a1814", padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Ver</button>
                  </div>)}
                </>}
                {manualPending.length > 0 && <>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, marginTop: 20, color: "#8c8680", textTransform: "uppercase", letterSpacing: 0.5 }}>📋 Seguimientos manuales</div>
                  {manualPending.map(f => <div key={f.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 14, background: "#fff", border: "1px solid #e8e5e0", borderRadius: 10, marginBottom: 10 }}>
                    <div className={`fuc ${f.done ? "done" : ""}`} onClick={() => toggleFU(f.clientId, f.id, f.done)}>{f.done ? "✓" : ""}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8c8680", marginBottom: 3 }}>👤 {f.clientName}</div>
                      <div style={{ fontSize: 13.5 }}>{f.note}</div>
                      {f.date && <div style={{ fontSize: 11.5, color: "#8c8680", marginTop: 2 }}>{new Date(f.date + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}</div>}
                    </div>
                    <button onClick={() => { const c = clients.find(x => x.id === f.clientId); if (c) { setSelectedClient(c); setActiveTab("seguimiento"); setView("detalle"); } }} style={{ background: "none", border: "1px solid #e8e5e0", color: "#1a1814", padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Ver</button>
                  </div>)}
                </>}
              </>}
            </div>
          </>}

          {/* STATS */}
          {view === "stats" && <>
            <div className="tb"><div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Estadísticas</div></div>
            <div className="ct">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 14, marginBottom: 24 }}>
                <div className="sc"><div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, fontFamily: "'DM Mono',monospace" }}>{stats.total}</div><div style={{ fontSize: 12, color: "#8c8680", marginTop: 4 }}>Clientes totales</div></div>
                <div className="sc"><div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>USD {stats.revenue.toLocaleString()}</div><div style={{ fontSize: 12, color: "#8c8680", marginTop: 4 }}>Ingresos confirmados</div></div>
                <div className="sc"><div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, fontFamily: "'DM Mono',monospace" }}>{stats.totalTrips}</div><div style={{ fontSize: 12, color: "#8c8680", marginTop: 4 }}>Viajes registrados</div></div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Clientes por etapa</div>
              {stats.byStage.map(s => <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 13, minWidth: 160 }}>{s.emoji} {s.label}</span>
                <div style={{ flex: 1, background: "#f0ede8", borderRadius: 20, height: 8, overflow: "hidden" }}>
                  <div style={{ width: `${stats.total > 0 ? (s.count / stats.total) * 100 : 0}%`, background: s.color, height: "100%", borderRadius: 20, transition: "width .3s" }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, minWidth: 24, textAlign: "right" }}>{s.count}</span>
              </div>)}
            </div>
          </>}
        </div>
      </div>

      {showClientForm && <ClientForm client={editingClient} onSave={saveClient} onClose={() => { setShowClientForm(false); setEditingClient(null); }} />}

      {showFUModal && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={e => e.target === e.currentTarget && setShowFUModal(false)}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, width: 420, maxWidth: "95vw", border: "1px solid #e8e5e0", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", fontFamily: "'DM Sans',sans-serif" }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>Nuevo seguimiento</div>
          <div style={{ marginBottom: 14 }}><FL>Fecha</FL><input type="date" style={iS} value={fuForm.date || ""} onChange={e => setFuForm(p => ({ ...p, date: e.target.value }))} /></div>
          <div style={{ marginBottom: 14 }}><FL>Nota *</FL><textarea style={{ ...iS, resize: "vertical", minHeight: 80 }} value={fuForm.note || ""} onChange={e => setFuForm(p => ({ ...p, note: e.target.value }))} placeholder="Ej: Llamar para confirmar fechas" /></div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setShowFUModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e8e5e0", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancelar</button>
            <button onClick={saveFU} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1a1814", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Guardar</button>
          </div>
        </div>
      </div>}

      {showTripForm && selectedClient && <TripForm clientName={selectedClient.name} trip={editingTrip} onSave={saveTrip} onClose={() => { setShowTripForm(false); setEditingTrip(null); }} />}
    </>
  );
}
