import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Lock, Palette, Trash2, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore, useThemeStore } from "@/store";
import { userService } from "@/services/user-service";
import { toApiError } from "@/lib/api-client";
import { ROUTES, STORAGE_KEYS } from "@/lib/constants";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

const NOTIF_PREFS_KEY = "connectx.notif.prefs";
type NotifPrefs = { messages: boolean; requests: boolean; digest: boolean };

function readNotifPrefs(): NotifPrefs {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(NOTIF_PREFS_KEY) : null;
    if (!raw) return { messages: true, requests: true, digest: false };
    return { messages: true, requests: true, digest: false, ...JSON.parse(raw) };
  } catch {
    return { messages: true, requests: true, digest: false };
  }
}

function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [prefs, setPrefs] = useState<NotifPrefs>(() => readNotifPrefs());
  const [pwOpen, setPwOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const updatePref = (key: keyof NotifPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next));
    } catch {
      /* noop */
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPw(true);
    try {
      await userService.changePassword({ currentPassword: currentPw, newPassword: newPw });
      toast.success("Password updated");
      setPwOpen(false);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setChangingPw(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await userService.logoutAllDevices();
      toast.success("Signed out on all other devices");
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setLoggingOutAll(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") {
      toast.error('Type "DELETE" to confirm');
      return;
    }
    setDeleting(true);
    try {
      await userService.deleteAccount();
      try {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      } catch {
        /* noop */
      }
      await logout();
      toast.success("Account deleted");
      await navigate({ to: ROUTES.LANDING });
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your preferences and account.</p>
      </div>

      <Card icon={Palette} title="Appearance" desc="Pick the theme that suits you best.">
        <div className="flex flex-wrap gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <Button
              key={t}
              variant={theme === t ? "hero" : "outline"}
              size="sm"
              onClick={() => setTheme(t)}
              className="capitalize"
            >
              {t}
            </Button>
          ))}
        </div>
      </Card>

      <Card icon={Bell} title="Notifications" desc="Choose what you want to hear about.">
        {[
          { key: "messages" as const, label: "New messages", desc: "Play a sound and show a badge for new messages." },
          { key: "requests" as const, label: "Friend requests", desc: "Notify me when someone sends a request." },
          { key: "digest" as const, label: "Weekly digest", desc: "A quick summary of your ConnectX activity, every Monday." },
        ].map((row) => (
          <div key={row.key} className="flex items-start justify-between gap-4 py-3">
            <div>
              <div className="text-sm font-medium">{row.label}</div>
              <div className="text-xs text-muted-foreground">{row.desc}</div>
            </div>
            <Switch checked={prefs[row.key]} onCheckedChange={(v) => updatePref(row.key, v)} />
          </div>
        ))}
      </Card>

      <Card
        icon={Lock}
        title="Security"
        desc={user?.email ? `Signed in as ${user.email}` : "Password and sessions."}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => setPwOpen(true)}>
            Change password
          </Button>
          <Button variant="outline" onClick={handleLogoutAll} disabled={loggingOutAll}>
            {loggingOutAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Sign out other devices
          </Button>
        </div>
      </Card>

      <Card icon={Trash2} title="Danger zone" desc="Permanent actions.">
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          Delete account
        </Button>
      </Card>

      {/* Change password */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one. You'll stay signed in on this device.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cur-pw">Current password</Label>
              <Input
                id="cur-pw"
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pw">New password</Label>
              <Input
                id="new-pw"
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conf-pw">Confirm new password</Label>
              <Input
                id="conf-pw"
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPwOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="hero" disabled={changingPw}>
                {changingPw ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete account */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account</DialogTitle>
            <DialogDescription>
              This permanently removes your profile, messages, friends, and call history. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="del-conf">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="del-conf"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || deleteConfirm !== "DELETE"}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof Bell;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl border border-border p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-base font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground">{desc}</div>
        </div>
      </div>
      <Separator className="mb-4" />
      {children}
    </section>
  );
}
