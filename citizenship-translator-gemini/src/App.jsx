import { useState, useRef, useEffect } from "react";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Download, RefreshCw, ChevronDown } from "lucide-react";
import { auth, signInWithGoogle, logOut, getOrCreateUser, incrementPDFCount, incrementScanCount } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

// ─── Progress Bar Component ───────────────────────────────────────────────────
function ProgressBar({ used, limit }) {
  const percentage = Math.min((used / limit) * 100, 100);
  const color = percentage < 60 ? "bg-green-600" 
              : percentage < 80 ? "bg-yellow-500" 
              : "bg-red-600";
  
  return (
    <div className="w-24 h-1.5 bg-stone-200 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-500`} 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// ─── Logout Confirmation Modal ────────────────────────────────────────────────
function LogoutModal({ show, onCancel, onConfirm }) {
  if (!show) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4"
      onClick={onCancel}
    >
      <div 
        className="w-full max-w-sm rounded-sm border-2 border-stone-900 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        <h3 className="mb-2 text-lg font-semibold text-stone-900">Sign Out?</h3>
        <p className="mb-6 text-sm text-stone-600">
          You will need to sign in again to access your translations.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-sm border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-sm border border-red-700 bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [documentType, setDocumentType] = useState("Citizenship");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [birthAddressType, setBirthAddressType] = useState("Sub-Metropolitan");
  const [permAddressType, setPermAddressType] = useState("Sub-Metropolitan");
  const [birthPlaceType, setBirthPlaceType] = useState("Sub-Metropolitan");
  const [savedResult, setSavedResult] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getOrCreateUser(firebaseUser);
        setUser(firebaseUser);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-6 px-4"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-sm bg-red-700 flex items-center justify-center">
            <FileText className="h-6 w-6 text-stone-50" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Document Translator</h1>
            <p className="text-[11px] text-stone-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              NEPALI → ENGLISH
            </p>
          </div>
        </div>
        <div className="w-full max-w-sm border-2 border-stone-900 bg-white p-8 rounded-sm text-center shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900 mb-1">Welcome</h2>
          <p className="text-sm text-stone-500 mb-6">Sign in to access the translator</p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 border-2 border-stone-900 bg-stone-50 px-5 py-3 text-sm font-medium text-stone-900 hover:bg-stone-900 hover:text-stone-50 transition rounded-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
          <p className="mt-4 text-[11px] text-stone-400">Free tier includes 5 watermarked PDFs</p>
        </div>
      </div>
    );
  }

  const handleFiles = (fileList) => {
    const valid = Array.from(fileList).filter(
      (f) => f.type.startsWith("image/") || f.type === "application/pdf"
    );
    if (valid.length === 0) {
      setErrorMsg("Please upload JPG, PNG, or PDF files only.");
      return;
    }
    setErrorMsg("");
    setFiles((prev) => [...prev, ...valid].slice(0, 4));
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const onDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFiles(e.dataTransfer.files);
  };

  const extractData = async () => {
    if (files.length === 0) {
      setErrorMsg("Please upload at least one file.");
      return;
    }
    setStatus("processing");
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      files.forEach((f) => formData.append("files", f));

      const base = import.meta.env.VITE_API_URL || "";
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${base}/api/extract`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setStatus("done");
      await incrementScanCount(user.uid);
    } catch (err) {
      console.error(err);
      setErrorMsg(`Extraction failed: ${err.message}`);
      setStatus("error");
    }
  };

  const reset = () => {
    setFiles([]);
    setResult(null);
    setStatus("idle");
    setErrorMsg("");
    setEditMode(false);
  };

  const updateField = (path, value) => {
    setResult((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let ref = copy;
      for (let i = 0; i < keys.length - 1; i++) ref = ref[keys[i]];
      ref[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const printPDF = async () => {
    if (userProfile?.plan !== "premium" && userProfile?.pdfsGenerated >= userProfile?.pdfsLimit) {
      setErrorMsg("You've reached your 5 PDF limit. Upgrade to premium for 25 clean PDFs/month.");
      return;
    }

    const html = buildOutputHTML(result, birthPlaceType, birthAddressType, permAddressType, userProfile?.plan);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    w.onload = () => {
      setTimeout(() => {
        w.print();
        URL.revokeObjectURL(url);
      }, 400);
    };

    await incrementPDFCount(user.uid);
    setUserProfile(prev => ({ ...prev, pdfsGenerated: (prev.pdfsGenerated || 0) + 1 }));
  };

  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <header className="border-b-2 border-stone-900 bg-stone-50 px-4 py-4 sm:px-10 sm:py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-sm bg-red-700 flex items-center justify-center">
              <FileText className="h-5 w-5 text-stone-50" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-stone-900 sm:text-2xl">Document Translator</h1>
              <p className="text-[10px] text-stone-600 sm:text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                NEPALI → ENGLISH
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              {user.photoURL && (
                <img src={user.photoURL} alt="" className="h-7 w-7 rounded-full border border-stone-300" />
              )}
              <span className="text-sm text-stone-700">{user.displayName?.split(" ")[0]}</span>
              <span
                className={`rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  userProfile?.plan === "premium"
                    ? "bg-amber-400 text-stone-900"
                    : "bg-stone-200 text-stone-600"
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {userProfile?.plan === "premium" ? "PRO" : "FREE"}
              </span>

              {userProfile?.plan !== "premium" && (
                <div className="flex items-center gap-2">
                  <ProgressBar used={userProfile?.pdfsGenerated || 0} limit={userProfile?.pdfsLimit || 5} />
                  <span className="text-[10px] text-stone-500 whitespace-nowrap"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {userProfile?.pdfsGenerated || 0}/{userProfile?.pdfsLimit || 5}
                  </span>
                </div>
              )}
            </div>

            {status === "done" && (
              <button
                onClick={reset}
                className="flex items-center gap-2 rounded-sm border border-stone-900 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-900 transition hover:bg-stone-900 hover:text-stone-50 sm:px-4 sm:text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">New Translation</span>
                <span className="sm:hidden">New</span>
              </button>
            )}

            <button
              onClick={() => setShowLogoutModal(true)}
              className="rounded-sm border border-stone-300 px-3 py-2 text-xs font-medium text-stone-600 hover:border-red-700 hover:text-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-10 sm:py-14">
        {status !== "done" && (
          <>
            <section className="mb-6 sm:mb-8">
              <label
                className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-stone-700"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Document Type
              </label>
              <div className="relative max-w-md">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex w-full items-center justify-between rounded-sm border-2 border-stone-900 bg-stone-50 px-4 py-3 text-left text-base font-medium text-stone-900 hover:bg-stone-100"
                >
                  <span>{documentType}</span>
                  <ChevronDown className={`h-4 w-4 transition ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-sm border-2 border-stone-900 bg-stone-50 shadow-lg">
                    <button
                      onClick={() => { setDocumentType("Citizenship"); setDropdownOpen(false); }}
                      className="w-full px-4 py-3 text-left text-base font-medium text-stone-900 hover:bg-amber-100"
                    >
                      Citizenship
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="mb-6 sm:mb-8">
              <label
                className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-stone-700"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Upload Document
              </label>
              <div
                onDragEnter={onDrag}
                onDragLeave={onDrag}
                onDragOver={onDrag}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer rounded-sm border-2 border-dashed p-6 text-center transition sm:p-10 ${
                  dragActive ? "border-red-700 bg-red-50" : "border-stone-400 bg-white hover:border-stone-900 hover:bg-stone-100"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
                <Upload className="mx-auto mb-3 h-8 w-8 text-stone-500 sm:h-10 sm:w-10" strokeWidth={1.5} />
                <p className="text-sm font-medium text-stone-900 sm:text-base">
                  Tap to upload, or <span className="underline decoration-red-700 decoration-2 underline-offset-4">drag files</span>
                </p>
                <p className="mt-2 text-xs text-stone-600 sm:text-sm">JPG, PNG, or PDF · Up to 4 files</p>
                <p className="mt-1 text-[11px] italic text-stone-500">For best results: clear, well-lit, uncropped</p>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-sm border border-stone-300 bg-white px-3 py-2 sm:px-4 sm:py-2.5"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="h-4 w-4 flex-shrink-0 text-stone-600" />
                        <span className="truncate text-sm font-medium text-stone-900">{f.name}</span>
                      </div>
                      <button onClick={() => removeFile(i)} className="ml-2 text-xs font-medium text-red-700 hover:underline">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mb-6">
              <button
                onClick={extractData}
                disabled={status === "processing" || files.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-sm bg-stone-900 px-7 py-3.5 text-base font-medium text-stone-50 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                {status === "processing" ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Extracting & Translating...</>
                ) : (
                  <>Generate Translation <span className="ml-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>→</span></>
                )}
              </button>
            </section>

            {errorMsg && (
              <div className="flex items-start gap-3 rounded-sm border-l-4 border-red-700 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-700" />
                <p className="text-sm text-red-900">{errorMsg}</p>
              </div>
            )}

            {status === "processing" && (
              <div className="mt-6 rounded-sm border border-stone-300 bg-amber-50 px-5 py-4">
                <p className="text-sm text-stone-800">
                  Reading your document and translating Devanagari text. This usually takes 10–20 seconds.
                </p>
              </div>
            )}
          </>
        )}

        {status === "done" && result && (
          <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">Translation Complete</h2>
                  <p className="text-xs text-stone-600">Review and correct any errors before finalizing</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!editMode) setSavedResult(JSON.parse(JSON.stringify(result)));
                    setEditMode(!editMode);
                  }}
                  className="rounded-sm border border-stone-900 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-100"
                >
                  {editMode ? "Done Editing" : "Edit Fields"}
                </button>
                {editMode && (
                  <button
                    onClick={() => { setResult(savedResult); setEditMode(false); }}
                    className="rounded-sm border border-red-700 bg-stone-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-700 hover:text-stone-50"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  onClick={printPDF}
                  className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-red-700 sm:flex-initial"
                >
                  <Download className="h-4 w-4" /> Save PDF
                </button>
              </div>
            </div>

            <OutputCard
              result={result}
              editMode={editMode}
              updateField={updateField}
              birthAddressType={birthAddressType}
              setBirthAddressType={setBirthAddressType}
              permAddressType={permAddressType}
              setPermAddressType={setPermAddressType}
              birthPlaceType={birthPlaceType}
              setBirthPlaceType={setBirthPlaceType}
              userProfile={userProfile}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-stone-300 px-4 py-6 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Data Protected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              <span>Files Auto-Deleted</span>
            </div>
          </div>
          <p className="text-center text-[11px] text-stone-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Translation is machine-generated. Always verify before notarization.
          </p>
        </div>
      </footer>

      <LogoutModal 
        show={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          logOut();
        }}
      />
    </div>
  );
}

// ─── Watermark Component ──────────────────────────────────────────────────────
function Watermark({ show }) {
  if (!show) return null;
  return (
    <div style={{
      position: "absolute", top: 0, left: 0,
      width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 10,
      overflow: "hidden",
    }}>
      {[...Array(14)].map((_, i) => (
        <span key={i} style={{
          position: "absolute",
          top: `${i * 8 - 5}%`,
          left: "-20%",
          width: "140%",
          textAlign: "center",
          transform: "rotate(-35deg)",
          fontSize: "20px",
          fontWeight: "bold",
          color: "rgba(180, 0, 0, 0.13)",
          whiteSpace: "nowrap",
          userSelect: "none",
          letterSpacing: "6px",
        }}>
          DEMO VERSION • CitizenTranslate.com &nbsp;&nbsp;&nbsp; DEMO VERSION • CitizenTranslate.com
        </span>
      ))}
    </div>
  );
}

// ─── Field Component ──────────────────────────────────────────────────────────
function Field({ value, path, mono, editMode, updateField }) {
  if (editMode) {
    return (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => updateField(path, e.target.value)}
        className="w-full border-b border-stone-400 bg-amber-50 px-1 py-0.5 outline-none focus:border-red-700"
        style={mono ? { fontFamily: "'Times New Roman', Times, serif" } : {}}
      />
    );
  }
  return <span style={mono ? { fontFamily: "'Times New Roman', Times, serif" } : {}}>{value || "—"}</span>;
}

// ─── Address Type Dropdown ────────────────────────────────────────────────────
function AddressTypeDropdown({ value, onChange, editMode }) {
  if (!editMode) return <span>{value}:</span>;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border-b border-stone-400 bg-amber-50 px-1 py-0.5 outline-none focus:border-red-700 text-sm"
    >
      <option value="Sub-Metropolitan">Sub-Metropolitan</option>
      <option value="Metropolitan">Metropolitan</option>
      <option value="V.D.C">V.D.C</option>
    </select>
  );
}

// ─── OutputCard ───────────────────────────────────────────────────────────────
function OutputCard({
  result, editMode, updateField,
  birthAddressType, setBirthAddressType,
  permAddressType, setPermAddressType,
  birthPlaceType, setBirthPlaceType,
  userProfile,
}) {
  const fieldProps = { editMode, updateField };

  return (
    <article
      className="rounded-sm border-2 border-stone-900 bg-white p-5 sm:p-10"
      style={{ fontFamily: "'Fraunces', Georgia, serif", position: "relative" }}
    >
      <Watermark show={userProfile?.plan !== "premium"} />

      <div className="mb-4 grid grid-cols-[auto_1fr_auto] items-start gap-4">
        <div className="w-44 border border-stone-800 text-[10px] leading-tight">
          <div className="border-b border-stone-800 px-2 py-1.5">
            <p className="font-semibold">Distributed by:</p>
            <p>Nepal Notary Public Council</p>
          </div>
          <div className="flex items-center justify-between px-2 py-2">
            <span className="font-semibold">S.N.</span>
            <Field value={result.serial_no} path="serial_no" mono {...fieldProps} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-1">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-stone-500 text-[8px] italic leading-tight text-stone-600 text-center">
            Coat of<br />Arms of<br />Nepal
          </div>
          <div className="text-center">
            <p className="text-sm italic text-stone-600">Government of Nepal</p>
            <p className="text-sm italic text-stone-600">Ministry of Home Affairs</p>
            <h1 className="mt-1 text-lg font-bold tracking-tight text-stone-900 sm:text-xl">
              District Administration Office,{" "}
              <Field value={result.birth_place?.district} path="birth_place.district" {...fieldProps} />
            </h1>
            <p className="mt-1 text-base font-semibold italic text-stone-900 underline">NEPALESE CITIZENSHIP CERTIFICATE</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="h-20 w-20 border border-stone-800 p-1"><RandomQR /></div>
          <div className="flex h-20 w-28 items-center justify-center border border-stone-800 text-[10px] italic text-stone-500">
            Office Seal
          </div>
        </div>
      </div>

      <div className="mb-4 text-sm">
        <span className="font-semibold">Citizenship Certificate No.: </span>
        <Field value={result.citizenship_certificate_no} path="citizenship_certificate_no" mono {...fieldProps} />
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-5">
        <div className="flex h-44 w-32 flex-col items-center justify-center self-start border border-stone-800 py-3 text-center">
          <div className="text-[11px] italic text-stone-500">Photograph</div>
          <div className="pt-2 text-xs font-semibold italic text-stone-500">Sd.</div>
        </div>

        <div className="space-y-2 text-sm">
          <TwoColRow
            leftLabel="Name and Surname"
            leftValue={<Field value={result.full_name} path="full_name" {...fieldProps} />}
            rightLabel="Sex"
            rightValue={<Field value={result.sex} path="sex" {...fieldProps} />}
          />
          <TwoColRow
            leftLabel="Place of birth"
            leftValue={<>District: <Field value={result.birth_place?.district} path="birth_place.district" {...fieldProps} /></>}
          />
          <TwoColRow
            leftValue={<><AddressTypeDropdown value={birthPlaceType} onChange={setBirthPlaceType} editMode={editMode} /> <Field value={result.birth_place?.sub_metropolitan} path="birth_place.sub_metropolitan" {...fieldProps} /></>}
            rightLabel="Ward No."
            rightValue={<Field value={result.birth_place?.ward_no} path="birth_place.ward_no" mono {...fieldProps} />}
          />
          <TwoColRow
            leftLabel="Permanent Resident"
            leftValue={<>District: <Field value={result.permanent_address?.district} path="permanent_address.district" {...fieldProps} /></>}
          />
          <TwoColRow
            leftValue={<><AddressTypeDropdown value={permAddressType} onChange={setPermAddressType} editMode={editMode} /> <Field value={result.permanent_address?.sub_metropolitan} path="permanent_address.sub_metropolitan" {...fieldProps} /></>}
            rightLabel="Ward No."
            rightValue={<Field value={result.permanent_address?.ward_no} path="permanent_address.ward_no" mono {...fieldProps} />}
          />
          <TwoColRow
            leftLabel="Date of birth (A.D.)"
            leftValue={
              <>
                Year: <Field value={result.date_of_birth_ad?.year} path="date_of_birth_ad.year" mono {...fieldProps} />{" "}
                Month: <Field value={result.date_of_birth_ad?.month} path="date_of_birth_ad.month" mono {...fieldProps} />{" "}
                Day: <Field value={result.date_of_birth_ad?.day} path="date_of_birth_ad.day" mono {...fieldProps} />
              </>
            }
          />
          <TwoColRow
            leftLabel="Father's Name, Surname"
            leftValue={<Field value={result.father_name} path="father_name" {...fieldProps} />}
            rightLabel="C.C.No."
            rightValue={<Field value={result.father_cc_no} path="father_cc_no" mono {...fieldProps} />}
          />
          <TwoColRow
            leftLabel="Address"
            leftValue={<Field value={result.father_address} path="father_address" {...fieldProps} />}
            rightLabel="Citizenship Type"
            rightValue={<Field value={result.father_citizenship_type} path="father_citizenship_type" {...fieldProps} />}
          />
          <TwoColRow
            leftLabel="Mother's Name, Surname"
            leftValue={<Field value={result.mother_name} path="mother_name" {...fieldProps} />}
            rightLabel="C.C.No."
            rightValue={<Field value={result.mother_cc_no} path="mother_cc_no" mono {...fieldProps} />}
          />
          <TwoColRow
            leftLabel="Address"
            leftValue={<Field value={result.mother_address} path="mother_address" {...fieldProps} />}
            rightLabel="Citizenship Type"
            rightValue={<Field value={result.mother_citizenship_type} path="mother_citizenship_type" {...fieldProps} />}
          />
          <TwoColRow
            leftLabel="Husband/Wife's Name, Surname"
            leftValue={<Field value={result.spouse_name} path="spouse_name" {...fieldProps} />}
            rightLabel="C.C.No."
            rightValue={<Field value={result.spouse_cc_no} path="spouse_cc_no" mono {...fieldProps} />}
          />
          <TwoColRow
            leftLabel="Address"
            leftValue={<Field value={result.spouse_address} path="spouse_address" {...fieldProps} />}
            rightLabel="Citizenship Type"
            rightValue={<Field value={result.spouse_citizenship_type} path="spouse_citizenship_type" {...fieldProps} />}
          />
        </div>
      </div>

      <div className="mt-5 border border-stone-800 p-4 text-sm">
        <p className="mb-2 font-semibold">Government of Nepal has issued this Citizenship Certificate with following details:</p>
        <div className="space-y-1.5">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-semibold whitespace-nowrap">Citizenship Certificate No.:</span>
            <Field value={result.citizenship_certificate_no} path="citizenship_certificate_no" mono {...fieldProps} />
            <span className="ml-auto whitespace-nowrap">
              <span className="font-semibold">Sex:</span> <Field value={result.sex} path="sex" {...fieldProps} />
            </span>
          </div>
          <div className="grid grid-cols-[160px_1fr] items-baseline gap-3">
            <span className="font-semibold">Full Name:</span>
            <span className="font-bold uppercase tracking-wide">
              <Field value={result.full_name} path="full_name" {...fieldProps} />
            </span>
          </div>
          <div className="grid grid-cols-[160px_1fr] items-baseline gap-3">
            <span className="font-semibold">Date of Birth (AD):</span>
            <span>
              Year: <Field value={result.date_of_birth_ad?.year} path="date_of_birth_ad.year" mono {...fieldProps} />{"  "}
              Month: <Field value={result.date_of_birth_ad?.month} path="date_of_birth_ad.month" mono {...fieldProps} />{"  "}
              Day: <Field value={result.date_of_birth_ad?.day} path="date_of_birth_ad.day" mono {...fieldProps} />
            </span>
          </div>
          <div className="grid grid-cols-[160px_1fr_auto] items-baseline gap-3">
            <span className="font-semibold">Birth Place:</span>
            <span>District: <Field value={result.birth_place?.district} path="birth_place.district" {...fieldProps} /></span>
            <span></span>
          </div>
          <div className="grid grid-cols-[160px_1fr_auto] items-baseline gap-3">
            <span></span>
            <span>{birthPlaceType}: <Field value={result.birth_place?.sub_metropolitan} path="birth_place.sub_metropolitan" {...fieldProps} /></span>
            <span>Ward No. <Field value={result.birth_place?.ward_no} path="birth_place.ward_no" mono {...fieldProps} /></span>
          </div>
          <div className="grid grid-cols-[160px_1fr_auto] items-baseline gap-3">
            <span className="font-semibold">Permanent Address:</span>
            <span>District: <Field value={result.permanent_address?.district} path="permanent_address.district" {...fieldProps} /></span>
            <span></span>
          </div>
          <div className="grid grid-cols-[160px_1fr_auto] items-baseline gap-3">
            <span></span>
            <span>{permAddressType}: <Field value={result.permanent_address?.sub_metropolitan} path="permanent_address.sub_metropolitan" {...fieldProps} /></span>
            <span>Ward No. <Field value={result.permanent_address?.ward_no} path="permanent_address.ward_no" mono {...fieldProps} /></span>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-stone-400 pt-4 text-sm">
        <p className="italic">This certificate of Nepalese Citizenship is hereby issued pursuant to the Nepal Citizenship Act 2063 B.S. (2006 A.D.)</p>
        <p className="mt-2"><span className="font-semibold">Type of citizenship: </span><Field value={result.citizenship_type} path="citizenship_type" {...fieldProps} /></p>
        <p className="mt-1"><span className="font-semibold">Certificate Receiver's signature: </span><span className="italic text-stone-500">Sd.</span></p>
      </div>

      <div className="mt-6 flex flex-col gap-6 border-t border-stone-400 pt-5 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-shrink-0">
          <div className="inline-block border border-stone-800 text-center text-xs">
            <div className="border-b border-stone-800 px-4 py-1.5 font-semibold">Thumb Impression</div>
            <div className="grid grid-cols-2 divide-x divide-stone-800">
              <div className="border-b border-stone-800 px-4 py-1 font-medium">Right</div>
              <div className="border-b border-stone-800 px-4 py-1 font-medium">Left</div>
              <div className="px-4 py-6 italic text-stone-500">Impressed</div>
              <div className="px-4 py-6 italic text-stone-500">Impressed</div>
            </div>
          </div>
        </div>
        <div className="sm:w-1/2 sm:pr-4">
          <p className="italic underline">Certificate Issuing Authority's</p>
          <p className="mt-1"><span className="font-semibold">Signature:</span> <span className="italic text-stone-500">Sd.</span></p>
          <p><span className="font-semibold">Name, Surname:</span> <Field value={result.issuing_authority_name} path="issuing_authority_name" {...fieldProps} /></p>
          <p><span className="font-semibold">Designation:</span> <Field value={result.issuing_authority_designation} path="issuing_authority_designation" {...fieldProps} /></p>
          <p><span className="font-semibold">Date:</span> <Field value={result.issue_date_ad} path="issue_date_ad" mono {...fieldProps} /></p>
        </div>
      </div>

      <div className="mt-6 border-t border-stone-400 pt-4 text-center text-xs italic text-stone-600">
        If found, please submit this certificate to the nearest District Administration Office or Police Office.
      </div>
    </article>
  );
}

// ─── RandomQR ─────────────────────────────────────────────────────────────────
function RandomQR() {
  const size = 21;
  const seed = 1337;
  const rng = (i) => { const x = Math.sin(seed + i) * 10000; return x - Math.floor(x); };
  const cells = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inTL = x < 7 && y < 7;
      const inTR = x >= size - 7 && y < 7;
      const inBL = x < 7 && y >= size - 7;
      const inFinder = inTL || inTR || inBL;
      let filled;
      if (inFinder) {
        const fx = inTL ? x : inTR ? x - (size - 7) : x;
        const fy = inTL ? y : inBL ? y - (size - 7) : y;
        filled = (fx === 0 || fx === 6 || fy === 0 || fy === 6) || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
      } else {
        filled = rng(y * size + x) > 0.5;
      }
      if (filled) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" shapeRendering="crispEdges">
      <rect width={size} height={size} fill="white" />
      <g fill="#111">{cells}</g>
    </svg>
  );
}

// ─── TwoColRow ────────────────────────────────────────────────────────────────
function TwoColRow({ leftLabel, leftValue, rightLabel, rightValue }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-dotted border-stone-300 pb-1.5">
      <div>
        {leftLabel && <span className="font-semibold">{leftLabel}: </span>}
        {leftValue}
      </div>
      {(rightLabel || rightValue) && (
        <div className="text-right text-xs text-stone-700">
          {rightLabel && <span className="font-semibold">{rightLabel}: </span>}
          {rightValue}
        </div>
      )}
    </div>
  );
}

// ─── buildOutputHTML ──────────────────────────────────────────────────────────
function buildOutputHTML(r, birthPlaceAddrType = "Sub-Metropolitan", birthAddrType = "Sub-Metropolitan", permAddrType = "Sub-Metropolitan", userPlan = "free") {
  const val = (v) => (v && v !== "" ? v : "—");
  const qrSvg = () => {
    const size = 21; const seed = 1337;
    const rng = (i) => { const x = Math.sin(seed + i) * 10000; return x - Math.floor(x); };
    let rects = "";
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const inTL = x < 7 && y < 7, inTR = x >= size - 7 && y < 7, inBL = x < 7 && y >= size - 7;
        const inFinder = inTL || inTR || inBL;
        let filled;
        if (inFinder) {
          const fx = inTL ? x : inTR ? x - (size - 7) : x;
          const fy = inTL ? y : inBL ? y - (size - 7) : y;
          filled = (fx === 0 || fx === 6 || fy === 0 || fy === 6) || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
        } else { filled = rng(y * size + x) > 0.5; }
        if (filled) rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      }
    }
    return `<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="white"/><g fill="#111">${rects}</g></svg>`;
  };

  // Watermark HTML (conditional based on plan)
  const watermarkHTML = userPlan !== "premium" ? `
<div class="watermark-wrap">
  ${[0, 13, 26, 39, 52, 65, 78, 91].map(top =>
    `<div class="watermark-line" style="top:${top}%">DEMO VERSION &bull; CitizenTranslate.com &nbsp;&nbsp;&nbsp; DEMO VERSION &bull; CitizenTranslate.com</div>`
  ).join("")}
</div>` : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Citizenship Translation — ${val(r.citizenship_certificate_no)}</title>
<style>
@page { size: A4; margin: 10mm; }
* { box-sizing: border-box; }
body { font-family: 'Times New Roman', Times, serif; color: #111; max-width: 820px; margin: 0 auto; padding: 20px; font-size: 12px; line-height: 1.35; }
.top-strip { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: start; margin-bottom: 12px; }
.sn-box { border: 1px solid #111; width: 170px; font-size: 10px; }
.sn-box .dist { border-bottom: 1px solid #111; padding: 5px 6px; }
.sn-box .dist strong { display: block; }
.sn-box .sn { display: flex; justify-content: space-between; padding: 8px 6px; font-weight: 600; }
.title { display: flex; align-items: center; justify-content: center; gap: 10px; padding-top: 4px; }
.title .arms-circle { width: 44px; height: 44px; border: 1px solid #888; border-radius: 50%; font-size: 7px; font-style: italic; color: #666; display: flex; align-items: center; justify-content: center; text-align: center; flex-shrink: 0; line-height: 1.2; }
.title .title-text { text-align: center; min-width: 0; }
.title p.gov { margin: 0; font-style: italic; color: #555; font-size: 12px; }
.title .dao { margin: 3px 0 2px; font-size: 15px; font-weight: 700; }
.title .ct { font-weight: 600; font-style: italic; font-size: 13px; text-decoration: underline; margin: 3px 0 0; }
.seal-box { border: 1px solid #111; width: 110px; height: 80px; display: flex; align-items: center; justify-content: center; font-style: italic; font-size: 10px; color: #888; }
.qr-box { border: 1px solid #111; width: 80px; height: 80px; padding: 3px; margin-left: auto; margin-bottom: 6px; }
.qr-box svg { width: 100%; height: 100%; display: block; }
.right-stack { display: flex; flex-direction: column; align-items: flex-end; }
.cert-no-line { margin: 10px 0 14px; font-size: 12px; }
.cert-no { font-family: 'Times New Roman', Times, serif; font-weight: 600; }
.body-grid { display: grid; grid-template-columns: 130px 1fr; gap: 16px; }
.photo-box { border: 1px solid #111; height: 176px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 0; text-align: center; }
.photo-box .ph { font-style: italic; color: #888; font-size: 11px; }
.photo-box .sd { padding-top: 8px; font-style: italic; font-weight: 600; color: #888; font-size: 11px; }
.row { display: grid; grid-template-columns: 1fr auto; gap: 12px; border-bottom: 1px dotted #bbb; padding: 4px 0; align-items: baseline; }
.row .l strong { font-weight: 600; }
.row .r { text-align: right; font-size: 11px; color: #444; }
.row .r strong { font-weight: 600; }
.section { margin-top: 8px; border-top: 1px solid #888; padding-top: 6px; }
.section p { margin: 2.5px 0; }
.italic { font-style: italic; }
.muted { color: #888; }
.bottom { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-top: 14px; border-top: 1px solid #888; padding-top: 12px; }
.thumb { border: 1px solid #111; display: inline-block; font-size: 11px; text-align: center; flex-shrink: 0; }
.thumb .hdr { border-bottom: 1px solid #111; padding: 4px 12px; font-weight: 600; }
.thumb .cells { display: grid; grid-template-columns: 1fr 1fr; }
.thumb .cells > div { padding: 4px 12px; }
.thumb .cells .col-hdr { border-bottom: 1px solid #111; font-weight: 500; }
.thumb .cells .col-hdr:first-child, .thumb .cells .imp:first-child { border-right: 1px solid #111; }
.thumb .cells .imp { padding: 20px 16px; font-style: italic; color: #888; }
.auth { width: 50%; padding-right: 16px; }
.auth p { margin: 3px 0; }
.auth .underline { text-decoration: underline; font-style: italic; }
.footer-note { margin-top: 8px; padding-top: 6px; border-top: 1px solid #bbb; text-align: center; font-style: italic; color: #666; font-size: 11px; page-break-inside: avoid; page-break-before: avoid; }
.watermark-wrap { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; overflow: hidden; }
.watermark-line { position: absolute; left: -10%; width: 120%; text-align: center; transform: rotate(-35deg); font-size: 22px; font-weight: bold; color: rgba(180,0,0,0.11); white-space: nowrap; letter-spacing: 6px; font-family: 'Times New Roman', serif; }
.summary-box { border: 1px solid #111; padding: 10px 14px; margin-top: 14px; font-size: 12px; }
.summary-box .title-line { font-weight: 600; margin-bottom: 8px; }
.summary-box .srow { display: grid; grid-template-columns: 160px 1fr auto; gap: 10px; padding: 2px 0; align-items: baseline; }
.summary-box .srow.two-col { grid-template-columns: 160px 1fr; }
.summary-box .srow strong { font-weight: 600; }
.summary-box .name { font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
</style></head><body>

${watermarkHTML}

<div class="top-strip">
  <div class="sn-box">
    <div class="dist"><strong>Distributed by:</strong>Nepal Notary Public Council</div>
    <div class="sn"><span>S.N.</span><span class="cert-no">${val(r.serial_no)}</span></div>
  </div>
  <div class="title">
    <div class="arms-circle">Coat of<br/>Arms of<br/>Nepal</div>
    <div class="title-text">
      <p class="gov">Government of Nepal</p>
      <p class="gov">Ministry of Home Affairs &nbsp;&nbsp; District Administration Office, ${val(r.birth_place?.district)}</p>
      <p class="ct">NEPALESE CITIZENSHIP CERTIFICATE</p>
    </div>
  </div>
  <div class="right-stack">
    <div class="qr-box">${qrSvg()}</div>
    <div class="seal-box">Office Seal</div>
  </div>
</div>

<div class="cert-no-line"><strong>Citizenship Certificate No.:</strong> <span class="cert-no">${val(r.citizenship_certificate_no)}</span></div>

<div class="body-grid">
  <div class="photo-box"><div class="ph">Photograph</div><div class="sd">Sd.</div></div>
  <div>
    <div class="row"><div class="l"><strong>Name and Surname:</strong> ${val(r.full_name)}</div><div class="r"><strong>Sex:</strong> ${val(r.sex)}</div></div>
    <div class="row"><div class="l"><strong>Place of birth:</strong> District: ${val(r.birth_place?.district)}</div><div class="r"></div></div>
    <div class="row"><div class="l">${birthPlaceAddrType}: ${val(r.birth_place?.sub_metropolitan)}</div><div class="r"><strong>Ward No.:</strong> ${val(r.birth_place?.ward_no)}</div></div>
    <div class="row"><div class="l"><strong>Permanent Resident:</strong> District: ${val(r.permanent_address?.district)}</div><div class="r"></div></div>
    <div class="row"><div class="l">${permAddrType}: ${val(r.permanent_address?.sub_metropolitan)}</div><div class="r"><strong>Ward No.:</strong> ${val(r.permanent_address?.ward_no)}</div></div>
    <div class="row"><div class="l"><strong>Date of birth (A.D.):</strong> Year: ${val(r.date_of_birth_ad?.year)} &nbsp; Month: ${val(r.date_of_birth_ad?.month)} &nbsp; Day: ${val(r.date_of_birth_ad?.day)}</div><div class="r"></div></div>
    <div class="row"><div class="l"><strong>Father's Name, Surname:</strong> ${val(r.father_name)}</div><div class="r"><strong>C.C.No.:</strong> ${val(r.father_cc_no)}</div></div>
    <div class="row"><div class="l"><strong>Address:</strong> ${val(r.father_address)}</div><div class="r"><strong>Citizenship Type:</strong> ${val(r.father_citizenship_type)}</div></div>
    <div class="row"><div class="l"><strong>Mother's Name, Surname:</strong> ${val(r.mother_name)}</div><div class="r"><strong>C.C.No.:</strong> ${val(r.mother_cc_no)}</div></div>
    <div class="row"><div class="l"><strong>Address:</strong> ${val(r.mother_address)}</div><div class="r"><strong>Citizenship Type:</strong> ${val(r.mother_citizenship_type)}</div></div>
    <div class="row"><div class="l"><strong>Husband/Wife's Name, Surname:</strong> ${val(r.spouse_name)}</div><div class="r"><strong>C.C.No.:</strong> ${val(r.spouse_cc_no)}</div></div>
    <div class="row"><div class="l"><strong>Address:</strong> ${val(r.spouse_address)}</div><div class="r"><strong>Citizenship Type:</strong> ${val(r.spouse_citizenship_type)}</div></div>
  </div>
</div>

<div class="summary-box">
  <p class="title-line">Government of Nepal has issued this Citizenship Certificate with following details:</p>
  <div class="srow" style="display:flex;align-items:baseline;gap:8px;"><strong style="white-space:nowrap;">Citizenship Certificate No.:</strong><span class="cert-no">${val(r.citizenship_certificate_no)}</span><span style="margin-left:auto;white-space:nowrap;"><strong>Sex:</strong> ${val(r.sex)}</span></div>
  <div class="srow two-col"><strong>Full Name:</strong><span class="name">${val(r.full_name)}</span></div>
  <div class="srow two-col"><strong>Date of Birth (AD):</strong><span>Year: ${val(r.date_of_birth_ad?.year)} &nbsp; Month: ${val(r.date_of_birth_ad?.month)} &nbsp; Day: ${val(r.date_of_birth_ad?.day)}</span></div>
  <div class="srow"><strong>Birth Place:</strong><span>District: ${val(r.birth_place?.district)}</span><span></span></div>
  <div class="srow"><span></span><span>${birthPlaceAddrType}: ${val(r.birth_place?.sub_metropolitan)}</span><span>Ward No. ${val(r.birth_place?.ward_no)}</span></div>
  <div class="srow"><strong>Permanent Address:</strong><span>District: ${val(r.permanent_address?.district)}</span><span></span></div>
  <div class="srow"><span></span><span>${permAddrType}: ${val(r.permanent_address?.sub_metropolitan)}</span><span>Ward No. ${val(r.permanent_address?.ward_no)}</span></div>
</div>

<div class="section">
  <p class="italic">This certificate of Nepalese Citizenship is hereby issued pursuant to the Nepal Citizenship Act 2063 B.S. (2006 A.D.)</p>
  <p><strong>Type of citizenship:</strong> ${val(r.citizenship_type)}</p>
  <p><strong>Certificate Receiver's signature:</strong> <span class="muted italic">Sd.</span></p>
</div>

<div class="bottom">
  <div class="thumb">
    <div class="hdr">Thumb Impression</div>
    <div class="cells">
      <div class="col-hdr">Right</div><div class="col-hdr">Left</div>
      <div class="imp">Impressed</div><div class="imp">Impressed</div>
    </div>
  </div>
  <div class="auth">
    <p class="underline">Certificate Issuing Authority's</p>
    <p><strong>Signature:</strong> <span class="muted italic">Sd.</span></p>
    <p><strong>Name, Surname:</strong> ${val(r.issuing_authority_name)}</p>
    <p><strong>Designation:</strong> ${val(r.issuing_authority_designation)}</p>
    <p><strong>Date:</strong> ${val(r.issue_date_ad)}</p>
  </div>
</div>

<p class="footer-note">If found, please submit this certificate to the nearest District Administration Office or Police Office.</p>
</body></html>`;
}