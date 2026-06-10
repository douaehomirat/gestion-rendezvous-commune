import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Filter
} from 'lucide-react';

import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import {
  formatDate,
  getStatusColor,
  getStatusLabel
} from '../../utils/helpers';

import { generateHistoryPDF } from '../../utils/pdfGenerator';

const API_APPOINTMENTS = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/appointments";
const API_DEPARTMENTS = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/departments";

const RequestsHistory = () => {

  const user = JSON.parse(localStorage.getItem('user'));
  const citizenId = user?.id;

  const [history, setHistory] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ======================
  // LOAD HISTORY
  // ======================
  useEffect(() => {
    if (citizenId) fetchHistory();
    fetchDepartments();
  }, [citizenId]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_APPOINTMENTS}/citizen/${citizenId}`);
      setHistory(res.data);
    } catch (err) {
      console.error("Erreur history", err);
    }
  };

  // ======================
  // LOAD DEPARTMENTS (ADMIN DB)
  // ======================
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(API_DEPARTMENTS);
      setDepartments(res.data);
    } catch (err) {
      console.error("Erreur departments", err);
    }
  };

  // ======================
  // FILTER
  // ======================
  const filtered = history.filter((h) => {
    if (serviceFilter && h.serviceName !== serviceFilter) return false;
    if (statusFilter && h.status !== statusFilter) return false;
    return true;
  });

  const getProgress = (status) => {
    if (['completed', 'confirmed'].includes(status)) return 3;
    if (status === 'pending') return 2;
    if (status === 'cancelled') return -1;
    return 1;
  };

  return (
    <div className="space-y-6">

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total" value={history.length} icon={FileText} color="primary" />
        <StatCard title="Acceptées" value={history.filter(h => h.status === 'completed').length} icon={CheckCircle} color="emerald" />
        <StatCard title="En cours" value={history.filter(h => h.status === 'pending').length} icon={Clock} color="amber" />
        <StatCard title="Refusées" value={history.filter(h => h.status === 'cancelled').length} icon={XCircle} color="red" />
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-4">

        {/* DEPARTMENTS FROM DB */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />

          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">Tous les départements</option>

            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* STATUS */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">Tous les statuts</option>
          <option value="completed">Terminé</option>
          <option value="pending">En attente</option>
          <option value="cancelled">Annulé</option>
        </select>

        {/* EXPORT PDF */}
        <button
          onClick={() =>
            generateHistoryPDF(
              { name: user?.name || 'Citoyen' },
              history.map((h) => ({
                service: h.serviceName,
                date: h.date,
                time: '',
                status: getStatusLabel(h.status)
              }))
            )
          }
          className="btn-secondary flex items-center gap-2 ml-auto"
        >
          <Download size={16} /> Exporter PDF
        </button>

      </div>

      {/* LIST */}
      <div className="space-y-3">

        {filtered.map((h) => {
          const progress = getProgress(h.status);

          return (
            <div key={h.id} className="card p-5">

              <div className="flex items-start justify-between">

                {/* LEFT */}
                <div className="flex items-start gap-3">

                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mt-0.5 ${
                    h.status === 'completed'
                      ? 'bg-emerald-50'
                      : h.status === 'cancelled'
                      ? 'bg-red-50'
                      : 'bg-primary-50'
                  }`}>

                    {h.status === 'completed' ? (
                      <CheckCircle size={20} className="text-emerald-600" />
                    ) : h.status === 'cancelled' ? (
                      <XCircle size={20} className="text-red-600" />
                    ) : (
                      <Clock size={20} className="text-primary-600" />
                    )}

                  </div>

                  <div>

                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 text-sm">
                        {h.serviceName}
                      </p>

                      <Badge variant="primary">
                        Service
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-500">
                      {h.notes}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(h.date)}
                    </p>

                  </div>

                </div>

                {/* STATUS */}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(h.status)}`}>
                  {getStatusLabel(h.status)}
                </span>

              </div>

              {/* PROGRESS */}
              <div className="mt-3 flex items-center gap-2">

                {['Soumis', 'En cours', 'Traité'].map((step, i) => (
                  <div key={step} className="flex items-center flex-1">

                    <div
                      className={`h-1.5 rounded-full flex-1 ${
                        i < progress
                          ? (progress === -1 && i === 2
                              ? 'bg-red-500'
                              : 'bg-primary-600')
                          : 'bg-gray-200'
                      }`}
                    />

                    {i < 2 && (
                      <span className="text-[10px] text-gray-400 mx-1">
                        {step}
                      </span>
                    )}

                  </div>
                ))}

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
};

export default RequestsHistory;