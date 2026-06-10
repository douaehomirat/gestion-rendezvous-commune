import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  User,
  FileText,
  Inbox,
  Mail,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import Badge from "../../components/Badge";

import {
  formatDate,
  formatTime,
  getStatusColor,
  getStatusLabel,
} from "../../utils/helpers";

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api";

// ─────────────────────────────────────────────
// CHECK < 24H
// ─────────────────────────────────────────────
const isWithin24Hours = (appointmentDate) => {
  const now = new Date();
  const diffMs = appointmentDate - now;

  return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
};

const AgentAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reminderState, setReminderState] = useState({});
  const [sendingAll, setSendingAll] = useState(false);

  // ─────────────────────────────────────────────
  // FETCH APPOINTMENTS
  // ─────────────────────────────────────────────
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);

        // GET USER FROM LOCAL STORAGE
        const user = JSON.parse(
          localStorage.getItem("user")
        );

        const agentId = user?.id;

        if (!agentId) {
          console.error(
            "Agent ID introuvable"
          );
          setLoading(false);
          return;
        }

        console.log(
          "Fetching appointments for agent:",
          agentId
        );

        const res = await axios.get(
          `${API}/appointments/agent/${agentId}`
        );

        console.log(
          "Appointments response:",
          res.data
        );

        const data = Array.isArray(res.data)
          ? res.data
          : [];

        setAppointments(data);

        // INITIAL REMINDER STATE
        const initialState = {};

        data.forEach((a) => {
          if (a.reminderSent) {
            initialState[a.id] = "sent";
          }
        });

        setReminderState(initialState);

      } catch (err) {
        console.error(
          "Erreur chargement rendez-vous:",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // ─────────────────────────────────────────────
  // GET DATE OBJECT
  // ─────────────────────────────────────────────
  const getDateTime = (appointment) => {
    if (appointment.startDateTime) {
      return new Date(
        appointment.startDateTime
      );
    }

    if (
      appointment.date &&
      appointment.time
    ) {
      return new Date(
        `${appointment.date}T${appointment.time}`
      );
    }

    return new Date(0);
  };

  // ─────────────────────────────────────────────
  // MARK COMPLETED
  // ─────────────────────────────────────────────
  const markCompleted = async (id) => {
    try {
      await axios.put(
        `${API}/appointments/${id}/complete`
      );

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: "completed",
              }
            : a
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────
  // SEND REMINDER
  // ─────────────────────────────────────────────
  const sendReminder = async (id) => {
    setReminderState((prev) => ({
      ...prev,
      [id]: "sending",
    }));

    try {
      await axios.post(
        `${API}/appointments/${id}/remind`
      );

      setReminderState((prev) => ({
        ...prev,
        [id]: "sent",
      }));
    } catch (err) {
      console.error(err);

      setReminderState((prev) => ({
        ...prev,
        [id]: "error",
      }));
    }
  };

  // ─────────────────────────────────────────────
  // SORT APPOINTMENTS
  // ─────────────────────────────────────────────
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort(
      (a, b) =>
        getDateTime(b).getTime() -
        getDateTime(a).getTime()
    );
  }, [appointments]);

  // ─────────────────────────────────────────────
  // UPCOMING APPOINTMENTS
  // ─────────────────────────────────────────────
  const upcomingAppointments =
    useMemo(() => {
      return appointments.filter((a) => {
        const date = getDateTime(a);

        return (
          isWithin24Hours(date) &&
          a.status !== "completed" &&
          reminderState[a.id] !== "sent"
        );
      });
    }, [appointments, reminderState]);

  const showBulkButton =
    upcomingAppointments.length >= 2;

  // ─────────────────────────────────────────────
  // SEND ALL REMINDERS
  // ─────────────────────────────────────────────
  const sendAllReminders = async () => {
    try {
      setSendingAll(true);

      for (const appt of upcomingAppointments) {
        try {
          setReminderState((prev) => ({
            ...prev,
            [appt.id]: "sending",
          }));

          await axios.post(
            `${API}/appointments/${appt.id}/remind`
          );

          setReminderState((prev) => ({
            ...prev,
            [appt.id]: "sent",
          }));
        } catch (err) {
          console.error(err);

          setReminderState((prev) => ({
            ...prev,
            [appt.id]: "error",
          }));
        }
      }
    } finally {
      setSendingAll(false);
    }
  };

  // ─────────────────────────────────────────────
  // REMINDER BUTTON
  // ─────────────────────────────────────────────
  const ReminderButton = ({
    appointment,
  }) => {
    const apptDate =
      getDateTime(appointment);

    const within24h =
      isWithin24Hours(apptDate);

    const state =
      reminderState[appointment.id] ||
      "idle";

    // HIDE IF COMPLETED
    if (
      !within24h ||
      appointment.status ===
        "completed"
    ) {
      return null;
    }

    // SENT
    if (state === "sent") {
      return (
        <div className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-medium">
          <CheckCircle2 size={14} />
          Envoyé
        </div>
      );
    }

    // ERROR
    if (state === "error") {
      return (
        <button
          onClick={() =>
            sendReminder(
              appointment.id
            )
          }
          className="text-xs px-3 py-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition"
        >
          Réessayer
        </button>
      );
    }

    // DEFAULT
    return (
      <button
        onClick={() =>
          sendReminder(
            appointment.id
          )
        }
        disabled={
          state === "sending"
        }
        className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition disabled:opacity-50"
      >
        {state === "sending" ? (
          <Loader2
            size={14}
            className="animate-spin"
          />
        ) : (
          <Mail size={14} />
        )}

        {state === "sending"
          ? "Envoi..."
          : "Envoyer rappel"}
      </button>
    );
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 p-7 shadow-xl">

        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10">

          <h1 className="text-2xl font-bold text-white">
            Tous mes rendez-vous
          </h1>

          <p className="text-primary-100 mt-2 text-sm">
            {formatDate(new Date())}
          </p>

          <div className="flex items-center gap-3 mt-5 flex-wrap">

            <div className="bg-white/15 backdrop-blur px-4 py-2 rounded-2xl text-white text-sm">
              {appointments.length} rendez-vous
            </div>

            <div className="bg-orange-400/20 border border-orange-300/20 px-4 py-2 rounded-2xl text-orange-100 text-sm">
              {
                upcomingAppointments.filter(
                  (a) =>
                    a.status !==
                    "cancelled"
                ).length
              }{" "}
              urgents
            </div>

          </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">

        {/* BULK BUTTON */}
        {showBulkButton && (
          <div className="flex justify-end mb-6">
            <button
              onClick={
                sendAllReminders
              }
              disabled={sendingAll}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-2xl shadow-md transition disabled:opacity-50"
            >
              {sendingAll ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Mail size={16} />
              )}

              {sendingAll
                ? "Envoi en cours..."
                : `Envoyer tous (${upcomingAppointments.length})`}
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2
              size={40}
              className="animate-spin text-primary-600"
            />

            <p className="text-gray-500 mt-4">
              Chargement des rendez-vous...
            </p>
          </div>

        ) : sortedAppointments.length ===
          0 ? (

          <div className="text-center py-20">

            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Inbox
                className="text-gray-400"
                size={36}
              />
            </div>

            <h3 className="font-semibold text-gray-700">
              Aucun rendez-vous
            </h3>

            <p className="text-sm text-gray-400 mt-1">
              Les rendez-vous
              apparaîtront ici.
            </p>

          </div>

        ) : (

          <div className="space-y-5">

            {sortedAppointments.map(
              (a) => {
                const apptDate =
                  getDateTime(a);

                const urgent =
                  isWithin24Hours(
                    apptDate
                  );

                const citizenName =
                  a.citizen?.name ||
                  `${a.citizen?.firstName || ""} ${
                    a.citizen?.lastName || ""
                  }`.trim() ||
                  "Citoyen";

                return (
                  <div
                    key={a.id}
                    className={`group relative overflow-hidden rounded-3xl border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.01] ${
                      a.status ===
                      "cancelled"
                        ? "bg-red-50 border-red-200"
                        : urgent &&
                          a.status !==
                            "completed"
                        ? "bg-gradient-to-r from-orange-50 to-white border-orange-200"
                        : "bg-white border-gray-200"
                    }`}
                  >

                    {/* URGENT */}
                    {urgent &&
                      a.status !==
                        "completed" &&
                      a.status !==
                        "cancelled" && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 bg-orange-100 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full">
                          <AlertTriangle
                            size={12}
                          />
                          Moins de 24h
                        </div>
                      )}

                    {/* CANCELLED */}
                    {a.status ===
                      "cancelled" && (
                      <div className="absolute top-4 right-4 flex items-center gap-1 bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">
                        <XCircle
                          size={12}
                        />
                        Annulé
                      </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                      {/* LEFT */}
                      <div className="space-y-4">

                        <div className="flex items-center gap-3">

                          <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center">
                            <User
                              size={20}
                              className="text-primary-700"
                            />
                          </div>

                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {
                                citizenName
                              }
                            </h3>

                            <p className="text-xs text-gray-400">
                              Citoyen
                            </p>
                          </div>
                        </div>

                        {/* DETAILS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">
                            <Calendar
                              size={16}
                            />
                            {formatDate(
                              apptDate
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">
                            <Clock
                              size={16}
                            />
                            {formatTime(
                              apptDate
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl sm:col-span-2">
                            <FileText
                              size={16}
                            />
                            {a.serviceName ||
                              "Service"}
                          </div>

                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="flex flex-col items-start lg:items-end gap-3">

                        <Badge
                          variant={getStatusColor(
                            a.status
                          )}
                        >
                          {getStatusLabel(
                            a.status
                          )}
                        </Badge>

                        <div className="flex items-center gap-2 flex-wrap">

                          {/* REMINDER */}
                          <ReminderButton
                            appointment={
                              a
                            }
                          />

                          {/* COMPLETE */}
                      

                        </div>
                      </div>

                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentAppointments;