import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { connectNotificationSocket, disconnectNotificationSocket } from "../services/notificationSocket";

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/notifications";

/**
 * 🔥 Normalise isRead (IMPORTANT FIX)
 */
const normalize = (list) =>
  (list || []).map(n => ({
    ...n,
    isRead: n.isRead === true || n.isRead === 1 || n.isRead === "1"
  }));

const NotificationBell = () => {
  const auth = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const ref = useRef(null);

  const userId = auth?.user?.id || auth?.id;
  const role = auth?.user?.role || auth?.role || "citizen";

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // =========================
  // FETCH NOTIFICATIONS
  // =========================
  const fetchNotifications = useCallback(async () => {
    if (!userId || !role) return;

    setLoading(true);
    try {
      const res = await axios.get(`${API}?userId=${userId}&role=${role}`);

      // 🔥 FIX: normalize isRead
      setNotifications(normalize(res.data));

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  // =========================
  // SOCKET
  // =========================
  useEffect(() => {
    if (!userId || !role) return;

    fetchNotifications();

    const socketClient = connectNotificationSocket(userId, role, (notif) => {
      const cleanNotif = {
        ...notif,
        isRead: notif.isRead === true || notif.isRead === 1 || notif.isRead === "1"
      };

      setNotifications(prev => {
        const index = prev.findIndex(n => n.id === cleanNotif.id);

        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            ...cleanNotif
          };
          return updated;
        }

        return [cleanNotif, ...prev];
      });
    });

    return () => disconnectNotificationSocket();
  }, [userId, role, fetchNotifications]);

  // =========================
  // CLICK OUTSIDE
  // =========================
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // =========================
  // MARK ONE
  // =========================
  const markAsRead = async (id) => {
    try {
      await axios.put(`${API}/${id}/read`);

      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // MARK ALL
  // =========================
  const markAllAsRead = async () => {
    try {
      await axios.put(`${API}/read-all?userId=${userId}&role=${role}`);

      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // DELETE
  // =========================
  const deleteNotif = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);

      setNotifications(prev =>
        prev.filter(n => n.id !== id)
      );
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // UI SAFE CHECK
  // =========================
  if (!userId || !role) {
    return (
      <div className="p-3">
        <Bell className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>

      {/* 🔔 BELL */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-full bg-white hover:bg-gray-100 shadow-sm border transition-all duration-200 hover:shadow-md"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] h-[20px] flex items-center justify-center font-bold shadow-lg animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* =========================
          DROPDOWN
      ========================= */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border z-50 overflow-hidden animate-in fade-in duration-200">

          {/* HEADER */}
          <div className="flex justify-between items-center p-5 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border-b">

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Bell className="w-5 h-5 text-white" />
              </div>

              <div>
                <h2 className="font-bold text-gray-800 text-lg">
                  Notifications
                </h2>
                <p className="text-xs text-gray-500">
                  {userId} • {role}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition"
              >
                <CheckCheck size={16} className="inline mr-1" />
                Tout lire
              </button>
            )}

          </div>

          {/* LIST */}
          <div className="max-h-80 overflow-y-auto">

            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <Bell className="w-14 h-14 text-gray-300 mx-auto mb-3 opacity-60" />
                <p className="text-gray-500 font-medium">
                  Aucune notification
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Tout est à jour 🎉
                </p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-4 border-b transition hover:bg-gray-50 ${
                    !n.isRead ? "bg-blue-50 border-l-4 border-blue-500" : ""
                  }`}
                >

                  {/* TITLE */}
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm text-gray-800">
                      {n.title}
                    </h4>

                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                      {n.type}
                    </span>
                  </div>

                  {/* MESSAGE */}
                  <p className="text-sm text-gray-600 mt-1">
                    {n.message}
                  </p>

                  {/* ACTIONS */}
                  <div className="flex justify-between items-center mt-3">

                    <span className="text-xs text-gray-400">
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleString()
                        : "now"}
                    </span>

                    <div className="flex gap-2">

                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-green-600 text-xs flex items-center gap-1 hover:underline"
                        >
                          <Check size={14} />
                          lu
                        </button>
                      )}

                      <button
                        onClick={() => deleteNotif(n.id)}
                        className="text-red-600 text-xs flex items-center gap-1 hover:underline"
                      >
                        <Trash2 size={14} />
                        supprimer
                      </button>

                    </div>

                  </div>

                </div>
              ))
            )}

          </div>

          {/* FOOTER */}
          <div className="p-3 border-t bg-gray-50">
            <button
              onClick={fetchNotifications}
              className="w-full bg-white hover:bg-gray-100 border rounded-xl py-2 text-sm font-medium transition"
            >
              {loading ? "Chargement..." : "Actualiser"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default NotificationBell;