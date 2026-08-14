import { Link, Navigate, NavLink, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./Login";
import Categories from "./Categories";
import ProjectList from "./ProjectList";
import ProjectEditor from "./ProjectEditor";
import Leads from "./Leads";
import Testimonials from "./Testimonials";
import "./admin.css";

function AdminShell() {
  const { user, isAdmin, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="admin-auth">
        <p className="admin-muted">Checking your session…</p>
      </div>
    );
  }

  if (!user) return <Login />;

  // Signed in but not an admin. Say so plainly rather than bouncing them back
  // to a login form they just completed successfully.
  if (!isAdmin) {
    return (
      <div className="admin-auth">
        <div className="admin-auth__card">
          <h1 className="admin-auth__title">Not an admin</h1>
          <p className="admin-muted">
            You&apos;re signed in as <strong>{user.email}</strong>, but this account doesn&apos;t
            have admin access.
          </p>
          <p className="admin-muted small">
            Set <code>is_admin = 1</code> on this user in the database to grant it.
          </p>
          <button className="admin-btn admin-btn--ghost w-100" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-sidebar__brand">
          <span className="admin-sidebar__wordmark">Dreamy&nbsp;Space</span>
        </Link>

        <nav className="admin-nav">
          <NavLink to="/admin/projects" className="admin-nav__link">
            Projects
          </NavLink>
          <NavLink to="/admin/categories" className="admin-nav__link">
            Categories
          </NavLink>
          <NavLink to="/admin/testimonials" className="admin-nav__link">
            Testimonials
          </NavLink>
          <NavLink to="/admin/enquiries" className="admin-nav__link">
            Enquiries
          </NavLink>
          <a href="/" className="admin-nav__link" target="_blank" rel="noreferrer">
            View site ↗
          </a>
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-muted small">{user.email}</div>
          <button className="admin-btn admin-btn--ghost w-100" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Routes>
          <Route index element={<Navigate to="projects" replace />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:id" element={<ProjectEditor />} />
          <Route path="categories" element={<Categories />} />
          <Route path="testimonials" element={<Testimonials />} />
          <Route path="enquiries" element={<Leads />} />
          <Route path="*" element={<Navigate to="projects" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <AdminShell />
    </AuthProvider>
  );
}
