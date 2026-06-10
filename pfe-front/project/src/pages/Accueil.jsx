import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  MapPin,
  Users,
  Building2,
  Phone,
  Mail,
  Globe,
  ArrowRight,
  Sparkles,
  CheckCircle,
  ChevronDown,
  Calendar,
  FileText,
} from "lucide-react";

const API_CITIZENS = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/users/citizens";
const API_DEPARTMENTS = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/departments";

const CommuneAccueil = () => {
  const navigate = useNavigate();

  const [citizens, setCitizens] = useState(0);
  const [departments, setDepartments] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);

        const [res1, res2] = await Promise.all([
          axios.get(API_CITIZENS),
          axios.get(API_DEPARTMENTS),
        ]);

        setCitizens(Array.isArray(res1.data) ? res1.data.length : res1.data);
        setDepartments(
          Array.isArray(res2.data) ? res2.data.length : res2.data
        );
      } catch (err) {
        console.error("Erreur chargement stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/70 to-blue-100/50 overflow-hidden">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl mb-6 animate-float">
            <Sparkles className="w-5 h-5 text-blue-300 animate-pulse" />
            <span className="text-sm md:text-base font-semibold">
              Administration Digitale Moderne
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-5">
            Bienvenue
            <br />
            <span className="text-transparent bg-gradient-to-r from-blue-300 via-blue-200 to-blue-400 bg-clip-text">
              à la Commune
            </span>
          </h1>

          <p className="text-lg md:text-xl text-blue-100/95 max-w-3xl mx-auto mb-10 leading-relaxed">
            Une administration moderne, digitale et proche des citoyens
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate("/login")}
              className="group bg-white text-blue-900 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
            >
              Découvrir les services
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate("/login")}
              className="group bg-white/20 backdrop-blur-xl hover:bg-white/30 border border-white/40 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center gap-2"
            >
              Prendre RDV
              <ChevronDown className="w-5 h-5 group-hover:rotate-180 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative -mt-10 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 relative z-10">
            <div className="bg-white/90 p-6 rounded-2xl shadow-xl text-center">
              <Users className="mx-auto text-blue-600 w-8 h-8" />

              <h3 className="text-3xl font-black mt-3">
                {loading ? "..." : `+${citizens.toLocaleString()}`}
              </h3>

              <p className="text-gray-600">Citoyens</p>
            </div>

            <div className="bg-white/90 p-6 rounded-2xl shadow-xl text-center">
              <Building2 className="mx-auto text-blue-500 w-8 h-8" />

              <h3 className="text-3xl font-black mt-3">
                {loading ? "..." : departments.toLocaleString()}
              </h3>

              <p className="text-gray-600">Services</p>
            </div>

            <div className="bg-white/90 p-6 rounded-2xl shadow-xl text-center">
              <Phone className="mx-auto text-blue-700 w-8 h-8" />

              <h3 className="text-3xl font-black mt-3">24/7</h3>

              <p className="text-gray-600">Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-bold text-sm shadow-lg mb-6">
              <Sparkles className="w-4 h-4" />
              Mission
            </span>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-6">
              Une commune
              <br />
              <span className="text-transparent bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text">
                au service du citoyen
              </span>
            </h2>

            <div className="space-y-5 text-base md:text-lg text-gray-700 leading-relaxed">
              <p>
                Notre commune s'engage dans une transformation digitale pour
                rendre les services publics plus rapides, accessibles et
                transparents.
              </p>

              <div className="grid md:grid-cols-2 gap-4 pt-5">
                {[
                  "Traitement rapide",
                  "Démarches digitalisées",
                  "Suivi temps réel",
                  "Sécurité maximale",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-md border border-blue-100"
                  >
                    <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>

                    <span className="font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-blue-100">
            <h3 className="text-2xl font-black text-gray-900 mb-8 text-center">
              Nos valeurs
            </h3>

            <div className="space-y-5">
              <div className="flex items-center gap-4 p-5 bg-blue-50 rounded-2xl">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>

                <div>
                  <h4 className="font-bold text-lg text-gray-900">
                    Proximité
                  </h4>

                  <p className="text-gray-600">
                    À l'écoute des citoyens
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-5 bg-blue-50 rounded-2xl">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>

                <div>
                  <h4 className="font-bold text-lg text-gray-900">
                    Innovation
                  </h4>

                  <p className="text-gray-600">
                    Digitalisation avancée
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-5 bg-blue-50 rounded-2xl">
                <div className="w-12 h-12 bg-blue-700 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>

                <div>
                  <h4 className="font-bold text-lg text-gray-900">
                    Fiabilité
                  </h4>

                  <p className="text-gray-600">
                    Services de qualité
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-20 bg-gradient-to-b from-white to-blue-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-bold text-sm shadow-lg mb-6">
              Services
            </span>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Tout au bout
              <br />
              <span className="text-transparent bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text">
                d'un clic
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "État Civil",
                desc: "Actes de naissance, mariage et certificats.",
                icon: Users,
                color: "from-blue-500 to-blue-600",
              },
              {
                title: "Rendez-vous",
                desc: "Prise de rendez-vous rapide et simple.",
                icon: Calendar,
                color: "from-blue-400 to-blue-500",
              },
              {
                title: "Documents",
                desc: "Demande et délivrance des documents.",
                icon: FileText,
                color: "from-blue-600 to-blue-700",
              },
            ].map((service, i) => (
              <div
                key={i}
                onClick={() => navigate("/login")}
                className="group bg-white rounded-3xl shadow-xl hover:shadow-blue-500/20 hover:-translate-y-3 transition-all duration-500 cursor-pointer border border-blue-100 p-6"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}
                >
                  <service.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-black text-gray-900 text-center mb-4">
                  {service.title}
                </h3>

                <p className="text-gray-600 text-center leading-relaxed">
                  {service.desc}
                </p>

                <div className="flex justify-center mt-6">
                  <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8">
              Contactez-nous
            </h2>

            <div className="space-y-5">
              {[
                {
                  icon: Phone,
                  label: "+212 600 000 000",
                  desc: "Lundi-Vendredi 9h-17h",
                },
                {
                  icon: Mail,
                  label: "contact@commune.ma",
                  desc: "Réponse sous 24h",
                },
                {
                  icon: Globe,
                  label: "www.commune.ma",
                  desc: "Plateforme 24/7",
                },
              ].map((contact, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-lg border border-blue-100"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                    <contact.icon className="w-6 h-6 text-white" />
                  </div>

                  <div>
                    <div className="font-bold text-lg text-gray-900">
                      {contact.label}
                    </div>

                    <div className="text-gray-600">{contact.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-blue-100">
            <h3 className="text-2xl font-black text-gray-900 mb-8 text-center">
              Horaires d'ouverture
            </h3>

            <div className="space-y-5 text-center">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                <div className="text-3xl font-black text-blue-600 mb-2">
                  L-V
                </div>

                <div className="text-xl font-bold text-gray-900">
                  09h - 17h
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <div className="text-3xl font-black text-gray-500 mb-2">
                  WeekEnd
                </div>

                <div className="text-xl font-bold text-gray-700">
                  Fermé
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl mb-8">
            <Sparkles className="w-5 h-5 text-blue-300" />

            <span className="text-lg font-bold">
              Commune Moderne 2026
            </span>
          </div>

          <p className="text-lg text-blue-100/90 mb-6">
            Ensemble pour une administration d'excellence
          </p>

          <div className="flex flex-wrap justify-center gap-5 text-sm md:text-base mb-8">
            <a href="#" className="hover:text-blue-300 transition-colors">
              Services
            </a>

            <a href="#" className="hover:text-blue-300 transition-colors">
              Contact
            </a>

            <a href="#" className="hover:text-blue-300 transition-colors">
              RDV
            </a>
          </div>

          <div className="border-t border-white/20 pt-6">
            <p className="text-sm text-blue-200/80">
              © 2026 Commune Moderne - Tous droits réservés
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CommuneAccueil;