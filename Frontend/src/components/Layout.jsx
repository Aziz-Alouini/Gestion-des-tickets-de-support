import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">ST</span>
          <div>
            <strong>SupportTickets</strong>
            <p>Plateforme de suivi</p>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" end>
            Tableau de bord
          </NavLink>
          <NavLink to="/tickets">Tickets</NavLink>
          <NavLink to="/tickets/new">Nouveau ticket</NavLink>
          {(user?.role === 'admin' || user?.role === 'agent') && (
            <NavLink to="/import">Import Excel</NavLink>
          )}
          {user?.role === 'admin' && <NavLink to="/users">Utilisateurs</NavLink>}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <strong>{user?.nom}</strong>
            <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onLogout}>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
