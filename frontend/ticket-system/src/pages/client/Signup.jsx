import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { registerUser } from "../../lib/api";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    phone: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Full name is required";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email address";
    if (!form.password) errors.password = "Password is required";
    else if (form.password.length < 6) errors.password = "Password must be at least 6 characters";
    if (!form.confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (form.confirmPassword !== form.password) errors.confirmPassword = "Passwords do not match";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        department: form.department.trim(),
        phone: form.phone.trim(),
      });
      setSuccess(true);
      // Give the user a moment to see the confirmation, then send them
      // to sign in with the account they just created.
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      setError(err.message || "Could not create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthShell
        eyebrow="Threadline"
        title="Account created"
        description="Your account is ready. Redirecting you to sign in…"
        footer={
          <>
            Not redirected?{" "}
            <Link to="/login" className="font-medium text-accent hover:underline">
              Go to sign in
            </Link>
          </>
        }
      >
        <div className="rounded-md border border-accent-line bg-accent-soft/40 p-3 text-[12.5px] text-accent">
          Your account was created successfully. You can sign in immediately with your new email and password.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Threadline"
      title="Create your account"
      description="Sign up to raise and track IT support tickets for your department."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="name"
          label="Full name"
          placeholder="Jane Doe"
          value={form.name}
          onChange={update("name")}
          error={fieldErrors.name}
          required
        />
        <Input
          id="signup-email"
          label="College email"
          type="email"
          placeholder="you@bmsce.ac.in"
          value={form.email}
          onChange={update("email")}
          error={fieldErrors.email}
          required
        />
        <Input
          id="department"
          label="Department / Course"
          placeholder="e.g. Computer Science"
          value={form.department}
          onChange={update("department")}
        />
        <Input
          id="phone"
          label="Phone number"
          type="tel"
          placeholder="Optional"
          value={form.phone}
          onChange={update("phone")}
        />
        <Input
          id="signup-password"
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          value={form.password}
          onChange={update("password")}
          error={fieldErrors.password}
          required
        />
        <Input
          id="confirm-password"
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          error={fieldErrors.confirmPassword}
          required
        />
        {error && <p className="text-[12.5px] text-danger">{error}</p>}
        <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" loading={submitting}>
          {submitting ? "Creating account" : "Sign up"}
        </Button>
      </form>
    </AuthShell>
  );
}
