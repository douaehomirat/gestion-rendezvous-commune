import { useState, useEffect } from "react";
import axios from "axios";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  Users,
  User,
} from "lucide-react";

import Modal from "../../components/Modal";
import StatCard from "../../components/StatCard";

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/departments";
const AGENTS_API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/users/agents";

// ✅ FIX IMPORTANT : pas /uploads ici
const FILE_BASE_URL = "https://gestion-rendezvous-commune-production-b126.up.railway.app/";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [agents, setAgents] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [selectedDepId, setSelectedDepId] = useState("");
  const [file, setFile] = useState(null);

  const [notify, setNotify] = useState({
    open: false,
    msg: "",
    type: "success",
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    phone: "",
    headAgentId: "",
    active: true,
  });

  const safeArray = (d) => (Array.isArray(d) ? d : []);

  useEffect(() => {
    fetchDepartments();
    fetchAgents();
  }, []);

  // ================= NOTIFY =================
  const showNotify = (msg, type = "success") => {
    setNotify({ open: true, msg, type });
    setTimeout(() => {
      setNotify({ open: false, msg: "", type: "success" });
    }, 2500);
  };

  // ================= FETCH =================
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(API);
      setDepartments(safeArray(res.data));
    } catch {
      setDepartments([]);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await axios.get(AGENTS_API);
      setAgents(safeArray(res.data));
    } catch {
      setAgents([]);
    }
  };

  // ================= RESET =================
  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      phone: "",
      headAgentId: "",
      active: true,
    });
    setSelectedDepId("");
    setFile(null);
  };

  // ================= CREATE =================
  const addDepartment = async () => {
    try {
      const exists = departments.some(
        (d) =>
          d.name?.toLowerCase().trim() === form.name.toLowerCase().trim()
      );

      if (exists) {
        showNotify("Ce service existe déjà ❌", "error");
        return;
      }

      const data = new FormData();
      data.append("name", form.name);
      data.append("description", form.description);
      data.append("phone", form.phone);
      data.append("active", String(form.active));

      if (form.headAgentId) data.append("headAgentId", form.headAgentId);
      if (file) data.append("file", file);

      await axios.post(API, data);

      fetchDepartments();
      resetForm();
      setShowModal(false);

      showNotify("Service ajouté avec succès ✅");
    } catch {
      showNotify("Erreur lors de l'ajout ❌", "error");
    }
  };

  // ================= UPDATE =================
  const updateDepartment = async () => {
    try {
      const exists = departments.some(
        (d) =>
          d.id !== editing &&
          d.name?.toLowerCase().trim() === form.name.toLowerCase().trim()
      );

      if (exists) {
        showNotify("Nom déjà utilisé ❌", "error");
        return;
      }

      const data = new FormData();
      data.append("name", form.name);
      data.append("description", form.description);
      data.append("phone", form.phone);
      data.append("active", String(form.active));

      if (form.headAgentId) data.append("headAgentId", form.headAgentId);
      if (file) data.append("file", file);

      await axios.put(`${API}/${editing}`, data);

      fetchDepartments();
      setEditing(null);
      resetForm();
      setShowModal(false);

      showNotify("Service modifié ✏️");
    } catch {
      showNotify("Erreur modification ❌", "error");
    }
  };

  // ================= DELETE =================
  const deleteDepartment = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      fetchDepartments();
      showNotify("Service supprimé 🗑️");
    } catch {
      showNotify("Erreur suppression ❌", "error");
    }
  };

  // ================= TOGGLE =================
  const toggleActive = async (id) => {
    try {
      await axios.put(`${API}/${id}/toggle`);
      fetchDepartments();
      fetchAgents();
      showNotify("Statut mis à jour 🔄");
    } catch {
      showNotify("Erreur toggle ❌", "error");
    }
  };

  const safeDepartments = safeArray(departments);

  // ✅ FIX: only selectedDepId
  const currentDepId = selectedDepId;

  const filteredAgents = safeArray(agents).filter(
    (a) =>
      currentDepId &&
      a.departement?.id?.toString() === currentDepId?.toString()
  );

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">

      {/* NOTIFY */}
      {notify.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className={`w-[320px] p-5 rounded-2xl bg-white text-center border-l-8 shadow-xl ${
              notify.type === "success"
                ? "border-green-500"
                : "border-red-500"
            }`}
          >
            <p className="font-bold mb-2">
              {notify.type === "success" ? "Succès" : "Erreur"}
            </p>
            <p className="text-gray-600">{notify.msg}</p>
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Total services"
          value={safeDepartments.length}
          icon={Building2}
        />
        <StatCard
          title="Actifs"
          value={safeDepartments.filter((d) => d.active).length}
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Agents"
          value={safeArray(agents).length}
          icon={Users}
        />
      </div>

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">
          Services Municipaux
        </h2>

        <button
          onClick={() => {
            resetForm();
            setEditing(null);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus size={18} />
          Ajouter
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

        {safeDepartments.map((d) => {
          const teamSize = agents.filter(
            (a) => a.departement?.id === d.id
          ).length;

          const headAgent = agents.find(
            (a) => a.id === d.headAgent?.id
          );

          return (
            <div
              key={d.id}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition"
            >

              <div className="flex justify-between items-center">
                <Building2 className="text-gray-600" />

                <button onClick={() => toggleActive(d.id)}>
                  {d.active ? (
                    <ToggleRight className="text-green-600" />
                  ) : (
                    <ToggleLeft className="text-gray-400" />
                  )}
                </button>
              </div>

              <h3 className="mt-3 font-bold">{d.name}</h3>
              <p className="text-sm text-gray-500">{d.description}</p>

              <p className="text-xs mt-2">📞 {d.phone}</p>

              <p className="text-xs mt-2 flex items-center gap-1">
                <User size={12} />
                {headAgent ? headAgent.name : "Non assigné"}
              </p>

              <p className="text-xs mt-1 font-semibold">
                👥 {teamSize} agents
              </p>

              {/* DOCUMENT FIX */}
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-700">
                  📁 Document
                </p>

                {d.documentUrl ? (
                  <a
                    href={d.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    📄 Voir le document
                  </a>
                ) : (
                  <p className="text-xs text-gray-400">
                    Aucun document
                  </p>
                )}
              </div>

              <span
                className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                  d.active
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {d.active ? "Actif" : "Inactif"}
              </span>

              <div className="flex gap-3 mt-4 border-t pt-3">
                <button
                  onClick={() => {
                    setForm({
                      name: d.name,
                      description: d.description,
                      phone: d.phone,
                      headAgentId: d.headAgent?.id || "",
                      active: d.active,
                    });

                    setSelectedDepId(d.id);
                    setEditing(d.id);
                    setShowModal(true);
                  }}
                >
                  <Edit size={16} />
                </button>

                <button onClick={() => deleteDepartment(d.id)}>
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {showModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowModal(false)}
          title={editing ? "Modifier service" : "Ajouter service"}
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

            <textarea
              className="input-field"
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
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
              type="file"
              className="input-field"
              onChange={(e) => setFile(e.target.files[0])}
            />

            <select
              className="input-field"
              value={form.headAgentId}
              onChange={(e) =>
                setForm({ ...form, headAgentId: e.target.value })
              }
            >
              <option value="">Choisir agent responsable</option>
              {filteredAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                className="flex-1 bg-gray-200 rounded-xl py-2"
                onClick={() => setShowModal(false)}
              >
                Annuler
              </button>

              <button
                className="flex-1 bg-blue-600 text-white rounded-xl py-2"
                onClick={editing ? updateDepartment : addDepartment}
              >
                {editing ? "Modifier" : "Ajouter"}
              </button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};

export default Departments;