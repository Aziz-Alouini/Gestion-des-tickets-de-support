import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function ImportTickets() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Choisissez un fichier Excel (.xlsx)');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.importTickets(file);
      setResult(data);
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
          <p className="eyebrow">Import en masse</p>
          <h1>Importer des tickets Excel</h1>
        </div>
      </header>

      <section className="panel form-stack">
        <p>
          Colonnes attendues : <code>titre</code>, <code>description</code>, optionnel{' '}
          <code>priorite</code>, <code>categorie</code>, <code>demandeur</code> (email),{' '}
          <code>responsable</code> (email).
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {result && (
          <div className="alert alert-success">
            {result.message}
            {result.errors?.length > 0 && (
              <ul>
                {result.errors.map((err) => (
                  <li key={`${err.ligne}-${err.message}`}>
                    Ligne {err.ligne}: {err.message}
                  </li>
                ))}
              </ul>
            )}
            <p>
              <Link to="/tickets">Voir les tickets</Link>
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="form-stack">
          <label className="file-input">
            Fichier Excel
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Import…' : 'Importer'}
          </button>
        </form>
      </section>
    </div>
  );
}
