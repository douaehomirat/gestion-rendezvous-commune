import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Send, List } from "lucide-react";

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api";

export default function CreateReclamation() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [appointmentId, setAppointmentId] = useState("");
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [myReclamations, setMyReclamations] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  // ================= LOAD APPOINTMENTS =================
  useEffect(() => {
    if (!userId) return;

    axios
      .get(`${API}/appointments/citizen/${userId}`)
      .then((res) => setAppointments(res.data || []))
      .catch(() => {
        Swal.fire("Erreur", "Impossible de charger les rendez-vous", "error");
      });
  }, [userId]);

  // ================= CREATE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subject || !message || !appointmentId) {
      return Swal.fire("Erreur", "Tous les champs sont obligatoires", "warning");
    }

    setLoading(true);

    try {
      await axios.post(`${API}/reclamations`, {
        subject,
        message,
        user: { id: userId },
        appointment: { id: appointmentId },
      });

      Swal.fire("Succès", "Réclamation envoyée", "success");
      resetForm();
    } catch {
      Swal.fire("Erreur", "Échec de l'envoi", "error");
    } finally {
      setLoading(false);
    }
  };

  // ================= UPDATE =================
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`${API}/reclamations/${editId}`, {
        subject,
        message,
        user: { id: userId },
        appointment: { id: appointmentId },
      });

      Swal.fire("Succès", "Réclamation modifiée", "success");
      resetForm();
      loadMyReclamations();
    } catch {
      Swal.fire("Erreur", "Modification échouée", "error");
    }
  };

  const resetForm = () => {
    setSubject("");
    setMessage("");
    setAppointmentId("");
    setIsEditing(false);
    setEditId(null);
  };

  // ================= LOAD RECLAMATIONS =================
  const loadMyReclamations = () => {
    axios
      .get(`${API}/reclamations/user/${userId}`)
      .then((res) => setMyReclamations(res.data || []))
      .catch(() => {
        Swal.fire("Erreur", "Impossible de charger vos réclamations", "error");
      });
  };

  const openMyModal = () => {
    loadMyReclamations();
    setOpenModal(true);
  };

  // ================= DELETE =================
  const deleteReclamation = (id) => {
    Swal.fire({
      title: "Supprimer ?",
      showCancelButton: true,
      confirmButtonText: "Oui",
    }).then((res) => {
      if (res.isConfirmed) {
        axios.delete(`${API}/reclamations/${id}`).then(() => {
          loadMyReclamations();
        });
      }
    });
  };

  // ================= EDIT =================
  const openEditForm = (r) => {
    setSubject(r.subject);
    setMessage(r.message);
    setAppointmentId(r.appointment?.id);
    setEditId(r.id);
    setIsEditing(true);
    setOpenModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-6">

      {/* CARD */}
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Réclamations
          </h2>

          <button
            onClick={openMyModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
          >
            <List size={18} />
            Mes réclamations
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={isEditing ? handleUpdate : handleSubmit}
          className="space-y-4"
        >

          <input
            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none"
            placeholder="Sujet"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <textarea
            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none"
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <select
            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none"
            value={appointmentId}
            onChange={(e) => setAppointmentId(e.target.value)}
          >
            <option value="">Choisir un rendez-vous</option>

            {appointments.map((a) => {
              const date = a.startDateTime
                ? new Date(a.startDateTime).toLocaleString("fr-FR")
                : "Date inconnue";

              return (
                <option key={a.id} value={a.id}>
                  {a.ticket || `RDV #${a.id}`} - {date}
                </option>
              );
            })}
          </select>

          <button
            disabled={loading && !isEditing}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition"
          >
            <Send size={18} />
            {isEditing
              ? "Modifier"
              : loading
              ? "Envoi..."
              : "Envoyer"}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="w-full bg-gray-400 text-white p-3 rounded-xl"
            >
              Annuler modification
            </button>
          )}
        </form>
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">

          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl">

            {/* HEADER */}
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-bold">Mes réclamations</h3>
              <button onClick={() => setOpenModal(false)}>✕</button>
            </div>

            {/* LIST */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">

              {myReclamations.length === 0 ? (
                <p className="text-center text-gray-500">
                  Aucune réclamation
                </p>
              ) : (
                myReclamations.map((r) => (
                  <div
                    key={r.id}
                    className="border rounded-xl p-4 bg-gray-50 hover:shadow-md transition"
                  >

                    <div className="flex justify-between">
                      <strong>{r.subject}</strong>
                      <span className="text-blue-600 text-sm">
                        {r.status}
                      </span>
                    </div>

                    <p className="text-gray-600 mt-1">{r.message}</p>

                    <div className="flex gap-2 mt-3">

                      <button
                        onClick={() => openEditForm(r)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-lg"
                      >
                        Modifier
                      </button>

                      <button
                        onClick={() => deleteReclamation(r.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg"
                      >
                        Supprimer
                      </button>

                    </div>

                  </div>
                ))
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}