import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import {
  CATEGORIES,
  PRIORITES,
  STATUTS,
  PriorityBadge,
  StatusBadge,
  formatDate,
} from '../components/Badges';

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isStaff = user?.role === 'admin' || user?.role === 'agent';

  const load = () =>
    api
      .ticket(id)
      .then(setTicket)
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
    if (isStaff) {
      Promise.all([api.users('?role=agent'), api.users('?role=admin')])
        .then(([agentsList, admins]) => setAgents([...agentsList, ...admins]))
        .catch(() => {});
    }
  }, [id, isStaff]);

  const updateField = async (payload) => {
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateTicket(id, payload);
      setTicket(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSaving(true);
    try {
      const updated = await api.comment(id, comment);
      setTicket(updated);
      setComment('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Supprimer ce ticket ?')) return;
    await api.deleteTicket(id);
    navigate('/tickets');
  };

  if (error && !ticket) return <div className="alert alert-error">{error}</div>;
  if (!ticket) return <div className="loading">Chargement du ticket…</div>;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">
            <Link to="/tickets">Tickets</Link> / {ticket.numero}
          </p>
          <h1>{ticket.titre}</h1>
          <div className="meta-row">
            <StatusBadge value={ticket.statut} />
            <PriorityBadge value={ticket.priorite} />
            <span>{ticket.categorie}</span>
          </div>
        </div>
        {user?.role === 'admin' && (
          <button type="button" className="btn btn-danger" onClick={remove}>
            Supprimer
          </button>
        )}
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-detail">
        <section className="panel">
          <h3>Description</h3>
          <p className="description">{ticket.description}</p>

          <div className="info-grid">
            <div>
              <span>Demandeur</span>
              <strong>{ticket.demandeur?.nom}</strong>
            </div>
            <div>
              <span>Responsable</span>
              <strong>{ticket.responsable?.nom || 'Non assigné'}</strong>
            </div>
            <div>
              <span>Créé le</span>
              <strong>{formatDate(ticket.createdAt)}</strong>
            </div>
            <div>
              <span>Mis à jour</span>
              <strong>{formatDate(ticket.updatedAt)}</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <h3>Suivi</h3>
          <div className="form-stack">
            {isStaff && (
              <>
                <label>
                  Statut
                  <select
                    value={ticket.statut}
                    disabled={saving}
                    onChange={(e) => updateField({ statut: e.target.value })}
                  >
                    {STATUTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Responsable
                  <select
                    value={ticket.responsable?._id || ''}
                    disabled={saving}
                    onChange={(e) =>
                      updateField({ responsable: e.target.value || null })
                    }
                  >
                    <option value="">Non assigné</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nom} ({a.role})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Catégorie
                  <select
                    value={ticket.categorie}
                    disabled={saving}
                    onChange={(e) => updateField({ categorie: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label>
              Priorité
              <select
                value={ticket.priorite}
                disabled={saving}
                onChange={(e) => updateField({ priorite: e.target.value })}
              >
                {PRIORITES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      </div>

      <div className="grid-2">
        <section className="panel">
          <h3>Commentaires</h3>
          <ul className="timeline">
            {ticket.commentaires.length === 0 && <li className="empty">Aucun commentaire</li>}
            {[...ticket.commentaires].reverse().map((c) => (
              <li key={c._id}>
                <div className="timeline-head">
                  <strong>{c.auteur?.nom || 'Utilisateur'}</strong>
                  <span>{formatDate(c.createdAt)}</span>
                </div>
                <p>{c.contenu}</p>
              </li>
            ))}
          </ul>
          <form className="form-stack" onSubmit={addComment}>
            <textarea
              rows={3}
              placeholder="Ajouter un commentaire…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={saving}>
              Publier
            </button>
          </form>
        </section>

        <section className="panel">
          <h3>Historique</h3>
          <ul className="timeline">
            {[...ticket.historique].reverse().map((h) => (
              <li key={h._id}>
                <div className="timeline-head">
                  <strong>{h.action}</strong>
                  <span>{formatDate(h.createdAt)}</span>
                </div>
                <p>
                  {h.details}
                  {h.auteur?.nom ? ` — ${h.auteur.nom}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
