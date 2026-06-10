import { useEffect, useState } from "react";
import axios from "axios";

import { Filter } from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const Reports = () => {
  const [period, setPeriod] = useState("month");

  const [serviceData, setServiceData] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [monthData, setMonthData] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [services, status, months] = await Promise.all([
          axios.get("https://gestion-rendezvous-commune-production-b126.up.railway.app/api/reports/services"),
          axios.get("https://gestion-rendezvous-commune-production-b126.up.railway.app/api/reports/status"),
          axios.get("https://gestion-rendezvous-commune-production-b126.up.railway.app/api/reports/months"),
        ]);

        // SERVICES
        const safeServices = services.data || {};
        setServiceData({
          labels: Object.keys(safeServices),
          datasets: [
            {
              label: "Rendez-vous",
              data: Object.values(safeServices),
              backgroundColor: "rgba(37, 99, 235, 0.85)",
              borderRadius: 12,
              hoverBackgroundColor: "#1d4ed8",
            },
          ],
        });

        // STATUS
        const safeStatus = status.data || {};
        setStatusData({
          labels: Object.keys(safeStatus),
          datasets: [
            {
              data: Object.values(safeStatus),
              backgroundColor: [
                "#10b981",
                "#3b82f6",
                "#ef4444",
                "#8b5cf6",
                "#f59e0b",
              ],
              borderWidth: 0,
            },
          ],
        });

        // MONTHS
        const safeMonths = months.data || {};
        setMonthData({
          labels: Object.keys(safeMonths),
          datasets: [
            {
              label: "Rendez-vous",
              data: Object.values(safeMonths),
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59,130,246,0.08)",
              fill: true,
              tension: 0.4,
              pointRadius: 3,
            },
          ],
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Chargement des statistiques...
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#111827",
        padding: 10,
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: "#f3f4f6" } },
    },
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-2xl shadow-sm">

        <h2 className="text-lg font-semibold text-gray-800">
          Statistiques des rendez-vous
        </h2>

        <div className="flex items-center gap-2 mt-3 md:mt-0">
          <Filter size={18} className="text-gray-500" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded-lg px-3 py-1 text-sm"
          >
            <option value="month">Mois</option>
            <option value="year">Année</option>
          </select>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SERVICES */}
        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Rendez-vous par service
          </h3>

          <div className="h-[320px]">
            {serviceData && <Bar data={serviceData} options={chartOptions} />}
          </div>
        </div>

        {/* MONTH */}
        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Évolution mensuelle
          </h3>

          <div className="h-[320px]">
            {monthData && <Line data={monthData} options={chartOptions} />}
          </div>
        </div>

        {/* STATUS MINIMAL */}
        <div className="bg-white p-6 rounded-2xl shadow-sm lg:col-span-2">

          <h3 className="text-sm font-semibold text-gray-700 mb-6">
            Répartition par statut
          </h3>

          <div className="flex flex-col md:flex-row items-center justify-between gap-10">

            {/* DONUT */}
            <div className="w-[220px] h-[220px]">
              {statusData && (
                <Doughnut
                  data={statusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "78%",
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
              )}
            </div>

            {/* LEGEND */}
            <div className="w-full md:w-auto space-y-3 text-sm">

              {statusData?.labels?.map((label, i) => (
                <div key={i} className="flex items-center justify-between gap-6">

                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: statusData.datasets[0].backgroundColor[i],
                      }}
                    />
                    <span className="text-gray-600">{label}</span>
                  </div>

                  <span className="font-semibold text-gray-800">
                    {statusData.datasets[0].data[i]}
                  </span>

                </div>
              ))}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Reports;