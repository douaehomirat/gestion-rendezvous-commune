import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  User,
  FileText,
  Inbox,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  XCircle,
  Mail,
} from "lucide-react";

import Badge from "../../components/Badge";

import {
  formatDate,
  formatTime,
  getStatusColor,
  getStatusLabel,
} from "../../utils/helpers";

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api";

// ─────────────────────────────────────────────
// CHECK < 24H
// ─────────────────────────────────────────────
const isWithin24Hours = (appointmentDate) => {
  const now = new Date();
  const diffMs = appointmentDate - now;
  return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
};

const AgentAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────────────────────
  // FETCH APPOINTMENTS
  // ─────────────────────────────────────────────
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);

        const user = JSON.parse(localStorage.getItem("user"));
        const agentId = user?.id;

        if (!agentId) {
          console.error("Agent ID introuvable");
          setLoading(false);
          return;
        }

        const res = await axios.get(`${API}/appointments/agent/${agentId}`);
        const data = Array.isArray(res.data) ? res.data : [];
        setAppointments(data);
      } catch (err) {
        console.error("Erreur chargement rendez-vous:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // ─────────────────────────────────────────────
  // GET DATE OBJECT
  // ─────────────────────────────────────────────
  const getDateTime = (appointment) => {
    if (appointment.startDateTime) {
      return new Date(appointment.startDateTime);
    }
    if (appointment.date && appointment.time) {
      return new Date(`${appointment.date}T${appointment.time}`);
    }
    return new Date(0);
  };

  // ─────────────────────────────────────────────
  // MARK COMPLETED
  // ─────────────────────────────────────────────
  const markCompleted = async (id) => {
    try {
      await axios.put(`${API}/appointments/${id}/complete`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "completed" } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────
  // SORT APPOINTMENTS
  // ─────────────────────────────────────────────
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort(
      (a, b) => getDateTime(b).getTime() - getDateTime(a).getTime()
    );
  }, [appointments]);

  // ─────────────────────────────────────────────
  // UPCOMING (urgent, not completed, reminder not yet sent)
  // ─────────────────────────────────────────────
  const upcomingAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const date = getDateTime(a);
      return (
        isWithin24Hours(date) &&
        a.status !== "completed" &&
        !a.reminderSent
      );
    });
  }, [appointments]);

  return (
    <div className="space-y-6">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-8 shadow-2xl">

        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-40 h-40 bg-primary-400/20 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

          <div>
            <p className="text-primary-200 text-xs font-semibold uppercase tracking-widest mb-1">
              Tableau de bord
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              Mes rendez-vous
            </h1>
            <p className="text-primary-300 mt-1 text-sm">
              {formatDate(new Date())}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Stat
              value={appointments.length}
              label="total"
              color="bg-white/15 text-white"
            />
            <Stat
              value={upcomingAppointments.filter((a) => a.status !== "cancelled").length}
              label="urgents"
              color="bg-orange-400/25 border border-orange-300/30 text-orange-100"
            />
          </div>

        </div>
      </div>

      {/* ── MAIN CARD ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-primary-600" />
            </div>
            <p className="text-gray-400 text-sm">Chargement des rendez-vous…</p>
          </div>

        ) : sortedAppointments.length === 0 ? (

          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-20 h-20 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Inbox className="text-gray-300" size={36} />
            </div>
            <p className="font-semibold text-gray-600">Aucun rendez-vous</p>
            <p className="text-sm text-gray-400">Les rendez-vous apparaîtront ici.</p>
          </div>

        ) : (

          <div className="divide-y divide-gray-50">
            {sortedAppointments.map((a) => {
              const apptDate = getDateTime(a);
              const urgent = isWithin24Hours(apptDate);
              const isCancelled = a.status === "cancelled";
              const isCompleted = a.status === "completed";

              const citizenName =
                a.citizen?.name ||
                `${a.citizen?.firstName || ""} ${a.citizen?.lastName || ""}`.trim() ||
                "Citoyen";

              return (
                <div
                  key={a.id}
                  className={`group relative p-5 sm:p-6 transition-all duration-200 hover:bg-gray-50/60 ${
                    isCancelled
                      ? "bg-red-50/40"
                      : urgent && !isCompleted
                      ? "bg-orange-50/40"
                      : ""
                  }`}
                >
                  {/* Accent bar */}
                  <div
                    className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full transition-all duration-200 group-hover:top-2 group-hover:bottom-2 ${
                      isCancelled
                        ? "bg-red-400"
                        : isCompleted
                        ? "bg-emerald-400"
                        : urgent
                        ? "bg-orange-400"
                        : "bg-primary-300"
                    }`}
                  />

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pl-3">

                    {/* LEFT — citizen + details */}
                    <div className="space-y-4 min-w-0">

                      {/* Citizen row */}
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          isCancelled ? "bg-red-100" : "bg-primary-100"
                        }`}>
                          <User
                            size={18}
                            className={isCancelled ? "text-red-500" : "text-primary-700"}
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">{citizenName}</h3>
                          <p className="text-xs text-gray-400">Citoyen</p>
                        </div>
                      </div>

                      {/* Meta chips */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <MetaChip icon={<Calendar size={14} />} text={formatDate(apptDate)} />
                        <MetaChip icon={<Clock size={14} />} text={formatTime(apptDate)} />
                        <MetaChip
                          icon={<FileText size={14} />}
                          text={a.serviceName || "Service"}
                          wide
                        />
                      </div>
                    </div>

                    {/* RIGHT — status + reminder badge */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 flex-shrink-0">

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {/* Status pill */}
                        {isCancelled && (
                          <StatusPill
                            icon={<XCircle size={12} />}
                            label="Annulé"
                            color="bg-red-100 text-red-600"
                          />
                        )}
                        {urgent && !isCompleted && !isCancelled && (
                          <StatusPill
                            icon={<AlertTriangle size={12} />}
                            label="< 24 h"
                            color="bg-orange-100 text-orange-600"
                          />
                        )}
                      </div>

                      <Badge variant={getStatusColor(a.status)}>
                        {getStatusLabel(a.status)}
                      </Badge>

                      {/* Reminder indicator (read-only — n8n handles sending) */}
                      {a.reminderSent ? (
                        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-medium whitespace-nowrap">
                          <CheckCircle2 size={13} />
                          Rappel envoyé
                        </div>
                      ) : urgent && !isCompleted && !isCancelled ? (
                        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-100 text-orange-700 font-medium whitespace-nowrap">
                          <Mail size={13} />
                          En attente du rappel
                        </div>
                      ) : null}

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

const Stat = ({ value, label, color }) => (
  <div className={`px-4 py-2 rounded-2xl text-sm font-medium backdrop-blur ${color}`}>
    <span className="font-bold">{value}</span>{" "}
    <span className="opacity-80">{label}</span>
  </div>
);

const MetaChip = ({ icon, text, wide = false }) => (
  <div
    className={`flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl ${
      wide ? "sm:col-span-2" : ""
    }`}
  >
    <span className="text-gray-400 flex-shrink-0">{icon}</span>
    <span className="truncate">{text}</span>
  </div>
);

const StatusPill = ({ icon, label, color }) => (
  <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
    {icon}
    {label}
  </div>
);

export default AgentAppointments;