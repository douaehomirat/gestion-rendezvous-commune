import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import {
  Users,
  UserCheck,
  Calendar,
  BarChart3,
  FileText,
  Settings,
  Clock3,
} from "lucide-react";

import StatCard from "../../components/StatCard";
import Badge from "../../components/Badge";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DashboardAdmin = () => {
  const [stats, setStats] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, apptRes, serviceRes] = await Promise.all([
          axios.get("https://gestion-rendezvous-commune-production-b126.up.railway.app/api/admin/dashboard/stats"),
          axios.get("https://gestion-rendezvous-commune-production-b126.up.railway.app/api/appointments/recent"),
          axios.get("https://gestion-rendezvous-commune-production-b126.up.railway.app/api/admin/dashboard/services"),
        ]);

        setStats(statsRes.data || {});

        // ================= SORT RECENT FIRST =================
        const sortedAppointments = (apptRes.data || [])
          .slice()
          .sort(
            (a, b) =>
              new Date(b.startDateTime) -
              new Date(a.startDateTime)
          );

        setAppointments(sortedAppointments);

        // ================= CHART DATA =================
        const data = serviceRes.data || {};

        setServiceData({
          labels: Object.keys(data),
          datasets: [
            {
              label: "Rendez-vous",
              data: Object.values(data),
              backgroundColor: [
                "rgba(37, 99, 235, 0.8)",
                "rgba(16, 185, 129, 0.8)",
                "rgba(245, 158, 11, 0.8)",
                "rgba(239, 68, 68, 0.8)",
                "rgba(139, 92, 246, 0.8)",
              ],
              borderRadius: 12,
              borderSkipped: false,
            },
          ],
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

          <p className="text-gray-500 text-lg font-medium">
            Chargement du dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ================= CHART OPTIONS =================
  const chartOpts = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },
      },

      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-8">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Dashboard Admin
          </h1>

          <p className="text-gray-500 mt-1">
            Gestion des rendez-vous et statistiques
          </p>
        </div>

        <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <Clock3 className="text-blue-600" size={20} />

          <span className="text-sm font-medium text-gray-600">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Citoyens"
          value={stats.citizens || 0}
          icon={Users}
          color="primary"
        />

        <StatCard
          title="Agents"
          value={stats.agents || 0}
          icon={UserCheck}
          color="emerald"
        />

        <StatCard
          title="RDV Aujourd'hui"
          value={stats.todayAppointments || 0}
          icon={Calendar}
          color="amber"
        />
      </div>

      {/* ================= CHART ================= */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
            <BarChart3 className="text-blue-600" size={24} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Rendez-vous par service
            </h2>

            <p className="text-sm text-gray-500">
              Statistiques des rendez-vous
            </p>
          </div>
        </div>

        {serviceData?.labels?.length > 0 ? (
          <Bar data={serviceData} options={chartOpts} />
        ) : (
          <div className="text-center text-gray-400 py-10">
            Aucune donnée disponible
          </div>
        )}
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Rendez-vous récents
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Les rendez-vous les plus récents apparaissent en premier
            </p>
          </div>

          <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
            {appointments.length} rendez-vous
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">
                  Citoyen
                </th>

                <th className="px-6 py-4 font-semibold">
                  Service
                </th>

                <th className="px-6 py-4 font-semibold">
                  Date
                </th>

                <th className="px-6 py-4 font-semibold">
                  Heure
                </th>

                <th className="px-6 py-4 font-semibold">
                  Statut
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {appointments.length > 0 ? (
                appointments.map((apt, index) => (
                  <tr
                    key={apt.id || index}
                    className="hover:bg-blue-50/40 transition duration-200"
                  >
                    {/* CITIZEN */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {(
                            apt.citizenName ||
                            apt.citizen?.name ||
                            "N"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-semibold text-gray-800">
                            {apt.citizenName ||
                              apt.citizen?.name ||
                              "N/A"}
                          </p>

                          <p className="text-xs text-gray-400">
                            Citoyen
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* SERVICE */}
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                        {apt.service?.name ||
                          apt.department?.name ||
                          "N/A"}
                      </span>
                    </td>

                    {/* DATE */}
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {apt.startDateTime
                        ? new Date(
                            apt.startDateTime
                          ).toLocaleDateString("fr-FR")
                        : "-"}
                    </td>

                    {/* TIME */}
                    <td className="px-6 py-4 text-gray-600">
                      {apt.startDateTime
                        ? new Date(
                            apt.startDateTime
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          apt.status === "confirmed"
                            ? "success"
                            : apt.status === "pending"
                            ? "info"
                            : "danger"
                        }
                      >
                        {apt.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-10 text-gray-400"
                  >
                    Aucun rendez-vous trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= QUICK ACTIONS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AGENTS */}
        <Link to="/admin/agents">
          <div className="group bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Gestion
                </p>

                <h3 className="text-lg font-bold text-gray-800 mt-1">
                  Gérer agents
                </h3>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition">
                <UserCheck size={24} />
              </div>
            </div>
          </div>
        </Link>

        {/* REPORTS */}
        <Link to="/admin/reports">
          <div className="group bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Analyse
                </p>

                <h3 className="text-lg font-bold text-gray-800 mt-1">
                  Rapports
                </h3>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition">
                <FileText size={24} />
              </div>
            </div>
          </div>
        </Link>

        {/* SETTINGS */}
        <Link to="/admin/settings">
          <div className="group bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Configuration
                </p>

                <h3 className="text-lg font-bold text-gray-800 mt-1">
                  Paramètres
                </h3>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition">
                <Settings size={24} />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DashboardAdmin;