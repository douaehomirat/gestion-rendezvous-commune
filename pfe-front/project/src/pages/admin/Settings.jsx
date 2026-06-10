import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

import {
  Building2,
  Save,
  Shield,
  Trash2,
  AlertTriangle,
  Lock,
  Mail,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Settings as SettingsIcon,
} from "lucide-react";

// ================= API =================
const SETTINGS_API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/settings";
const USERS_API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/users";

// ================= INPUT COMPONENT =================
const Input = ({
  label,
  value,
  onChange,
  icon: Icon,
  type = "text",
  placeholder = "",
  passwordKey,
  showPasswords,
  setShowPasswords,
}) => {
  const isPassword = type === "password";

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700">
        {label}
      </label>

      <div className="relative group">
        {Icon && (
          <Icon
            size={18}
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-gray-400
              group-focus-within:text-blue-600
              transition
            "
          />
        )}

        <input
          type={
            isPassword
              ? showPasswords[passwordKey]
                ? "text"
                : "password"
              : type
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full
            ${Icon ? "pl-12" : "pl-4"}
            ${isPassword ? "pr-12" : "pr-4"}
            py-3.5
            rounded-2xl
            border
            border-white/40
            bg-white/60
            backdrop-blur-md
            shadow-sm
            text-gray-700
            placeholder:text-gray-400
            hover:border-blue-300
            focus:bg-white
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:border-blue-500
            transition-all
            duration-300
          `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() =>
              setShowPasswords((prev) => ({
                ...prev,
                [passwordKey]: !prev[passwordKey],
              }))
            }
            className="
              absolute
              right-4
              top-1/2
              -translate-y-1/2
              text-gray-400
              hover:text-gray-700
              transition
            "
          >
            {showPasswords[passwordKey] ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ================= MAIN COMPONENT =================
const Settings = () => {

  // ================= USER =================
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  // ================= STATES =================
  const [general, setGeneral] = useState({
    id: 1,
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [saved, setSaved] = useState(false);

  // ================= FETCH SETTINGS =================
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const response = await axios.get(SETTINGS_API);

      if (response.data) {
        setGeneral({
          id: response.data.id || 1,
          name: response.data.name || "",
          address: response.data.address || "",
          phone: response.data.phone || "",
          email: response.data.email || "",
        });
      }
    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de charger les paramètres",
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= SAVE SETTINGS =================
  const handleSave = async () => {
    try {
      setLoading(true);

await axios.put(SETTINGS_API, {
  ...general,
  id: 1,
});
      setSaved(true);

      Swal.fire({
        icon: "success",
        title: "Succès",
        text: "Paramètres enregistrés avec succès",
        timer: 2000,
        showConfirmButton: false,
      });

      setTimeout(() => {
        setSaved(false);
      }, 3000);

    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Erreur lors de la sauvegarde",
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= CHANGE PASSWORD =================
  const handleChangePassword = async () => {

    if (!userId) {
      return Swal.fire(
        "Erreur",
        "Utilisateur introuvable",
        "error"
      );
    }

    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      return Swal.fire(
        "Erreur",
        "Veuillez remplir tous les champs",
        "warning"
      );
    }

    if (
      passwords.newPassword !==
      passwords.confirmPassword
    ) {
      return Swal.fire(
        "Erreur",
        "Les mots de passe ne correspondent pas",
        "error"
      );
    }

    if (passwords.newPassword.length < 6) {
      return Swal.fire(
        "Erreur",
        "Le mot de passe doit contenir au moins 6 caractères",
        "warning"
      );
    }

    try {
      setPasswordLoading(true);

      await axios.put(
        `${USERS_API}/${userId}/password`,
        {
          currentPassword:
            passwords.currentPassword,
          newPassword: passwords.newPassword,
        }
      );

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      Swal.fire({
        icon: "success",
        title: "Succès",
        text: "Mot de passe mis à jour",
      });

    } catch (err) {
      console.log(err);

      Swal.fire({
        icon: "error",
        title: "Erreur",
        text:
          "Mot de passe incorrect ou erreur serveur",
      });

    } finally {
      setPasswordLoading(false);
    }
  };

  // ================= DELETE SETTINGS =================
  const handleDeleteAccount = async () => {

    const confirmDelete = await Swal.fire({
      title: "Suppression",
      text:
        "Voulez-vous vraiment supprimer les paramètres ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Oui supprimer",
      cancelButtonText: "Annuler",
    });

    if (!confirmDelete.isConfirmed) return;

    try {

      await axios.delete(SETTINGS_API);

      Swal.fire({
        icon: "success",
        title: "Supprimé",
        text: "Configuration supprimée",
      });

      setGeneral({
        id: 1,
        name: "",
        address: "",
        phone: "",
        email: "",
      });

    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de supprimer",
      });
    }
  };
 const handleDelete = () => {
    Swal.fire({
      title: "Supprimer le compte ?",
      text: "Cette action est irréversible !",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler"
    }).then(async (result) => {

      if (result.isConfirmed) {
        try {
          await axios.delete(`${USERS_API}/${userId}`);

          localStorage.removeItem("user");

          Swal.fire("Supprimé", "Compte supprimé avec succès", "success");

          window.location.href = "/login";

        } catch (err) {
          console.log(err);
          Swal.fire("Erreur", "Suppression impossible", "error");
        }
      }

    });
  };
  // ================= UI =================
  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-br
        from-slate-100
        via-blue-50
        to-indigo-100
        p-6
        relative
        overflow-hidden
      "
    >

      {/* BACKGROUND */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 opacity-20 blur-3xl rounded-full"></div>

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 opacity-20 blur-3xl rounded-full"></div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            bg-white/70
            backdrop-blur-xl
            border
            border-white/40
            rounded-3xl
            shadow-xl
            p-6
            flex
            flex-col
            md:flex-row
            md:items-center
            md:justify-between
            gap-4
          "
        >

          <div className="flex items-center gap-4">

            <div
              className="
                w-16
                h-16
                rounded-3xl
                bg-gradient-to-r
                from-blue-600
                to-indigo-600
                flex
                items-center
                justify-center
                shadow-lg
              "
            >
              <SettingsIcon
                className="text-white"
                size={30}
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Paramètres
              </h1>

              <p className="text-gray-500 mt-1">
                Gestion des informations du système municipal
              </p>
            </div>
          </div>

          {saved && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="
                flex
                items-center
                gap-2
                bg-green-100
                text-green-700
                px-4
                py-3
                rounded-2xl
                shadow-sm
              "
            >
              <CheckCircle2 size={20} />
              Paramètres enregistrés
            </motion.div>
          )}

        </motion.div>

        {/* GENERAL */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            bg-white/70
            backdrop-blur-xl
            rounded-3xl
            shadow-xl
            border
            border-white/40
            overflow-hidden
          "
        >

          <div className="border-b border-gray-100 px-6 py-5 flex items-center gap-4">

            <div className="bg-blue-100 p-4 rounded-2xl">
              <Building2
                className="text-blue-600"
                size={24}
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Informations générales
              </h2>

              <p className="text-gray-500 text-sm">
                Paramètres principaux
              </p>
            </div>

          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

            <Input
              label="Nom"
              value={general.name}
              onChange={(v) =>
                setGeneral({
                  ...general,
                  name: v,
                })
              }
              icon={Building2}
              placeholder="Nom"
              showPasswords={showPasswords}
              setShowPasswords={setShowPasswords}
            />

            <Input
              label="Adresse"
              value={general.address}
              onChange={(v) =>
                setGeneral({
                  ...general,
                  address: v,
                })
              }
              icon={MapPin}
              placeholder="Adresse"
              showPasswords={showPasswords}
              setShowPasswords={setShowPasswords}
            />

            <Input
              label="Téléphone"
              value={general.phone}
              onChange={(v) =>
                setGeneral({
                  ...general,
                  phone: v,
                })
              }
              icon={Phone}
              placeholder="+212 ..."
              showPasswords={showPasswords}
              setShowPasswords={setShowPasswords}
            />

            <Input
              label="Email"
              value={general.email}
              onChange={(v) =>
                setGeneral({
                  ...general,
                  email: v,
                })
              }
              icon={Mail}
              placeholder="email@gmail.com"
              showPasswords={showPasswords}
              setShowPasswords={setShowPasswords}
            />

          </div>

          <div className="px-6 pb-6">

            <button
              onClick={handleSave}
              disabled={loading}
              className="
                flex
                items-center
                gap-2
                bg-gradient-to-r
                from-blue-600
                to-indigo-600
                hover:scale-105
                hover:shadow-xl
                transition-all
                duration-300
                text-white
                px-6
                py-3.5
                rounded-2xl
                font-medium
              "
            >

              {loading ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save size={18} />
              )}

              Enregistrer

            </button>

          </div>

        </motion.div>

        {/* SECURITY */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            bg-white/70
            backdrop-blur-xl
            rounded-3xl
            shadow-xl
            border
            border-white/40
            overflow-hidden
          "
        >

          <div className="border-b border-gray-100 px-6 py-5 flex items-center gap-4">

            <div className="bg-gray-100 p-4 rounded-2xl">
              <Shield
                className="text-gray-700"
                size={24}
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Sécurité
              </h2>

              <p className="text-gray-500 text-sm">
                Modifier le mot de passe
              </p>
            </div>

          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

            <Input
              label="Mot de passe actuel"
              value={passwords.currentPassword}
              onChange={(v) =>
                setPasswords({
                  ...passwords,
                  currentPassword: v,
                })
              }
              icon={Lock}
              type="password"
              passwordKey="current"
              showPasswords={showPasswords}
              setShowPasswords={setShowPasswords}
            />

            <Input
              label="Nouveau mot de passe"
              value={passwords.newPassword}
              onChange={(v) =>
                setPasswords({
                  ...passwords,
                  newPassword: v,
                })
              }
              icon={Lock}
              type="password"
              passwordKey="new"
              showPasswords={showPasswords}
              setShowPasswords={setShowPasswords}
            />

            <Input
              label="Confirmer le mot de passe"
              value={passwords.confirmPassword}
              onChange={(v) =>
                setPasswords({
                  ...passwords,
                  confirmPassword: v,
                })
              }
              icon={Lock}
              type="password"
              passwordKey="confirm"
              showPasswords={showPasswords}
              setShowPasswords={setShowPasswords}
            />

          </div>

          <div className="px-6 pb-6">

            <button
              onClick={handleChangePassword}
              disabled={passwordLoading}
              className="
                flex
                items-center
                gap-2
                bg-gray-900
                hover:bg-black
                hover:scale-105
                transition-all
                duration-300
                text-white
                px-6
                py-3.5
                rounded-2xl
                font-medium
              "
            >

              {passwordLoading ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Shield size={18} />
              )}

              Mettre à jour le mot de passe

            </button>

          </div>

        </motion.div>

      </div>
{/* 🧨 ZONE DANGEREUSE */}
<div className="card p-6 border border-red-200 bg-red-50/40 backdrop-blur-sm rounded-xl shadow-sm">

  <div className="flex items-start gap-4">

    {/* Icon warning */}
    <div className="p-3 rounded-xl bg-red-100 text-red-600">
      <AlertTriangle size={20} />
    </div>

    <div className="flex-1">

      <h3 className="text-base font-bold text-red-700">
        Zone dangereuse
      </h3>

      <p className="text-sm text-gray-600 mt-1">
        La suppression de votre compte est définitive. Toutes vos données seront supprimées
        et ne pourront pas être récupérées.
      </p>

      {/* Warning box */}
      <div className="mt-4 p-3 rounded-lg bg-white border border-red-200">
        <p className="text-xs text-red-600 font-medium">
          ⚠️ Cette action est irréversible
        </p>
      </div>

      {/* Button */}
      <div className="mt-5 flex justify-end">
        <button
          onClick={handleDelete}
          className="
            flex items-center gap-2
            bg-red-600
            hover:bg-red-700
            text-white
            px-5 py-2.5
            rounded-xl
            font-medium
            transition-all duration-300
            shadow-sm hover:shadow-md
            active:scale-95
          "
        >
          <Trash2 size={16} />
          Supprimer mon compte
        </button>
      </div>

    </div>
  </div>
</div>
    </div>
  );
};

export default Settings;