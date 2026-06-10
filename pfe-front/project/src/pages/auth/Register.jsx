import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Eye,
  EyeOff,
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Globe,
  ArrowRight,
    Users,  
  Sparkles,
  ShieldCheck,
  Sun,
  Moon,
} from "lucide-react";
import Swal from "sweetalert2";

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/auth/register";
const Register = () => {
  const navigate = useNavigate();

  // =========================
  // THEME CLAIR PAR DÉFAUT
  // =========================
  const [darkMode, setDarkMode] = useState(false);

  // =========================
  // STATES
  // =========================
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    password: "",
    confirmPassword: "",
    role: "citizen",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // =========================
  // HANDLE CHANGE
  // =========================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Les mots de passe ne correspondent pas",
        background: darkMode ? "#0f172a" : "#ffffff",
        color: darkMode ? "#ffffff" : "#0f172a",
      });
      return;
    }

    setLoading(true);

    try {
      await axios.post(API, formData);

      Swal.fire({
        icon: "success",
        title: "Compte créé !",
        text: "Inscription réussie. Vous pouvez maintenant vous connecter.",
        timer: 2000,
        showConfirmButton: false,
        background: darkMode ? "#0f172a" : "#ffffff",
        color: darkMode ? "#ffffff" : "#0f172a",
      });

      navigate("/login");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erreur d'inscription",
        text: error.response?.data?.message || error.response?.data || "Erreur lors de l'inscription",
        background: darkMode ? "#0f172a" : "#ffffff",
        color: darkMode ? "#ffffff" : "#0f172a",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex overflow-hidden relative transition-all duration-500 ${
        darkMode
          ? "bg-[#050816]"
          : "bg-gradient-to-br from-slate-100 via-white to-blue-100"
      }`}
    >
      {/* BG GLOW */}
      <div className="absolute top-[-120px] left-[-120px] w-[350px] h-[350px] bg-blue-600/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-120px] right-[-120px] w-[350px] h-[350px] bg-indigo-600/30 rounded-full blur-3xl"></div>

      {/* THEME SWITCH */}
    

      {/* LEFT SIDE */}
      <div
        className={`hidden lg:flex lg:w-1/2 relative items-center justify-center border-r transition-all duration-500 ${
          darkMode ? "border-white/10" : "border-gray-200"
        }`}
      >
        <div className="relative z-10 max-w-lg px-10">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 backdrop-blur-md ${
              darkMode
                ? "bg-white/10 border-white/10 text-white"
                : "bg-white border-gray-200 text-slate-700"
            }`}
          >
            <Sparkles size={18} />
            <span className="text-sm tracking-wide">Plateforme intelligente</span>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl">
              <Building2 size={40} className="text-white" />
            </div>
            <div>
              <h1
                className={`text-5xl font-black tracking-tight ${
                  darkMode ? "text-white" : "text-slate-800"
                }`}
              >
                CityAppointment
              </h1>
              <p
                className={`mt-2 ${
                  darkMode ? "text-blue-100" : "text-slate-600"
                }`}
              >
                Créez votre compte et rejoignez la plateforme
              </p>
            </div>
          </div>

          {/* FEATURES */}
          <div className="space-y-5 mt-10">
            <div
              className={`flex items-center gap-4 rounded-2xl p-4 backdrop-blur-md border ${
                darkMode
                  ? "bg-white/5 border-white/10"
                  : "bg-white/70 border-gray-200"
              }`}
            >
              <ShieldCheck className="text-emerald-400" />
              <div>
                <h3
                  className={`font-semibold ${
                    darkMode ? "text-white" : "text-slate-800"
                  }`}
                >
                  Sécurité avancée
                </h3>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-300" : "text-slate-500"
                  }`}
                >
                  Vos données sont protégées et sécurisées.
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-4 rounded-2xl p-4 backdrop-blur-md border ${
                darkMode
                  ? "bg-white/5 border-white/10"
                  : "bg-white/70 border-gray-200"
              }`}
            >
              <Sparkles className="text-yellow-400" />
              <div>
                <h3
                  className={`font-semibold ${
                    darkMode ? "text-white" : "text-slate-800"
                  }`}
                >
                  Expérience moderne
                </h3>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-300" : "text-slate-500"
                  }`}
                >
                  Interface élégante et confortable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        {/* HOME BUTTON */}
        <div className="absolute top-5 right-5">
          <Link
            to="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md border transition-all duration-300 ${
              darkMode
                ? "bg-white/10 border-white/10 text-white hover:bg-white/20"
                : "bg-white border-gray-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <ArrowRight size={16} />
            Accueil
          </Link>
        </div>

        {/* CARD */}
        <div className="w-full max-w-md">
          <div
            className={`backdrop-blur-2xl rounded-[32px] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.15)] border transition-all duration-500 ${
              darkMode ? "bg-white/10 border-white/10" : "bg-white/80 border-gray-200"
            }`}
          >
            {/* HEADER */}
            <div className="text-center mb-10">
              <div className="mx-auto mb-6 w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl border-4 border-white/20">
                <User className="text-white" size={40} />
              </div>
              <h2
                className={`text-4xl font-black ${
                  darkMode ? "text-white" : "text-slate-800"
                }`}
              >
                Créer un compte
              </h2>
              <p
                className={`mt-3 text-lg ${
                  darkMode ? "text-gray-300" : "text-slate-500"
                }`}
              >
                Rejoignez la plateforme en quelques instants
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* NAME */}
              <div className="relative">
                <User
                  className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                    darkMode ? "text-gray-400" : "text-slate-400"
                  }`}
                  size={19}
                />
                <input
                  name="name"
                  placeholder="Nom complet"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={`w-full rounded-2xl py-4 pl-12 pr-4 outline-none transition-all duration-300 shadow-sm ${
                    darkMode
                      ? "bg-white/5 border border-white/10 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                      : "bg-white border border-gray-300 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-gray-400"
                  }`}
                />
              </div>

              {/* EMAIL */}
              <div className="relative">
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                    darkMode ? "text-gray-400" : "text-slate-400"
                  }`}
                  size={19}
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Adresse email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={`w-full rounded-2xl py-4 pl-12 pr-4 outline-none transition-all duration-300 shadow-sm ${
                    darkMode
                      ? "bg-white/5 border border-white/10 text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
                      : "bg-white border border-gray-300 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 hover:border-gray-400"
                  }`}
                />
              </div>

              {/* PHONE + ADDRESS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Phone
                    className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      darkMode ? "text-gray-400" : "text-slate-400"
                    }`}
                    size={19}
                  />
                  <input
                    name="phone"
                    placeholder="Téléphone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={`w-full rounded-2xl py-4 pl-12 pr-4 outline-none transition-all duration-300 shadow-sm ${
                      darkMode
                        ? "bg-white/5 border border-white/10 text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                        : "bg-white border border-gray-300 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-gray-400"
                    }`}
                  />
                </div>

                <div className="relative">
                  <MapPin
                    className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      darkMode ? "text-gray-400" : "text-slate-400"
                    }`}
                    size={19}
                  />
                  <input
                    name="address"
                    placeholder="Adresse"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={`w-full rounded-2xl py-4 pl-12 pr-4 outline-none transition-all duration-300 shadow-sm ${
                      darkMode
                        ? "bg-white/5 border border-white/10 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20"
                        : "bg-white border border-gray-300 text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 hover:border-gray-400"
                    }`}
                  />
                </div>
              </div>

              {/* CITY + ROLE ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Globe
                    className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      darkMode ? "text-gray-400" : "text-slate-400"
                    }`}
                    size={19}
                  />
                  <input
                    name="city"
                    placeholder="Ville"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={`w-full rounded-2xl py-4 pl-12 pr-4 outline-none transition-all duration-300 shadow-sm ${
                      darkMode
                        ? "bg-white/5 border border-white/10 text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
                        : "bg-white border border-gray-300 text-slate-800 placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 hover:border-gray-400"
                    }`}
                  />
                </div>

                <div className="relative">
                  <Users
                    className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      darkMode ? "text-gray-400" : "text-slate-400"
                    }`}
                    size={19}
                  />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full rounded-2xl py-4 pl-12 pr-4 outline-none transition-all duration-300 shadow-sm appearance-none bg-white border border-gray-300 text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-gray-400 ${
                      darkMode
                        ? "bg-white/5 border-white/10 text-white"
                        : ""
                    }`}
                  >
                    <option value="citizen">Citoyen</option>
                    <option value="agent">Agent Municipal</option>
                  </select>
                </div>
              </div>

              {/* PASSWORD */}
              <div className="relative">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                    darkMode ? "text-gray-400" : "text-slate-400"
                  }`}
                  size={19}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Mot de passe"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={`w-full rounded-2xl py-4 pl-12 pr-14 outline-none transition-all duration-300 shadow-sm ${
                    darkMode
                      ? "bg-white/5 border border-white/10 text-white placeholder:text-gray-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20"
                      : "bg-white border border-gray-300 text-slate-800 placeholder:text-slate-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 hover:border-gray-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                    darkMode ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
                  }`}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="relative">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                    darkMode ? "text-gray-400" : "text-slate-400"
                  }`}
                  size={19}
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirmer le mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={`w-full rounded-2xl py-4 pl-12 pr-4 outline-none transition-all duration-300 shadow-sm ${
                    darkMode
                      ? "bg-white/5 border border-white/10 text-white placeholder:text-gray-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20"
                      : "bg-white border border-gray-300 text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 hover:border-gray-400"
                  }`}
                />
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-3xl font-bold text-xl text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-2xl hover:shadow-3xl disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Création en cours...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    Créer mon compte
                    <ArrowRight size={20} />
                  </span>
                )}
              </button>
            </form>

            {/* FOOTER */}
            <div className="pt-8 border-t border-gray-200">
              <p
                className={`text-center text-sm ${
                  darkMode ? "text-gray-300" : "text-slate-500"
                }`}
              >
                Déjà un compte ?{" "}
                <Link
                  to="/login"
                  className={`font-bold transition-all duration-300 ${
                    darkMode
                      ? "text-blue-400 hover:text-blue-300 hover:underline"
                      : "text-emerald-600 hover:text-emerald-700 hover:underline"
                  }`}
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;