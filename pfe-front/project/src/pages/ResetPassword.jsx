import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // ✅ useParams ajouté
import axios from 'axios';
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

const API_RESET = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/auth/reset-password";

const ResetPassword = () => {
  const { token } = useParams(); // ✅ Récupère /reset-password/66232ffd-...
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);

  // ✅ Vérification token au montage
  useEffect(() => {
    console.log('🔑 Token reçu:', token);
    
    if (token && token.length > 10) { // Validation simple
      setValidToken(true);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Lien invalide',
        text: 'Token manquant ou invalide'
      }).then(() => navigate('/login'));
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Les mots de passe ne correspondent pas'
      });
      return;
    }

    if (formData.password.length < 8) {
      Swal.fire({
        icon: 'error',
        title: 'Mot de passe trop court',
        text: 'Minimum 8 caractères'
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('📤 Envoi:', { token, passwordLength: formData.password.length });
      
      await axios.post(`${API_RESET}/${token}`, {
  password: formData.password,
  confirmPassword: formData.confirmPassword  // ← Les 2 obligatoires
});

      Swal.fire({
        icon: 'success',
        title: '✅ Succès !',
        text: 'Mot de passe réinitialisé avec succès',
        timer: 2500,
        timerProgressBar: true
      }).then(() => {
        navigate('/login', { replace: true });
      });

    } catch (error) {
      console.error('❌ Reset error:', error.response?.data || error.message);
      
      const message = error.response?.data?.message || 
                     'Erreur lors de la réinitialisation';
                     
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Nouveau mot de passe
          </h2>
          <p className="text-gray-600 text-sm">
            Entrez votre nouveau mot de passe sécurisé (8+ caractères)
          </p>
        </div>

        {/* Debug Token (supprimez en prod) */}
        <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-800 text-center">
          Token: {token?.slice(0,8)}...
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <input
              type="password"
              name="password"
              placeholder="Nouveau mot de passe"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white/50"
              minLength={8}
              required
              disabled={loading}
            />
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirmer le mot de passe"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white/50"
              minLength={8}
              required
              disabled={loading}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || formData.password !== formData.confirmPassword}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Réinitialisation...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Réinitialiser le mot de passe
                <CheckCircle size={20} />
              </span>
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 text-gray-700 hover:text-blue-600 font-medium py-3 px-4 rounded-xl hover:bg-gray-50 transition-all duration-200"
            disabled={loading}
          >
            <ArrowLeft size={18} />
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;