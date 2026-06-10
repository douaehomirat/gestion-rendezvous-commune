import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  UserPlus,
  Eye,
  Trash2,
  UserCheck,
  Shield,
  Phone,
  Edit
} from 'lucide-react';

import SearchBar from '../../components/SearchBar';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import StatCard from '../../components/StatCard';

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/users/agents";
const DEP_API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/departments";

const Agents = () => {

  const [agents, setAgents] = useState([]);
  const [departements, setDepartements] = useState([]);

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState(false);

  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    bureau: '',
    status: 'active',
    departementId: '',
    role: 'AGENT'
  });

  const safeArray = (data) => Array.isArray(data) ? data : [];

  useEffect(() => {
    fetchAgents();
    fetchDepartements();
  }, []);

  // =========================
  // GET AGENTS
  // =========================
  const fetchAgents = async () => {
    try {
      const res = await axios.get(API);
      setAgents(safeArray(res.data));
    } catch (err) {
      console.error(err);
      setAgents([]);
    }
  };

  // =========================
  // GET DEPARTMENTS
  // =========================
  const fetchDepartements = async () => {
    try {
      const res = await axios.get(DEP_API);
      setDepartements(safeArray(res.data));
    } catch (err) {
      console.error(err);
      setDepartements([]);
    }
  };

  // =========================
  // ADD AGENT
  // =========================
  const addAgent = async () => {
    try {
      await axios.post(API, {
        ...form,
        departementId: Number(form.departementId)
      });

      fetchAgents();
      setShowAdd(false);

      setForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        bureau: '',
        status: 'active',
        departementId: '',
        role: 'AGENT'
      });

    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // DELETE
  // =========================
  const deleteAgent = async (id) => {
    try {
      await axios.delete(`https://gestion-rendezvous-commune-production-b126.up.railway.app/api/users/${id}`);
      fetchAgents();
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // SEARCH
  // =========================
  const filtered = agents.filter((a) =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  );

  // =========================
  // TABLE
  // =========================
  const columns = [
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Téléphone' },

    {
      key: 'departement',
      label: 'Département',
      render: (_, row) => row.departement?.name || '—'
    },

    {
      key: 'role',
      label: 'Role',
      render: (val) => (
        <Badge variant={val === 'ADMIN' ? 'danger' : 'success'}>
          {val}
        </Badge>
      )
    },

    {
      key: 'status',
      label: 'Statut',
      render: (val) => (
        <Badge variant={val === 'active' ? 'success' : 'danger'}>
          {val === 'active' ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },

    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">

          <button
            onClick={() => {
              setSelected(row);
              setShowView(true);
            }}
          >
            <Eye size={16} />
          </button>

          <button>
            <Edit size={16} />
          </button>

          <button onClick={() => deleteAgent(row.id)}>
            <Trash2 size={16} className="text-red-500" />
          </button>

        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total agents" value={agents.length} icon={Users} />
        <StatCard
          title="Actifs"
          value={agents.filter(a => a.status === 'active').length}
          icon={UserCheck}
        />
        <StatCard
          title="Inactifs"
          value={agents.filter(a => a.status !== 'active').length}
          icon={Shield}
        />
        <StatCard title="Contacts" value={agents.length} icon={Phone} />
      </div>

      {/* TOP */}
      <div className="flex justify-between items-center">
        <SearchBar
          placeholder="Rechercher agent..."
          onSearch={setSearch}
        />

        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary flex gap-2 items-center"
        >
          <UserPlus size={18} />
          Ajouter
        </button>
      </div>

      {/* TABLE */}
      <Table columns={columns} data={filtered} />

      {/* ADD */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Ajouter Agent"
      >
        <div className="space-y-3">

          <input
            className="input-field"
            placeholder="Nom"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />


          <input
            className="input-field"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            className="input-field"
            placeholder="Téléphone"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <input
            type="password"
            className="input-field"
            placeholder="Mot de passe"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          <input
            className="input-field"
            placeholder="Bureau"
            value={form.bureau}
            onChange={(e) =>
              setForm({ ...form, bureau: e.target.value })
            }
          />

          <select
            className="input-field"
            value={form.departementId}
            onChange={(e) =>
              setForm({
                ...form,
                departementId: e.target.value
              })
            }
          >
            <option value="">Choisir département</option>

            {departements.map(dep => (
              <option key={dep.id} value={dep.id}>
                {dep.name}
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
          >
            <option value="AGENT">AGENT</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <select
            className="input-field"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value })
            }
          >
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>

          <button
            onClick={addAgent}
            className="btn-primary w-full"
          >
            Ajouter
          </button>

        </div>
      </Modal>

      {/* VIEW */}
      <Modal
        isOpen={showView}
        onClose={() => setShowView(false)}
        title="Détails Agent"
      >
        {selected && (
          <div className="space-y-2 text-sm">

            <p><b>Nom:</b> {selected.name}</p>
            <p><b>Email:</b> {selected.email}</p>
            <p><b>Téléphone:</b> {selected.phone}</p>
            <p><b>Bureau:</b> {selected.bureau}</p>
            <p><b>Département:</b> {selected.departement?.name}</p>
            <p><b>Role:</b> {selected.role}</p>
            <p><b>Status:</b> {selected.status}</p>

          </div>
        )}
      </Modal>

    </div>
  );
};

export default Agents;