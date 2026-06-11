import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Users,
  UserPlus,
  Eye,
  Trash2,
  UserCheck,
  CalendarDays,
  MapPin,
  Mail,
  Phone,
  User,
} from "lucide-react";

import SearchBar from "../../components/SearchBar";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import StatCard from "../../components/StatCard";

const API =
  "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/users/citizens";

const Citizens = () => {
  const [citizens, setCitizens] = useState([]);
  const [search, setSearch] = useState("");
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);

  // ================= LOAD DATA =================
  useEffect(() => {
    loadCitizens();
  }, []);

  const loadCitizens = async () => {
    try {
      const res = await axios.get(API);
      setCitizens(res.data);
    } catch (error) {
      console.error("Erreur chargement :", error);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Voulez-vous vraiment supprimer ce citoyen ?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API}/${id}`);

      setCitizens((prev) =>
        prev.filter((citizen) => citizen.id !== id)
      );

      alert("Citoyen supprimé avec succès");
    } catch (error) {
      console.error("Erreur suppression :", error);
      alert("Impossible de supprimer le citoyen");
    }
  };

  // ================= TODAY CITIZENS =================
  const todayCitizens = useMemo(() => {
    const today = new Date().toDateString();

    return citizens.filter(
      (c) =>
        c.createdAt &&
        new Date(c.createdAt).toDateString() === today
    );
  }, [citizens]);

  // ================= FILTER =================
  const filtered = useMemo(() => {
    return citizens.filter(
      (c) =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase())
    );
  }, [citizens, search]);

  // ================= TABLE =================
  const columns = [
    {
      key: "name",
      label: "Nom",
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "phone",
      label: "Téléphone",
    },
    {
      key: "city",
      label: "Ville",
    },
    {
      key: "id",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => {
              setSelected(row);
              setShowView(true);
            }}
            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition"
            title="Voir détails"
          >
            <Eye size={18} className="text-blue-600" />
          </button>

          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition"
            title="Supprimer"
          >
            <Trash2 size={18} className="text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Gestion des citoyens
        </h1>
        <p className="text-gray-500">
          Consultation et gestion des citoyens inscrits.
        </p>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard
          title="Total citoyens"
          value={citizens.length}
          icon={Users}
        />

        <StatCard
          title="Citoyens actifs"
          value={citizens.length}
          icon={UserCheck}
        />

        <StatCard
          title="Inscrits aujourd'hui"
          value={todayCitizens.length}
          icon={UserPlus}
        />

        <StatCard
          title="Date système"
          value={new Date().toLocaleDateString("fr-FR")}
          icon={CalendarDays}
        />
      </div>

      {/* ================= SEARCH ================= */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
          <SearchBar
            placeholder="Rechercher par nom, email, téléphone ou ville..."
            onSearch={setSearch}
            className="w-full md:w-96"
          />

          <div className="text-gray-500">
            Résultats :
            <span className="font-bold text-blue-600 ml-2">
              {filtered.length}
            </span>
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table columns={columns} data={filtered} />
      </div>

      {/* ================= DETAILS MODAL ================= */}
      <Modal
        isOpen={showView}
        onClose={() => setShowView(false)}
        title="Informations du citoyen"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="text-blue-600" size={35} />
              </div>
            </div>

            <div className="grid gap-3">
              <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                <User className="text-blue-500" size={18} />
                <div>
                  <p className="text-xs text-gray-500">Nom complet</p>
                  <p className="font-semibold">{selected.name}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                <Mail className="text-green-500" size={18} />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-semibold">{selected.email}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                <Phone className="text-orange-500" size={18} />
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="font-semibold">{selected.phone}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                <MapPin className="text-red-500" size={18} />
                <div>
                  <p className="text-xs text-gray-500">Ville</p>
                  <p className="font-semibold">{selected.city}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                <MapPin className="text-purple-500" size={18} />
                <div>
                  <p className="text-xs text-gray-500">Adresse</p>
                  <p className="font-semibold">
                    {selected.address || "Non renseignée"}
                  </p>
                </div>
              </div>

              {selected.createdAt && (
                <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                  <CalendarDays
                    className="text-indigo-500"
                    size={18}
                  />
                  <div>
                    <p className="text-xs text-gray-500">
                      Date d'inscription
                    </p>
                    <p className="font-semibold">
                      {new Date(
                        selected.createdAt
                      ).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowView(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Citizens;