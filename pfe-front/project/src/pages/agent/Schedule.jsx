import { useState, useEffect } from 'react';
import axios from 'axios';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';

import { Calendar, Clock, BarChart3 } from 'lucide-react';
import Modal from '../../components/Modal';
import StatCard from '../../components/StatCard';

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/appointments";

// =========================
// STATUS COLORS + LABELS
// =========================
const statusColors = {
  confirmed: { color: '#059669', label: 'Confirme' },
  pending: { color: '#2563eb', label: 'En cours' },
  cancelled: { color: '#dc2626', label: 'Annulée' },
  postponed: { color: '#ea580c', label: 'in_progress' },
  completed: { color: '#7c3aed', label: 'Terminée' }
};

const Schedule = () => {

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // =========================
  // LOAD EVENTS (AGENT ONLY)
  // =========================
  useEffect(() => {

    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    const agentId = JSON.parse(storedUser)?.id;
    if (!agentId) return;

    axios.get(`${API}/calendar/agent/${agentId}`)
      .then(res => {

        console.log("CALENDAR DATA:", res.data);

        const formatted = res.data
          .filter(e => e.agent?.id === agentId)
          .map(e => ({

            id: e.id,

            title: `${e.ticket} - ${e.serviceName}`,

            start: new Date(e.startDateTime),
            end: new Date(e.endDateTime),

            
            backgroundColor: statusColors[e.status]?.color || '#ea580c',
            borderColor: statusColors[e.status]?.color || '#ea580c',

            // DATA MODAL
            extendedProps: {
              citizen: e.citizen?.name,
              citizenEmail: e.citizen?.email,
              service: e.serviceName,
              status: e.status,
              statusLabel: statusColors[e.status]?.label || e.status,
              ticket: e.ticket,
              agent: e.agent?.name,
              notes: e.notes
            }

          }));

        setEvents(formatted);
      })
      .catch(err => {
        console.error("Error loading calendar:", err);
      });

  }, []);

  // =========================
  // CLICK EVENT
  // =========================
  const handleEventClick = (info) => {
    setSelectedEvent({
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      ...info.event.extendedProps
    });

    setShowDetail(true);
  };

  // =========================
  // STATS
  // =========================
  const total = events.length;

  const confirmed = events.filter(
    e => e.extendedProps?.status === "confirmed"
  ).length;

  const pending = events.filter(
    e => e.extendedProps?.status === "pending"
  ).length;

  return (
    <div className="space-y-6">

      {/* =========================
          STATS
      ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total RDV" value={total} icon={Calendar} />
        <StatCard title="Confirmés" value={confirmed} icon={BarChart3} />
        <StatCard title="En cours" value={pending} icon={Clock} />
      </div>

      {/* =========================
          LEGEND
      ========================= */}
      <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg text-sm">

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: '#059669' }}></span>
          Confirmée
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: '#2563eb' }}></span>
          En cours
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: '#dc2626' }}></span>
          Annulée
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: '#ea580c' }}></span>
          in_progress
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: '#7c3aed' }}></span>
          Terminée
        </div>

      </div>

      {/* =========================
          CALENDAR (FR + BUTTONS FIX)
      ========================= */}
      <div className="card p-6 bg-white rounded-xl shadow">

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"

          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}

          // ✅ FULL FRENCH SUPPORT
          locales={[frLocale]}
          locale="fr"

          // ✅ BUTTON TEXT TRANSLATION
          buttonText={{
            today: "Aujourd’hui",
            month: "Mois",
            week: "Semaine",
            day: "Jour"
          }}

          events={events}
          eventClick={handleEventClick}
          height="auto"
        />

      </div>

      {/* =========================
          MODAL DETAILS
      ========================= */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Détails du rendez-vous"
      >

        {selectedEvent && (
          <div className="space-y-3 text-sm">

            <div>
              <span className="text-gray-500">Ticket:</span>
              <p className="font-medium">{selectedEvent.ticket}</p>
            </div>

            <div>
              <span className="text-gray-500">Service:</span>
              <p className="font-medium">{selectedEvent.service}</p>
            </div>

            <div>
              <span className="text-gray-500">Citoyen:</span>
              <p className="font-medium">{selectedEvent.citizen}</p>
            </div>

            <div>
              <span className="text-gray-500">Email:</span>
              <p className="font-medium">{selectedEvent.citizenEmail}</p>
            </div>

            <div>
              <span className="text-gray-500">Date:</span>
              <p className="font-medium">
                {selectedEvent.start &&
                  new Date(selectedEvent.start).toLocaleDateString('fr-FR')
                }
              </p>
            </div>

            <div>
              <span className="text-gray-500">Heure:</span>
              <p className="font-medium">
                {selectedEvent.start &&
                  new Date(selectedEvent.start).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                }
              </p>
            </div>

            <div>
              <span className="text-gray-500">Statut:</span>
              <p className="font-medium">
                {selectedEvent.statusLabel}
              </p>
            </div>

            <div>
              <span className="text-gray-500">Agent:</span>
              <p className="font-medium">{selectedEvent.agent}</p>
            </div>

            <div>
              <span className="text-gray-500">Notes:</span>
              <p className="font-medium">{selectedEvent.notes || "Aucune"}</p>
            </div>

          </div>
        )}

      </Modal>

    </div>
  );
};

export default Schedule;