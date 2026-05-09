import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SignSequencePresenter, type SignPreviewItem } from "./SignSequencePresenter";
import { HandSkeletonOverlay } from "./HandSkeletonOverlay";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { useLanguage } from "./context/LanguageContext";

const API_BASE = (() => {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (raw !== undefined && raw !== "") return `${raw.replace(/\/$/, "")}/api`;
  // Default production backend (Render). Keeps working even if env var isn't set.
  return "https://ksl-be-ftj9.onrender.com/api";
})();

// Icons
const IcCamera = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
  </svg>
);
const IcSwap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 3 4 4-4 4" /><path d="M20 7H4" /><path d="m8 21-4-4 4-4" /><path d="M4 17h16" />
  </svg>
);
const IcType = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" x2="15" y1="20" y2="20" /><line x1="12" x2="12" y1="4" y2="20" />
  </svg>
);
const IcSun = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);
const IcStop = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);
const IcVolume = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);
const IcTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);
const IcMic = ({ recording }: { recording?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={recording ? "#ef4444" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
    {recording && <circle cx="12" cy="12" r="11" stroke="#ef4444" strokeWidth="1" className="animate-ping" />}
  </svg>
);

interface ApiStatus { active: boolean; status?: string; started_at?: string | null; backend?: string; error?: string; }
interface Prediction {
  letter: string;
  confidence: number;
  text: string;
  current_letter?: string;
  backend?: string;
  error?: string;
  hold_progress?: number;
  hold_seconds_required?: number;
}
interface TranslateResponse { text?: string; fallback?: boolean; message?: string; }
interface AnalyzeFrameResponse {
  ok?: boolean;
  text?: string;
  current_letter?: string;
  confidence?: number;
  hold_progress?: number;
  hold_seconds_required?: number;
  error?: string;
}

const isLoadingMessage = (msg: string): boolean => {
  const lower = msg.toLowerCase();
  return lower.includes("still loading") || lower.includes("loading");
};

const isSessionMessage = (msg: string): boolean => {
  const lower = msg.toLowerCase();
  return (
    lower.includes("session_id") ||
    lower.includes("unknown or expired session") ||
    lower.includes("missing session")
  );
};

async function getUserMediaWithFallbacks(): Promise<MediaStream> {
  const attempts: MediaStreamConstraints[] = [
    { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, audio: false },
    { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
    { video: true, audio: false }
  ];
  let lastError: unknown;
  for (const c of attempts) {
    try { return await navigator.mediaDevices.getUserMedia(c); } catch (e) { lastError = e; }
  }
  throw lastError;
}

const translations = {
  kinyarwanda: {
    badge: "Gerageza",
    heroTitle1: "Gerageza",
    heroTitleItalic: "Ihindurangenga",
    heroTitle2: "mu gihe nyacyo",
    heroDesc: "Reba uko sisitemu yacu ikoresha ubwenge bw'ikoranabuhanga ihindura hagati y'ururimi rw'ibimenyetso n'indimi zivugwa mu kanya ako kanya.",
    tabSignToText: "Ikimenyetso mu magambo",
    tabTextToSign: "Amagambo ajya mu kimenyetso",
    leftCardCamera: "Ibisohoka bya Kamera",
    leftCardText: "Injiza Amagambo",
    rightCard: "Ibisohoka by'Ubuhinduzi",
    cameraTitle: "Igaragaza rya Kamera",
    cameraDesc: "Kanda hano kugirango wemerere kamera utangire gufata ibimenyetso bya KSL.",
    startCamera: "Murikira Kamera",
    startingCamera: "Gutangira...",
    outputLangLabel: "Ururimi rusohoka",
    addLetter: "+ Inyuguti",
    addSpace: "+ Akagabane",
    waitingGestures: "Gutegereza ibimenyetso...",
    clearAll: "Siba byose",
    speak: "Vuga",
    translatedWords: "Amagambo yahinduwe",
    translatedWordsDesc: "Ikimenyetso cyawe kizahindurwa amagambo hano",
    emptyMatrix: "Sequence Matrix Empty",
    accuracy: "Ukuri kw'isuzuma",
    hideLogs: "Hisha Logs",
    showLogs: "Pipeline Logs",
    textPlaceholder: "Andika hano amagambo ushaka guhindura...",
    translateBtn: "Hindura mu Kimenyetso",
    recordBtn: "Record & Translate",
    startTalking: "Vuga amagambo",
    detection: "Detection",
    waiting: "Gutegereza...",
  },
  english: {
    badge: "Demo",
    heroTitle1: "Try",
    heroTitleItalic: "Real-time Translation",
    heroTitle2: "now",
    heroDesc: "See how our AI-powered system translates between sign language and spoken languages in real time.",
    tabSignToText: "Sign to Text",
    tabTextToSign: "Text to Sign",
    leftCardCamera: "Camera Input",
    leftCardText: "Enter Text",
    rightCard: "Translation Output",
    cameraTitle: "Camera View",
    cameraDesc: "Click below to allow camera access and start capturing KSL gestures.",
    startCamera: "Start Camera",
    startingCamera: "Starting...",
    outputLangLabel: "Output language",
    addLetter: "+ Letter",
    addSpace: "+ Space",
    waitingGestures: "Waiting for gestures...",
    clearAll: "Clear all",
    speak: "Speak",
    translatedWords: "Translated Words",
    translatedWordsDesc: "Your gesture will be translated into words here",
    emptyMatrix: "Sequence Matrix Empty",
    accuracy: "Recognition accuracy",
    hideLogs: "Hide Logs",
    showLogs: "Pipeline Logs",
    textPlaceholder: "Type text to convert to sign language...",
    translateBtn: "Translate to Sign",
    recordBtn: "Record & Translate",
    startTalking: "Talk to translate",
    detection: "Detection",
    waiting: "Loading...",
  },
  french: {
    badge: "Démo",
    heroTitle1: "Essayez la",
    heroTitleItalic: "traduction en temps réel",
    heroTitle2: "maintenant",
    heroDesc: "Découvrez comment notre système basé sur l'IA traduit entre la langue des signes et les langues parlées en temps réel.",
    tabSignToText: "Signe en texte",
    tabTextToSign: "Texte en signe",
    leftCardCamera: "Entrée caméra",
    leftCardText: "Saisir du texte",
    rightCard: "Résultat de la traduction",
    cameraTitle: "Vue caméra",
    cameraDesc: "Cliquez ci-dessous pour autoriser l'accès à la caméra et commencer à capturer les gestes KSL.",
    startCamera: "Démarrer la caméra",
    startingCamera: "Démarrage...",
    outputLangLabel: "Langue de sortie",
    addLetter: "+ Lettre",
    addSpace: "+ Espace",
    waitingGestures: "En attente de gestes...",
    clearAll: "Tout effacer",
    speak: "Parler",
    translatedWords: "Mots traduits",
    translatedWordsDesc: "Votre geste sera traduit en mots ici",
    emptyMatrix: "Matrice de séquence vide",
    accuracy: "Précision de reconnaissance",
    hideLogs: "Masquer les logs",
    showLogs: "Logs pipeline",
    textPlaceholder: "Tapez le texte à convertir en langue des signes...",
    translateBtn: "Traduire en signe",
    recordBtn: "Record & Translate",
    startTalking: "Parler pour traduire",
    detection: "Détection",
    waiting: "Chargement...",
  },
} as const;

export default function InterpreterPage() {
  const { language } = useLanguage();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<"sign-to-text" | "text-to-sign">("sign-to-text");
  const [status, setStatus] = useState<ApiStatus>({ active: false, status: "idle", started_at: null });
  const [prediction, setPrediction] = useState<Prediction>({
    letter: "",
    confidence: 0,
    text: "",
    current_letter: "",
    hold_progress: 0,
    hold_seconds_required: 3,
  });
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [outputLang, setOutputLang] = useState("rw");
  const [translatedText, setTranslatedText] = useState("");
  const [translateNote, setTranslateNote] = useState("");
  const [textInput, setTextInput] = useState("");
  const [signPreviewItems, setSignPreviewItems] = useState<SignPreviewItem[]>([]);
  const [signSourceSnapshot, setSignSourceSnapshot] = useState("");
  const [signPreviewNote, setSignPreviewNote] = useState("");

  const recognitionRef = useRef<any>(null);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === "kinyarwanda" ? "rw-RW" : language === "french" ? "fr-FR" : "en-US";
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setTextInput(transcript);
        // Automatically trigger translation after voice input
        fetchFingerSpellingExplicit(transcript);
      };
      rec.onstart = () => setIsRecording(true);
      rec.onend = () => setIsRecording(false);
      rec.onerror = () => setIsRecording(false);
      recognitionRef.current = rec;
    }
  }, [language]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setError("");
      try {
        recognitionRef.current?.start();
      } catch (e) {
        setError("Voice recognition failed to start.");
      }
    }
  };
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const camRef = useRef(false);
  const translateSeqRef = useRef(0);

  const apiFetch = useCallback(
    async (path: string, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers || {});
      const sid = sessionIdRef.current;
      if (sid) headers.set("X-Session-Id", sid);
      return fetch(`${API_BASE}${path}`, { ...init, headers });
    },
    []
  );

  const getJson = useCallback(async <T,>(path: string): Promise<T> => {
    const r = await apiFetch(path);
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json() as Promise<T>;
  }, [apiFetch]);

  const refresh = useCallback(async () => {
    try {
      const [s, l, p] = await Promise.all([
        getJson<ApiStatus>("/status"),
        getJson<{ logs: string[] }>("/pipeline-logs"),
        getJson<Prediction>("/prediction"),
      ]);
      setStatus(s);
      setLogs(l.logs);
      setPrediction({
        letter: p.current_letter || p.letter || "",
        confidence: p.confidence || 0,
        text: p.text || "",
        hold_progress: p.hold_progress || 0,
        hold_seconds_required: p.hold_seconds_required || 3,
      });
      const backendError = s.error || p.error || "";
      if (backendError) {
        if (isSessionMessage(backendError)) {
          if (!camRef.current) {
            // No active camera/session yet; keep UI clean.
            setError("");
          } else {
            // Camera is active but session was lost or hasn't connected yet.
            setError("Reconnecting camera session...");
          }
          return;
        }
        setError(
          `Sign model unavailable on server: ${backendError} ` +
          `(Auth can still work; camera/sign detection needs a MediaPipe-compatible backend runtime.)`
        );
      } else {
        setError("");
      }
    } catch (e) {
      if (!camRef.current) {
        const net = e instanceof TypeError && String(e.message).toLowerCase().includes("fetch");
        setError(
          net
            ? "Cannot reach backend API. Check https://ksl-be-ftj9.onrender.com/api/health."
            : (e instanceof Error ? e.message : "API error")
        );
      }
    }
  }, [getJson]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 2000);
    return () => clearInterval(id);
  }, [refresh]);

  // If user already opened camera while backend was warming up, auto-start once ready.
  useEffect(() => {
    if (!cameraActive) return;
    if (status.backend !== "ready") return;
    if (status.status === "running") return;
    let cancelled = false;
    void (async () => {
      try {
        const r = await apiFetch(`/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "letter" }),
        });
        if (!r.ok) return;
        const started = (await r.json().catch(() => ({}))) as { session_id?: string };
        if (started?.session_id) sessionIdRef.current = started.session_id;
        if (!cancelled) {
          setError("");
          void refresh();
        }
      } catch {
        // status polling will continue and user can retry manually.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cameraActive, status.backend, status.status, refresh]);

  useEffect(() => {
    if (activeTab !== "sign-to-text") return;
    const sourceText = (prediction.text || "").trim();
    if (!sourceText) {
      setTranslatedText("");
      setTranslateNote("");
      return;
    }

    const seq = ++translateSeqRef.current;
    const id = window.setTimeout(async () => {
      try {
        const r = await fetch(`${API_BASE}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sourceText, target: outputLang }),
        });
        if (!r.ok) throw new Error(`${r.status}`);
        const data = (await r.json()) as TranslateResponse;
        if (seq !== translateSeqRef.current) return;
        setTranslatedText((data.text || sourceText).trim());
        setTranslateNote(data.fallback ? (data.message || "") : "");
      } catch {
        if (seq !== translateSeqRef.current) return;
        setTranslatedText(sourceText);
        setTranslateNote(outputLang === "en" ? "" : "Translation unavailable; showing detected text.");
      }
    }, 250);

    return () => window.clearTimeout(id);
  }, [activeTab, outputLang, prediction.text]);

  // Frame send loop
  useEffect(() => {
    if (!cameraActive) return;
    const vid = videoRef.current;
    const can = canvasRef.current;
    if (!vid || !can) return;
    const id = setInterval(async () => {
      if (vid.videoWidth === 0) return;
      if (!sessionIdRef.current) return; // Prevent sending frames before session is established
      can.width = 640; can.height = 480;
      const ctx = can.getContext("2d"); if (!ctx) return;
      ctx.drawImage(vid, 0, 0, can.width, can.height);
      const image = can.toDataURL("image/jpeg", 0.9);
      try {
        const r = await apiFetch(`/analyze-frame`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image }),
        });
        if (!r.ok) {
          if (r.status === 503) {
            let backendMsg = "Sign model is unavailable on backend.";
            try {
              const err = (await r.json()) as { error?: string };
              if (err?.error) backendMsg = err.error;
            } catch {
              // ignore parse errors and use fallback message
            }
            if (isLoadingMessage(backendMsg)) {
              setError("Backend is warming up. Keep camera open; detection will start automatically.");
              return;
            }
            setError(`Sign detection unavailable: ${backendMsg}`);
            streamRef.current?.getTracks().forEach(t => t.stop());
            streamRef.current = null;
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.srcObject = null;
            }
            camRef.current = false;
            setCameraActive(false);
          }
          if (r.status === 400 || r.status === 404 || r.status === 409) {
            let backendMsg = "";
            try {
              const err = (await r.json()) as { error?: string };
              backendMsg = err?.error || "";
            } catch {
              // ignore parse errors
            }
            if (isSessionMessage(backendMsg)) {
              setError("Reconnecting camera session...");
              sessionIdRef.current = "";
              void refresh();
            }
          }
          return;
        }
        const data = (await r.json()) as AnalyzeFrameResponse;
        setPrediction((prev) => ({
          ...prev,
          letter: data.current_letter || "",
          current_letter: data.current_letter || "",
          confidence: data.confidence || 0,
          text: data.text || "",
          hold_progress: data.hold_progress || 0,
          hold_seconds_required: data.hold_seconds_required || 3,
        }));
      } catch { }
    }, 120);
    return () => clearInterval(id);
  }, [cameraActive]);

  const startInterpreter = async () => {
    setLoading(true); setError("");
    try {
      const stream = await getUserMediaWithFallbacks();
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => { });
      }
      camRef.current = true; setCameraActive(true);
      const startResponse = await fetch(`${API_BASE}/start`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "letter" }),
      });
      if (!startResponse.ok) {
        let backendMsg = `Backend returned ${startResponse.status}`;
        try {
          const err = (await startResponse.json()) as { error?: string };
          if (err?.error) backendMsg = err.error;
        } catch {
          // fallback is enough
        }
        if (startResponse.status === 503 && isLoadingMessage(backendMsg)) {
          setError("Backend is still loading model. Camera is ready; detection will begin automatically.");
          setLoading(false);
          return;
        }
        throw new Error(backendMsg);
      }
      const started = (await startResponse.json().catch(() => ({}))) as { session_id?: string };
      if (started?.session_id) sessionIdRef.current = started.session_id;
      void refresh();
    } catch (e) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      camRef.current = false;
      setCameraActive(false);
      setError(e instanceof Error ? e.message : "Camera failed");
    }
    setLoading(false);
  };

  const stopInterpreter = async () => {
    setLoading(true);
    try {
      await apiFetch(`/stop`, { method: "POST" });
      sessionIdRef.current = "";
      streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null;
      if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; }
      camRef.current = false; setCameraActive(false);
      void refresh();
    } catch { }
    setLoading(false);
  };

  const commitLetter = () => apiFetch(`/commit-letter`, { method: "POST" }).then(() => refresh()).catch(() => { });
  const commitSpace = () => apiFetch(`/commit-space`, { method: "POST" }).then(() => refresh()).catch(() => { });
  const clearText = () => apiFetch(`/clear`, { method: "POST" }).then(() => refresh()).catch(() => { });

  const fetchFingerSpelling = async () => {
    await fetchFingerSpellingExplicit(textInput);
  };

  const fetchFingerSpellingExplicit = async (val: string) => {
    if (!val.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/text-to-sign`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: val }),
      });
      if (!r.ok) throw new Error(`${r.status}`);
      const data = await r.json();
      setSignPreviewItems(data.items || []);
      setSignSourceSnapshot(val);
      setSignPreviewNote(data.note || "");
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not fetch signs"); }
    setLoading(false);
  };

  const speakResult = () => {
    const spoken = (translatedText || prediction.text || "").trim();
    if (!spoken) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(spoken));
  };

  const runDuration = useMemo(() => {
    if (!status.started_at || !cameraActive) return "00:00:00";
    const s = Math.max(0, Math.floor((Date.now() - Date.parse(status.started_at)) / 1000));
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(n => String(n).padStart(2, "0")).join(":");
  }, [status, cameraActive]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background text-foreground font-sans overflow-x-hidden flex flex-col custom-scrollbar border-none">

      <Header />

      {/* ═══════════════ MAIN ═══════════════ */}
      <main className="flex-1 pt-28 md:pt-36 pb-20 container mx-auto px-6 flex flex-col items-center border-none">

        {/* Hero text */}
        <div className="text-center max-w-3xl mx-auto mb-12 relative z-10 border-none">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ksl-yellow text-slate-900 font-bold text-[13px] mb-8 tracking-tight border-none">
            {t.badge}
          </div>
          
          {/* <h1 style={{ letterSpacing: "-0.04em" }} className="text-[50px] md:text-[75px] font-bold leading-[0.95] lowercase mb-6 text-foreground transition-colors border-none tracking-tight">
            {t.heroTitle1}{" "}
            <span className="text-ksl-blue drop-shadow-sm">{t.heroTitleItalic}</span>
            <br className="hidden md:block"/>
            {" "}{t.heroTitle2}
          </h1> */}
          
          <p className="text-[18px] md:text-[20px] text-muted-foreground font-medium leading-relaxed max-w-xl mx-auto tracking-tight border-none">
            {t.heroDesc}
          </p>
        </div>

        {/* ─── Tab switcher ─── */}
        <div className="bg-white dark:bg-[#111] p-2 rounded-full flex gap-2 shadow-sm mb-12 z-10 relative border-none">
          <button
            onClick={() => setActiveTab("sign-to-text")}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-full text-[15px] font-bold transition-all duration-300 border-none ${
              activeTab === "sign-to-text"
                ? "bg-ksl-dark text-white shadow-md"
                : "text-muted-foreground hover:bg-slate-50 dark:hover:bg-[#222] hover:text-foreground"
            }`}
          >
            <IcCamera /> {t.tabSignToText}
          </button>
          <button
            onClick={() => setActiveTab("text-to-sign")}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-full text-[15px] font-bold transition-all duration-300 border-none ${
              activeTab === "text-to-sign"
                ? "bg-ksl-blue text-white shadow-md"
                : "text-muted-foreground hover:bg-slate-50 dark:hover:bg-[#222] hover:text-foreground"
            }`}
          >
            <IcType /> {t.tabTextToSign}
          </button>
        </div>

        {/* ─── Two panel boxes (Agenda Bento Style) ─── */}
        <div className="w-full max-w-[1100px] grid md:grid-cols-2 gap-[18px] border-none relative z-10">

          {/* LEFT card: Input */}
          <div className="bg-white dark:bg-[#111] border-none rounded-[2rem] p-6 lg:p-10 flex flex-col gap-6 shadow-sm relative overflow-hidden transition-all">
            <h3 className="font-bold text-[18px] tracking-tight border-none text-foreground">
              {activeTab === "sign-to-text" ? t.leftCardCamera : t.leftCardText}
            </h3>

            {activeTab === "sign-to-text" ? (
              /* Camera view */
              <div className="relative bg-slate-50 dark:bg-[#0a0a0a] rounded-[1.5rem] overflow-hidden aspect-video flex flex-col items-center justify-center border-none">
                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${cameraActive ? "opacity-100" : "opacity-0"} border-none`}
                />
                <HandSkeletonOverlay videoRef={videoRef} active={cameraActive} />
                <canvas ref={canvasRef} className="hidden" />

                {!cameraActive && (
                  <div className="relative z-10 flex flex-col items-center text-center px-6 gap-4 border-none">
                    <div className="w-16 h-16 rounded-full bg-ksl-blue/10 flex items-center justify-center text-ksl-blue animate-float border-none">
                      <IcCamera />
                    </div>
                    <div className="border-none">
                      <p className="font-bold text-[16px] text-foreground mb-1 border-none tracking-tight">{t.cameraTitle}</p>
                      <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[200px] border-none">
                        {t.cameraDesc}
                      </p>
                    </div>
                    <button
                      onClick={startInterpreter}
                      disabled={loading}
                      className="px-8 py-3.5 rounded-full bg-ksl-blue text-white text-[15px] font-bold shadow-md hover:bg-ksl-blue/90 active:scale-95 transition-all disabled:opacity-50 border-none"
                    >
                      {loading ? t.startingCamera : t.startCamera}
                    </button>
                  </div>
                )}

                {cameraActive && (
                  <button
                    onClick={stopInterpreter}
                    className="absolute bottom-4 right-4 z-20 p-3 bg-red-500 text-white rounded-[14px] shadow-xl hover:bg-red-600 active:scale-90 transition-all border-none"
                  >
                    <IcStop />
                  </button>
                )}
              </div>
            ) : (
              /* Text input */
              <div className="flex flex-col gap-4 flex-1 border-none">
                <textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder={t.textPlaceholder}
                  className="flex-1 min-h-[220px] bg-slate-50 dark:bg-[#0a0a0a] rounded-[1.5rem] p-6 text-foreground placeholder:text-muted-foreground text-[16px] font-medium resize-none focus:outline-none transition-colors border-none"
                />
                
                <div className="flex flex-col sm:flex-row gap-[12px] border-none">
                  <button
                    onClick={toggleRecording}
                    disabled={loading}
                    className={`flex-1 h-[52px] rounded-full flex items-center justify-center gap-2 transition-all font-bold text-[15px] border-none shadow-sm ${
                      isRecording 
                        ? "bg-red-500 text-white animate-pulse" 
                        : "bg-slate-100 dark:bg-[#222] text-foreground hover:bg-slate-200 dark:hover:bg-[#333]"
                    }`}
                  >
                    <IcMic recording={isRecording} />
                    {isRecording ? "Listening..." : t.recordBtn}
                  </button>
                  
                  <button
                    onClick={fetchFingerSpelling}
                    disabled={loading || !textInput.trim()}
                    className="flex-1 h-[52px] rounded-full bg-ksl-blue text-white font-bold text-[15px] shadow-sm hover:bg-ksl-blue/90 active:scale-[0.98] transition-all disabled:opacity-50 border-none"
                  >
                    {t.translateBtn}
                  </button>
                </div>
              </div>
            )}

            {/* Language selector */}
            {activeTab === "sign-to-text" && (
              <div className="flex items-center gap-4 mt-2 border-none">
                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest border-none">{t.outputLangLabel}</span>
                <div className="flex bg-slate-50 dark:bg-[#222] rounded-full p-1 gap-1 border-none">
                  {[["rw", "Kinyarwanda"], ["en", "English"], ["fr", "French"]].map(([v, label]) => (
                    <button
                      key={v}
                      onClick={() => setOutputLang(v)}
                      className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all border-none ${outputLang === v ? "bg-ksl-blue text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT card: Output */}
          <div className="bg-white dark:bg-[#111] border-none rounded-[2rem] p-6 lg:p-10 flex flex-col gap-6 shadow-sm border-none backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between border-none z-10 relative">
              <h3 className="font-bold text-[18px] tracking-tight border-none text-foreground">{t.rightCard}</h3>
              {cameraActive && (
                <div className="text-[13px] font-bold text-ksl-blue tabular-nums border-none bg-ksl-blue/10 px-4 py-1.5 rounded-full">
                  ⏱ {runDuration}
                </div>
              )}
            </div>

            {activeTab === "sign-to-text" ? (
              <div className="flex-1 bg-[#0a0a0a] rounded-[1.5rem] border-none p-6 flex flex-col min-h-[280px] relative text-white">
                {cameraActive ? (
                  <>
                    {/* Live detection display */}
                    <div className="flex items-start gap-4 mb-4 border-none">
                      <div className="flex flex-col items-center border-none">
                        <div className="w-16 h-16 rounded-[16px] bg-ksl-blue flex items-center justify-center border-none shadow-md shadow-ksl-blue/20">
                          <span className="text-4xl font-black text-white">{prediction.letter || "—"}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 border-none">Detection</span>
                      </div>
                      <div className="flex flex-col gap-2 pt-1 border-none">
                        <button onClick={commitLetter} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[13px] font-bold text-white transition-colors border-none">
                          {t.addLetter}
                        </button>
                        <button onClick={commitSpace} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[13px] font-bold text-white transition-colors border-none">
                          {t.addSpace}
                        </button>
                      </div>
                    </div>
                    <div className="mb-4 border-none">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 border-none">
                        <span>Auto confirm</span>
                        <span>
                          {((prediction.hold_progress || 0) * (prediction.hold_seconds_required || 3)).toFixed(1)}
                          s / {(prediction.hold_seconds_required || 3).toFixed(1)}s
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden border-none drop-shadow-sm">
                        <div
                          className="h-full bg-ksl-yellow transition-all duration-100 border-none shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                          style={{ width: `${Math.max(0, Math.min((prediction.hold_progress || 0) * 100, 100))}%` }}
                        />
                      </div>
                    </div>
                    {/* Translation text */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar border-none mt-2">
                      <p className="text-[26px] font-bold leading-tight text-white tracking-tight border-none">
                        {translatedText || prediction.text || <span className="text-gray-500 italic font-medium opacity-80">{t.waitingGestures}</span>}
                        <span className="inline-block w-1.5 h-6 bg-ksl-blue ml-2 animate-pulse align-middle rounded-full border-none" />
                      </p>
                      {translateNote && (
                        <p className="mt-3 text-[13px] font-bold text-ksl-yellow/90 border-none">{translateNote}</p>
                      )}
                    </div>
                    {/* Footer actions */}
                    <div className="flex items-center justify-between mt-4 pt-5 border-t border-white/10">
                      <button onClick={clearText} className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-red-400 transition-colors border-none">
                        <IcTrash /> {t.clearAll}
                      </button>
                      <button onClick={speakResult} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-ksl-blue text-[13px] font-bold text-white hover:bg-ksl-blue/90 transition-colors border-none shadow-sm shadow-ksl-blue/20">
                        <IcVolume /> {t.speak}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Idle state */
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-70 border-none">
                    <div className="w-16 h-16 rounded-full bg-ksl-yellow flex items-center justify-center text-[#111] border-none shadow-sm">
                      <IcSwap />
                    </div>
                    <div className="border-none">
                      <p className="text-[16px] font-bold text-white mb-1 tracking-tight border-none">{t.translatedWords}</p>
                      <p className="text-[13px] text-gray-400 max-w-[200px] mx-auto border-none leading-relaxed tracking-tight font-medium">{t.translatedWordsDesc}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Text-to-Sign output */
              <div className="flex-1 bg-[#0a0a0a] rounded-[1.5rem] border-none p-6 flex flex-col min-h-[280px] overflow-hidden text-white relative">
                {signPreviewItems.length > 0 ? (
                  <SignSequencePresenter items={signPreviewItems} sourceSnapshot={signSourceSnapshot} note={signPreviewNote} />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-50 border-none">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white border-none">
                      <IcSwap />
                    </div>
                    <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest border-none mt-2">{t.emptyMatrix}</p>
                  </div>
                )}
              </div>
            )}

            {/* Confidence + accuracy pill */}
            <div className="flex items-center justify-between border-none mt-2 z-10 relative">
              <div className="flex items-center gap-2.5 text-[13px] font-bold text-slate-500 border-none tracking-tight">
                <span className="w-2.5 h-2.5 rounded-full bg-ksl-yellow border-[2px] border-ksl-yellow/30" />
                {t.accuracy} {Math.round(prediction.confidence * 100) || 95}%
              </div>
              <button
                onClick={() => setShowLogs(p => !p)}
                className="text-[13px] font-bold text-slate-400 hover:text-slate-600 transition-colors border-none underline-offset-4 hover:underline"
              >
                {showLogs ? t.hideLogs : t.showLogs}
              </button>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="w-full max-w-[1100px] mt-6 p-5 rounded-[1.5rem] bg-red-500 text-white text-[14px] font-bold flex items-center justify-between gap-4 border-none shadow-xl relative z-10">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-white/60 hover:text-white border-none transition-colors">✕</button>
          </div>
        )}

        {/* Logs drawer */}
        {showLogs && (
          <div className="w-full max-w-[1100px] mt-6 rounded-[2rem] bg-[#0a0a0a] p-8 overflow-hidden border-none shadow-xl relative z-10">
            <div className="flex items-center justify-between mb-6 border-none">
              <span className="text-[12px] font-black text-ksl-yellow uppercase tracking-widest border-none">Pipeline Telemetry</span>
              <button onClick={() => setLogs([])} className="text-[12px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest border-none">Flush</button>
            </div>
            <div className="h-48 overflow-y-auto custom-scrollbar font-mono text-[12px] text-ksl-blue space-y-2 border-none px-2">
              {logs.length > 0 ? logs.map((l, i) => (
                <div key={i} className="flex gap-4 hover:bg-white/5 py-1 rounded border-none">
                  <span className="text-gray-600 w-10 shrink-0 font-bold">{String(i).padStart(4, "0")}</span>
                  <span className="break-all opacity-90">{l}</span>
                </div>
              )) : <p className="text-gray-600 font-medium">Waiting for backend streams...</p>}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
