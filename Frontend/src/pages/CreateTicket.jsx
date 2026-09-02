import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { CATEGORIES, PRIORITES } from '../components/Badges';

export default function CreateTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titre: '',
    description: '',
    priorite: 'Moyenne',
    categorie: 'Autre',
    responsable: '',
  });

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'agent') {
      api.users('?role=agent').then(setAgents).catch(() => {});
    }
  }, [user]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        responsable: form.responsable || undefined,
      };
      const ticket = await api.createTicket(payload);
      navigate(`/tickets/${ticket._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page narrow">
      <header className="page-header">
        <div>
          <p className="eyebrow">Création</p>
          <h1>Nouveau ticket</h1>
        </div>
      </header>

      <form className="panel form-stack" onSubmit={onSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <label>
          Titre
          <input name="titre" value={form.titre} onChange={onChange} required />
        </label>

        <label>
          Description
          <textarea
            name="description"
            rows={6}
            value={form.description}
            onChange={onChange}
            required
          />
        </label>

        <div className="form-row">
          <label>
            Priorité
            <select name="priorite" value={form.priorite} onChange={onChange}>
              {PRIORITES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label>
            Catégorie
            <select name="categorie" value={form.categorie} onChange={onChange}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        {(user?.role === 'admin' || user?.role === 'agent') && (
          <label>
            Responsable
            <select name="responsable" value={form.responsable} onChange={onChange}>
              <option value="">Non assigné</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nom}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="actions">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Création…' : 'Créer le ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
