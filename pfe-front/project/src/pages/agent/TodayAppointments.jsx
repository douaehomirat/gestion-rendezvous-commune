import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Calendar, ChevronLeft, ChevronRight, Check, Clock,
  AlertCircle, User, Ticket, CheckCircle2, XCircle, Loader2
} from "lucide-react";
import StatCard from "../../components/StatCard";
import Badge from "../../components/Badge";
import { formatDate } from "../../utils/helpers";

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/appointments";

// ─── Pure helpers (outside component to avoid re-creation on each render) ────

const formatHour = (dateTime) =>
  dateTime
    ? new Date(dateTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

const STATUS_LABELS = {
  pending:     "En attente",
  confirmed:   "Confirmé",
  in_progress: "En cours",
  completed:   "Traité",
  cancelled:   "Annulé",
};

const STATUS_STYLES = {
  pending:     "bg-amber-50 text-amber-700 border border-amber-200",
  confirmed:   "bg-blue-50 text-blue-700 border border-blue-200",
  in_progress: "bg-violet-50 text-violet-700 border border-violet-200",
  completed:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled:   "bg-red-50 text-red-700 border border-red-200",
};

const getStatusLabel = (status) => STATUS_LABELS[status] ?? status;
const getStatusStyle = (status) => STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700 border border-gray-200";

const isFinal = (status) => status === "completed" || status === "cancelled";

// ─── Sub-component ────────────────────────────────────────────────────────────

const AppointmentCard = ({ apt, actionLoading, onUpdate }) => {
  const isExpired = apt.endDateTime && new Date() > new Date(apt.endDateTime);
  const isLoading = actionLoading === apt.id;
  const showActions = !isFinal(apt.status);

  const cardBorder =
    apt.status === "cancelled"   ? "border-red-200" :
    apt.status === "completed"   ? "border-emerald-200" :
    apt.status === "in_progress" ? "border-blue-300 ring-2 ring-blue-100" :
    "border-gray-100";

  return (
    <div className={`group relative overflow-hidden rounded-[30px] border p-6 bg-white/90 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 ${cardBorder}`}>
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">

        {/* LEFT */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary-600 font-bold text-lg">
            <Clock size={18} />
            {formatHour(apt.startDateTime)} – {formatHour(apt.endDateTime)}
          </div>

          <div className="flex items-center gap-3 text-gray-800 font-bold text-xl">
            <User size={20} />
            {apt.citizen?.name || "Inconnu"}
          </div>

          <div className="text-gray-500">{apt.department?.name || apt.serviceName}</div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Ticket size={15} />
            {apt.ticket}
          </div>

          {(apt.status === "pending" || apt.status === "confirmed") && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              En attente d'appel
            </div>
          )}

          {isExpired && !isFinal(apt.status) && (
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
              <AlertCircle size={14} />
              Rendez-vous dépassé
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex flex-wrap gap-3 items-center">
          {showActions && (
            <>
              <button
                disabled={isLoading}
                onClick={() => onUpdate(apt.id, "completed")}
                className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              </button>

              <button
                disabled={isLoading}
                onClick={() => onUpdate(apt.id, "cancelled")}
                className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 hover:bg-red-200 flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:opacity-50"
              >
                <XCircle size={18} />
              </button>
            </>
          )}

          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusStyle(apt.status)}`}>
            {getStatusLabel(apt.status)}
          </span>
        </div>

      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const TodayAppointments = () => {
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);

  const [appointments, setAppointments] = useState([]);
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [loading, setLoading]           = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // ── API helpers ──────────────────────────────────────────────────────────────

  const updateStatusApi = useCallback(async (id, payload) => {
    try {
      await axios.put(`${API}/${id}/status`, payload);
      return true;
    } catch (err) {
      console.error("STATUS UPDATE ERROR:", err.response?.data ?? err.message);
      return false;
    }
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────────

  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/agent/${user.id}`);
      const list = Array.isArray(data) ? data : [];
      const now  = new Date();

      // Auto-cancel expired appointments in parallel
      const updated = await Promise.all(
        list.map(async (apt) => {
          if (!apt?.endDateTime || isFinal(apt.status)) return apt;

          const isExpired = now > new Date(apt.endDateTime);
          if (!isExpired) return apt;

          const success = await updateStatusApi(apt.id, { status: "cancelled" });
          return success ? { ...apt, status: "cancelled" } : apt;
        })
      );

      updated.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
      setAppointments(updated);
    } catch (err) {
      console.error("LOAD ERROR:", err.response?.data ?? err.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, updateStatusApi]);

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 30_000);
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  // ── Derived state ─────────────────────────────────────────────────────────────

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (!apt.startDateTime) return false;
      const start = new Date(apt.startDateTime);
      return (
        start.getFullYear() === currentDate.getFullYear() &&
        start.getMonth()    === currentDate.getMonth()    &&
        start.getDate()     === currentDate.getDate()
      );
    });
  }, [appointments, currentDate]);

  const currentAppointmentNow = useMemo(
    () => filteredAppointments.find((apt) => apt.status === "in_progress"),
    [filteredAppointments]
  );

  const stats = useMemo(() => ({
    total:      filteredAppointments.length,
    inProgress: filteredAppointments.filter((a) => a.status === "in_progress").length,
    completed:  filteredAppointments.filter((a) => a.status === "completed").length,
    waiting:    filteredAppointments.filter((a) => a.status === "pending" || a.status === "confirmed").length,
  }), [filteredAppointments]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const callNextAppointment = useCallback(async () => {
    if (currentAppointmentNow) return;

    const next = filteredAppointments.find(
      (apt) => apt.status === "pending" || apt.status === "confirmed"
    );
    if (!next) return;

    setActionLoading(next.id);
    const success = await updateStatusApi(next.id, { status: "in_progress" });
    if (success) {
      setAppointments((prev) =>
        prev.map((apt) => apt.id === next.id ? { ...apt, status: "in_progress" } : apt)
      );
    }
    setActionLoading(null);
  }, [currentAppointmentNow, filteredAppointments, updateStatusApi]);

  const updateStatus = useCallback(async (id, status) => {
    setActionLoading(id);

    try {
      const payload = status === "completed"
        ? { status: "completed", endDateTime: new Date().toISOString() }
        : { status };

      const success = await updateStatusApi(id, payload);
      if (!success) return;

      // Optimistically update local state
      let updatedList = appointments.map((apt) =>
        apt.id === id ? { ...apt, ...payload } : apt
      );

      // Auto-advance to next when completing
      if (status === "completed") {
        const next = updatedList.find(
          (apt) => apt.id !== id && (apt.status === "pending" || apt.status === "confirmed")
        );
        if (next) {
          const nextSuccess = await updateStatusApi(next.id, { status: "in_progress" });
          if (nextSuccess) {
            updatedList = updatedList.map((apt) =>
              apt.id === next.id ? { ...apt, status: "in_progress" } : apt
            );
          }
        }
      }

      setAppointments(updatedList);
    } catch (err) {
      console.error("UPDATE ERROR:", err.response?.data ?? err.message);
    } finally {
      setActionLoading(null);
    }
  }, [appointments, updateStatusApi]);

  // ── Navigation ────────────────────────────────────────────────────────────────

  const prevDay = () => setCurrentDate((d) => new Date(d.getTime() - 86_400_000));
  const nextDay = () => setCurrentDate((d) => new Date(d.getTime() + 86_400_000));
  const isToday = new Date().toDateString() === currentDate.toDateString();

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-3 md:p-5 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-5 md:p-7 flex items-center justify-between">
        <button onClick={prevDay} className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-105">
          <ChevronLeft />
        </button>

        <div className="text-center">
          <h2 className="text-2xl md:text-4xl font-black text-gray-800">{formatDate(currentDate)}</h2>
          {isToday && <div className="mt-3"><Badge variant="primary">Aujourd'hui</Badge></div>}
        </div>

        <button onClick={nextDay} className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-105">
          <ChevronRight />
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-12 text-center">
          <div className="flex flex-col items-center gap-4 text-gray-500">
            <Loader2 className="animate-spin" />
            <span>Chargement des rendez-vous...</span>
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total"     value={stats.total}      icon={Calendar} />
        <StatCard title="En cours"  value={stats.inProgress} icon={Clock} />
        <StatCard title="Terminés"  value={stats.completed}  icon={CheckCircle2} />
        <StatCard title="Attente"   value={stats.waiting}    icon={AlertCircle} />
      </div>

      {/* CURRENT APPOINTMENT */}
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-indigo-600 via-blue-700 to-cyan-700 shadow-[0_20px_60px_rgba(37,99,235,0.35)]">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-10 w-60 h-60 bg-cyan-300/20 rounded-full blur-3xl" />

        <div className="relative p-6 md:p-10">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">

            {/* LEFT */}
            <div className="space-y-6 text-white">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/15 border border-white/20 backdrop-blur-md">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <span className="font-semibold tracking-wide">Citoyen actuellement appelé</span>
              </div>

              {currentAppointmentNow ? (
                <>
                  <div>
                    <h1 className="text-4xl md:text-6xl font-black leading-none">
                      {currentAppointmentNow.citizen?.name || "Citoyen"}
                    </h1>
                    <p className="mt-3 text-blue-100 text-lg">
                      {currentAppointmentNow.department?.name || currentAppointmentNow.serviceName}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-3 bg-white/10 border border-white/10 px-5 py-4 rounded-2xl backdrop-blur-md">
                      <Clock size={20} />
                      <span className="font-semibold text-lg">
                        {formatHour(currentAppointmentNow.startDateTime)} – {formatHour(currentAppointmentNow.endDateTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 border border-white/10 px-5 py-4 rounded-2xl backdrop-blur-md">
                      <Ticket size={20} />
                      <span className="font-bold text-lg tracking-wider">{currentAppointmentNow.ticket}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold">Aucun citoyen en cours</h2>
                  <p className="text-blue-100">Cliquez sur « Appeler le suivant »</p>
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div className="flex flex-col gap-4 min-w-[260px]">
              {!currentAppointmentNow && (
                <button
                  onClick={callNextAppointment}
                  disabled={!!actionLoading}
                  className="bg-white text-blue-700 font-bold px-7 py-5 rounded-3xl shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {actionLoading
                    ? <Loader2 size={22} className="animate-spin" />
                    : <ChevronRight size={24} />}
                  Appeler le suivant
                </button>
              )}

              {currentAppointmentNow && (
                <>
                  <button
                    disabled={actionLoading === currentAppointmentNow.id}
                    onClick={() => updateStatus(currentAppointmentNow.id, "completed")}
                    className="bg-white text-blue-700 font-bold px-7 py-5 rounded-3xl shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {actionLoading === currentAppointmentNow.id
                      ? <Loader2 size={22} className="animate-spin" />
                      : <CheckCircle2 size={22} />}
                    Marquer traité
                  </button>

                  <button
                    disabled={actionLoading === currentAppointmentNow.id}
                    onClick={() => updateStatus(currentAppointmentNow.id, "cancelled")}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold px-7 py-5 rounded-3xl shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <XCircle size={22} />
                    Annuler
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      {!loading && filteredAppointments.length === 0 && (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-14 text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-6">
            <Calendar size={38} className="text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-700">Aucun rendez-vous</h3>
          <p className="text-gray-500 mt-3">Aucun rendez-vous trouvé pour cette date</p>
        </div>
      )}

      {/* LIST */}
      <div className="space-y-5">
        {filteredAppointments.map((apt) => (
          <AppointmentCard
            key={apt.id}
            apt={apt}
            actionLoading={actionLoading}
            onUpdate={updateStatus}
          />
        ))}
      </div>

    </div>
  );
};

export default TodayAppointments;