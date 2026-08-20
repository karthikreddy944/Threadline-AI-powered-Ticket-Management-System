import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";

export default function EmployeeLogin() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role !== "employee") { logout(); setError("This account does not have employee access."); return; }
      navigate("/employee", { replace: true });
    } catch (err) { setError(err.message || "Could not sign in. Please try again."); }
    finally { setSubmitting(false); }
  };

  return (
    <AuthShell
      eyebrow="Threadline for Employees"
      title="Employee support workspace"
      description="Sign in to view and resolve the tickets assigned to you."
      footer={<>Are you a student or staff member? <Link to="/login" className="font-medium text-accent hover:underline">Go to client sign in</Link><span className="mx-1">·</span><Link to="/admin/login" className="font-medium text-accent hover:underline">Admin sign in</Link></>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input id="employee-email" label="Employee email" type="email" placeholder="employee@ticketsystem.test" value={email} onChange={e=>setEmail(e.target.value)} required />
        <Input id="employee-password" label="Password" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
        {error && <p className="text-[12.5px] text-danger">{error}</p>}
        <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" loading={submitting}>{submitting ? "Signing in" : "Sign in to employee panel"}</Button>
      </form>
    </AuthShell>
  );
}
