import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";

import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Ticket,
  Building2,
  Sparkles,
  ShieldCheck,
  BellRing,
} from "lucide-react";

import {
  getStatusColor,
  getStatusLabel,
} from "../../utils/helpers";

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/appointments";

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // FETCH APPOINTMENT
  // =========================
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`${API}/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        setAppointment(res.data);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.message ||
            "Impossible de charger le rendez-vous"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAppointment();
    }
  }, [id]);

  // =========================
  // STATUS CONFIG
  // =========================
  const statusConfig = useMemo(() => {
    const status = appointment?.status;

    switch (status) {
      case "confirmed":
        return {
          icon: CheckCircle2,
          color:
            "from-emerald-500 to-green-600",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-700",
        };

      case "pending":
        return {
          icon: AlertCircle,
          color:
            "from-orange-500 to-amber-500",
          bg: "bg-orange-50",
          border: "border-orange-200",
          text: "text-orange-700",
        };

      case "cancelled":
        return {
          icon: XCircle,
          color: "from-red-500 to-rose-600",
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-700",
        };

      default:
        return {
          icon: CheckCircle2,
          color:
            "from-blue-500 to-indigo-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
        };
    }
  }, [appointment]);

  // =========================
  // FORMAT DATE
  // =========================
  const formatDate = (date) => {
    if (!date) return "--";

    return new Date(date).toLocaleDateString(
      "fr-FR",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-[32px] shadow-2xl p-10 flex flex-col items-center gap-5">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600" />

          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-800">
              Chargement...
            </h2>

            <p className="text-slate-500 mt-2">
              Récupération des détails du rendez-vous
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================
  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-[32px] shadow-2xl p-10 text-center border border-red-100">
          <XCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />

          <h2 className="text-4xl font-black text-slate-800 mb-4">
            Erreur
          </h2>

          <p className="text-lg text-slate-600 mb-8">
            {error}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft size={20} />
            Retour
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-6 lg:p-8">
      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 lg:p-10 shadow-2xl mb-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/20">
              <Ticket className="w-10 h-10 text-white" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 text-sm font-semibold text-white mb-4">
                <Sparkles size={16} />
                Détails du rendez-vous
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                Rendez-vous #{appointment.id}
              </h1>

              <p className="text-blue-100 text-lg mt-3">
                Consultez toutes les informations liées à votre rendez-vous
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="group inline-flex items-center justify-center gap-3 bg-white text-blue-700 px-8 py-5 rounded-3xl font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300"
          >
            <ArrowLeft size={22} />
            Retour
          </button>
        </div>
      </div>

      {/* ========================= */}
      {/* MAIN GRID */}
      {/* ========================= */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* LEFT */}
        <div className="xl:col-span-2 space-y-8">
          {/* STATUS CARD */}
          <div
            className={`rounded-[32px] border ${statusConfig.border} ${statusConfig.bg} shadow-2xl overflow-hidden`}
          >
            <div
              className={`bg-gradient-to-r ${statusConfig.color} p-8 text-white`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                    <StatusIcon className="w-10 h-10" />
                  </div>

                  <div>
                    <p className="text-white/80 font-semibold mb-2">
                      Statut du rendez-vous
                    </p>

                    <h2 className="text-4xl font-black">
                      {getStatusLabel(
                        appointment.status
                      )}
                    </h2>
                  </div>
                </div>

                <div
                  className={`px-6 py-3 rounded-2xl text-lg font-black bg-white text-slate-800 shadow-xl`}
                >
                  Ticket #
                  {appointment.ticketNumber ||
                    appointment.ticket ||
                    appointment.id}
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard
                  icon={Calendar}
                  title="Date"
                  value={formatDate(
                    appointment.date ||
                      appointment.startDateTime
                  )}
                />

                <InfoCard
                  icon={Clock}
                  title="Heure"
                  value={
                    appointment.time ||
                    appointment.startDateTime
                      ?.split("T")[1]
                      ?.slice(0, 5) ||
                    "--:--"
                  }
                />

                <InfoCard
                  icon={MapPin}
                  title="Lieu"
                  value={
                    appointment.location ||
                    "Agence municipale"
                  }
                />
                <InfoCard
                icon={Building2}
                title="Service"
                value={appointment.department?.name || "Service municipal"}

                />
              </div>
            </div>
          </div>

          {/* DETAILS */}
          <div className="bg-white rounded-[32px] shadow-2xl p-8 border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                <FileText className="w-7 h-7 text-indigo-600" />
              </div>

              <div>
                <h2 className="text-3xl font-black text-slate-800">
                  Informations complémentaires
                </h2>

                <p className="text-slate-500">
                  Détails associés au rendez-vous
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <DetailRow
                label="Description"
                value={
                  appointment.notes ||
                  "Aucune description"
                }
              />

              <DetailRow
                label="Date de création"
                value={formatDate(
                  appointment.createdAt
                )}
              />

              <DetailRow
                label="Dernière mise à jour"
                value={formatDate(
                  appointment.updatedAt
                )}
              />

              <DetailRow
                label="Référence"
                value={
                  appointment.reference ||
                  appointment.ticketNumber ||
                  `RDV-${appointment.id}`
                }
              />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-8">
          {/* CITIZEN CARD */}
    
          {/* ALERT CARD */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 shadow-2xl text-white">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

            <div className="relative">
              <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center mb-6">
                <BellRing className="w-8 h-8" />
              </div>

              <h3 className="text-3xl font-black mb-4">
                Notification
              </h3>

              <p className="text-blue-100 leading-relaxed text-lg">
                Vous recevrez des mises à jour concernant votre rendez-vous en temps réel.
              </p>

              <div className="mt-8 flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl p-4">
                <ShieldCheck className="w-6 h-6 text-emerald-300" />

                <span className="font-semibold">
                  Rendez-vous sécurisé
                </span>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="bg-white rounded-[32px] shadow-2xl p-8 border border-gray-100">
            <h3 className="text-2xl font-black text-slate-800 mb-6">
              Actions rapides
            </h3>

            <div className="space-y-4">
              <Link
                to="/citizen/appointments"
                className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <Calendar className="w-6 h-6 text-blue-600" />

                  <span className="font-bold text-slate-800">
                    Tous mes RDV
                  </span>
                </div>

                <ArrowLeft className="rotate-180 text-slate-400" />
              </Link>

              <Link
                to="/citizen/book"
                className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />

                  <span className="font-bold text-slate-800">
                    Nouveau rendez-vous
                  </span>
                </div>

                <ArrowLeft className="rotate-180 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================
// INFO CARD
// =========================
const InfoCard = ({
  icon: Icon,
  title,
  value,
}) => {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Icon className="w-6 h-6 text-slate-700" />
        </div>

        <span className="text-slate-500 font-semibold">
          {title}
        </span>
      </div>

      <p className="text-xl font-black text-slate-800 break-words">
        {value}
      </p>
    </div>
  );
};

// =========================
// DETAIL ROW
// =========================
const DetailRow = ({ label, value }) => {
  return (
    <div className="flex flex-col gap-2 pb-5 border-b border-gray-100 last:border-none">
      <span className="text-slate-500 font-semibold">
        {label}
      </span>

      <span className="text-lg font-bold text-slate-800 break-words">
        {value || "--"}
      </span>
    </div>
  );
};

// =========================
// SMALL INFO
// =========================
const SmallInfo = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-gray-100">
      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-md">
        <Icon className="w-5 h-5 text-slate-700" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-500 mb-1">
          {label}
        </p>

        <p className="font-bold text-slate-800 break-words">
          {value}
        </p>
      </div>
    </div>
  );
};

export default AppointmentDetails;