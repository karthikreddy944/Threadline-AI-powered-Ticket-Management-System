import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role !== "admin") {
        logout();
        setError("This account doesn't have admin access.");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Could not sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Threadline for Admins"
      title="IT support console"
      description="Manage, triage and resolve tickets across the campus."
      footer={
        <>
          Are you an employee?{" "}
          <Link to="/employee/login" className="font-medium text-accent hover:underline">
            Employee sign in
          </Link>{" · "}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Client sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="admin-email"
          label="Admin email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="admin-password"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-[12.5px] text-danger">{error}</p>}
        <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" loading={submitting}>
          {submitting ? "Signing in" : "Sign in to console"}
        </Button>
      </form>
    </AuthShell>
  );
}
