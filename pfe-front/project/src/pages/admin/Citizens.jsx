import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Users,
  UserPlus,
  Eye,
  CreditCard as Edit,
  Trash2,
  UserCheck,
  CalendarDays
} from 'lucide-react';

import SearchBar from '../../components/SearchBar';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import StatCard from '../../components/StatCard';

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/users/citizens";

const Citizens = () => {
  const [citizens, setCitizens] = useState([]);
  const [search, setSearch] = useState('');
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);

  // ================= LOAD DATA =================
  useEffect(() => {
    axios.get(API)
      .then(res => setCitizens(res.data))
      .catch(err => console.error("ERROR:", err));
  }, []);

  // ================= TODAY CITIZENS =================
  const todayCitizens = useMemo(() => {
    const today = new Date().toDateString();
    return citizens.filter(c =>
      c.createdAt && new Date(c.createdAt).toDateString() === today
    );
  }, [citizens]);

  // ================= FILTER =================
  const filtered = useMemo(() => {
    return citizens.filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [citizens, search]);

  // ================= TABLE =================
  const columns = [
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Téléphone' },
    { key: 'city', label: 'Ville' },

    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">

          <button
            onClick={() => {
              setSelected(row);
              setShowView(true);
            }}
            className="p-2 rounded-lg hover:bg-blue-50 transition"
          >
            <Eye size={16} className="text-blue-600" />
          </button>


          <button className="p-2 rounded-lg hover:bg-red-50 transition">
            <Trash2 size={16} className="text-red-500" />
          </button>

        </div>
      )
    }
  ];

  // ================= UI =================
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

        <StatCard
          title="Total citoyens"
          value={citizens.length}
          icon={Users}
          className="hover:scale-[1.03] transition"
        />

        <StatCard
          title="Actifs"
          value={citizens.length}
          icon={UserCheck}
          className="hover:scale-[1.03] transition"
        />

        <StatCard
          title="Inscrits aujourd'hui"
          value={todayCitizens.length}
          icon={UserPlus}
          className="hover:scale-[1.03] transition"
        />

        <StatCard
          title="Date système"
          value={new Date().toLocaleDateString()}
          icon={CalendarDays}
          className="hover:scale-[1.03] transition"
        />

      </div>

      {/* ================= SEARCH BAR ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

        <SearchBar
          placeholder="Rechercher un citoyen..."
          onSearch={setSearch}
          className="w-full md:w-96"
        />

        <div className="text-sm text-gray-500">
          Résultats: <span className="font-semibold">{filtered.length}</span>
        </div>

      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-xl shadow-sm border">
        <Table columns={columns} data={filtered} />
      </div>

      {/* ================= VIEW MODAL ================= */}
      <Modal
        isOpen={showView}
        onClose={() => setShowView(false)}
        title="Détails du citoyen"
      >
        {selected && (
          <div className="space-y-3 text-gray-700">

            <div className="p-3 bg-gray-50 rounded-lg">
              <p><b>Nom:</b> {selected.name}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p><b>Email:</b> {selected.email}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p><b>Téléphone:</b> {selected.phone}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p><b>Ville:</b> {selected.city}</p>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
};

export default Citizens;