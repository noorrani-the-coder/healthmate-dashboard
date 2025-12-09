// src/DemoBot.jsx
import React, { useState, useEffect, useRef } from "react";

/* ---------------- BACKEND CALL ---------------- */
async function backendPost(payload) {
  const API_ENDPOINT = "/api";

  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // health_report may return 404 for new user
  if (res.status === 404 && payload.type === "health_report") {
    let parsed;
    try {
      parsed = await res.json();
    } catch {
      parsed = {};
    }
    return { __notFound: true, ...parsed };
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Backend error");
  }
  return res.json();
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function DemoBot() {
  const [employeeId] = useState(
    localStorage.getItem("employee_id") || "guest_001"
  );

  const [messages, setMessages] = useState([
    { from: "bot", text: "Hey! I'm your Demo HealthMate 🤖✨" },
    {
      from: "bot",
      text: "Ask me anything — symptoms, stress, or health concerns!",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  // profile state
  const [profileDraft, setProfileDraft] = useState({
    name: "",
    email: "",
    age: "",
    gender: "",
    blood_group: "",
    allergies: "",
    chronic_conditions: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [isProfileMode, setIsProfileMode] = useState(false); // C: replace chat until profile filled
  const [checkingProfile, setCheckingProfile] = useState(true);

  const chatEndRef = useRef(null);

  // auto-scroll chat
  useEffect(() => {
    if (!isProfileMode) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typing, isProfileMode]);

  // On mount, check if profile exists
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await backendPost({
          type: "health_report",
          employee_id: employeeId,
        });

        if (cancelled) return;

        if (data.__notFound || data.need_profile || !data.profile) {
          setIsProfileMode(true);
        } else if (data.profile) {
          setIsProfileMode(false);
          setMessages((prev) => [
            ...prev,
            {
              from: "bot",
              text: `Nice to see you again, ${
                data.profile.name || "friend"
              } 💙`,
            },
          ]);
        }
      } catch (e) {
        console.error("health_report error:", e);
        // if profile check fails, still allow chat
        setIsProfileMode(false);
      } finally {
        if (!cancelled) setCheckingProfile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  /* --------- Send message to backend ---------- */
  async function handleSend() {
    if (!input.trim() || isProfileMode) return; // no chat until profile done
    const text = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { from: "user", text }]);
    setTyping(true);

    try {
      const data = await backendPost({
        type: "symptom",
        employee_id: employeeId,
        message: text,
      });

      if (data.need_profile) {
        setIsProfileMode(true);
      }

      const replyText =
        data.reply ||
        "I'm having trouble reaching the medical brain right now. Please try again in a bit. 💙";

      setMessages((prev) => [...prev, { from: "bot", text: replyText }]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Oops, I couldn't reach the server. If this feels urgent, please contact a doctor immediately. ⚠️",
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  /* --------- Save profile to backend ---------- */
  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!profileDraft.name.trim() || !profileDraft.email.trim()) return;

    setSavingProfile(true);
    try {
      await backendPost({
        type: "update_profile",
        employee_id: employeeId,
        ...profileDraft, // includes email
      });

      setIsProfileMode(false);

      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: `Got it, ${profileDraft.name}! Your profile is saved — you can now ask me anything about your health. 💙`,
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "I couldn't save your profile right now. Please try again in a minute.",
        },
      ]);
    } finally {
      setSavingProfile(false);
    }
  }
 /* ---------------- RENDER ---------------- */
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-6"
      style={{
        background:
          "radial-gradient(circle at 0% 0%, #ffe3f3 0, #f0e6ff 35%, #e2f2ff 70%, #f8e7ff 100%)",
      }}
    >
      <div className="w-full max-w-6xl flex flex-col gap-4">
        {/* Top mini header like app bar */}
       

 
        {/* Main content shell: left intro + right panel */}
        <div className="w-full flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Left intro card */}
          <div className="md:w-5/12 w-full">
            <div
              className="w-full h-full rounded-[2.5rem] px-10 py-10 flex flex-col justify-between shadow-[0_26px_80px_rgba(148,163,255,0.7)] border border-white/60"
              style={{
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.7), rgba(235,217,255,0.95))",
                backdropFilter: "blur(30px)",
              }}
            >
              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-white/80 text-[11px] font-medium text-slate-600 mb-6 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Always-on wellness sidekick
                </div>

                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-400 shadow-[0_22px_45px_rgba(129,140,248,0.7)]">
                    <span className="text-4xl">🤖</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h1 className="text-3xl font-semibold text-slate-800 leading-snug">
                    Your AI HealthMate.
                  </h1>
                  <h2 className="text-xl font-semibold text-violet-500">
                    Always listening.
                    <br />
                    Always gentle.
                  </h2>
                </div>

                <p className="mt-5 text-[12px] text-slate-600 leading-relaxed max-w-md">
                  Log symptoms, talk about stress, or just check in with your
                  body. I don’t diagnose, but I help you reflect, track, and
                  nudge you towards real doctors when needed.
                </p>
              </div>

              <div className="mt-8 text-[11px] text-slate-500">
                Signed in as{" "}
                <span className="font-medium text-slate-700">
                  {employeeId}
                </span>
                . Your chats stay between you and your health.
              </div>
            </div>
          </div>

          {/* Right side: either profile or chat */}
          <div className="md:w-7/12 w-full flex justify-center">
            {checkingProfile ? (
              <div
                className="w-full max-w-md h-[80vh] md:h-[82vh] rounded-[2.2rem] flex items-center justify-center shadow-[0_24px_80px_rgba(148,163,255,0.7)] border border-white/60 text-[13px] text-slate-500"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.8), rgba(229,222,255,0.95))",
                  backdropFilter: "blur(30px)",
                }}
              >
                Checking your profile…
              </div>
            ) : isProfileMode ? (
              <ProfilePanel
                draft={profileDraft}
                setDraft={setProfileDraft}
                onSave={handleSaveProfile}
                saving={savingProfile}
              />
            ) : (
              <ChatPanel
                messages={messages}
                typing={typing}
                input={input}
                setInput={setInput}
                handleKeyDown={handleKeyDown}
                handleSend={handleSend}
                chatEndRef={chatEndRef}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Chat Panel ---------------- */
function ChatPanel({
  messages,
  typing,
  input,
  setInput,
  handleKeyDown,
  handleSend,
  chatEndRef,
}) {
  return (
    <div
      className="w-full max-w-md h-[80vh] md:h-[82vh] rounded-[2.2rem] flex flex-col overflow-hidden shadow-[0_24px_80px_rgba(148,163,255,0.7)] border border-white/60"
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(229,222,255,0.98))",
        backdropFilter: "blur(32px)",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-400 flex items-center justify-center shadow-[0_10px_25px_rgba(129,140,248,0.8)]">
            <span className="text-xl text-white">🤖</span>
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-slate-800">
              Demo HealthMate Bot
            </div>
            <div className="text-[11px] text-slate-500">
              AI Wellness Assistant
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[9px] text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
          Live
        </div>
      </div>

      {/* Divider */}
      <div className="px-5">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      </div>

      {/* Chat area */}
      <div className="flex-1 px-4 pt-3 pb-3 overflow-y-auto space-y-3">
        {messages.map((m, idx) => (
          <ChatBubble key={idx} from={m.from} text={m.text} />
        ))}

        {typing && <TypingBubble />}

        <div ref={chatEndRef} />
      </div>

      {/* Divider above input */}
      <div className="px-5">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-200/80 to-transparent" />
      </div>

      {/* Input bar */}
      <div className="px-4 pb-4 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your message…"
              className="w-full resize-none rounded-full bg-white/70 border border-white/70 px-4 py-2.5 pr-10 text-[13px] text-slate-700 placeholder:text-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-violet-300"
              style={{ backdropFilter: "blur(18px)" }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
              ↵
            </span>
          </div>
          <button
            onClick={handleSend}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-lg shadow-[0_12px_30px_rgba(129,140,248,0.9)] hover:scale-105 active:scale-95 transition-transform"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Profile Panel (replaces chat until filled) ---------------- */
function ProfilePanel({ draft, setDraft, onSave, saving }) {
  return (
    <div
      className="w-full max-w-md h-[80vh] md:h-[82vh] rounded-[2.2rem] flex flex-col overflow-hidden shadow-[0_24px_80px_rgba(148,163,255,0.7)] border border-white/60"
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(235,225,255,0.99))",
        backdropFilter: "blur(32px)",
      }}
    >
      <div className="px-5 pt-5 pb-3">
        <div className="text-xs font-semibold text-violet-500 uppercase tracking-wide">
          First things first
        </div>
        <h2 className="text-base font-semibold text-slate-800 mt-1">
          Complete your basic profile
        </h2>
        <p className="text-[11px] text-slate-500 mt-1">
          I use this only to personalize responses. I won’t diagnose or replace
          a real doctor.
        </p>
      </div>

      <div className="flex-1 px-5 pb-5 overflow-y-auto">
        <form onSubmit={onSave} className="mt-2 space-y-3 text-[13px]">
          <div>
            <label className="text-[11px] text-slate-500">Name</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/80 bg-white/90 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 shadow-inner"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-500">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-white/80 bg-white/90 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 shadow-inner"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] text-slate-500">Age</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/80 bg-white/90 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 shadow-inner"
                value={draft.age}
                onChange={(e) => setDraft({ ...draft, age: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-slate-500">Gender</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/80 bg-white/90 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 shadow-inner"
                value={draft.gender}
                onChange={(e) =>
                  setDraft({ ...draft, gender: e.target.value })
                }
                placeholder="e.g. Female"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-500">Blood Group</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/80 bg-white/90 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 shadow-inner"
              value={draft.blood_group}
              onChange={(e) =>
                setDraft({ ...draft, blood_group: e.target.value })
              }
              placeholder="e.g. O+"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-500">Allergies</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/80 bg-white/90 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 shadow-inner"
              value={draft.allergies}
              onChange={(e) =>
                setDraft({ ...draft, allergies: e.target.value })
              }
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-500">
              Chronic conditions
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-white/80 bg-white/90 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 shadow-inner"
              value={draft.chronic_conditions}
              onChange={(e) =>
                setDraft({ ...draft, chronic_conditions: e.target.value })
              }
              placeholder="e.g. asthma, diabetes (optional)"
            />
          </div>

          <div className="pt-2 flex justify-between items-center">
            <p className="text-[10px] text-slate-500 max-w-[60%]">
              You can edit this anytime from your dashboard profile.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[12px] shadow-[0_10px_25px_rgba(129,140,248,0.8)] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save & continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Chat Bubbles & Typing ---------------- */
function ChatBubble({ from, text }) {
  const isUser = from === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} text-[13px]`}
    >
      <div
        className={`max-w-[78%] px-4 py-2.5 rounded-3xl shadow-md ${
          isUser
            ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white rounded-br-sm"
            : "bg-white/90 text-slate-800 rounded-bl-sm border border-white/70"
        }`}
        style={{
          backdropFilter: "blur(18px)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-500">
      <div
        className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow-md border border-white/70"
        style={{ backdropFilter: "blur(16px)" }}
      >
        <div className="flex space-x-1">
          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150" />
          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-300" />
        </div>
      </div>
      <span>Typing…</span>
    </div>
  );
}
