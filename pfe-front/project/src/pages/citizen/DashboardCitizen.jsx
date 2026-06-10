import { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import {
  Calendar,
  CalendarPlus,
  Clock,
  FileText,
  CheckCircle,
  ArrowRight,
  Users,
  MapPin,
  TrendingUp,
  Timer,
  Bell,
  Activity,
  Sparkles,
  ChevronRight,
  Hash,
} from "lucide-react";

import StatCard from "../../components/StatCard";
import { getStatusColor, getStatusLabel } from "../../utils/helpers";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/appointments";

// =========================
// HELPER — formater la date
// =========================
const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateShort = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

// =========================
// QUEUE VISUAL COMPONENT
// =========================
const QueueVisual = ({ apt, showQueue }) => {
  if (!showQueue) return null;

  const peopleAhead = apt.peopleAhead ?? Math.max(0, (apt.queuePosition ?? 1) - 1);

  const maxVisible = 5;
  const showEllipsis = peopleAhead > maxVisible;
  const visibleAhead = showEllipsis ? maxVisible - 1 : peopleAhead;

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-white shadow-inner">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">
        <h4 className="font-bold text-slate-700 flex items-center gap-2 text-base">
          <Users size={18} className="text-slate-500" />
          File d'attente
        </h4>
        <span
          className={`text-sm font-bold px-3 py-1 rounded-full
            ${peopleAhead === 0
              ? "bg-emerald-100 text-emerald-700"
              : peopleAhead <= 2
              ? "bg-orange-100 text-orange-700"
              : "bg-slate-100 text-slate-600"
            }`}
        >
          {peopleAhead === 0
            ? "🎉 C'est votre tour !"
            : `${peopleAhead} personne${peopleAhead > 1 ? "s" : ""} devant vous`}
        </span>
      </div>

      {/* AVATARS ROW */}
      <div className="flex items-end gap-3 overflow-x-auto pb-2">
        {Array.from({ length: visibleAhead }, (_, i) => {
          const position = i + 1;
          const isProcessing = position === 1;
          return (
            <div key={`ahead-${position}`} className="flex flex-col items-center gap-2 flex-shrink-0">
              {isProcessing ? (
                <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  En cours
                </div>
              ) : (
                <div className="h-6" />
              )}
              <div
                className={`flex items-center justify-center rounded-full font-bold text-sm shadow transition-all
                  ${isProcessing
                    ? "w-12 h-12 bg-emerald-500 text-white ring-4 ring-emerald-200"
                    : "w-10 h-10 bg-slate-300 text-slate-600"
                  }`}
              >
                {position}
              </div>
              <span className={`text-xs font-semibold ${isProcessing ? "text-emerald-600" : "text-slate-400"}`}>
                #{position}
              </span>
            </div>
          );
        })}

        {showEllipsis && (
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="h-6" />
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
              +{peopleAhead - (maxVisible - 1)}
            </div>
            <span className="text-xs text-slate-400">autres</span>
          </div>
        )}

        {peopleAhead > 0 && (
          <div className="flex flex-col items-center gap-2 flex-shrink-0 pb-1">
            <div className="h-6" />
            <ArrowRight size={20} className="text-slate-300 mx-1" />
            <div className="h-4" />
          </div>
        )}

        {/* MOI */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          {peopleAhead === 0 ? (
            <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              En cours
            </div>
          ) : (
            <div className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
              Vous
            </div>
          )}
          <div
            className={`flex items-center justify-center rounded-full font-black text-sm shadow-lg ring-4 transition-all scale-110
              ${peopleAhead === 0
                ? "w-14 h-14 bg-emerald-500 text-white ring-emerald-200"
                : "w-14 h-14 bg-blue-600 text-white ring-blue-200"
              }`}
          >
            Moi
          </div>
          <span className="text-xs font-bold text-blue-600">#{apt.queuePosition}</span>
        </div>
      </div>

      {/* MESSAGE CONTEXTUEL */}
      <div
        className={`mt-4 text-sm px-4 py-3 rounded-xl font-medium
          ${peopleAhead === 0
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : peopleAhead === 1
            ? "bg-orange-50 text-orange-700 border border-orange-200"
            : "bg-slate-50 text-slate-600 border border-slate-200"
          }`}
      >
        {peopleAhead === 0 && (
          <>🎉 <strong>C'est votre tour !</strong> Présentez-vous au guichet.</>
        )}
        {peopleAhead === 1 && (
          <>
            Le <span className="font-bold text-emerald-600">#1</span> est en cours de traitement.{" "}
            <strong>Vous êtes le prochain !</strong> Tenez-vous prêt.
          </>
        )}
        {peopleAhead >= 2 && (
          <>
            Le <span className="font-bold text-emerald-600">#1</span> est actuellement en cours de traitement.{" "}
            Encore <strong>{peopleAhead} passage{peopleAhead > 1 ? "s" : ""}</strong> avant vous.
          </>
        )}
      </div>
    </div>
  );
};

// =========================
// MAIN COMPONENT
// =========================
const DashboardCitizen = () => {
  const { user, logout } = useAuth();
  const citizenId = user?.id;

  const [stats, setStats] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!citizenId) return;
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const [statsRes, upcomingRes, activityRes] = await Promise.all([
        axios.get(`${API}/citizen/${citizenId}/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/citizen/${citizenId}/upcoming`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/citizen/${citizenId}/activity`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setStats(statsRes.data || {});
      setAppointments(upcomingRes.data || []);
      setActivity(activityRes.data || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Erreur de chargement des données");
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  }, [citizenId, logout]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // RDV actifs (pending, confirmed, in_progress)
  const queueAppointments = useMemo(() => {
    return appointments.filter(
      (a) =>
        a.status === "in_progress" ||
        a.status === "confirmed" ||
        a.status === "pending"
    );
  }, [appointments]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white px-4">
        <div className="bg-white shadow-2xl rounded-[32px] p-10 max-w-md w-full border border-gray-100 text-center">
          <Users className="mx-auto w-20 h-20 text-gray-400 mb-6" />
          <h2 className="text-3xl font-black text-slate-800 mb-3">Veuillez vous connecter</h2>
          <p className="text-gray-500 mb-8">Accédez à votre espace citoyen</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105"
          >
            Se connecter <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-6 lg:p-8 space-y-8">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 lg:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/20">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 text-sm font-semibold text-white mb-4">
                <Sparkles size={16} />
                Tableau de bord citoyen
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                Bonjour, {user.name || user.fullName || "Citoyen"}
              </h1>
              <p className="text-blue-100 text-lg mt-3">
                Suivez vos rendez-vous et votre file d'attente en temps réel
              </p>
              {(user.citizenNumber || user.cin || user.id) && (
                <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white text-sm font-bold">
                  <Hash size={14} />
                  Citoyen N° {user.citizenNumber || user.cin || user.id}
                </div>
              )}
            </div>
          </div>
          <Link
            to="/citizen/book"
            className="group flex items-center justify-center gap-3 px-8 py-5 rounded-3xl bg-white text-blue-700 font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300"
          >
            <CalendarPlus size={24} />
            Nouveau RDV
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total RDV"  value={stats.total     || 0} icon={Calendar}     color="blue"   change={stats.totalChange}     loading={loading} />
        <StatCard title="En attente" value={stats.pending   || 0} icon={Clock}        color="orange" change={stats.pendingChange}   loading={loading} />
        <StatCard title="Confirmés"  value={stats.confirmed || 0} icon={CheckCircle}  color="emerald" change={stats.confirmedChange} loading={loading} />
        <StatCard title="Terminés"   value={stats.completed || 0} icon={FileText}     color="purple" change={stats.completedChange} loading={loading} />
      </div>

      {/* FILE D'ATTENTE */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white p-6 lg:p-8">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center shadow-lg">
              <Timer className="w-7 h-7 text-orange-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800">File d'attente</h2>
              <p className="text-slate-500 mt-1">Suivi en temps réel de votre position</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-orange-50 border border-orange-200 text-orange-700 font-semibold">
            <Bell size={18} />
            Mise à jour automatique
          </div>
        </div>

        {queueAppointments.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 p-14 text-center bg-gradient-to-br from-gray-50 to-white">
            <Activity className="w-16 h-16 mx-auto text-gray-400 mb-5" />
            <h3 className="text-2xl font-bold text-slate-700 mb-2">Aucune file d'attente</h3>
            <p className="text-gray-500">Aucun rendez-vous actif actuellement</p>
          </div>
        ) : (
          <div className="space-y-5">
            {queueAppointments.map((apt) => {

              // ✅ FIX — isToday basé sur apt.date (string "yyyy-MM-dd")
              const today = new Date();
              const aptDate = apt.date ? new Date(apt.date) : null;
              const isToday = aptDate
                ? aptDate.toDateString() === today.toDateString()
                : false;

              // ✅ FIX — showQueue : file visible seulement aujourd'hui
              const showQueue = isToday && (
                apt.status === "in_progress" ||
                apt.status === "confirmed" ||
                apt.status === "pending"
              );

              // Badge temps : si aujourd'hui → diffMinutes, sinon → date courte
              const timeBadge = apt.status === "in_progress"
                ? "En cours"
                : isToday && apt.diffMinutes != null && apt.diffMinutes <= 120
                ? `${apt.diffMinutes} min`
                : isToday
                ? "Aujourd'hui"
                : formatDate(apt.date);

              return (
                <div
                  key={apt.id}
                  className={`relative overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl
                    ${apt.status === "in_progress"
                      ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"
                      : apt.urgency === "urgent"
                      ? "bg-gradient-to-r from-red-50 to-orange-50 border-red-200"
                      : apt.urgency === "soon"
                      ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200"
                      : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100"
                    }`}
                >
                  <div className="p-6 lg:p-7 space-y-6">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">

                      {/* LEFT */}
                      <div className="flex items-start gap-5">
                        {/* POSITION BADGE */}
                        <div
                          className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-black shadow-xl flex-shrink-0
                            ${apt.status === "in_progress"
                              ? "bg-emerald-500 text-white"
                              : apt.urgency === "urgent"
                              ? "bg-red-500 text-white"
                              : apt.urgency === "soon"
                              ? "bg-orange-500 text-white"
                              : "bg-blue-600 text-white"
                            }`}
                        >
                          #{apt.queuePosition ?? "—"}
                        </div>

                        {/* DETAILS */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-2xl font-black text-slate-800">
                              {apt.serviceName || "Service municipal"}
                            </h3>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${getStatusColor(apt.status)}`}>
                              {getStatusLabel(apt.status)}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-col gap-2 text-slate-600">
                            <div className="flex items-center gap-2">
                              <MapPin size={18} />
                              <span>{apt.location || "Agence municipale"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar size={18} />
                              {/* ✅ FIX — date formatée lisible */}
                              <span>{formatDate(apt.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={18} />
                              <span className="font-bold text-slate-800">{apt.time}</span>
                            </div>
                            {(apt.citizenNumber || apt.ticketNumber || apt.ticket) && (
                              <div className="flex items-center gap-2 mt-1">
                                <Hash size={18} />
                                <span className="font-bold text-blue-700 bg-blue-100 px-3 py-0.5 rounded-full text-sm">
                                  Ticket N° {apt.citizenNumber || apt.ticketNumber || apt.ticket}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="flex flex-col items-start xl:items-end gap-4">
                        <div
                          className={`px-5 py-3 rounded-2xl font-black text-lg shadow-lg
                            ${apt.status === "in_progress"
                              ? "bg-emerald-500 text-white"
                              : apt.urgency === "urgent"
                              ? "bg-red-500 text-white"
                              : apt.urgency === "soon"
                              ? "bg-orange-500 text-white"
                              : "bg-blue-600 text-white"
                            }`}
                        >
                          {timeBadge}
                        </div>
                        <Link
                          to={`/citizen/appointment/${apt.id}`}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold transition-all"
                        >
                          Voir détails <ChevronRight size={18} />
                        </Link>
                      </div>
                    </div>

                    {/* ✅ FIX — File d'attente : seulement si aujourd'hui */}
                    <QueueVisual apt={apt} showQueue={showQueue} />

                    {/* ✅ FIX — Message RDV futur (pas aujourd'hui) */}
                    {!isToday && (
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 text-blue-700 text-sm font-medium flex items-center gap-3">
                        <Calendar size={18} className="flex-shrink-0" />
                        <span>
                          Votre rendez-vous est prévu le{" "}
                          <strong>{formatDateShort(apt.date)}</strong> à{" "}
                          <strong>{apt.time}</strong>. La file d'attente sera visible le jour J.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="h-2 w-full bg-white/60">
                    <div
                      className={`h-full rounded-r-full transition-all
                        ${apt.status === "in_progress"
                          ? "bg-emerald-500"
                          : apt.urgency === "urgent"
                          ? "bg-red-500"
                          : apt.urgency === "soon"
                          ? "bg-orange-500"
                          : "bg-blue-500"
                        }`}
                      style={{
                        width:
                          apt.status === "in_progress" ? "100%"
                          : apt.urgency === "urgent"   ? "95%"
                          : apt.urgency === "soon"     ? "70%"
                          : "40%",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPCOMING + ACTIVITY */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">

        {/* UPCOMING */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl border border-white">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-lg">
                <Calendar className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800">Prochains RDV</h3>
                <p className="text-slate-500">Vos rendez-vous programmés</p>
              </div>
            </div>
            <Link to="/citizen/appointments" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
              Voir tout <ArrowRight size={18} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-3xl bg-gray-200 animate-pulse" />)}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-14">
              <CalendarPlus className="w-16 h-16 text-gray-400 mx-auto mb-5" />
              <h3 className="text-2xl font-bold text-slate-700 mb-2">Aucun rendez-vous</h3>
              <p className="text-gray-500 mb-6">Prenez votre premier rendez-vous</p>
              <Link to="/citizen/book" className="inline-flex items-center gap-2 bg-blue-600 text-white px-7 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all">
                Nouveau RDV <CalendarPlus size={20} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
              {appointments.slice(0, 5).map((apt) => (
                <Link
                  key={apt.id}
                  to={`/citizen/appointment/${apt.id}`}
                  className="group block rounded-3xl border border-gray-100 bg-gradient-to-r from-white to-slate-50 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-4 h-4 rounded-full ${getStatusColor(apt.status, true)}`} />
                        <h4 className="text-xl font-black text-slate-800 truncate">
                          {apt.serviceName || apt.service || "Service municipal"}
                        </h4>
                      </div>
                      <div className="space-y-2 text-slate-600">
                        <p><MapPin size={17} className="inline mr-2" />{apt.location || "Agence municipale"}</p>
                        <p>
                          <Clock size={17} className="inline mr-2" />
                          {/* ✅ date formatée dans la liste aussi */}
                          {formatDate(apt.date || apt.startDateTime?.split("T")[0])}
                          {" à "}
                          <span className="font-bold text-slate-800">
                            {apt.time || apt.startDateTime?.split("T")[1]?.slice(0, 5)}
                          </span>
                        </p>
                        {(apt.citizenNumber || apt.ticketNumber || apt.ticket) && (
                          <p className="text-blue-600 font-bold text-sm">
                            <Hash size={14} className="inline mr-1" />
                            Ticket N° {apt.citizenNumber || apt.ticketNumber || apt.ticket}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${getStatusColor(apt.status)}`}>
                      {getStatusLabel(apt.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ACTIVITY */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl border border-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800">Activité récente</h3>
              <p className="text-slate-500">Historique des actions</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-3xl bg-gray-200 animate-pulse" />)}
            </div>
          ) : activity.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-5" />
              <h3 className="text-2xl font-bold text-slate-700 mb-2">Aucune activité</h3>
              <p className="text-gray-500">Vos activités apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
              {activity.slice(0, 8).map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-4 p-5 rounded-3xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-3 h-3 rounded-full mt-3 bg-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg text-slate-800 truncate">
                      {a.service || a.serviceName || "Service terminé"}
                    </p>
                    <p className="text-slate-500 mt-1">
                      {new Date(a.date || a.createdAt).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-emerald-500 mt-2" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ERROR TOAST */}
      {error && !loading && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl font-semibold">{error}</div>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-20 h-20 rounded-full border-4 border-white/20 border-t-blue-600 animate-spin shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default DashboardCitizen;