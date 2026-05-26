import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SignSequencePresenter, type SignPreviewItem } from "./SignSequencePresenter";
import { HandSkeletonOverlay } from "./HandSkeletonOverlay";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { useLanguage } from "./context/LanguageContext";
import {
  FiCamera,
  FiMic,
  FiSquare,
  FiTrash2,
  FiVolume2,
  FiPlus,
  FiRotateCcw,
  FiLogIn,
  FiLogOut,
} from "react-icons/fi";

const API_BASE = (() => {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (raw !== undefined && raw !== "") return `${raw.replace(/\/$/, "")}/api`;
  // Default production backend (Render). Keeps working even if env var isn't set.
  return "https://ksl-be-ftj9.onrender.com/api";
})();

const FRAME_SEND_INTERVAL_MS = 200;
const DEFAULT_HOLD_SECONDS = 3;

function parseHoldSeconds(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_HOLD_SECONDS;
}

const FRAME_WIDTH = 480;
const FRAME_HEIGHT = 360;
const FRAME_JPEG_QUALITY = 0.72;

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
interface ApiStatus {
  active: boolean;
  status?: string;
  started_at?: string | null;
  backend?: string;
  error?: string;
  sign_detector?: string;
}
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

const defaultPrediction: Prediction = {
  letter: "",
  confidence: 0,
  text: "",
  hold_progress: 0,
  hold_seconds_required: DEFAULT_HOLD_SECONDS,
};

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
    targetLang: "Ururimi rusohoka",
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
    targetLang: "Target Language",
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
    targetLang: "Langue cible",
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
    hold_seconds_required: DEFAULT_HOLD_SECONDS,
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
  const shouldKeepListeningRef = useRef(false);
  const spokenFinalRef = useRef("");
  const speechLocaleIndexRef = useRef(0);
  const sessionIdRef = useRef<string>(sessionStorage.getItem("ksl_session_id") || "");

  const speechLocales = useMemo(() => {
    if (language === "kinyarwanda") return ["rw-RW", "sw-KE", "en-US"];
    if (language === "french") return ["fr-FR", "fr", "en-US"];
    return ["en-US"];
  }, [language]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      speechLocaleIndexRef.current = 0;
      rec.lang = speechLocales[speechLocaleIndexRef.current];
      rec.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i += 1) {
          const part = (e.results[i][0]?.transcript || "").trim();
          if (!part) continue;
          if (e.results[i].isFinal) {
            spokenFinalRef.current = `${spokenFinalRef.current} ${part}`.trim();
          } else {
            interim = `${interim} ${part}`.trim();
          }
        }
        const combined = `${spokenFinalRef.current} ${interim}`.trim();
        setTextInput(combined);
      };
      rec.onstart = () => setIsRecording(true);
      rec.onend = () => {
        if (shouldKeepListeningRef.current) {
          try {
            rec.start();
            return;
          } catch {
            // fallback to stopped state below
          }
        }
        setIsRecording(false);
      };
      rec.onerror = (e: any) => {
        if (!shouldKeepListeningRef.current) {
          setIsRecording(false);
          return;
        }
        const code = String(e?.error || "");
        if (code === "language-not-supported" && speechLocaleIndexRef.current < speechLocales.length - 1) {
          speechLocaleIndexRef.current += 1;
          rec.lang = speechLocales[speechLocaleIndexRef.current];
          setError(`Speech locale not supported; switched to ${rec.lang}.`);
        }
        // Let onend attempt automatic resume for transient mobile speech errors.
      };
      recognitionRef.current = rec;
    }
    return () => {
      shouldKeepListeningRef.current = false;
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, [speechLocales]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError("Voice recognition is not supported in this browser.");
      return;
    }
    if (isRecording) {
      shouldKeepListeningRef.current = false;
      recognitionRef.current?.stop();
    } else {
      setError("");
      const base = textInput.trim();
      spokenFinalRef.current = base ? `${base} ` : "";
      speechLocaleIndexRef.current = 0;
      recognitionRef.current.lang = speechLocales[speechLocaleIndexRef.current];
      shouldKeepListeningRef.current = true;
      try {
        recognitionRef.current?.start();
      } catch {
        shouldKeepListeningRef.current = false;
        setError("Voice recognition failed to start.");
      }
    }
  };
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const camRef = useRef(false);
  const translateSeqRef = useRef(0);
  const frameInFlightRef = useRef(false);
  const lastFrameSentAtRef = useRef(0);
  const reconnectingRef = useRef(false);

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

  const startBackendSession = useCallback(async () => {
    const r = await apiFetch(`/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "letter" }),
    });
    if (!r.ok) {
      let backendMsg = `Backend returned ${r.status}`;
      try {
        const err = (await r.json()) as { error?: string };
        if (err?.error) backendMsg = err.error;
      } catch {
        // fallback message is enough
      }
      throw new Error(backendMsg);
    }
    const started = (await r.json().catch(() => ({}))) as { session_id?: string };
    if (!started?.session_id) {
      throw new Error("Backend did not return a session id.");
    }
    sessionIdRef.current = started.session_id;
    sessionStorage.setItem("ksl_session_id", started.session_id);
  }, [apiFetch]);

  const refresh = useCallback(async () => {
    try {
      const [s, l, p] = await Promise.all([
        getJson<ApiStatus>("/status"),
        getJson<{ logs: string[] }>("/pipeline-logs"),
        sessionIdRef.current ? getJson<Prediction>("/prediction") : Promise.resolve(defaultPrediction),
      ]);
      setStatus(s);
      setLogs(l.logs);
      setPrediction((prev) => {
        const holdRequired = parseHoldSeconds(p.hold_seconds_required);
        const fromCamera = camRef.current;
        return {
          letter: p.current_letter || p.letter || "",
          confidence: p.confidence || 0,
          text: p.text || "",
          // While the camera loop is running, keep live hold progress from /analyze-frame.
          hold_progress: fromCamera ? prev.hold_progress : (p.hold_progress ?? 0),
          hold_seconds_required: fromCamera
            ? prev.hold_seconds_required || holdRequired
            : holdRequired,
        };
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
        await startBackendSession();
        if (!cancelled) {
          reconnectingRef.current = false;
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
  }, [cameraActive, status.backend, status.status, refresh, startBackendSession]);

  useEffect(() => {
    if (activeTab !== "sign-to-text") return;
    if (status.backend !== "ready") {
      setTranslatedText("");
      setTranslateNote("");
      return;
    }
    const sourceText = (prediction.text || "").trim();
    if (!sourceText) {
      setTranslatedText("");
      setTranslateNote("");
      return;
    }

    const seq = ++translateSeqRef.current;
    const id = window.setTimeout(async () => {
      if (outputLang === "en") {
        setTranslatedText(sourceText);
        setTranslateNote("");
        return;
      }
      try {
        const r = await apiFetch("/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sourceText, target: outputLang }),
        });
        const data = (await r.json()) as TranslateResponse;
        if (seq !== translateSeqRef.current) return;
        setTranslatedText((data.text || sourceText).trim());
        if (data.fallback && data.message) {
          setTranslateNote(data.message);
        } else if (!r.ok) {
          setTranslatedText(sourceText);
          setTranslateNote(
            "Translation service error. Is the backend running at " +
              API_BASE.replace(/\/api$/, "") +
              " with internet access?"
          );
        } else {
          setTranslateNote("");
        }
      } catch {
        if (seq !== translateSeqRef.current) return;
        setTranslatedText(sourceText);
        setTranslateNote(
          "Cannot reach the translation API. Start the backend (.\\start_backend.ps1) and use http://127.0.0.1:5000."
        );
      }
    }, 500);

    return () => window.clearTimeout(id);
  }, [activeTab, outputLang, prediction.text, status.backend, apiFetch]);

  // Frame send loop
  useEffect(() => {
    if (!cameraActive) return;
    const vid = videoRef.current;
    const can = canvasRef.current;
    if (!vid || !can) return;
    let rafId = 0;
    let disposed = false;

    const tick = async () => {
      if (disposed) return;
      if (vid.videoWidth === 0) return;
      if (!sessionIdRef.current) return; // Prevent sending frames before session is established
      if (document.visibilityState !== "visible") return;
      if (frameInFlightRef.current) return;
      const now = Date.now();
      if (now - lastFrameSentAtRef.current < FRAME_SEND_INTERVAL_MS) return;

      can.width = FRAME_WIDTH;
      can.height = FRAME_HEIGHT;
      const ctx = can.getContext("2d"); if (!ctx) return;
      frameInFlightRef.current = true;
      lastFrameSentAtRef.current = now;
      ctx.drawImage(vid, 0, 0, can.width, can.height);
      const image = can.toDataURL("image/jpeg", FRAME_JPEG_QUALITY);
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
              sessionStorage.removeItem("ksl_session_id");
              if (!reconnectingRef.current) {
                reconnectingRef.current = true;
                void startBackendSession()
                  .then(() => {
                    setError("");
                    reconnectingRef.current = false;
                    void refresh();
                  })
                  .catch(() => {
                    reconnectingRef.current = false;
                  });
              }
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
          hold_progress:
            typeof data.hold_progress === "number" ? data.hold_progress : 0,
          hold_seconds_required: parseHoldSeconds(data.hold_seconds_required),
        }));
      } catch {
        // network hiccups are expected on hosted backends
      } finally {
        frameInFlightRef.current = false;
      }
    };

    const loop = () => {
      void tick();
      if (!disposed) rafId = window.requestAnimationFrame(loop);
    };
    rafId = window.requestAnimationFrame(loop);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      frameInFlightRef.current = false;
    };
  }, [cameraActive, status.backend, apiFetch, refresh, startBackendSession]);

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
      try {
        await startBackendSession();
      } catch (e) {
        const backendMsg = e instanceof Error ? e.message : "Backend start failed";
        if (backendMsg.includes("503") || isLoadingMessage(backendMsg)) {
          setError("Backend is still loading model. Camera is ready; detection will begin automatically.");
          setLoading(false);
          return;
        }
        throw new Error(backendMsg);
      }
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
      sessionStorage.removeItem("ksl_session_id");
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

  const resetTextToSignInput = () => {
    if (isRecording) {
      shouldKeepListeningRef.current = false;
      recognitionRef.current?.stop();
    }
    spokenFinalRef.current = "";
    setTextInput("");
    setSignPreviewItems([]);
    setSignSourceSnapshot("");
    setSignPreviewNote("");
    setError("");
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
    <div className="min-h-screen bg-[#fafbfc] dark:bg-background text-foreground font-sans overflow-x-hidden flex flex-col custom-scrollbar border-none relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.05),transparent)] pointer-events-none" />
      
      <Header />

      {/* ═══════════════ MAIN ═══════════════ */}
      <main className="flex-1 pt-20 md:pt-36 pb-12 container mx-auto px-4 md:px-6 flex flex-col items-center border-none">

        {/* Hero text */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16 relative z-10 border-none px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ksl-yellow/10 dark:bg-ksl-yellow/5 border border-ksl-yellow/20 text-ksl-yellow font-bold text-[11px] md:text-[13px] mb-6 md:mb-10 tracking-widest uppercase animate-float shadow-none border-none">
            <span className="w-1.5 h-1.5 rounded-full bg-ksl-yellow animate-pulse" />
            {t.badge}
          </div>
          
          <h1 className="text-[38px] md:text-[64px] font-bold leading-[1.1] mb-6 text-foreground tracking-tight border-none">
            {language === 'kinyarwanda' ? 'Ihindurangenga' : 'KSL Interpreter'} 
            <span className="text-ksl-blue">.</span>
          </h1>
          
          <p className="text-[15px] md:text-[20px] text-muted-foreground font-medium leading-relaxed max-w-xl mx-auto tracking-tight border-none opacity-80">
            {t.heroDesc}
          </p>
        </div>

        {/* ─── Tab switcher ─── */}
        <div className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-sm p-1.5 rounded-3xl flex gap-1.5 shadow-none shadow-black/[0.02] mb-10 md:mb-16 z-10 relative border border-slate-200 dark:border-white/5 transition-all">
          <button
            onClick={() => setActiveTab("sign-to-text")}
            className={`flex items-center gap-2.5 px-6 md:px-10 py-3 md:py-4 rounded-2xl text-[14px] md:text-[16px] font-bold transition-all duration-300 border-none ${
              activeTab === "sign-to-text"
                ? "bg-ksl-dark text-white shadow-none shadow-ksl-dark/20 scale-[1.02]"
                : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <IcCamera size={18} /> <span className="sm:inline">{t.tabSignToText}</span><span className="sm:hidden">Sign</span>
          </button>
          <button
            onClick={() => setActiveTab("text-to-sign")}
            className={`flex items-center gap-2.5 px-6 md:px-10 py-3 md:py-4 rounded-2xl text-[14px] md:text-[16px] font-bold transition-all duration-300 border-none ${
              activeTab === "text-to-sign"
                ? "bg-ksl-blue text-white shadow-none shadow-ksl-blue/20 scale-[1.02]"
                : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <IcType size={18} /> <span className="sm:inline">{t.tabTextToSign}</span><span className="sm:hidden">Text</span>
          </button>
        </div>

        {/* ─── Two panel boxes (Agenda Bento Style) ─── */}
        <div className="w-full max-w-[1100px] grid md:grid-cols-2 gap-[18px] border-none relative z-10">

          {/* LEFT card: Input */}
          <div className="bg-white/80 dark:bg-white/[0.02] backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-[2rem] p-5 md:p-10 flex flex-col gap-6 md:gap-8 shadow-none shadow-black/[0.02] relative overflow-hidden group/card transition-all hover:shadow-black/[0.04]">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="w-1.5 h-6 bg-ksl-blue rounded-full" />
              <h3 className="font-bold text-[14px] md:text-[16px] tracking-[0.1em] uppercase text-foreground/60">
                {activeTab === "sign-to-text" ? t.leftCardCamera : t.leftCardText}
              </h3>
            </div>

            {activeTab === "sign-to-text" ? (
              /* Camera view */
              <div className="relative bg-slate-900 rounded-[2rem] overflow-hidden aspect-video flex flex-col items-center justify-center border border-white/5 shadow-none shadow-black/20 group/video">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none opacity-0 group-hover/video:opacity-100 transition-opacity duration-500" />
                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${cameraActive ? "opacity-100" : "opacity-0"} border-none`}
                />
                <HandSkeletonOverlay videoRef={videoRef} active={cameraActive} />
                <canvas ref={canvasRef} className="hidden" />

                {!cameraActive && (
                  <div className="relative z-10 flex flex-col items-center text-center px-4 gap-2 md:gap-4 border-none">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-ksl-blue/10 flex items-center justify-center text-ksl-blue animate-float border-none">
                      <IcCamera />
                    </div>
                    <div className="border-none">
                      <h4 className="font-bold text-[16px] md:text-[18px] mb-2 text-foreground border-none tracking-tight">{t.cameraTitle}</h4>
                      <p className="text-[13px] md:text-[14px] text-muted-foreground mb-6 max-w-[240px] leading-relaxed border-none">{t.cameraDesc}</p>
                    </div>
                    <button
                      onClick={startInterpreter}
                      disabled={loading}
                      className="px-6 md:px-8 py-2.5 md:py-3.5 rounded-full bg-ksl-blue text-white text-[13px] md:text-[15px] font-bold shadow-none hover:bg-ksl-blue/90 active:scale-95 transition-all disabled:opacity-50 border-none flex items-center gap-2"
                    >
                      <FiCamera className="text-sm md:text-base" />
                      {loading ? t.startingCamera : t.startCamera}
                    </button>
                  </div>
                )}

                {cameraActive && (
                  <button
                    onClick={stopInterpreter}
                    className="absolute bottom-4 right-4 z-20 p-3 bg-red-500 text-white rounded-[14px] shadow-none hover:bg-red-600 active:scale-90 transition-all border-none"
                  >
                    <FiSquare className="text-lg" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col h-full border-none">
                <div className="flex-1 relative mb-6">
                  <textarea
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    placeholder={t.textPlaceholder}
                    className="w-full h-full min-h-[220px] md:min-h-[260px] bg-slate-50 dark:bg-white/[0.03] rounded-[1.5rem] p-6 text-foreground placeholder:text-muted-foreground/50 text-[15px] md:text-[17px] font-medium resize-none transition-all border border-slate-200 dark:border-white/5 outline-none focus:border-ksl-blue/50"
                  />
                  <div className="absolute bottom-4 right-4 text-[11px] font-bold text-muted-foreground/40 tracking-widest uppercase">
                    UTF-8 Character Stream
                  </div>
                </div>
                
                <div className="grid grid-cols-12 gap-3 mt-auto">
                  <button
                    onClick={toggleRecording}
                    disabled={loading}
                    className={`col-span-5 h-[56px] rounded-2xl flex items-center justify-center gap-2.5 transition-all font-bold text-[14px] shadow-none border-none ${
                      isRecording 
                        ? "bg-red-500 text-white animate-pulse" 
                        : "bg-slate-100 dark:bg-white/5 text-foreground hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                  >
                    <FiMic className={`text-[18px] ${isRecording ? "text-white" : ""}`} />
                    <span className="truncate">{isRecording ? "Listening" : "Record"}</span>
                  </button>
                  
                  <button
                    onClick={fetchFingerSpelling}
                    disabled={loading || !textInput.trim()}
                    className="col-span-5 h-[56px] rounded-2xl bg-ksl-blue text-white font-bold text-[14px] shadow-none shadow-ksl-blue/20 hover:bg-ksl-blue/90 active:scale-[0.98] transition-all disabled:opacity-50 border-none flex items-center justify-center gap-2"
                  >
                    <IcType size={16} />
                    <span className="truncate">Translate</span>
                  </button>

                  <button
                    onClick={resetTextToSignInput}
                    disabled={loading || (!textInput.trim() && signPreviewItems.length === 0)}
                    className="col-span-2 h-[56px] rounded-2xl bg-slate-100 dark:bg-white/5 text-foreground flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-all disabled:opacity-30 border-none"
                    title="Reset"
                  >
                    <FiRotateCcw className="text-[18px]" />
                  </button>
                </div>
              </div>
            )}

            {/* Language selector footer */}
            {activeTab === "sign-to-text" && (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">{t.outputLangLabel}</span>
                <div className="flex bg-slate-50 dark:bg-white/5 rounded-xl p-1 gap-1 border border-slate-200 dark:border-white/10">
                  {[["rw", "🇷🇼", "RW"], ["en", "🇺🇸", "EN"], ["fr", "🇫🇷", "FR"]].map(([v, flag, label]) => (
                    <button
                      key={v}
                      onClick={() => setOutputLang(v)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all border-none flex items-center gap-2 ${outputLang === v ? "bg-ksl-blue text-white shadow-none" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <span>{flag}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT card: Output */}
          <div className="bg-ksl-dark dark:bg-white/[0.02] backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-[2rem] p-5 md:p-10 flex flex-col gap-6 md:gap-8 shadow-none relative overflow-hidden transition-all group/output min-h-[480px] md:min-h-[520px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent)] pointer-events-none" />
            <div className="flex items-center justify-between border-b border-white/10 pb-4 z-10 relative">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-6 bg-ksl-yellow rounded-full" />
                <h3 className="font-bold text-[14px] md:text-[16px] tracking-[0.1em] uppercase text-white/60">
                  {t.rightCard}
                </h3>
              </div>
              {cameraActive && (
                <div className="text-[12px] font-bold text-ksl-blue tabular-nums border border-ksl-blue/30 bg-ksl-blue/10 px-4 py-1.5 rounded-xl">
                  {runDuration}
                </div>
              )}
            </div>

            {activeTab === "sign-to-text" ? (
              <div className="flex-1 bg-[#0a0a0a] rounded-[1.5rem] border-none p-6 flex flex-col min-h-[280px] relative text-white">
                {cameraActive ? (
                  <>
                    {/* Live detection display */}
                    <div className="flex items-start gap-3 md:gap-4 mb-4 border-none">
                      <div className="flex flex-col items-center border-none">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-[16px] bg-ksl-blue flex items-center justify-center border-none shadow-none shadow-ksl-blue/20">
                          <span className="text-3xl md:text-4xl font-black text-white">{prediction.letter || "—"}</span>
                        </div>
                        <span className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 border-none">Detection</span>
                      </div>
                      <div className="flex flex-col gap-2 pt-1 border-none">
                        <button onClick={commitLetter} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[12px] md:text-[13px] font-bold text-white transition-colors border-none flex items-center gap-1.5">
                          <FiPlus className="text-xs md:text-sm" />
                          <span className="hidden sm:inline">{t.addLetter}</span>
                          <span className="sm:hidden">Letter</span>
                        </button>
                        <button onClick={commitSpace} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[12px] md:text-[13px] font-bold text-white transition-colors border-none flex items-center gap-1.5">
                          <FiPlus className="text-xs md:text-sm" />
                          <span className="hidden sm:inline">{t.addSpace}</span>
                          <span className="sm:hidden">Space</span>
                        </button>
                      </div>
                    </div>
                    <div className="mb-4 border-none">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 border-none">
                        <span>Auto confirm (hold sign)</span>
                        <span>
                          {(
                            (prediction.hold_progress ?? 0) *
                            parseHoldSeconds(prediction.hold_seconds_required)
                          ).toFixed(1)}
                          s / {parseHoldSeconds(prediction.hold_seconds_required).toFixed(1)}s
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden border-none drop-shadow-none">
                        <div
                          className="h-full bg-ksl-yellow transition-all duration-100 border-none shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                          style={{ width: `${Math.max(0, Math.min((prediction.hold_progress ?? 0) * 100, 100))}%` }}
                        />
                      </div>
                    </div>
                    {/* Translation text */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar border-none mt-1 md:mt-2">
                      <p className="text-[18px] md:text-[26px] font-bold leading-snug text-white tracking-tight border-none whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                        {translatedText || prediction.text || <span className="text-gray-500 italic font-medium opacity-80">{t.waitingGestures}</span>}
                        <span className="inline-block w-1 h-5 md:w-1.5 md:h-6 bg-ksl-blue ml-2 animate-pulse align-middle rounded-full border-none" />
                      </p>
                      {translateNote && (
                        <p className="mt-3 text-[13px] font-bold text-ksl-yellow/90 border-none">{translateNote}</p>
                      )}
                    </div>
                    {/* Footer actions */}
                    <div className="flex items-center justify-between mt-4 pt-5 border-t border-white/10">
                      <button onClick={clearText} className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-red-400 transition-colors border-none">
                        <FiTrash2 className="text-base" /> <span className="hidden sm:inline">{t.clearAll}</span><span className="sm:hidden">Clear</span>
                      </button>
                      <button onClick={speakResult} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-ksl-blue text-[13px] font-bold text-white hover:bg-ksl-blue/90 transition-colors border-none shadow-none shadow-ksl-blue/20">
                        <FiVolume2 className="text-base" /> <span className="hidden sm:inline">{t.speak}</span><span className="sm:hidden">Speak</span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* Idle state */
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 border-none group/idle">
                    <div className="relative">
                      <div className="absolute -inset-6 bg-ksl-yellow/10 blur-2xl rounded-full group-hover/idle:bg-ksl-yellow/20 transition-all" />
                      <div className="relative w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover/idle:text-ksl-yellow transition-colors">
                        <IcSwap size={32} />
                      </div>
                    </div>
                    <div className="max-w-[280px] space-y-2">
                      <h4 className="font-bold text-[18px] text-white/80 tracking-tight uppercase border-none">{t.translatedWords}</h4>
                      <p className="text-[14px] text-white/30 leading-relaxed border-none font-medium">{t.translatedWordsDesc}</p>
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

            {/* Confidence + accuracy footer */}
            <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/10 z-10 relative">
              <div className="flex items-center gap-3 text-[11px] font-bold text-white/40 tracking-widest uppercase">
                <span className="flex gap-1">
                  {[1,2,3].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= (prediction.confidence * 3) ? 'bg-ksl-yellow shadow-[0_0_8px_rgba(255,204,0,0.5)]' : 'bg-white/10'}`} />)}
                </span>
                {t.accuracy} {Math.round(prediction.confidence * 100) || 95}%
              </div>
              <button
                onClick={() => setShowLogs(p => !p)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all border ${showLogs ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-white/30 hover:border-white/20 hover:text-white'}`}
              >
                {showLogs ? <FiLogOut size={14} /> : <FiLogIn size={14} />}
                {showLogs ? t.hideLogs : t.showLogs}
              </button>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="w-full max-w-[1100px] mt-6 p-5 rounded-[1.5rem] bg-red-500 text-white text-[14px] font-bold flex items-center justify-between gap-4 border-none shadow-none relative z-10">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-white/60 hover:text-white border-none transition-colors">✕</button>
          </div>
        )}

        {/* Logs drawer */}
        {showLogs && (
          <div className="w-full max-w-[1100px] mt-8 rounded-[2.5rem] bg-ksl-dark dark:bg-white/[0.02] backdrop-blur-xl p-8 overflow-hidden border border-white/5 shadow-none relative z-10">
            <div className="flex items-center justify-between mb-8 border-none">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-ksl-blue animate-pulse" />
                <span className="text-[12px] font-black text-white uppercase tracking-[0.2em] border-none opacity-80">Pipeline Telemetry</span>
              </div>
              <button onClick={() => setLogs([])} className="text-[12px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest border-none">Flush Console</button>
            </div>
            <div className="h-56 overflow-y-auto custom-scrollbar font-mono text-[12px] text-ksl-blue/90 space-y-2.5 border-none px-4">
              {logs.length > 0 ? logs.map((l, i) => (
                <div key={i} className="flex gap-6 hover:bg-white/5 py-1.5 rounded-lg px-3 transition-colors border-none group/log">
                  <span className="text-gray-700 w-12 shrink-0 font-bold group-hover/log:text-gray-500 transition-colors">{String(i).padStart(4, "0")}</span>
                  <span className="break-all leading-relaxed">{l}</span>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-ksl-blue/30 animate-spin-slow" />
                  <p className="text-gray-500 font-medium tracking-tight">Listening for telemetry streams...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
