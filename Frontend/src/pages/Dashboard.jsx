import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { PriorityBadge, StatusBadge, formatDate } from '../components/Badges';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .stats()
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return <div className="loading">Chargement du tableau de bord…</div>;

  const statutEntries = Object.entries(stats.parStatut || {});
  const prioriteEntries = Object.entries(stats.parPriorite || {});

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Vue d’ensemble</p>
          <h1>Tableau de bord</h1>
        </div>
        <Link className="btn btn-primary" to="/tickets/new">
          Nouveau ticket
        </Link>
      </header>

      <section className="kpi-grid">
        <article className="kpi">
          <span>Total tickets</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="kpi">
          <span>En cours</span>
          <strong>{stats.enCours}</strong>
        </article>
        <article className="kpi">
          <span>Résolus / clôturés</span>
          <strong>{stats.resolus}</strong>
        </article>
        <article className="kpi">
          <span>Taux de résolution</span>
          <strong>{stats.tauxResolution}%</strong>
        </article>
      </section>

      <section className="grid-2">
        <article className="panel">
          <h3>Répartition par statut</h3>
          <ul className="stat-list">
            {statutEntries.length === 0 && <li>Aucune donnée</li>}
            {statutEntries.map(([label, count]) => (
              <li key={label}>
                <StatusBadge value={label} />
                <span className="bar">
                  <i style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }} />
                </span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h3>Répartition par priorité</h3>
          <ul className="stat-list">
            {prioriteEntries.length === 0 && <li>Aucune donnée</li>}
            {prioriteEntries.map(([label, count]) => (
              <li key={label}>
                <PriorityBadge value={label} />
                <span className="bar">
                  <i style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }} />
                </span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Tickets récents</h3>
          <Link to="/tickets">Voir tout</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Titre</th>
                <th>Statut</th>
                <th>Priorité</th>
                <th>Créé le</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((t) => (
                <tr key={t._id}>
                  <td>
                    <Link to={`/tickets/${t._id}`}>{t.numero}</Link>
                  </td>
                  <td>{t.titre}</td>
                  <td>
                    <StatusBadge value={t.statut} />
                  </td>
                  <td>
                    <PriorityBadge value={t.priorite} />
                  </td>
                  <td>{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
