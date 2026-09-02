import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@support.local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-hero">
          <p className="eyebrow">SupportTickets</p>
          <h1>Centralisez, suivez et résolvez vos demandes.</h1>
          <p className="lead">
            Une plateforme unique pour l’équipe support : tickets, priorités, historique et
            collaboration.
          </p>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <h2>Connexion</h2>
          {error && <div className="alert alert-error">{error}</div>}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

          <div className="hint-box">
            <p>Comptes de démo après seed :</p>
            <ul>
              <li>admin@support.local / Admin123!</li>
              <li>agent@support.local / Agent123!</li>
              <li>alice@support.local / User123!</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}
