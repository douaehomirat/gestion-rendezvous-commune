import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { RefreshCcw, AlertCircle } from "lucide-react";

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api";

/**
 * 🎯 Backend ENUM SOURCE OF TRUTH:
 * EN_COURS | RESOLUE | REJETEE
 */

export default function AdminReclamations() {
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH DATA
  // =========================
  const fetchData = () => {
    setLoading(true);

    axios
      .get(`${API}/reclamations`)
      .then((res) => setReclamations(res.data || []))
      .catch(() => {
        Swal.fire("Erreur", "Impossible de charger les réclamations", "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =========================
  // UPDATE STATUS
  // =========================
  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API}/reclamations/${id}/status`, null, {
        params: { status },
      });

      Swal.fire("Succès", "Statut mis à jour", "success");
      fetchData();
    } catch (e) {
      Swal.fire("Erreur", "Échec de mise à jour", "error");
    }
  };

  // =========================
  // UI COLORS
  // =========================
  const getBadge = (status) => {
    switch (status) {
      case "EN_COURS":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "RESOLUE":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJETEE":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            Gestion des réclamations
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Administration & suivi des demandes citoyens
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {/* EMPTY */}
      {!loading && reclamations.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-20 text-gray-500">
          <AlertCircle className="w-12 h-12 mb-3 text-gray-300" />
          <p className="text-lg font-medium">Aucune réclamation trouvée</p>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="text-center text-gray-500 mt-10 animate-pulse">
          Chargement des réclamations...
        </div>
      )}

      {/* GRID */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

        {reclamations.map((r) => {
          const ticket =
            r?.appointment?.ticket ||
            r?.appointment?.ticketNumber ||
            "N/A";

          const userName = r?.user?.name || "Utilisateur inconnu";

          return (
            <div
              key={r.id}
              className="bg-white rounded-2xl shadow-sm border hover:shadow-lg transition p-5 flex flex-col justify-between"
            >

              {/* TITLE + STATUS */}
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  {r.subject}
                </h3>

                <span
                  className={`px-3 py-1 text-xs rounded-full border font-semibold ${getBadge(
                    r.status
                  )}`}
                >
                  {r.status}
                </span>
              </div>

              {/* MESSAGE */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {r.message}
              </p>

              {/* INFO */}
              <div className="text-xs text-gray-500 mb-4 space-y-1">
                <p>👤 {userName}</p>
                <p>🎫 Ticket: {ticket}</p>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap gap-2 mt-auto">

                <button
                  onClick={() => updateStatus(r.id, "RESOLUE")}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  Résolu
                </button>

                <button
                  onClick={() => updateStatus(r.id, "REJETEE")}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                >
                  Rejeté
                </button>

              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}