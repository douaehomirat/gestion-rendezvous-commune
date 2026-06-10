import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Loader2, CalendarDays, ChevronRight, ChevronLeft,
  CheckCircle2, Building2, Clock, FileText, Sparkles,
} from "lucide-react";
import Swal from "sweetalert2";
import { generateTicketNumber } from "../../utils/helpers";

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api";

// ===================== UTILS =====================

const pad = (n) => String(n).padStart(2, "0");

const formatLocal = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

const isWeekend = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === 0 || d.getDay() === 6;
};

const getMoroccanHolidays = (year) => {
  const fixed = [
    `${year}-01-01`,
    `${year}-01-11`,
    `${year}-05-01`,
    `${year}-07-30`,
    `${year}-08-14`,
    `${year}-08-20`,
    `${year}-08-21`,
    `${year}-11-06`,
    `${year}-11-18`,
  ];
  return new Set(fixed);
};

const isPastDate = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr + "T00:00:00") < today;
};

const isPastDateTime = (date, time) => {
  if (!date || !time) return false;
  return new Date(`${date}T${time}:00`) < new Date();
};

const isMoroccanHoliday = (dateStr) => {
  const year = new Date(dateStr).getFullYear();
  return getMoroccanHolidays(year).has(dateStr);
};

const isDateBlocked = (dateStr) =>
  isPastDate(dateStr) || isWeekend(dateStr) || isMoroccanHoliday(dateStr);

const getBlockReason = (dateStr) => {
  if (isPastDate(dateStr)) return "Date passée";
  if (isWeekend(dateStr)) return "Weekend non disponible";
  if (isMoroccanHoliday(dateStr)) return "Jour férié marocain";
  return null;
};

const getEndTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const end = new Date(0, 0, 0, h, m + 15);
  return `${pad(end.getHours())}:${pad(end.getMinutes())}`;
};

const formatDateFR = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-MA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ===================== VÉRIFICATION LIMITE SEMAINE =====================
// Règle : 1 RDV actif par citoyen par service par semaine.
// Un citoyen PEUT avoir des RDVs dans des services différents la même semaine.
// Utilise le endpoint dédié GET /appointments/check-weekly (n'interfère pas avec GET /appointments).

const checkWeeklyLimit = async (citizenId, departmentId, dateStr) => {
  const ref = new Date(dateStr + "T00:00:00");
  const day = ref.getDay();
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // Vérifie uniquement pour ce département précis
  // Un citoyen peut avoir un RDV dans un autre service la même semaine
  const res = await axios.get(`${API}/appointments/check-weekly`, {
    params: {
      citizenId,
      departmentId,
      from: fmt(monday),
      to: fmt(sunday),
    },
  });

  // Le backend renvoie { hasActive: true/false }
  return res.data.hasActive === true;
};

// ===================== STEP INDICATOR =====================

const StepIndicator = ({ step }) => {
  const steps = [
    { icon: Building2, label: "Département" },
    { icon: CalendarDays, label: "Créneau" },
    { icon: CheckCircle2, label: "Confirmation" },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-2">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const idx = i + 1;
        const active = step === idx;
        const done = step > idx;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${done
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                    : active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110"
                    : "bg-white text-gray-400 border-2 border-gray-200"}`}
              >
                {done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
              </div>
              <span
                className={`text-xs font-semibold ${
                  active ? "text-indigo-600" : done ? "text-emerald-500" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-20 h-0.5 mb-5 mx-1 transition-all duration-500 ${
                  step > idx ? "bg-emerald-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ===================== MAIN COMPONENT =====================

const BookAppointment = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState([]);
  const [notes, setNotes] = useState("");

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const today = new Date().toISOString().split("T")[0];

  // ================= LOAD DEPARTMENTS =================
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/departments`);
        const actifs = (res.data || []).filter(
          (d) => d.status !== 0 && d.active !== 0 && d.active !== false
        );
        setDepartments(actifs);
      } catch {
        Swal.fire("Erreur", "Impossible de charger les départements", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ================= LOAD SLOTS =================
  const loadSlots = useCallback(async () => {
    if (!selectedDepartment?.id || !selectedDate) return;
    try {
      setLoadingSlots(true);
      const res = await axios.get(`${API}/availability/auto`, {
        params: { departmentId: selectedDepartment.id, date: selectedDate },
      });
      const clean = (res.data || [])
        .filter((s) => s.availableAgents > 0)
        .filter((s) => !isPastDateTime(selectedDate, s.time))
        .sort((a, b) => a.time.localeCompare(b.time));
      setSlots(clean);
      setSelectedTime("");
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDepartment, selectedDate]);

  useEffect(() => {
    if (selectedDepartment?.id && selectedDate && !isDateBlocked(selectedDate)) {
      loadSlots();
    } else {
      setSlots([]);
      setSelectedTime("");
    }
  }, [selectedDepartment, selectedDate, loadSlots]);

  useEffect(() => {
    if (
      step === 2 &&
      selectedDepartment?.id &&
      selectedDate &&
      !isDateBlocked(selectedDate)
    ) {
      loadSlots();
    }
  }, [step]);

  // ================= DATE CHANGE =================
  const handleDateChange = (value) => {
    const reason = getBlockReason(value);
    if (reason) {
      Swal.fire({
        icon: "warning",
        title: "Date indisponible",
        text: reason,
        confirmButtonColor: "#6366f1",
      });
      return;
    }
    setSelectedDate(value);
  };

  // ================= CONFIRM =================
  const handleConfirm = async () => {
    if (isPastDateTime(selectedDate, selectedTime)) {
      Swal.fire("Erreur", "Impossible de réserver un créneau passé", "error");
      return;
    }

    // Vérification frontend via endpoint dédié
    // Règle : 1 RDV actif par citoyen par semaine (tous départements)
    // Les RDVs annulés ne comptent pas.
    try {
      const alreadyBooked = await checkWeeklyLimit(user.id, selectedDepartment.id, selectedDate);
      if (alreadyBooked) {
        Swal.fire({
          icon: "warning",
          title: "Limite atteinte",
          html: `Vous avez déjà un rendez-vous actif cette semaine pour le service <b>${selectedDepartment.name}</b>.<br>Annulez-le pour pouvoir en réserver un nouveau.`,
          confirmButtonColor: "#6366f1",
        });
        return;
      }
    } catch {
      // Si le endpoint /check-weekly est inaccessible, on laisse le backend trancher
    }

    try {
      const ticket = generateTicketNumber();
      const startDateTime = `${selectedDate}T${selectedTime}:00`;
      const endDate = new Date(startDateTime);
      endDate.setMinutes(endDate.getMinutes() + 15);
      const endDateTime = formatLocal(endDate);

      await axios.post(`${API}/appointments`, {
        ticket,
        citizenId: user.id,
        departmentId: selectedDepartment.id,
        notes,
        startDateTime,
        endDateTime,
      });

      Swal.fire({
        icon: "success",
        title: "Rendez-vous confirmé !",
        html: `<b>${formatDateFR(selectedDate)}</b> à <b>${selectedTime}</b>`,
        timer: 2500,
        showConfirmButton: false,
        confirmButtonColor: "#6366f1",
      });

      setStep(1);
      setSelectedDepartment(null);
      setSelectedDate("");
      setSelectedTime("");
      setSlots([]);
      setNotes("");
    } catch (e) {
      const status = e.response?.status;
      const msg = e.response?.data?.message;
      if (status === 409 && msg?.includes("semaine")) {
        // Filet de sécurité backend
        Swal.fire({
          icon: "warning",
          title: "Limite atteinte",
          html: `Vous avez déjà un rendez-vous actif cette semaine pour le service <b>${selectedDepartment?.name}</b>.<br>Annulez-le pour pouvoir en réserver un nouveau.`,
          confirmButtonColor: "#6366f1",
        });
      } else if (status === 409) {
        Swal.fire("Créneau indisponible", msg || "Veuillez choisir un autre créneau", "error");
      } else {
        Swal.fire("Erreur", msg || "Une erreur est survenue", "error");
      }
    }
  };

  // ===================== UI =====================
  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{
        background: "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 40%, #f5f3ff 100%)",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}
    >
      <div className="max-w-3xl mx-auto space-y-6">

        {/* HEADER */}
        <div
          className="rounded-3xl p-8 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
        >
          <div
            className="absolute top-0 right-0 w-48 h-48 opacity-10"
            style={{
              background: "radial-gradient(circle, white 0%, transparent 70%)",
              transform: "translate(20%, -30%)",
            }}
          />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <span className="text-indigo-200 text-sm font-medium uppercase tracking-widest">
              Portail Citoyen
            </span>
          </div>
          <h1 className="text-3xl font-bold mt-1">Prendre un rendez-vous</h1>
          <p className="text-indigo-200 mt-1 text-sm">
            Réservez en 3 étapes simples · Lundi–Vendredi · Hors jours fériés
          </p>
        </div>

        {/* STEP INDICATOR */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-8 py-6">
          <StepIndicator step={step} />
        </div>

        {/* ===== STEP 1: DÉPARTEMENT ===== */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="font-semibold text-gray-800 text-lg">Choisir un département</h2>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="animate-spin text-indigo-500" size={36} />
              </div>
            ) : departments.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucun département disponible</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {departments.map((d) => {
                  const selected = selectedDepartment?.id === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDepartment(d)}
                      className={`group relative text-left p-5 rounded-2xl border-2 transition-all duration-200
                        ${selected
                          ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100"
                          : "border-gray-100 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-sm"
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`font-semibold ${selected ? "text-indigo-700" : "text-gray-700"}`}>
                            {d.name}
                          </p>
                          {d.description && (
                            <p className={`text-sm mt-1 ${selected ? "text-indigo-500" : "text-gray-400"}`}>
                              {d.description}
                            </p>
                          )}
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 transition-all
                            ${selected
                              ? "bg-indigo-500 border-indigo-500"
                              : "border-gray-300 group-hover:border-indigo-400"
                            }`}
                        >
                          {selected && (
                            <svg viewBox="0 0 10 10" className="w-full h-full text-white" fill="currentColor">
                              <path
                                d="M2 5l2.5 2.5L8 3"
                                stroke="white"
                                strokeWidth="1.5"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== STEP 2: DATE & CRÉNEAU ===== */}
        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="font-semibold text-gray-800 text-lg">Choisir une date et un créneau</h2>
            </div>

            {/* Résumé département */}
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">
              <Building2 size={16} className="text-indigo-400" />
              <span className="text-sm text-indigo-700 font-medium">{selectedDepartment?.name}</span>
            </div>

            {/* Sélection date */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Date du rendez-vous
              </label>
              <input
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="border-2 border-gray-200 focus:border-indigo-400 outline-none rounded-2xl p-3 w-full text-gray-700 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                <span>📅</span> Lundi–Vendredi · Hors jours fériés marocains
              </p>
            </div>

            {/* Créneaux */}
            {selectedDate && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-indigo-500" />
                  <span className="font-semibold text-gray-700 text-sm capitalize">
                    {formatDateFR(selectedDate)}
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="animate-spin text-indigo-400" size={28} />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl text-gray-400">
                    <Clock size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun créneau disponible pour cette date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((s, i) => {
                      const sel = selectedTime === s.time;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (isPastDateTime(selectedDate, s.time)) {
                              Swal.fire("Créneau invalide", "Impossible de choisir une heure passée", "warning");
                              return;
                            }
                            setSelectedTime(s.time);
                          }}
                          className={`relative p-3 rounded-2xl border-2 transition-all duration-150 text-center
                            ${sel
                              ? "border-indigo-500 bg-indigo-500 text-white shadow-md shadow-indigo-200 scale-105"
                              : "border-gray-100 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700"
                            }`}
                        >
                          <div className="font-bold text-sm">{s.time}</div>
                          <div className={`text-xs mt-0.5 ${sel ? "text-indigo-100" : "text-gray-400"}`}>
                            {s.availableAgents} agent{s.availableAgents > 1 ? "s" : ""}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== STEP 3: CONFIRMATION ===== */}
        {step === 3 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h2 className="font-semibold text-gray-800 text-lg">Confirmer le rendez-vous</h2>
            </div>

            {/* Récap */}
            <div className="rounded-2xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Building2 size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Département</p>
                    <p className="font-semibold text-gray-800">{selectedDepartment?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <CalendarDays size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Date</p>
                    <p className="font-semibold text-gray-800 capitalize">{formatDateFR(selectedDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Clock size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Heure</p>
                    <p className="font-semibold text-gray-800">
                      {selectedTime} – {getEndTime(selectedTime)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <FileText size={14} /> Notes (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border-2 border-gray-200 focus:border-indigo-400 outline-none rounded-2xl p-4 text-sm text-gray-700 resize-none transition-colors"
                rows={3}
                placeholder="Précisez l'objet de votre visite..."
              />
            </div>

            {/* Bouton confirmer */}
            <button
              onClick={handleConfirm}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-emerald-200"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
            >
              ✓ Confirmer le rendez-vous
            </button>
          </div>
        )}

        {/* NAVIGATION */}
        <div className="flex justify-between items-center pb-4">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors px-4 py-2 rounded-xl hover:bg-indigo-50"
            >
              <ChevronLeft size={18} /> Retour
            </button>
          ) : (
            <div />
          )}

          {step < 3 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !selectedDepartment) ||
                (step === 2 && !selectedTime)
              }
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
                hover:scale-[1.02] active:scale-[0.98] shadow-md"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
            >
              Suivant <ChevronRight size={18} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default BookAppointment;