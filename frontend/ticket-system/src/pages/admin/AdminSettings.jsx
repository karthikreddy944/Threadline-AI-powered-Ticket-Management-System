import { useEffect, useState } from "react";
import Topbar from "../../components/Topbar";
import Input from "../../components/Input";
import Button from "../../components/Button";
import LoadingState from "../../components/LoadingState";
import { getCurrentUser, getAllocationSettings, updateAllocationSettings } from "../../lib/api";
import { getInitials } from "../../lib/adapters";

export default function AdminSettings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [allocation, setAllocation] = useState({ mode: "manual", strategy: "round_robin", priorityOrder: ["Critical","High","Medium","Low"] });
  const [allocationNote, setAllocationNote] = useState("");

  useEffect(() => {
    Promise.all([getCurrentUser(), getAllocationSettings()])
      .then(([me, settings]) => { setProfile(me); setAllocation(settings); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Topbar eyebrow="Account" title="Admin settings" />
        <div className="flex-1 px-6 py-6">
          <LoadingState rows={3} />
        </div>
      </>
    );
  }

  const roleLabel = profile?.role === "admin" ? "Admin" : profile?.role;

  return (
    <>
      <Topbar eyebrow="Account" title="Admin settings" />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-xl flex-col gap-5">
          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-surface-sunken text-[13px] font-semibold text-ink">
                {getInitials(profile?.name)}
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-ink">{profile?.name}</p>
                <p className="text-[12px] text-ink-faint">{roleLabel}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input id="name" label="Full name" defaultValue={profile?.name} />
              <Input id="email" label="College email" defaultValue={profile?.email} disabled />
              <Input id="role" label="Role" defaultValue={roleLabel} disabled />
              <Input id="phone" label="Phone (optional)" placeholder="+91 " />
            </div>
            <div className="mt-4 flex items-center justify-end gap-3 border-t border-line pt-4">
              {note && <span className="text-[12px] text-ink-faint">{note}</span>}
              <Button variant="primary" onClick={() => setNote("Profile editing isn't available yet.")}>
                Save changes
              </Button>
            </div>
          </div>


          <div className="rounded-lg border border-line bg-surface p-5">
            <h3 className="mb-1 text-[13px] font-semibold text-ink">Assignment settings</h3>
            <p className="mb-4 text-[12px] text-ink-faint">Choose whether tickets are assigned to employees manually or automatically.</p>

            <div className="flex flex-col gap-2">
              <span className="text-[12.5px] font-medium text-ink">Assignment mode</span>
              <label className="flex items-center gap-2 text-[12.5px] text-ink">
                <input
                  type="radio"
                  name="assignment-mode"
                  value="manual"
                  checked={allocation.mode !== "automatic"}
                  onChange={() => setAllocation({ ...allocation, mode: "manual" })}
                  className="size-3.5 accent-[#0E6B5C]"
                />
                Manual — admin picks the employee for each ticket
              </label>
              <label className="flex items-center gap-2 text-[12.5px] text-ink">
                <input
                  type="radio"
                  name="assignment-mode"
                  value="automatic"
                  checked={allocation.mode === "automatic"}
                  onChange={() => setAllocation({ ...allocation, mode: "automatic" })}
                  className="size-3.5 accent-[#0E6B5C]"
                />
                Automatic — the system assigns each ticket for you
              </label>
            </div>

            {allocation.mode === "automatic" && (
              <div className="mt-4 border-t border-line pt-4">
                <span className="mb-2 block text-[12.5px] font-medium text-ink">Automatic assignment strategy</span>
                <select value={allocation.strategy} onChange={e=>setAllocation({...allocation,strategy:e.target.value})} className="h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-[12.5px] text-ink">
                  <option value="round_robin">Round Robin — rotate assignments evenly</option>
                  <option value="priority">Priority Wise — highest priority tickets first, workload-balanced</option>
                  <option value="fifo">FIFO — oldest unassigned ticket first</option>
                </select>
                <div className="mt-3 rounded-md bg-surface-alt/60 p-3 text-[11.5px] text-ink-faint">
                  Only ACTIVE employees participate in automatic assignment. Priority Wise processes Critical → High → Medium → Low tickets first; FIFO processes the oldest created ticket first.
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-3">{allocationNote&&<span className="text-[12px] text-ink-faint">{allocationNote}</span>}<Button variant="primary" onClick={async()=>{try{const saved=await updateAllocationSettings(allocation);setAllocation(saved);setAllocationNote("Assignment settings saved.")}catch(e){setAllocationNote(e.message)}}}>Save assignment settings</Button></div>
          </div>

          <div className="rounded-lg border border-line bg-surface p-5">
            <h3 className="mb-3 text-[13px] font-semibold text-ink">Notification preferences</h3>
            <div className="flex flex-col gap-3">
              <Toggle label="Notify me when a ticket is unassigned for 1 hour" defaultChecked />
              <Toggle label="Notify me on new Critical priority tickets" defaultChecked />
              <Toggle label="Daily digest of queue activity" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Toggle({ label, defaultChecked = false }) {
  return (
    <label className="flex items-center justify-between">
      <span className="text-[12.5px] text-ink">{label}</span>
      <input type="checkbox" defaultChecked={defaultChecked} className="size-4 rounded border-line-strong accent-[#0E6B5C]" />
    </label>
  );
}
