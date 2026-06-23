import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SignSequencePresenter, type SignPreviewItem } from "./SignSequencePresenter";
import { HandSkeletonOverlay } from "./HandSkeletonOverlay";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { PageShell } from "./components/layout/PageShell";
import { stripDisplayMarkup } from "./utils/plainText";
import { PlainTextEditor } from "./components/PlainTextEditor";
import { RecentTextSuggestions } from "./components/RecentTextSuggestions";
import { TranslationSuggestionBar } from "./components/TranslationSuggestionBar";
import {
  applySuggestionToText,
  getDeviceId,
  getLocalTextSuggestions,
  lastWordPrefix,
  mergeSuggestions,
  recordLocalTextUsage,
  type TextSuggestion,
} from "./utils/textSuggestions";
import {
  FiCamera,
  FiSquare,
  FiTrash2,
  FiPlus,
  FiRotateCcw,
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
const IcCamera = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
  </svg>
);
const IcSwap = ({ size = 28 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 3 4 4-4 4" /><path d="M20 7H4" /><path d="m8 21-4-4 4-4" /><path d="M4 17h16" />
  </svg>
);
const IcType = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const t = {
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
  recentSuggestions: "Your recent translations — tap to use (optional)",
  suggestedTranslation: "Suggested translation",
  approvedTranslation: "Approved",
  approve: "Approve",
  dismiss: "Dismiss",
};

export default function InterpreterPage() {
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
  const [textSuggestions, setTextSuggestions] = useState<TextSuggestion[]>([]);
  const [approvedTranslation, setApprovedTranslation] = useState<string | null>(
    null
  );
  const [dismissedTranslation, setDismissedTranslation] = useState<string | null>(
    null
  );

  // Keep interpreter output language aligned with the site language.
  useEffect(() => {
    setOutputLang("en");
  }, []);

  const recognitionRef = useRef<any>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const spokenFinalRef = useRef("");
  const speechLocaleIndexRef = useRef(0);
  const sessionIdRef = useRef<string>(sessionStorage.getItem("ksl_session_id") || "");

  const speechLocales = useMemo(() => {
    return ["en-US", "en-GB", "en"];
  }, []);

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
        const combined = stripDisplayMarkup(
          `${spokenFinalRef.current} ${interim}`.trim()
        );
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
      const token = localStorage.getItem("ksl_token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("X-Device-Id", getDeviceId());
      return fetch(`${API_BASE}${path}`, { ...init, headers });
    },
    []
  );

  useEffect(() => {
    if (activeTab !== "text-to-sign") {
      setTextSuggestions([]);
      return;
    }
    const prefix = lastWordPrefix(textInput);
    const local = getLocalTextSuggestions(prefix, 8);
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);

    const applyMerged = (remote: TextSuggestion[]) => {
      setTextSuggestions(mergeSuggestions(local, remote, 8));
    };

    const query = prefix
      ? `/text-suggestions?q=${encodeURIComponent(prefix)}&limit=8`
      : "/text-suggestions?limit=6";

    suggestDebounceRef.current = setTimeout(async () => {
      try {
        const r = await apiFetch(query);
        if (!r.ok) {
          setTextSuggestions(local);
          return;
        }
        const data = (await r.json()) as { suggestions?: TextSuggestion[] };
        applyMerged(data.suggestions ?? []);
      } catch {
        setTextSuggestions(local);
      }
    }, 300);

    return () => {
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    };
  }, [textInput, activeTab, apiFetch]);

  const applyTextSuggestion = useCallback((suggestion: string) => {
    setTextInput((prev) => applySuggestionToText(prev, suggestion));
  }, []);

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

  const detectedSignText = stripDisplayMarkup((prediction.text || "").trim());

  useEffect(() => {
    setDismissedTranslation(null);
    setApprovedTranslation(null);
  }, [detectedSignText, outputLang]);

  useEffect(() => {
    if (activeTab !== "sign-to-text") return;
    if (status.backend !== "ready") {
      setTranslatedText("");
      setTranslateNote("");
      return;
    }
    const sourceText = detectedSignText;
    if (!sourceText) {
      setTranslatedText("");
      setTranslateNote("");
      return;
    }

    const seq = ++translateSeqRef.current;
    const id = window.setTimeout(async () => {
      if (outputLang === "en") {
        setTranslatedText(stripDisplayMarkup(sourceText));
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
        setTranslatedText(stripDisplayMarkup((data.text || sourceText).trim()));
        if (data.fallback && data.message) {
          setTranslateNote(data.message);
        } else if (!r.ok) {
          setTranslatedText(stripDisplayMarkup(sourceText));
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
        setTranslatedText(stripDisplayMarkup(sourceText));
        setTranslateNote(
          "Cannot reach the translation API. Start the backend (.\\start_backend.ps1) and use http://127.0.0.1:5000."
        );
      }
    }, 500);

    return () => window.clearTimeout(id);
  }, [activeTab, outputLang, detectedSignText, status.backend, apiFetch]);

  const pendingTranslation = useMemo(() => {
    if (outputLang === "en") return "";
    const raw = stripDisplayMarkup(translatedText.trim());
    if (!raw || raw === detectedSignText) return "";
    if (dismissedTranslation === raw) return "";
    return raw;
  }, [
    outputLang,
    translatedText,
    detectedSignText,
    dismissedTranslation,
  ]);

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
  const clearText = () => {
    setApprovedTranslation(null);
    setDismissedTranslation(null);
    return apiFetch(`/clear`, { method: "POST" }).then(() => refresh()).catch(() => { });
  };

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
    setTextSuggestions([]);
    setError("");
  };

  const fetchFingerSpellingExplicit = async (val: string) => {
    if (!val.trim()) return;
    setLoading(true);
    try {
      const r = await apiFetch(`/text-to-sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: val }),
      });
      if (!r.ok) throw new Error(`${r.status}`);
      const data = await r.json();
      recordLocalTextUsage(val);
      setSignPreviewItems(data.items || []);
      setSignSourceSnapshot(val);
      setSignPreviewNote(data.note || "");
      setError("");
      const prefix = lastWordPrefix(val);
      setTextSuggestions(getLocalTextSuggestions(prefix, 8));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not fetch signs"); }
    setLoading(false);
  };

  const runDuration = useMemo(() => {
    if (!status.started_at || !cameraActive) return "00:00:00";
    const s = Math.max(0, Math.floor((Date.now() - Date.parse(status.started_at)) / 1000));
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(n => String(n).padStart(2, "0")).join(":");
  }, [status, cameraActive]);

  return (
    <PageShell className="interpreter-page custom-scrollbar text-slate-800 relative bg-mesh">
      <Header />

      <main className="relative z-10 mx-auto flex-1 flex w-full max-w-5xl flex-col items-center justify-center px-4 py-8 md:px-6 select-none">

        {/* Hero Leading Heading */}
        <div className="mb-8 flex flex-col items-center text-center animate-slide-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#90DDF5]/20 border border-[#90DDF5]/40 px-4 py-1.5 text-[11px] font-display font-semibold uppercase tracking-widest text-[#0B252E]/70 mb-5">
            {t.badge}
          </span>
          <h1 className="text-[36px] md:text-[52px] leading-[1.1] tracking-tight text-[#0B252E]">
            <span className="font-display font-bold">{t.heroTitle1} </span>
            <span className="font-script text-[#0B252E]">{t.heroTitleItalic}</span>
            <span className="font-display font-bold"> {t.heroTitle2}</span>
          </h1>
          <p className="mt-4 max-w-lg text-[15px] font-display font-light text-slate-500 leading-relaxed">
            {t.heroDesc}
          </p>
        </div>

        {/* Compact, clean Tab Switcher centered above the cards */}
        <div className="mb-6 flex w-full max-w-xs gap-1 rounded-full border border-gray-200 bg-gray-50/80 p-1 shadow-inner animate-slide-up">
          <button
            type="button"
            onClick={() => setActiveTab("sign-to-text")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-[12px] font-semibold transition-all duration-200 ${
              activeTab === "sign-to-text"
                ? "bg-white text-primary shadow-sm border border-gray-200/50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <IcCamera size={14} />
            <span>Sign to Text</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("text-to-sign")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-[12px] font-semibold transition-all duration-200 ${
              activeTab === "text-to-sign"
                ? "bg-white text-primary shadow-sm border border-gray-200/50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <IcType size={14} />
            <span>Text to Sign</span>
          </button>
        </div>

        <div className="grid w-full max-w-[1100px] items-start gap-4 md:grid-cols-2 md:gap-5">

          <div
            className={`interpreter-panel flex flex-col gap-4 p-5 md:gap-5 md:p-6 ${
              activeTab === "sign-to-text" ? "min-h-[480px] md:min-h-[520px]" : ""
            }`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="interpreter-panel-title font-display font-bold">
                {activeTab === "sign-to-text" ? t.leftCardCamera : t.leftCardText}
              </h3>
            </div>

            {activeTab === "sign-to-text" ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="interpreter-stage relative flex min-h-[260px] flex-1 flex-col overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${cameraActive ? "opacity-100" : "opacity-0"}`}
                  />
                  <HandSkeletonOverlay videoRef={videoRef} active={cameraActive} />
                  <canvas ref={canvasRef} className="hidden" />

                  {!cameraActive && (
                    <div className="relative z-10 flex h-full min-h-[240px] flex-col items-center justify-center gap-4 p-6 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-primary shadow-sm">
                        <IcCamera size={24} />
                      </div>
                      <div className="max-w-[260px]">
                        <h4 className="mb-1.5 font-display text-[16px] font-bold text-slate-800">
                          {t.cameraTitle}
                        </h4>
                        <p className="mb-6 text-[13px] leading-relaxed text-slate-500">
                          {t.cameraDesc}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={startInterpreter}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-white shadow-button transition-all hover:brightness-110 disabled:opacity-50"
                      >
                        <FiCamera className="text-sm" />
                        {loading ? t.startingCamera : t.startCamera}
                      </button>
                    </div>
                  )}

                  {cameraActive && (
                    <button
                      type="button"
                      onClick={stopInterpreter}
                      className="absolute bottom-4 right-4 z-20 rounded-lg bg-red-500/90 p-2.5 text-white transition-colors hover:bg-red-600"
                      aria-label="Stop camera"
                    >
                      <FiSquare className="text-base" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="interpreter-stage flex flex-col gap-3 p-4 md:p-5">
                  <div className="relative min-h-[140px]">
                    <PlainTextEditor
                      value={textInput}
                      onChange={setTextInput}
                      placeholder={t.textPlaceholder}
                      className="min-h-[160px] w-full border-0 bg-transparent p-0 text-[15px] leading-relaxed text-slate-800 empty:before:text-slate-400 focus:ring-0 md:min-h-[180px]"
                    />
                  </div>
                  <RecentTextSuggestions
                    items={textSuggestions}
                    onSelect={applyTextSuggestion}
                    label={t.recentSuggestions}
                  />
                </div>
                <div className="grid shrink-0 grid-cols-12 gap-2">
                  <button
                    type="button"
                    onClick={fetchFingerSpelling}
                    disabled={loading || !textInput.trim()}
                    className="col-span-10 flex h-11 items-center justify-center gap-2 rounded-full bg-primary text-[13px] font-medium text-white shadow-button transition-all hover:brightness-110 disabled:opacity-40"
                  >
                    <IcType size={15} />
                    <span className="truncate">Translate</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetTextToSignInput}
                    disabled={loading || (!textInput.trim() && signPreviewItems.length === 0)}
                    className="col-span-2 flex h-11 items-center justify-center rounded-full border border-gray-200 text-slate-500 transition-colors hover:bg-gray-50 hover:text-slate-800 disabled:opacity-25"
                    title="Reset"
                  >
                    <FiRotateCcw className="text-base" />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
              {activeTab === "sign-to-text" ? (
                <>
                  <span className="text-[11px] font-medium text-slate-400">
                    {t.outputLangLabel}
                  </span>
                  <span className="text-[11px] font-medium text-slate-600">
                    {outputLang === "rw"
                      ? "🇷🇼 RW"
                      : outputLang === "fr"
                        ? "🇫🇷 FR"
                        : "🇺🇸 EN"}
                  </span>
                </>
              ) : (
                <span className="text-[11px] text-slate-400">
                  {t.recentSuggestions}
                </span>
              )}
            </div>
          </div>

          <div
            className={`interpreter-panel flex flex-col gap-4 p-5 md:gap-5 md:p-6 ${
              activeTab === "sign-to-text" ? "min-h-[480px] md:min-h-[520px]" : ""
            }`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="interpreter-panel-title font-display font-bold">{t.rightCard}</h3>
              {cameraActive && activeTab === "sign-to-text" && (
                <span className="rounded-full bg-ksl-blue/15 px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-ksl-blue">
                  {runDuration}
                </span>
              )}
            </div>

            {activeTab === "sign-to-text" ? (
              <div className="interpreter-stage flex min-h-[260px] flex-1 flex-col p-4 text-slate-800 md:p-5">
                {cameraActive ? (
                  <>
                    <div className="mb-4 flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="font-display flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-xl font-semibold text-primary md:h-14 md:w-14 md:text-2xl">
                          {prediction.letter || "—"}
                        </div>
                        <span className="mt-1.5 text-[10px] text-slate-400">
                          {t.detection}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={commitLetter}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-gray-50"
                        >
                          <FiPlus className="text-xs" />
                          <span className="hidden sm:inline">{t.addLetter}</span>
                        </button>
                        <button
                          type="button"
                          onClick={commitSpace}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-gray-50"
                        >
                          <FiPlus className="text-xs" />
                          <span className="hidden sm:inline">{t.addSpace}</span>
                        </button>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="mb-1.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Hold to confirm</span>
                        <span className="tabular-nums">
                          {(
                            (prediction.hold_progress ?? 0) *
                            parseHoldSeconds(prediction.hold_seconds_required)
                          ).toFixed(1)}
                          /{parseHoldSeconds(prediction.hold_seconds_required).toFixed(1)}s
                        </span>
                      </div>
                      <div className="h-0.5 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-gradient-to-r from-ksl-blue to-sky-400 transition-all duration-100"
                          style={{
                            width: `${Math.max(0, Math.min((prediction.hold_progress ?? 0) * 100, 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <p className="text-[14px] md:text-[16px] font-normal leading-relaxed text-slate-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                          {detectedSignText || (
                            <span className="text-[14px] font-normal text-slate-400">
                              {t.waitingGestures}
                            </span>
                          )}
                        </p>
                        {translateNote && (
                          <p className="mt-2 text-[12px] text-slate-500">{translateNote}</p>
                        )}
                      </div>
                      {outputLang !== "en" && (
                        <TranslationSuggestionBar
                          suggestion={pendingTranslation}
                          approvedText={approvedTranslation}
                          onApprove={() => {
                            if (pendingTranslation) {
                              setApprovedTranslation(pendingTranslation);
                              setDismissedTranslation(null);
                            }
                          }}
                          onDismiss={() => {
                            if (pendingTranslation) {
                              setDismissedTranslation(pendingTranslation);
                            }
                          }}
                          labels={{
                            suggested: t.suggestedTranslation,
                            approved: t.approvedTranslation,
                            approve: t.approve,
                            dismiss: t.dismiss,
                          }}
                        />
                      )}
                    </div>
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <button
                        type="button"
                        onClick={clearText}
                        className="flex items-center gap-2 text-[12px] font-medium text-slate-400 transition-colors hover:text-red-500"
                      >
                        <FiTrash2 className="text-sm" />
                        {t.clearAll}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-slate-400 shadow-sm">
                      <IcSwap size={20} />
                    </div>
                    <div className="max-w-[260px] space-y-1">
                      <p className="text-[14px] font-medium text-slate-600">{t.translatedWords}</p>
                      <p className="text-[12px] leading-relaxed text-slate-400">{t.translatedWordsDesc}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`interpreter-stage flex flex-col overflow-hidden p-3 md:p-4 ${
                  signPreviewItems.length > 0
                    ? "h-auto min-h-0"
                    : "min-h-[220px]"
                }`}
              >
                {signPreviewItems.length > 0 ? (
                  <SignSequencePresenter
                    items={signPreviewItems}
                    sourceSnapshot={signSourceSnapshot}
                    note={signPreviewNote}
                  />
                ) : (
                  <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-slate-400 shadow-sm">
                      <IcSwap size={20} />
                    </div>
                    <p className="text-[13px] text-slate-400">{t.emptyMatrix}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-auto flex shrink-0 items-center justify-between border-t border-gray-100 pt-4">
              <span className="text-[11px] text-slate-400">
                {t.accuracy}{" "}
                <span className="tabular-nums text-slate-600">
                  {Math.round(prediction.confidence * 100) || 95}%
                </span>
              </span>
              <button
                type="button"
                onClick={() => setShowLogs((p) => !p)}
                className={`text-[11px] font-medium transition-colors ${showLogs ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}
              >
                {showLogs ? t.hideLogs : t.showLogs}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex w-full max-w-[1100px] items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-950/80 px-4 py-3 text-[13px] text-red-100 backdrop-blur-sm">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-white/60 hover:text-white border-none transition-colors">✕</button>
          </div>
        )}

        {/* Logs drawer */}
        {showLogs && (
          <div className="interpreter-panel mt-6 w-full max-w-[1100px] overflow-hidden p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="interpreter-panel-title">Pipeline logs</span>
              <button
                type="button"
                onClick={() => setLogs([])}
                className="text-[11px] font-medium text-white/40 hover:text-white/70"
              >
                Clear
              </button>
            </div>
            <div className="h-56 overflow-y-auto custom-scrollbar font-mono text-[12px] text-ksl-blue/90 space-y-2.5 border-none px-4">
              {logs.length > 0 ? logs.map((l, i) => (
                <div key={i} className="flex gap-6 hover:bg-white/5 py-1.5 rounded-lg px-3 transition-colors border-none group/log">
                  <span className="text-gray-700 w-12 shrink-0 font-bold group-hover/log:text-gray-500 transition-colors">{String(i).padStart(4, "0")}</span>
                  <span className="break-all leading-relaxed">{l}</span>
                </div>
              )) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 opacity-40">
                  <p className="text-[12px] text-white/40">No logs yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </PageShell>
  );
}
