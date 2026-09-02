import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { CATEGORIES, PRIORITES, STATUTS, PriorityBadge, StatusBadge, formatDate } from '../components/Badges';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    statut: '',
    priorite: '',
    categorie: '',
  });

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const q = params.toString();
    return q ? `?${q}` : '';
  }, [filters]);

  useEffect(() => {
    api
      .tickets(query)
      .then(setTickets)
      .catch((err) => setError(err.message));
  }, [query]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Suivi</p>
          <h1>Tickets</h1>
        </div>
        <Link className="btn btn-primary" to="/tickets/new">
          Créer un ticket
        </Link>
      </header>

      <section className="filters panel">
        <input
          placeholder="Rechercher (n°, titre, description)…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <select
          value={filters.statut}
          onChange={(e) => setFilters((f) => ({ ...f, statut: e.target.value }))}
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filters.priorite}
          onChange={(e) => setFilters((f) => ({ ...f, priorite: e.target.value }))}
        >
          <option value="">Toutes les priorités</option>
          {PRIORITES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={filters.categorie}
          onChange={(e) => setFilters((f) => ({ ...f, categorie: e.target.value }))}
        >
          <option value="">Toutes les catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Titre</th>
                <th>Statut</th>
                <th>Priorité</th>
                <th>Catégorie</th>
                <th>Demandeur</th>
                <th>Responsable</th>
                <th>Mis à jour</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty">
                    Aucun ticket trouvé
                  </td>
                </tr>
              )}
              {tickets.map((t) => (
                <tr key={t._id}>
                  <td>
                    <Link to={`/tickets/${t._id}`}>{t.numero}</Link>
                  </td>
                  <td>
                    <Link to={`/tickets/${t._id}`}>{t.titre}</Link>
                  </td>
                  <td>
                    <StatusBadge value={t.statut} />
                  </td>
                  <td>
                    <PriorityBadge value={t.priorite} />
                  </td>
                  <td>{t.categorie}</td>
                  <td>{t.demandeur?.nom || '—'}</td>
                  <td>{t.responsable?.nom || '—'}</td>
                  <td>{formatDate(t.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
