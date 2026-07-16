import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { exportDoc } from "../lib/store";
import { sendSignInCode, signOut, syncNow, verifySignInCode } from "../lib/sync";

export function SettingsSheet({
  session,
  onClose,
}: {
  session: Session | null;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("marilynliewpj@gmail.com");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sendCode = async () => {
    setBusy(true);
    setMsg(null);
    const { error } = await sendSignInCode(email.trim());
    setBusy(false);
    if (error) setMsg(error.message);
    else {
      setStage("code");
      setMsg("code sent — check your email");
    }
  };

  const verify = async () => {
    setBusy(true);
    setMsg(null);
    const { error } = await verifySignInCode(email.trim(), code);
    setBusy(false);
    if (error) setMsg(error.message);
    else setMsg(null);
  };

  const doSync = async () => {
    setBusy(true);
    await syncNow();
    setBusy(false);
    setMsg("synced");
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3>Settings</h3>

        <span className="microcaps sect-label">cloud sync</span>
        {session ? (
          <>
            <div className="hint">
              signed in as {session.user.email}. edits push automatically ~1s after each
              change; the live site reads the latest without a redeploy.
            </div>
            <div className="row">
              <button className="btn" onClick={doSync} disabled={busy}>
                {busy ? "syncing…" : "sync now"}
              </button>
              <button className="btn" onClick={() => signOut()}>
                sign out
              </button>
            </div>
          </>
        ) : stage === "email" ? (
          <>
            <div className="hint">
              one-time sign-in per device. a code is emailed to you — type it back here.
            </div>
            <div className="row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email"
              />
              <button className="btn" onClick={sendCode} disabled={busy}>
                {busy ? "…" : "email me a code"}
              </button>
            </div>
          </>
        ) : (
          <div className="row">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="sign-in code"
            />
            <button className="btn" onClick={verify} disabled={busy || !code.trim()}>
              {busy ? "…" : "verify"}
            </button>
          </div>
        )}
        {msg && <div className="hint">{msg}</div>}

        <span className="microcaps sect-label">backup</span>
        <div className="row">
          <button
            className="btn"
            onClick={() => {
              exportDoc();
              setMsg("content.json downloaded — commit it to the repo as src/content/seed.json");
            }}
          >
            export content.json
          </button>
        </div>
        <div className="hint">
          localStorage is the source of truth; supabase syncs it across devices; the
          exported json committed to the repo is the belt-and-suspenders backup.
        </div>
      </div>
    </div>
  );
}
