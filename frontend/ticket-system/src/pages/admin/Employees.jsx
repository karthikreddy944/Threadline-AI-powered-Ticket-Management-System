import { useEffect, useMemo, useState } from "react";
import { Plus, UserRound, UserX, RotateCcw, Pencil, Trash2, Search, SlidersHorizontal, X } from "lucide-react";
import Topbar from "../../components/Topbar";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Modal from "../../components/Modal";
import LoadingState from "../../components/LoadingState";
import Select from "../../components/Select";
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
} from "../../lib/api";

const EMPTY_FORM = { name: "", email: "", employeeId: "", department: "IT Support", employeeRole: "", password: "" };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [active, setActive] = useState("");
  const [sort, setSort] = useState("newest");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // employee being edited, or null when adding
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [confirmDelete, setConfirmDelete] = useState(null); // employee pending delete confirmation
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    getEmployees({ search: query })
      .then(setEmployees)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [query]);

  const departments = useMemo(() => [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort(), [employees]);
  const visibleEmployees = useMemo(() => employees.filter((employee) => (!department || employee.department === department) && (active === "" || String(employee.isActive !== false) === active)).sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "workload") return (b.ticketStats?.open || 0) - (a.ticketStats?.open || 0);
    if (sort === "resolved") return (b.ticketStats?.resolved || 0) - (a.ticketStats?.resolved || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  }), [employees, department, active, sort]);
  const hasFilters = query || department || active || sort !== "newest";
  const clearFilters = () => { setQuery(""); setDepartment(""); setActive(""); setSort("newest"); };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setNotice("");
    setError("");
    setOpen(true);
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm({
      name: emp.name || "",
      email: emp.email || "",
      employeeId: emp.employeeId || "",
      department: emp.department || "IT Support",
      employeeRole: emp.employeeRole || "",
      password: "",
    });
    setNotice("");
    setError("");
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password; // keep existing password unless a new one was entered
        await updateEmployee(editing._id || editing.id, payload);
        setNotice("Employee updated successfully.");
      } else {
        await createEmployee(form);
        setNotice("Employee account created successfully.");
      }
      setOpen(false);
      setForm(EMPTY_FORM);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (emp) => {
    setError("");
    try {
      await updateEmployeeStatus(emp._id || emp.id, emp.isActive === false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmDeleteEmployee = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setError("");
    try {
      await deleteEmployee(confirmDelete._id || confirmDelete.id);
      setNotice("Employee deleted. Any tickets assigned to them are now unassigned.");
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Topbar
        eyebrow="Administration"
        title="Employees"
        actions={
          <Button variant="primary" size="sm" icon={Plus} onClick={openAdd}>
            Add employee
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="w-full">
          <div className="mb-5 rounded-lg border border-line bg-surface p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
              <label className="relative flex-1"><span className="sr-only">Search employees</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employee, email, department, ID, or role…" className="h-9 w-full rounded-md border border-line-strong bg-surface pl-9 pr-3 text-[13px] outline-none focus:border-accent focus:ring-2 focus:ring-accent-line" /></label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:w-[580px]"><Select id="employee-filter-department" label="Department" options={[{ value: "", label: "All departments" }, ...departments]} value={department} onChange={(e) => setDepartment(e.target.value)} /><Select id="employee-filter-status" label="Status" options={[{ value: "", label: "All statuses" }, { value: "true", label: "Active" }, { value: "false", label: "Inactive" }]} value={active} onChange={(e) => setActive(e.target.value)} /><Select id="employee-filter-sort" label="Sort by" options={[{ value: "newest", label: "Newest added" }, { value: "name", label: "Name A–Z" }, { value: "workload", label: "Open workload" }, { value: "resolved", label: "Most resolved" }]} value={sort} onChange={(e) => setSort(e.target.value)} /></div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3"><span className="inline-flex items-center gap-1.5 text-[12px] text-ink-faint"><SlidersHorizontal className="size-3.5" /> {visibleEmployees.length} employee{visibleEmployees.length === 1 ? "" : "s"}</span>{hasFilters && <Button variant="ghost" size="sm" icon={X} onClick={clearFilters}>Clear filters</Button>}</div>
          </div>
          {notice && (
            <div className="mb-4 rounded-md border border-accent-line bg-accent-soft/40 p-3 text-[12.5px] text-accent">
              {notice}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-md border border-danger/20 bg-danger/5 p-3 text-[12.5px] text-danger">
              {error}
            </div>
          )}
          {loading ? (
            <LoadingState rows={5} />
          ) : (
            <div className="overflow-hidden rounded-lg border border-line bg-surface">
             <div className="overflow-x-auto">
              <div className="min-w-[860px]">
              <div className="grid grid-cols-[1.3fr_1.3fr_0.9fr_80px_80px_80px_80px_90px_150px] gap-3 border-b border-line bg-surface-alt px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                <span>Employee</span>
                <span>Email</span>
                <span>Department</span>
                <span>Assigned</span>
                <span>Open</span>
                <span>In progress</span>
                <span>Resolved</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              {visibleEmployees.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-ink-faint">
                  No employees yet. Add the first employee account.
                </div>
              ) : (
                visibleEmployees.map((emp) => {
                  const stats = emp.ticketStats || { assigned: 0, open: 0, inProgress: 0, resolved: 0 };
                  return (
                    <div
                      key={emp._id || emp.id}
                      className="grid grid-cols-[1.3fr_1.3fr_0.9fr_80px_80px_80px_80px_90px_150px] items-center gap-3 border-b border-line px-4 py-4 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-surface-sunken">
                          <UserRound className="size-4 text-ink-muted" />
                        </div>
                        <div>
                          <div className="text-[12.5px] font-medium text-ink">{emp.name}</div>
                          <div className="text-[11px] text-ink-faint">
                            {emp.employeeRole || emp.employeeId || "Employee"}
                          </div>
                        </div>
                      </div>
                      <div className="truncate text-[12.5px] text-ink-muted">{emp.email}</div>
                      <div className="text-[12.5px] text-ink-muted">{emp.department || "IT Support"}</div>
                      <div className="text-[12.5px] text-ink-muted">{stats.assigned}</div>
                      <div className="text-[12.5px] text-ink-muted">{stats.open}</div>
                      <div className="text-[12.5px] text-ink-muted">{stats.inProgress}</div>
                      <div className="text-[12.5px] text-ink-muted">{stats.resolved}</div>
                      <div>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] ${
                            emp.isActive === false ? "bg-surface-alt text-ink-faint" : "bg-accent-soft text-accent"
                          }`}
                        >
                          {emp.isActive === false ? "Inactive" : "Active"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(emp)} />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={emp.isActive === false ? RotateCcw : UserX}
                          onClick={() => toggle(emp)}
                        />
                        <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setConfirmDelete(emp)} />
                      </div>
                    </div>
                  );
                })
              )}
              </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {open && (
        <Modal open={open} title={editing ? "Edit employee" : "Add employee"} onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input
              id="employee-name"
              label="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              id="employee-email"
              label="Employee email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                id="employee-id"
                label="Employee ID"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              />
              <Input
                id="employee-department"
                label="Department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
            <Input
              id="employee-role"
              label="Role"
              placeholder="e.g. Support Engineer"
              value={form.employeeRole}
              onChange={(e) => setForm({ ...form, employeeRole: e.target.value })}
            />
            <Input
              id="employee-password"
              label={editing ? "New password (optional)" : "Temporary password"}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editing}
            />
            <p className="text-[11.5px] text-ink-faint">
              {editing
                ? "Leave the password blank to keep the employee's current password."
                : "Give these credentials to the employee. The password is hashed by the backend and is never returned to the dashboard."}
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                {editing ? "Save changes" : "Create employee"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal open={!!confirmDelete} title="Delete employee" onClose={() => setConfirmDelete(null)}>
          <p className="text-[13px] text-ink-muted">
            Delete <span className="font-medium text-ink">{confirmDelete.name}</span>? Any tickets currently
            assigned to them will be unassigned so they can be re-assigned to another employee. This cannot be
            undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" loading={deleting} onClick={confirmDeleteEmployee}>
              Delete employee
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
