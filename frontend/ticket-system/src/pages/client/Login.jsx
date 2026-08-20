import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

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
      if (loggedInUser.role !== "client") {
        setError(loggedInUser.role === "employee" ? "This is an employee account. Use Employee sign in." : "This is an admin account. Use Admin sign in.");
        return;
      }
      navigate(location.state?.from?.pathname || "/app", { replace: true });
    } catch (err) {
      setError(err.message || "Could not sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Threadline"
      title="Sign in to your account"
      description="Track and raise IT support tickets for your department."
      footer={
        <>
          <p className="mb-2">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-medium text-accent hover:underline">
              Sign up
            </Link>
          </p>
          Are you an employee?{" "}
          <Link to="/employee/login" className="font-medium text-accent hover:underline">
            Employee sign in
          </Link>{" · "}
          <Link to="/admin/login" className="font-medium text-accent hover:underline">
            Admin sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-[12.5px] text-ink-muted">
            <input type="checkbox" className="size-3.5 rounded border-line-strong accent-[#0E6B5C]" defaultChecked />
            Keep me signed in
          </label>
          <a href="#" className="text-[12.5px] font-medium text-accent hover:underline">
            Forgot password?
          </a>
        </div>
        {error && <p className="text-[12.5px] text-danger">{error}</p>}
        <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" loading={submitting}>
          {submitting ? "Signing in" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
