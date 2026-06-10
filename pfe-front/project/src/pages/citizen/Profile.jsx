import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

import {
  User, Mail, Phone, MapPin,AlertTriangle,
  Save, Trash2, CreditCard as Edit
} from 'lucide-react';

import Badge from '../../components/Badge';

const API = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/users";

const Profile = () => {

  const userLocal = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userLocal.id;

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [info, setInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  });
  const [passwords, setPasswords] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const handleChangePassword = async () => {
  if (passwords.newPassword !== passwords.confirmPassword) {
    return Swal.fire("Erreur", "Les mots de passe ne correspondent pas", "error");
  }

  try {
    await axios.put(`${API}/${userId}/password`, {
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword
    });

    setPasswords({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    Swal.fire("Succès", "Mot de passe mis à jour", "success");

  } catch (err) {
    console.log(err);
    Swal.fire("Erreur", "Mot de passe incorrect ou erreur serveur", "error");
  }
};
  // ======================
  // LOAD USER FROM DB
  // ======================
  useEffect(() => {
    if (!userId) return;

    axios.get(`${API}/${userId}`)
      .then(res => {
        setInfo(res.data);
        setLoading(false);
      })
      .catch(err => console.log(err));
  }, [userId]);

  // ======================
  // UPDATE USER
  // ======================
  const handleSave = async () => {
    try {
      const res = await axios.put(`${API}/${userId}`, info);

      setInfo(res.data);
      setEditing(false);

      localStorage.setItem("user", JSON.stringify(res.data));

      Swal.fire("Succès", "Profil mis à jour", "success");

    } catch (err) {
      console.log(err);
      Swal.fire("Erreur", "Impossible de modifier", "error");
    }
  };

  // ======================
  // DELETE ACCOUNT
  // ======================
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
          await axios.delete(`${API}/${userId}`);

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

  if (loading) return <p className="p-6">Chargement...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="card p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">{info.name}</h2>
          <Badge variant="success">Citoyen</Badge>
        </div>

        <button
          onClick={() => setEditing(!editing)}
          className="btn-secondary flex items-center gap-2"
        >
          <Edit size={16} />
          {editing ? "Annuler" : "Modifier"}
        </button>
      </div>

      {/* FORM */}
      <div className="card p-6 space-y-4">

        {[ 
          { label: "Nom", key: "name", icon: User },
          { label: "Email", key: "email", icon: Mail },
          { label: "Téléphone", key: "phone", icon: Phone },
          { label: "Adresse", key: "address", icon: MapPin },
          { label: "Ville", key: "city", icon: MapPin }
        ].map((f) => (
          <div key={f.key}>
            <label className="text-sm font-medium">{f.label}</label>

            <div className="relative">
              <f.icon size={16} className="absolute left-3 top-3 text-gray-400" />

              <input
                value={info[f.key] || ''}
                disabled={!editing}
                onChange={(e) =>
                  setInfo({ ...info, [f.key]: e.target.value })
                }
                className="input-field pl-10"
              />
            </div>
          </div>
        ))}

        {editing && (
          <button
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={16} />
            Enregistrer
          </button>
        )}

      </div>
      {/* 🔒 CHANGE PASSWORD */}
<div className="card p-6 space-y-4">

  <h3 className="text-sm font-semibold text-gray-700">
    Modifier le mot de passe
  </h3>

  <input
    type="password"
    placeholder="Mot de passe actuel"
    value={passwords.currentPassword}
    onChange={(e) =>
      setPasswords({ ...passwords, currentPassword: e.target.value })
    }
    className="input-field"
  />

  <input
    type="password"
    placeholder="Nouveau mot de passe"
    value={passwords.newPassword}
    onChange={(e) =>
      setPasswords({ ...passwords, newPassword: e.target.value })
    }
    className="input-field"
  />

  <input
    type="password"
    placeholder="Confirmer le mot de passe"
    value={passwords.confirmPassword}
    onChange={(e) =>
      setPasswords({ ...passwords, confirmPassword: e.target.value })
    }
    className="input-field"
  />

  <button
    onClick={handleChangePassword}
    className="btn-primary flex items-center gap-2"
  >
    <Save size={16} />
    Changer le mot de passe
  </button>

</div>

      {/* 🧨 ZONE DANGEREUSE */}
      <div className="card p-6 border border-red-200">

        <h3 className="text-sm font-semibold text-red-600 mb-2">
          Zone dangereuse
        </h3>

        <p className="text-xs text-gray-500 mb-4">
          La suppression du compte est définitive et irréversible.
        </p>

        <button
          onClick={handleDelete}
          className="btn-danger flex items-center gap-2"
        >
          <Trash2 size={16} />
          Supprimer mon compte
        </button>

      </div>

    </div>
  );
};

export default Profile;