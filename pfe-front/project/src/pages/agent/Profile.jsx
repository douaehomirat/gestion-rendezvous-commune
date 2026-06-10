import { useEffect, useState } from 'react';
import {
  User, Mail, Phone, Building2,
  Lock, Save, CreditCard as Edit,
  Camera, MapPin, Trash2
} from 'lucide-react';
import Badge from '../../components/Badge';
import Swal from 'sweetalert2';

const Profile = () => {

  const userLocal = JSON.parse(localStorage.getItem('user') || '{}');

  const [editing, setEditing] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: '' });

  const [info, setInfo] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    office: ''
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [conge, setConge] = useState({
    startDate: '',
    endDate: '',
    type: 'ANNUEL'
  });

  const [conges, setConges] = useState([]);

  // ================= POPUP =================
  const showPopup = (msg) => {
    setPopup({ show: true, message: msg });
    setTimeout(() => setPopup({ show: false, message: '' }), 2500);
  };

  // ================= LOAD USER =================
  const loadUser = async () => {
    try {
      const res = await fetch(`https://gestion-rendezvous-commune-production-b126.up.railway.app/api/users/${userLocal.id}`);
      const data = await res.json();

      setInfo({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        department: data.departement?.name || '',
        office: data.bureau || ''
      });

    } catch (err) {
      console.error(err);
    }
  };

  // ================= LOAD CONGES =================
  const loadConges = async () => {
    try {
      const res = await fetch(`https://gestion-rendezvous-commune-production-b126.up.railway.app/api/conges/agent/${userLocal.id}`);
      const data = await res.json();
      setConges(Array.isArray(data) ? data : []);
    } catch (err) {
      setConges([]);
    }
  };

  useEffect(() => {
    if (userLocal.id) {
      loadUser();
      loadConges();
    }
  }, []);

  // ================= UPDATE USER =================
  const handleUpdateUser = async () => {
    try {
      const res = await fetch(`https://gestion-rendezvous-commune-production-b126.up.railway.app/api/users/${userLocal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info)
      });

      if (res.ok) {
        setEditing(false);
        showPopup("Profil mis à jour avec succès");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ================= CHANGE PASSWORD =================
  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      showPopup("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const res = await fetch(`https://gestion-rendezvous-commune-production-b126.up.railway.app/api/users/${userLocal.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      });

if (res.ok) {
  setPasswords({ current: '', new: '', confirm: '' });

  Swal.fire({
    icon: "success",
    title: "Succès",
    text: "Mot de passe mis à jour avec succès"
  });

} else {
  Swal.fire({
    icon: "error",
    title: "Erreur",
    text: "Mot de passe actuel incorrect"
  });
}
    } catch (err) {
      console.error(err);
      showPopup("Erreur serveur");
    }
  };

  // ================= ADD CONGE =================
  const handleAddConge = async () => {
    if (!conge.startDate || !conge.endDate) {
      showPopup("Remplir les dates");
      return;
    }

    const res = await fetch("https://gestion-rendezvous-commune-production-b126.up.railway.app/api/conges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...conge, agentId: userLocal.id })
    });

    if (res.ok) {
      loadConges();
      setConge({ startDate: '', endDate: '', type: 'ANNUEL' });
      showPopup("Congé ajouté");
    }
  };

  // ================= DELETE CONGE =================
  const handleDelete = async (id) => {
    const res = await fetch(`https://gestion-rendezvous-commune-production-b126.up.railway.app/api/conges/${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      loadConges();
      showPopup("Congé supprimé");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* POPUP */}
      {popup.show && (
        <div className="fixed top-5 right-5 bg-black text-white px-4 py-2 rounded-lg shadow-lg">
          {popup.message}
        </div>
      )}

      {/* HEADER */}
      <div className="card p-6">
        <div className="flex justify-between items-center">

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 text-2xl font-bold">
                {info.name?.charAt(0)}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold">{info.name}</h2>
              <div className="text-sm text-gray-500">{info.department}</div>
              <Badge variant="primary">Agent Municipal</Badge>
            </div>
          </div>

          <button
            onClick={() => editing ? handleUpdateUser() : setEditing(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit size={16} />
            {editing ? "Enregistrer" : "Modifier"}
          </button>

        </div>
      </div>

      {/* INFO */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Informations personnelles</h3>

        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "name", label: "Nom", icon: User },
            { key: "email", label: "Email", icon: Mail },
            { key: "phone", label: "Téléphone", icon: Phone },
            { key: "department", label: "Département", icon: Building2 },
            { key: "office", label: "Bureau", icon: MapPin }
          ].map(f => (
            <div key={f.key}>
              <label>{f.label}</label>
              <div className="relative">
                <f.icon className="absolute left-3 top-2 text-gray-400" size={16} />
                <input
                  className="input-field pl-10"
                  disabled={!editing}
                  value={info[f.key]}
                  onChange={(e) => setInfo({ ...info, [f.key]: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONGES */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Congés</h3>

        <div className="grid grid-cols-3 gap-3">
          <input type="date" className="input-field"
            value={conge.startDate}
            onChange={e => setConge({ ...conge, startDate: e.target.value })}
          />

          <input type="date" className="input-field"
            value={conge.endDate}
            onChange={e => setConge({ ...conge, endDate: e.target.value })}
          />

          <select className="input-field"
            value={conge.type}
            onChange={e => setConge({ ...conge, type: e.target.value })}
          >
            <option>ANNUEL</option>
            <option>MALADIE</option>
            <option>URGENCE</option>
          </select>
        </div>

        <button onClick={handleAddConge}
          className="btn-primary mt-4">
          Ajouter congé
        </button>

        <div className="mt-4 space-y-2">
          {conges.map(c => (
            <div key={c.id}
              className="flex justify-between bg-gray-50 p-2 rounded">

              <span>{c.startDate} → {c.endDate} ({c.type})</span>

              <button onClick={() => handleDelete(c.id)}>
                <Trash2 size={16} />
              </button>

            </div>
          ))}
        </div>
      </div>

      {/* MOT DE PASSE */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold">Modifier le mot de passe</h3>

        {[
          { key: "current", label: "Mot de passe actuel",    placeholder: "Mot de passe actuel" },
          { key: "new",     label: "Nouveau mot de passe",   placeholder: "Nouveau mot de passe" },
          { key: "confirm", label: "Confirmer",              placeholder: "Confirmer le mot de passe" }
        ].map(f => (
          <div key={f.key}>
            <label className="text-sm font-medium">{f.label}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="password"
                placeholder={f.placeholder}
                className="input-field pl-10"
                value={passwords[f.key]}
                onChange={(e) => setPasswords({ ...passwords, [f.key]: e.target.value })}
              />
            </div>
          </div>
        ))}

        <button onClick={handleChangePassword} className="btn-primary flex items-center gap-2">
          <Save size={16} />
          Changer le mot de passe
        </button>
      </div>

    </div>
  );
};

export default Profile;