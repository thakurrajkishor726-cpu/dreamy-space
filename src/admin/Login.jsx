import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setBusy(false);
    if (signInError) setError(signInError);
  };

  return (
    <div className="admin-auth">
      <form className="admin-auth__card" onSubmit={handleSubmit}>
        <img src="/images/logo/logo.png" alt="Dreamy Space" className="admin-auth__logo" />
        <h1 className="admin-auth__title">Catalogue Admin</h1>
        <p className="admin-auth__subtitle">Sign in to manage categories and projects.</p>

        <label className="admin-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="admin-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div className="admin-alert admin-alert--error">{error}</div>}

        <button type="submit" className="admin-btn admin-btn--primary w-100" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
