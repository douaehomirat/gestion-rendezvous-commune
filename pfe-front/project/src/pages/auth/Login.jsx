import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  Eye,
  EyeOff,
  Building2,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Mail as MailIcon,
  Sun,
  Moon,
} from "lucide-react";
import Swal from "sweetalert2";

const API_LOGIN = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/auth/login";
const API_FORGOT_PASSWORD = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/auth/forgot-password";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Thème CLair par défaut (false = light, true = dark)
  const [darkMode, setDarkMode] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // =========================
  // HANDLE CHANGE
  // =========================
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // =========================
  // NORMALIZE ROLE
  // =========================
  const normalizeRole = (role) => {
    if (!role) return "";

    return role
      .toString()
      .replace("ROLE_", "")
      .trim()
      .toLowerCase();
  };

  // =========================
  // REDIRECT ROLE
  // =========================
  const getRouteByRole = (role) => {
    switch (role) {
      case "admin":
        return "/admin/dashboard";
      case "agent":
        return "/agent/dashboard";
      case "citizen":
        return "/citizen/dashboard";
      default:
        return "/login";
    }
  };

  // =========================
  // LOGIN
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const res = await axios.post(API_LOGIN, {
        email: formData.email.trim(),
        password: formData.password,
      });

      const data = res.data;
      const user = data.user || data;
      const token = data.token || "logged";

      if (!user?.role) {
        throw new Error("Role manquant dans backend");
      }

      login(user, token);

      const normalizedRole = normalizeRole(user.role);
      const route = getRouteByRole(normalizedRole);

      Swal.fire({
        icon: "success",
        title: "Connexion réussie",
        text: `Bienvenue ${user.name || user.fullName || "Utilisateur"}`,
        timer: 1200,
        showConfirmButton: false,
        background: darkMode ? "#0f172a" : "#ffffff",
        color: darkMode ? "#ffffff" : "#0f172a",
      }).then(() => {
        navigate(route, { replace: true });
      });
    } catch (error) {
      let msg = "Email ou mot de passe incorrect";

      if (error.response?.status === 400) {
        msg = error.response?.data?.message || "Erreur validation";
      } else if (error.response?.status === 401) {
        msg = "Email ou mot de passe incorrect";
      } else if (error.response?.status === 403) {
        msg = "Compte non autorisé";
      } else if (error.message) {
        msg = error.message;
      }

      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: msg,
        background: darkMode ? "#0f172a" : "#ffffff",
        color: darkMode ? "#ffffff" : "#0f172a",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FORGOT PASSWORD
  // =========================
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (forgotLoading) return;

    if (!forgotEmail.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Email requis",
        text: "Veuillez saisir votre adresse email",
        background: darkMode ? "#0f172a" : "#ffffff",
        color: darkMode ? "#ffffff" : "#0f172a",
      });
      return;
    }

    setForgotLoading(true);

    try {
      await axios.post(API_FORGOT_PASSWORD, {
        email: forgotEmail.trim(),
      });

      Swal.fire({
        icon: "success",
        title: "Email envoyé !",
        text: "Vérifiez votre boîte mail pour le lien de réinitialisation.",
        timer: 3500,
        showConfirmButton: false,
        background: darkMode ? "#0f172a" : "#ffffff",
        color: darkMode ? "#ffffff" : "#0f172a",
      }).then(() => {
        setForgotMode(false);
        setForgotEmail("");
      });
    } catch (error) {
      let msg = "Email non trouvé ou erreur serveur";

      if (error.response?.status === 404) {
        msg = "Aucun compte trouvé avec cet email";
      } else if (error.response?.status === 400) {
        msg = error.response?.data?.message || "Email invalide";
      }

      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: msg,
        background: darkMode ? "#0f172a" : "#ffffff",
        color: darkMode ? "#ffffff" : "#0f172a",
      });
    } finally {
      setForgotLoading(false);
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
                Gestion moderne des rendez-vous municipaux
              </p>
            </div>
          </div>

          {/* Features */}
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
                  Protection et confidentialité des données.
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
                  Expérience fluide
                </h3>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-300" : "text-slate-500"
                  }`}
                >
                  Interface moderne.
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
              darkMode
                ? "bg-white/10 border-white/10"
                : "bg-white/80 border-gray-200"
            }`}
          >
            {/* HEADER */}
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl">
                {forgotMode ? (
                  <MailIcon className="text-white" size={34} />
                ) : (
                  <Lock className="text-white" size={34} />
                )}
              </div>
              <h2
                className={`text-3xl font-bold ${
                  darkMode ? "text-white" : "text-slate-800"
                }`}
              >
                {forgotMode ? "Mot de passe oublié" : "Connexion"}
              </h2>
              <p
                className={`mt-2 text-sm ${
                  darkMode ? "text-gray-300" : "text-slate-500"
                }`}
              >
                {forgotMode
                  ? "Recevez un lien sécurisé de réinitialisation"
                  : "Accédez à votre espace sécurisé"}
              </p>
            </div>

            {/* LOGIN FORM */}
            {!forgotMode ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* EMAIL */}
                <div className="relative">
                  <Mail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      darkMode ? "text-gray-400" : "text-slate-400"
                    }`}
                    size={19}
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Adresse email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={`w-full rounded-2xl py-4 pl-12 pr-4 outline-none transition-all ${
                      darkMode
                        ? "bg-white/5 border border-white/10 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                        : "bg-white border border-gray-300 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    }`}
                  />
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
                    className={`w-full rounded-2xl py-4 pl-12 pr-14 outline-none transition-all ${
                      darkMode
                        ? "bg-white/5 border border-white/10 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                        : "bg-white border border-gray-300 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                      darkMode ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    "Connexion..."
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Se connecter
                      <ArrowRight size={18} />
                    </span>
                  )}
                </button>

                {/* FORGOT PASSWORD */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className={`text-sm transition-colors ${
                      darkMode ? "text-blue-300 hover:text-white" : "text-blue-600 hover:text-blue-800"
                    }`}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </form>
            ) : (
              /* FORGOT PASSWORD FORM */
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="relative">
                  <MailIcon
                    className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      darkMode ? "text-gray-400" : "text-slate-400"
                    }`}
                    size={19}
                  />
                  <input
                    type="email"
                    placeholder="Votre adresse email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    disabled={forgotLoading}
                    className={`w-full rounded-2xl py-4 pl-12 pr-4 outline-none transition-all ${
                      darkMode
                        ? "bg-white/5 border border-white/10 text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
                        : "bg-white border border-gray-300 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:scale-[1.02] transition-all duration-300 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {forgotLoading ? (
                    "Envoi..."
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Envoyer le lien
                      <MailIcon size={18} />
                    </span>
                  )}
                </button>

                {/* BACK BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(false);
                    setForgotEmail("");
                  }}
                  className={`w-full text-sm transition-colors ${
                    darkMode ? "text-gray-300 hover:text-white" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  ← Retour à la connexion
                </button>
              </form>
            )}

            {/* REGISTER LINK */}
            {!forgotMode && (
              <p
                className={`text-center text-sm mt-8 ${
                  darkMode ? "text-gray-300" : "text-slate-500"
                }`}
              >
                Pas de compte ?{" "}
                <Link
                  to="/register"
                  className={`font-semibold transition-colors ${
                    darkMode ? "text-blue-300 hover:text-white" : "text-blue-600 hover:text-blue-800"
                  }`}
                >
                  Créer un compte
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;