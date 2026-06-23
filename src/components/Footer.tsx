import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { toast } from "sonner";
import { submitFeedback } from "@/lib/api";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [activePopup, setActivePopup] = useState<"issue" | "feedback" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({
        name,
        email,
        topic: activePopup === "issue" ? "issue" : "feedback",
        message,
      });
      toast.success(
        activePopup === "issue"
          ? "Thank you! The issue has been reported to the admin."
          : "Thank you! Your feedback has been submitted successfully."
      );
      setName("");
      setEmail("");
      setMessage("");
      setActivePopup(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <footer className="w-full font-display bg-slate-50 border-t border-border mt-auto py-6">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[14px] text-muted-foreground">
          
          <div className="flex items-center gap-2">
            <span className="font-script text-[20px] text-foreground">GestureMind</span>
            <span>© {currentYear}</span>
          </div>

          <Link to="/about" className="font-display hover:text-foreground transition-colors">About</Link>
          <Link to="/privacy-policy" className="font-display hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/community-forum" className="font-display hover:text-foreground transition-colors">Community Guidelines</Link>
          
          {/* Button triggers instead of separate page links */}
          <button
            onClick={() => setActivePopup("issue")}
            className="font-display hover:text-foreground transition-colors focus:outline-none"
          >
            Report Issue
          </button>
          <button
            onClick={() => setActivePopup("feedback")}
            className="font-display hover:text-foreground transition-colors focus:outline-none"
          >
            Submit Feedback
          </button>
          
        </div>
      </footer>

      {/* Modal Popup */}
      {activePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B252E]/60 backdrop-blur-sm p-4 animate-reveal">
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => {
              if (!submitting) setActivePopup(null);
            }}
          />
          <div className="relative w-full max-w-lg bg-[#F6F4EF] border border-[#0B252E]/10 p-6 md:p-8 rounded-[24px] shadow-card text-[#0B252E] z-10">
            
            {/* Close Button */}
            <button
              onClick={() => setActivePopup(null)}
              disabled={submitting}
              className="absolute top-4 right-4 p-1 text-[#0B252E]/60 hover:text-[#0B252E] hover:bg-[#0B252E]/5 rounded-full transition-colors focus:outline-none"
              aria-label="Close form"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-display font-bold tracking-tight mb-2 lowercase leading-none">
              {activePopup === "issue" ? "report translation issue" : "submit feedback"}
              <span className="text-[#90DDF5]">.</span>
            </h3>
            <p className="text-[13px] text-slate-500 mb-5 leading-relaxed">
              {activePopup === "issue"
                ? "Help us improve KSL recognition. Describe what went wrong below."
                : "Tell us about your experience with KSL interpreter. We value your thoughts."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  disabled={submitting}
                  className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-[13px] text-[#0B252E] outline-none focus:border-[#90DDF5] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  disabled={submitting}
                  className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-[13px] text-[#0B252E] outline-none focus:border-[#90DDF5] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Message Details
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    activePopup === "issue"
                      ? "Explain what signs were misrecognized or any translation issues..."
                      : "Write your feedback or suggestions here..."
                  }
                  disabled={submitting}
                  className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-[13px] text-[#0B252E] outline-none focus:border-[#90DDF5] transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#90DDF5] hover:bg-[#74cfeb] text-[#0B252E] font-bold py-3.5 rounded-full uppercase tracking-wider transition-all duration-200 shadow-sm border-none mt-2 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
