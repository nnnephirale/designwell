import { useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Doc } from "../types";
import { exportDoc, setDoc } from "../lib/store";
import { sendSignInCode, signOut, syncNow, verifySignInCode } from "../lib/sync";

export function SettingsSheet({
  session,
  onClose,
}: {
  session: Session | null;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
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

  const fileRef = useRef<HTMLInputElement>(null);
  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Doc;
      if (!parsed || !Array.isArray(parsed.sections) || !Array.isArray(parsed.topics))
        throw new Error("not a designwell content file");
      setDoc(parsed); // stamps a fresh updatedAt → wins on every device, auto-pushes
      setMsg(`restored ${parsed.sections.length} sections — syncing to other devices`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "couldn't read that file");
    }
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
              setMsg("content.json downloaded — keep it somewhere safe");
            }}
          >
            export content.json
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            import content.json
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = "";
            }}
          />
        </div>
        <div className="hint">
          localStorage is the source of truth; supabase syncs it across devices.
          export regularly; import replaces the whole doc from a backup file and
          syncs it out — the recovery path if anything is ever lost again.
        </div>
      </div>
    </div>
  );
}
