import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

import {
  Calendar,
  Download,
  Eye,
  X,
  CreditCard as Edit,
  FileText
} from 'lucide-react';

import Modal from '../../components/Modal';
import {
  getStatusColor,
  getStatusLabel
} from '../../utils/helpers';

import { generateAppointmentPDF } from '../../utils/pdfGenerator';

const API_URL = 'https://gestion-rendezvous-commune-production-b126.up.railway.app/api/appointments';
const API = 'https://gestion-rendezvous-commune-production-b126.up.railway.app/api';

const MyAppointments = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const citizenId = user?.id;

  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [filter, setFilter] = useState('all');

  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);

  const [isEditOpen, setIsEditOpen] = useState(false);

  const [editData, setEditData] = useState({
    id: null,
    date: '',
    time: '',
    notes: ''
  });

  // ================= LOAD =================
  useEffect(() => {
    if (citizenId) {
      loadData();
    }
  }, [citizenId]);

  // ✅ charger departments AVANT appointments
  const loadData = async () => {
    try {
      const depRes = await axios.get(`${API}/departments`);
      const deps = depRes.data || [];

      setDepartments(deps);

      await fetchAppointments(deps);
    } catch (error) {
      console.error(error);
      setDepartments([]);
      setAppointments([]);
    }
  };

  // ================= APPOINTMENTS =================
  const fetchAppointments = async (deps = departments) => {
    try {
      const res = await axios.get(`${API_URL}/citizen/${citizenId}`);

      const data = (res.data || []).map((a) => {
        const start = a.startDateTime || '';
        const dep = deps.find(d => d.id === a.departmentId);

        return {
          ...a,

          serviceName:
            a.serviceName ||
            a.departmentName ||
            a.department?.name ||
            'Service',

          date: a.date || (start ? start.split('T')[0] : ''),
          time: a.time || (start ? start.split('T')[1]?.slice(0, 5) : ''),

          ticket: a.ticket || '',
          agentName: a.agentName || 'Agent',
          citizenName: a.citizenName || user?.name || 'Citoyen',

          // ✅ FIX PDF
          departmentDocs: dep?.documentUrl
            ? `http://localhost:8080/${dep.documentUrl}`
            : null
        };
      });

      setAppointments(data);
    } catch (error) {
      console.error(error);
      setAppointments([]);
    }
  };

  // ================= CANCEL =================
  const handleCancel = async (id) => {
    const result = await Swal.fire({
      title: 'Annuler le rendez-vous ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non'
    });

    if (!result.isConfirmed) return;

    try {
      await axios.put(`${API_URL}/${id}/cancel`);
      Swal.fire('Succès', 'Rendez-vous annulé', 'success');
      fetchAppointments(departments);
    } catch {
      Swal.fire('Erreur', 'Serveur indisponible', 'error');
    }
  };

  // ================= EDIT =================
  const handleEditClick = (apt) => {
    setEditData({
      id: apt.id,
      date: apt.date || '',
      time: apt.time || '',
      notes: apt.notes || ''
    });

    setIsEditOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditData((prev) => ({
      ...prev,
      [name]: value || ''
    }));
  };

  const handleUpdate = async () => {
    try {
      const startDateTime =
        editData.date && editData.time
          ? `${editData.date}T${editData.time}:00`
          : null;

      await axios.put(`${API_URL}/${editData.id}`, {
        id: editData.id,
        date: editData.date,
        time: editData.time,
        notes: editData.notes,
        startDateTime
      });

      Swal.fire('Succès', 'Rendez-vous modifié', 'success');

      setIsEditOpen(false);
      fetchAppointments(departments);
    } catch {
      Swal.fire('Erreur', 'Modification impossible', 'error');
    }
  };

  // ================= FILTER =================
  const filtered = appointments.filter((a) => {
    if (filter === 'upcoming')
      return ['confirmed', 'pending'].includes(a.status);

    if (filter === 'past')
      return ['completed', 'cancelled'].includes(a.status);

    if (filter === 'cancelled')
      return a.status === 'cancelled';

    return true;
  });

  const tabs = [
    { key: 'all', label: 'Tous' },
    { key: 'upcoming', label: 'À venir' },
    { key: 'past', label: 'Passés' },
    { key: 'cancelled', label: 'Annulés' }
  ];

  return (
    <div className="space-y-6">

      {/* TABS */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === t.key
                ? 'bg-primary-600 text-white'
                : 'bg-white border'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {filtered.map((apt) => (
          <div
            key={apt.id}
            className="card p-5 flex justify-between items-center"
          >
            <div className="flex items-center gap-4">

              <div className="w-12 h-12 bg-primary-50 flex items-center justify-center rounded-xl">
                <Calendar size={20} className="text-primary-600" />
              </div>

              <div>
                <p className="font-semibold">{apt.serviceName}</p>

                <p className="text-sm text-gray-500">
                  {apt.date} - {apt.time}
                </p>

                <div className="text-xs text-gray-400 flex gap-2 mt-1">
                  <span>{apt.agentName}</span>
                  <span className="font-mono">{apt.ticket}</span>
                </div>

                {/* ✅ DOCUMENT BUTTON */}
                {apt.departmentDocs && (
                  <a
                    href={apt.departmentDocs}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition"
                  >
                    <FileText size={14} />
                    Documents à fournir
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">

              <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(apt.status)}`}>
                {getStatusLabel(apt.status)}
              </span>

              <button onClick={() => {
                setSelected(apt);
                setShowView(true);
              }}>
                <Eye size={16} />
              </button>

              <button onClick={() =>
                generateAppointmentPDF({
                  citizenName: apt.citizenName,
                  serviceName: apt.serviceName,
                  date: apt.date,
                  time: apt.time,
                  ticketNumber: apt.ticket,
                  status: apt.status,
                  agentName: apt.agentName || apt.agent?.name,
                  bureau: apt.bureau || apt.agent?.bureau
                })
              }>
                <Download size={16} />
              </button>

              {apt.status === 'pending' && (
                <button onClick={() => handleEditClick(apt)}>
                  <Edit size={16} />
                </button>
              )}

              {['pending', 'confirmed'].includes(apt.status) && (
                <button onClick={() => handleCancel(apt.id)}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* VIEW MODAL */}
      <Modal
        isOpen={showView}
        onClose={() => setShowView(false)}
        title="Détails du rendez-vous"
      >
        {selected && (
          <div className="space-y-2">

            <p><b>Service :</b> {selected.serviceName}</p>
            <p><b>Date :</b> {selected.date}</p>
            <p><b>Heure :</b> {selected.time}</p>
            <p><b>Ticket :</b> {selected.ticket}</p>
            <p><b>Statut :</b> {getStatusLabel(selected.status)}</p>

            {selected?.departmentDocs ? (
              <a
                href={selected.departmentDocs}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <FileText size={16} />
                Ouvrir les documents PDF
              </a>
            ) : (
              <p className="text-xs text-gray-400 mt-2">
                Aucun document disponible
              </p>
            )}

          </div>
        )}
      </Modal>

      {/* EDIT */}
      {isEditOpen && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title="Modifier rendez-vous"
        >
          <div className="space-y-3">

            <input
              type="date"
              name="date"
              value={editData.date}
              onChange={handleEditChange}
              className="w-full border p-2 rounded"
            />

            <input
              type="time"
              name="time"
              value={editData.time}
              onChange={handleEditChange}
              className="w-full border p-2 rounded"
            />

            <textarea
              name="notes"
              value={editData.notes}
              onChange={handleEditChange}
              rows="4"
              className="w-full border p-2 rounded"
              placeholder="Notes"
            />

            <button
              onClick={handleUpdate}
              className="w-full bg-blue-600 text-white p-2 rounded"
            >
              Sauvegarder
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyAppointments;