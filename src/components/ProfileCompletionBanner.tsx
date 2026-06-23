import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserById } from "@/lib/api";

type StoredUser = { 
  id?: string; 
  firstName?: string; 
  lastName?: string; 
  email?: string; 
  role?: string; 
  profilePicture?: string;
  profileCompletionRequested?: boolean;
  profileCompleted?: boolean;
} | null;

function getStoredUser(): StoredUser {
  try {
    const raw = localStorage.getItem("ksl_user");
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function ProfileCompletionBanner() {
  const [user, setUser] = useState<StoredUser>(getStoredUser);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfileStatus = async () => {
      const stored = getStoredUser();
      if (!stored?.id || stored?.role === "admin") {
        setLoading(false);
        return;
      }

      // Check localStorage first for quick render
      if (stored.profileCompletionRequested && !stored.profileCompleted) {
        setUser(stored);
      }

      // Fetch fresh data from server
      try {
        const fresh = await getUserById(stored.id);
        if (fresh) {
          setUser(fresh);
          // Update localStorage with fresh data
          const updated = { ...stored, ...fresh };
          localStorage.setItem("ksl_user", JSON.stringify(updated));
        }
      } catch {
        // Silent fail - use stored data
      } finally {
        setLoading(false);
      }
    };

    checkProfileStatus();

    // Listen for user updates
    const onUpdate = () => {
      setUser(getStoredUser());
      setDismissed(false);
    };
    window.addEventListener("ksl-user-update", onUpdate);
    return () => window.removeEventListener("ksl-user-update", onUpdate);
  }, []);

  if (loading) return null;
  if (!user) return null;
  if (user.role === "admin") return null;
  if (dismissed) return null;
  if (user.profileCompleted) return null;
  if (!user.profileCompletionRequested) return null;

  return (
    <div className="fixed top-[72px] left-0 right-0 z-40 bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-sm">
      <div className="max-w-[1200px] mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Complete Your Profile
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/70">
                An admin has requested you to complete your profile information.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8 px-4"
            >
              <Link to="/complete-profile">Complete Profile</Link>
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 text-amber-600/60 hover:text-amber-600 dark:text-amber-400/60 dark:hover:text-amber-400 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileCompletionBanner;
