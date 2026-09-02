import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatDate } from '../components/Badges';

const emptyForm = { nom: '', email: '', password: '', role: 'demandeur' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => api.users().then(setUsers).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onCreate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.createUser(form);
      setForm(emptyForm);
      setMessage('Utilisateur créé');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActif = async (user) => {
    await api.updateUser(user.id, { actif: !user.actif });
    load();
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Utilisateurs</h1>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="grid-2">
        <section className="panel">
          <h3>Créer un compte</h3>
          <form className="form-stack" onSubmit={onCreate}>
            <label>
              Nom
              <input name="nom" value={form.nom} onChange={onChange} required />
            </label>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
              />
            </label>
            <label>
              Mot de passe
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                required
                minLength={6}
              />
            </label>
            <label>
              Rôle
              <select name="role" value={form.role} onChange={onChange}>
                <option value="demandeur">demandeur</option>
                <option value="agent">agent</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <button className="btn btn-primary" type="submit">
              Créer
            </button>
          </form>
        </section>

        <section className="panel">
          <h3>Liste ({users.length})</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Créé</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nom}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>{u.role}</span>
                    </td>
                    <td>{u.actif ? 'Actif' : 'Inactif'}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => toggleActif(u)}
                      >
                        {u.actif ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
