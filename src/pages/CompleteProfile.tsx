import { useId, useMemo, useState, type ReactNode, type SelectHTMLAttributes } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { AuthPageLayout } from "@/components/layout/AuthPageLayout";
import { cn } from "@/lib/utils";

const API_URL = (() => {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (raw && raw.trim()) return raw.replace(/\/$/, "");
  return window.location.origin;
})();

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-2 block text-[13px] text-white/45">
      {children}
      {required && <span className="text-red-400/90"> *</span>}
    </label>
  );
}

function UnderlineSelect({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative border-b border-white/70">
      <select
        {...props}
        className={cn(
          "w-full cursor-pointer appearance-none border-0 bg-transparent py-2.5 pr-8 text-[15px] text-white outline-none",
          "[&>option]:bg-[#1a1a1a] [&>option]:text-white",
          !props.value && "text-white/35",
          className
        )}
      />
      <span
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/40"
        aria-hidden
      >
        ▾
      </span>
    </div>
  );
}

function UnderlineInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative border-b border-white/70">
      <input
        {...props}
        className={cn(
          "w-full border-0 bg-transparent py-2.5 text-[15px] text-white outline-none placeholder:text-white/25",
          className
        )}
      />
    </div>
  );
}

function UnderlineTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="relative border-b border-white/70">
      <textarea
        {...props}
        className={cn(
          "w-full resize-none border-0 bg-transparent py-2.5 text-[15px] text-white outline-none placeholder:text-white/25",
          className
        )}
      />
    </div>
  );
}

const CompleteProfile = () => {
  const navigate = useNavigate();
  const agreementId = useId();
  const rawUser = localStorage.getItem("ksl_user");
  const token = localStorage.getItem("ksl_token");

  if (!rawUser || !token) {
    return <Navigate to="/auth" replace />;
  }

  let currentUser: { role?: string; profileCompleted?: boolean } = {};
  try {
    currentUser = JSON.parse(rawUser);
  } catch {
    return <Navigate to="/auth" replace />;
  }

  if (currentUser.profileCompleted === true || currentUser.role === "admin") {
    return <Navigate to="/" replace />;
  }

  const [userType, setUserType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [communicationMode, setCommunicationMode] = useState("");
  const [institution, setInstitution] = useState("");
  const [address, setAddress] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [agreement, setAgreement] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = userType !== "" && purpose !== "" && agreement;
  const summary = useMemo(() => {
    if (!userType && !purpose) return null;
    const items = [userType, purpose].filter(Boolean);
    return items.join(" • ");
  }, [purpose, userType]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!isFormValid) return;

    try {
      setIsSubmitting(true);
      const payload = {
        userType,
        purpose,
        communicationMode: communicationMode || "",
        institution: institution || "",
        address: address || "",
        additionalInfo: additionalInfo || "",
      };
      console.log("Submitting profile data:", payload);
      const response = await fetch(`${API_URL}/api/profile/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Profile completion response:", data);
      if (!response.ok) {
        setError(data?.message || "Failed to save profile. Please try again.");
        return;
      }

      if (data.user) {
        localStorage.setItem("ksl_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("ksl-user-update"));
      }
      localStorage.setItem("ksl_user_type", userType);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Profile completion error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageLayout
      title="Complete profile"
      subtitle="A few details help us tailor KSL for you."
      brandLabel="KSL Interpreter"
      homeLabel="Home"
      hideLeftPanel
    >
      <div className="w-full pt-4">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium tracking-[0.18em] text-white/35">
              ONBOARDING
            </p>
            <p className="text-[13px] leading-relaxed text-white/55">
              Required fields first. You can edit later in Settings.
            </p>
          </div>
          {summary && (
            <span className="shrink-0 px-3 py-1 text-[11px] text-white/45">
              {summary}
            </span>
          )}
        </div>

        {error && <p className="mb-4 text-[12px] text-red-400">{error}</p>}

        {userType && (
          <p className="mb-6 text-[12px] leading-relaxed text-ksl-blue/90">
            {userType === "Deaf User"
              ? "We'll prioritize sign-to-text and accessibility-friendly defaults."
              : "We'll prioritize text-to-sign to support your communication."}
          </p>
        )}

        <form className="space-y-9" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-7">
            <div>
              <FieldLabel required>User type</FieldLabel>
              <UnderlineSelect
                required
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
              >
                <option value="" disabled>
                  Select your user type
                </option>
                <option value="Deaf User">Deaf User</option>
                <option value="Hearing User">Hearing User</option>
              </UnderlineSelect>
            </div>

            <div>
              <FieldLabel required>Primary purpose</FieldLabel>
              <UnderlineSelect
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              >
                <option value="" disabled>
                  Select your primary purpose
                </option>
                <option value="Communication">Communication</option>
                <option value="Learning Sign Language">Learning Sign Language</option>
                <option value="Teaching">Teaching</option>
                <option value="Research">Research</option>
                <option value="Other">Other</option>
              </UnderlineSelect>
            </div>
          </div>

          <div className="pt-1">
            <p className="mb-5 text-[11px] font-medium tracking-[0.16em] text-white/30">
              OPTIONAL
            </p>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel>Preferred communication mode</FieldLabel>
                <UnderlineSelect
                  value={communicationMode}
                  onChange={(e) => setCommunicationMode(e.target.value)}
                >
                  <option value="">Optional</option>
                  <option value="Text">Text</option>
                  <option value="Sign Language (Video)">Sign Language (Video)</option>
                  <option value="Both">Both</option>
                </UnderlineSelect>
              </div>

              <div>
                <FieldLabel>Institution / organization</FieldLabel>
                <UnderlineInput
                  type="text"
                  placeholder="e.g. University of Kigali"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  autoComplete="organization"
                />
              </div>

              <div>
                <FieldLabel>Address</FieldLabel>
                <UnderlineInput
                  type="text"
                  placeholder="Location (optional)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="street-address"
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Additional information</FieldLabel>
                <UnderlineTextarea
                  rows={3}
                  placeholder="Anything that helps improve your experience…"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                />
              </div>
            </div>
          </div>

          <label
            htmlFor={agreementId}
            className="flex cursor-pointer items-start gap-3 text-[13px] text-white/55"
          >
            <input
              id={agreementId}
              type="checkbox"
              checked={agreement}
              onChange={(e) => setAgreement(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded-full border border-white/40 bg-transparent accent-white"
            />
            <span>I confirm the information provided is correct.</span>
          </label>

          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-[12px] text-white/40">
              {isFormValid ? "Ready to continue." : "Select required fields to continue."}
            </p>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white text-[10px] font-semibold tracking-[0.1em] text-black transition-transform hover:scale-[1.02] disabled:opacity-50 sm:h-20 sm:w-20"
            >
              {isSubmitting ? "…" : "CONTINUE"}
            </button>
          </div>
        </form>
      </div>
    </AuthPageLayout>
  );
};

export default CompleteProfile;
