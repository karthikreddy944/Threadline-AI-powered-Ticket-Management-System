import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";

export default function PlatformLogin() {
  const { login, logout } = useAuth(); const navigate = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => { event.preventDefault(); setSubmitting(true); setError(""); try { const user = await login(email, password); if (user.role !== "superadmin") { logout(); throw new Error("This account does not have Platform Operations access."); } navigate("/platform", { replace: true }); } catch (err) { setError(err.message || "Could not sign in."); } finally { setSubmitting(false); } };
  return <AuthShell eyebrow="Threadline" title="Platform Operations" description="Secure access for the sole platform owner."><form onSubmit={submit} className="flex flex-col gap-4"><Input id="platform-email" label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><Input id="platform-password" label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />{error && <p className="text-[12.5px] text-danger">{error}</p>}<Button type="submit" variant="primary" size="lg" className="w-full" loading={submitting}>Sign in securely</Button></form></AuthShell>;
}
