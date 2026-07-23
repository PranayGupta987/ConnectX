import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/common/user-avatar";
import { useAuthStore } from "@/store/auth-store";
import { userService } from "@/services/user-service";
import { toApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_MIME = /^image\/(png|jpe?g|webp|gif)$/i;

function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [status, setStatus] = useState(user?.status ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? "");
    setUsername(user.username ?? "");
    setBio(user.bio ?? "");
    setStatus(user.status ?? "");
  }, [user]);

  if (!user) return null;

  const validateImage = (file: File) => {
    if (!IMAGE_MIME.test(file.type)) {
      toast.error("Please choose a PNG, JPG, WEBP, or GIF image");
      return false;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be under 5 MB");
      return false;
    }
    return true;
  };

  const handleAvatar = async (file: File) => {
    if (!validateImage(file)) return;
    setUploadingAvatar(true);
    try {
      const next = await userService.uploadAvatar(file);
      setUser(next);
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCover = async (file: File) => {
    if (!validateImage(file)) return;
    setUploadingCover(true);
    try {
      const next = await userService.uploadCover(file);
      setUser(next);
      toast.success("Cover photo updated");
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const next = await userService.updateMe({
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        status: status.trim(),
      });
      setUser(next);
      toast.success("Profile saved");
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">This is how others see you on ConnectX.</p>
      </div>

      <div className="glass overflow-hidden rounded-2xl border border-border">
        <div
          className={cn(
            "relative h-40 w-full bg-mesh sm:h-48",
            user.coverUrl && "bg-cover bg-center",
          )}
          style={user.coverUrl ? { backgroundImage: `url(${user.coverUrl})` } : undefined}
        >
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur hover:bg-black/60"
            disabled={uploadingCover}
            aria-label="Change cover photo"
          >
            {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
            Change cover
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleCover(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-end sm:gap-6">
          <div className="relative -mt-16">
            <UserAvatar user={user} size="lg" showPresence={false} className="h-24 w-24 border-4 border-background" />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border border-border bg-background shadow-sm hover:bg-accent disabled:opacity-60"
              aria-label="Change profile photo"
            >
              {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleAvatar(f);
                e.target.value = "";
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold">{user.displayName}</div>
            <div className="text-sm text-muted-foreground">
              @{user.username}
              {user.isVerified ? " · Verified" : ""}
            </div>
            {user.status ? (
              <div className="mt-1 text-sm text-muted-foreground">{user.status}</div>
            ) : null}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="glass space-y-5 rounded-2xl border border-border p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Display name</Label>
            <Input
              id="p-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={60}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-username">Username</Label>
            <Input
              id="p-username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
              pattern="^[a-zA-Z0-9_.]{3,24}$"
              title="3-24 characters, letters, numbers, dot or underscore"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-status">Status</Label>
          <Input
            id="p-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            maxLength={80}
            placeholder="What's on your mind?"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-bio">Bio</Label>
          <Textarea
            id="p-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            rows={4}
            placeholder="A few words about you"
          />
          <div className="text-right text-xs text-muted-foreground">{bio.length}/280</div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDisplayName(user.displayName);
              setUsername(user.username);
              setBio(user.bio ?? "");
              setStatus(user.status ?? "");
            }}
          >
            Cancel
          </Button>
          <Button type="submit" variant="hero" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
