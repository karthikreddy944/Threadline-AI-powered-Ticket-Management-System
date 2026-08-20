import { useEffect, useState } from "react";
import Topbar from "../../components/Topbar";
import Input from "../../components/Input";
import Button from "../../components/Button";
import LoadingState from "../../components/LoadingState";
import { getCurrentUser } from "../../lib/api";
import { getInitials } from "../../lib/adapters";

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");

  useEffect(() => {
    getCurrentUser()
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Topbar eyebrow="Account" title="Profile & settings" />
        <div className="flex-1 px-6 py-6">
          <LoadingState rows={3} />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar eyebrow="Account" title="Profile & settings" />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-xl flex-col gap-5">
          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-surface-sunken text-[13px] font-semibold text-ink">
                {getInitials(profile?.name)}
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-ink">{profile?.name}</p>
                <p className="text-[12px] text-ink-faint">{profile?.department || "Client"}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input id="name" label="Full name" defaultValue={profile?.name} />
              <Input id="email" label="College email" defaultValue={profile?.email} disabled />
              <Input id="dept" label="Department" defaultValue={profile?.department} />
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
            <h3 className="mb-3 text-[13px] font-semibold text-ink">Notification preferences</h3>
            <div className="flex flex-col gap-3">
              <Toggle label="Email me when a ticket status changes" defaultChecked />
              <Toggle label="Email me when an admin comments" defaultChecked />
              <Toggle label="Weekly summary of open tickets" />
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
