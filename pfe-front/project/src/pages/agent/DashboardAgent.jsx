import {
  useEffect,
  useState,
  useCallback,
  useMemo
} from "react";

import axios from "axios";

import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  Phone,
  Inbox,
  Loader2
} from "lucide-react";

import StatCard from "../../components/StatCard";
import Badge from "../../components/Badge";

import {
  formatDate,
  getStatusColor,
  getStatusLabel
} from "../../utils/helpers";

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api";

// =========================
// HELPERS
// =========================
const formatTime = (dateTime) => {

  if (!dateTime) return "--:--";

  return new Date(dateTime)
    .toLocaleTimeString(
      "fr-FR",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );
};

const normalizeScheduleItem = (
  item
) => ({

  ...item,

  time: formatTime(
    item?.startDateTime
  ),

  citizenName:
    item?.citizen?.name ||
    item?.citizenName ||
    "N/A",

  serviceLabel:
    item?.serviceName ||
    item?.service ||
    "-"

});

const getUser = () => {

  try {

    return JSON.parse(
      localStorage.getItem(
        "user"
      ) || "null"
    );

  } catch {

    return null;

  }

};

// =========================
// LOADING
// =========================
const LoadingSkeleton = () => (

  <div className="space-y-6 p-6">

    <div className="rounded-[32px] bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 p-8 animate-pulse">

      <div className="h-8 w-64 bg-white/20 rounded-xl mb-4"></div>

      <div className="h-4 w-40 bg-white/20 rounded-lg"></div>

    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

      {[...Array(4)].map(
        (_, i) => (

          <div
            key={i}
            className="bg-white rounded-[28px] p-6 animate-pulse border border-gray-100"
          >

            <div className="h-4 w-20 bg-gray-200 rounded mb-4"></div>

            <div className="h-12 bg-gray-200 rounded-2xl"></div>

          </div>

        )
      )}

    </div>

  </div>

);

// =========================
// COMPONENT
// =========================
const DashboardAgent = () => {

  const [queue, setQueue] =
    useState([]);

  const [schedule, setSchedule] =
    useState([]);

  const [agentName, setAgentName] =
    useState("Agent");

  const [loading, setLoading] =
    useState(true);

  const [callingId, setCallingId] =
    useState(null);

  // =========================
  // CURRENT IN PROGRESS
  // =========================
  const currentInProgress =
    useMemo(() => {

      return schedule.find(
        (s) =>
          s.status ===
          "in_progress"
      );

    }, [schedule]);

  // =========================
  // FILTER QUEUE
  // =========================
  const sortedQueue =
    useMemo(() => {

      return [...queue]

        .filter(
          (q) =>
            q.status ===
              "pending" ||
            q.status ===
              "confirmed" ||
            !q.status
        )

        .sort((a, b) => {

          const aTime =
            new Date(
              a.createdAt ||
                a.created_date ||
                0
            );

          const bTime =
            new Date(
              b.createdAt ||
                b.created_date ||
                0
            );

          return aTime - bTime;

        });

    }, [queue]);

  // =========================
  // COMPLETED COUNT
  // =========================
  const completedCount =
    useMemo(() => {

      return schedule.filter(
        (s) =>
          String(
            s?.status
          ) === "completed"
      ).length;

    }, [schedule]);

  // =========================
  // AVG TIME
  // =========================
  const averageTime =
    useMemo(() => {

      if (!schedule.length)
        return "0 min";

      let total = 0;
      let count = 0;

      for (const item of schedule) {

        const start =
          item?.startDateTime
            ? new Date(
                item.startDateTime
              )
            : null;

        const end =
          item?.endDateTime
            ? new Date(
                item.endDateTime
              )
            : null;

        if (
          start &&
          end &&
          !isNaN(start) &&
          !isNaN(end) &&
          end > start
        ) {

          total += end - start;

          count++;

        }

      }

      return count === 0
        ? "0 min"
        : `${Math.round(
            total /
              count /
              60000
          )} min`;

    }, [schedule]);

  // =========================
  // FETCH DATA
  // =========================
  const fetchData =
    useCallback(async () => {

      const user =
        getUser();

      const agentId =
        user?.id;

      if (!agentId) {

        setLoading(false);

        return;

      }

      try {

        setLoading(true);

        const [
          agentRes,
          queueRes,
          scheduleRes
        ] = await Promise.all([

          axios.get(
            `${API}/users/${agentId}`
          ),

          axios.get(
            `${API}/agent/queue/today`
          ),

          axios.get(
            `${API}/agent/schedule/today/${agentId}`
          )

        ]);

        // AGENT
        setAgentName(
          agentRes.data?.name ||
            user?.name ||
            "Agent"
        );

        // QUEUE
        setQueue(
          Array.isArray(
            queueRes.data
          )
            ? queueRes.data
            : []
        );

        // SCHEDULE
        const formatted =
          Array.isArray(
            scheduleRes.data
          )
            ? scheduleRes.data.map(
                normalizeScheduleItem
              )
            : [];

        formatted.sort(
          (a, b) =>
            new Date(
              a.startDateTime
            ) -
            new Date(
              b.startDateTime
            )
        );

        setSchedule(
          formatted
        );

      } catch (err) {

        console.error(
          "Dashboard Error:",
          err
        );

      } finally {

        setLoading(false);

      }

    }, []);

  // =========================
  // LOAD
  // =========================
  useEffect(() => {

    fetchData();

    const interval =
      setInterval(
        fetchData,
        10000
      );

    return () =>
      clearInterval(interval);

  }, [fetchData]);

  // =========================
  // CALL NEXT
  // =========================
  const callNext =
    useCallback(

      async (queueItem) => {

        if (!queueItem?.id)
          return;

        try {

          setCallingId(
            queueItem.id
          );

          await axios.put(
            `${API}/appointments/${queueItem.id}/status`,
            {
              status:
                "in_progress"
            }
          );

          await fetchData();

          // notification
          if (
            "Notification" in
            window
          ) {

            if (
              Notification.permission ===
              "granted"
            ) {

              new Notification(
                "Citoyen appelé",
                {
                  body: `${queueItem.name} a été appelé`
                }
              );

            } else if (
              Notification.permission !==
              "denied"
            ) {

              Notification.requestPermission();

            }

          }

        } catch (err) {

          console.error(
            "Call Error:",
            err
          );

        } finally {

          setCallingId(null);

        }

      },

      [fetchData]

    );

  // =========================
  // LOADING
  // =========================
  if (loading) {

    return <LoadingSkeleton />;

  }

  // =========================
  // UI
  // =========================
  return (

    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="rounded-[32px] p-6 md:p-8 bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 shadow-2xl">

        <h2 className="text-2xl md:text-3xl font-black text-white">

          Bonjour,

          <span className="bg-white/20 px-4 py-1 rounded-full ml-2 text-xl">

            {agentName}

          </span>

        </h2>

        <p className="text-primary-100 text-sm md:text-base mt-3">

          {formatDate(
            new Date()
          )} - Bonne journée ✨

        </p>

      </div>

      {/* CURRENT CITIZEN */}
      {currentInProgress && (

        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 shadow-[0_20px_60px_rgba(16,185,129,0.35)] p-6 md:p-8 text-white">

          <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            <div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/20 mb-5">

                <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>

                <span className="font-semibold">

                  Citoyen actuellement appelé

                </span>

              </div>

              <h2 className="text-3xl md:text-5xl font-black">

                {
                  currentInProgress.citizenName
                }

              </h2>

              <p className="text-lg text-emerald-50 mt-3">

                {
                  currentInProgress.serviceLabel
                }

              </p>

              <div className="flex flex-wrap gap-3 mt-5">

                <div className="bg-white/10 px-4 py-3 rounded-2xl backdrop-blur-sm">

                  Ticket :
                  {" "}
                  {
                    currentInProgress.ticket ||
                    "-"
                  }

                </div>

                <div className="bg-white/10 px-4 py-3 rounded-2xl backdrop-blur-sm">

                  Heure :
                  {" "}
                  {
                    currentInProgress.time
                  }

                </div>

              </div>

            </div>

            <div className="hidden md:flex w-24 h-24 rounded-3xl bg-white/15 items-center justify-center">

              <Phone className="w-12 h-12" />

            </div>

          </div>

        </div>

      )}

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        <StatCard
          title="RDV aujourd'hui"
          value={schedule.length}
          icon={Calendar}
          color="primary"
        />

        <StatCard
          title="En attente"
          value={sortedQueue.length}
          icon={Users}
          color="amber"
        />

        <StatCard
          title="Traités"
          value={completedCount}
          icon={CheckCircle}
          color="emerald"
        />

        <StatCard
          title="Temps moyen"
          value={averageTime}
          icon={Clock}
          color="blue"
        />

      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* QUEUE */}


        {/* SCHEDULE */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl p-6 md:p-8">

          <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">

            <Calendar className="w-7 h-7 text-emerald-600" />

            File d'attente du jour

          </h3>

          {schedule.length ===
          0 ? (

            <div className="text-center py-16">

              <Calendar
                size={54}
                className="mx-auto text-gray-300 mb-5"
              />

              <h4 className="text-2xl font-bold text-gray-500 mb-2">

                Aucun rendez-vous

              </h4>

            </div>

          ) : (

            <div className="space-y-4 max-h-[650px] overflow-y-auto pr-2">

              {schedule.map(
                (s) => (

                  <div
                    key={s.id}
                    className={`p-5 rounded-[28px] border transition-all duration-300

                    ${
                      s.status ===
                      "in_progress"
                        ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 shadow-lg ring-2 ring-emerald-100"
                        : "bg-gray-50 border-gray-100 hover:bg-white hover:shadow-md"
                    }
                    `}
                  >

                    <div className="flex items-center gap-4">

                      {/* TIME */}
                      <div className="w-20 text-center flex-shrink-0">

                        <span className="text-xl font-black text-primary-600 block">

                          {s.time}

                        </span>

                        <Badge
                          variant={getStatusColor(
                            s.status
                          )}
                          size="xs"
                        >

                          {getStatusLabel(
                            s.status
                          )}

                        </Badge>

                      </div>

                      {/* DETAILS */}
                      <div className="flex-1 min-w-0">

                        <p className="text-lg font-bold text-gray-900 truncate">

                          {
                            s.citizenName
                          }

                        </p>

                        <p className="text-sm text-gray-600 mt-1">

                          {
                            s.serviceLabel
                          }

                        </p>

                        <p className="text-xs text-gray-400 mt-2">

                          Ticket :
                          {" "}
                          {s.ticket ||
                            "-"}

                        </p>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>

    </div>

  );

};

export default DashboardAgent;