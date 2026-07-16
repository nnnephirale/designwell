// cloud sync — Deposits pattern: local-first, Supabase layered on top, the app
// never depends on it. Shared free-tier project (same as SSaved/Deposits) so
// mutual activity keeps it from auto-pausing; keep-alive cron lives in the
// deposits repo.
import { createClient, type Session } from "@supabase/supabase-js";
import type { Doc } from "../types";
import { getDoc, registerChangeHook, setDoc } from "./store";

const SUPABASE_URL = "https://uauqqdaalnddedgjdgcg.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdXFxZGFhbG5kZGVkZ2pkZ2NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTQ2NDIsImV4cCI6MjA4MzM3MDY0Mn0.afUxr9uKdSamnbFQmOt7DDRvEJYLEz3-c8u5P3zZcnE";

const TABLE = "dwd_document";
const ROW_ID = "main";

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

let session: Session | null = null;
const sessionListeners = new Set<(s: Session | null) => void>();

export function onSession(fn: (s: Session | null) => void) {
  sessionListeners.add(fn);
  fn(session);
  return () => {
    sessionListeners.delete(fn);
  };
}

export function getSession() {
  return session;
}

/* ---------- auth: email OTP, typed code (never magic link — iOS home-screen
   web apps live in a separate storage container that links can't sign in) ---- */

export async function sendSignInCode(email: string) {
  return sb.auth.signInWithOtp({ email });
}

export async function verifySignInCode(email: string, code: string) {
  // code length is a Supabase project setting — never hardcode it
  return sb.auth.verifyOtp({ email, token: code.trim(), type: "email" });
}

export async function signOut() {
  try {
    await sb.auth.signOut();
  } catch {
    /* offline sign-out is fine — session is cleared locally */
  }
}

/* ---------- doc sync: pull-on-open, debounced push, last-write-wins ---------- */

export type SyncState = "idle" | "syncing" | "error" | "offline";
let syncState: SyncState = "idle";
const syncListeners = new Set<(s: SyncState) => void>();

function setSyncState(s: SyncState) {
  syncState = s;
  syncListeners.forEach((l) => l(s));
}

export function onSyncState(fn: (s: SyncState) => void) {
  syncListeners.add(fn);
  fn(syncState);
  return () => syncListeners.delete(fn);
}

/** anyone can read — the live site always shows the latest published doc */
export async function pullDoc(): Promise<void> {
  try {
    setSyncState("syncing");
    const { data, error } = await sb
      .from(TABLE)
      .select("doc, updated_at")
      .eq("id", ROW_ID)
      .maybeSingle();
    if (error) throw error;
    if (data?.doc) {
      const remote = data.doc as Doc;
      const local = getDoc();
      if (new Date(remote.updatedAt) > new Date(local.updatedAt)) {
        setDoc(remote, { fromSync: true });
      }
    }
    setSyncState("idle");
  } catch {
    setSyncState("offline");
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

async function pushNow(doc: Doc) {
  if (!session) return; // writes are gated; reads are public
  try {
    setSyncState("syncing");
    const { error } = await sb.from(TABLE).upsert({
      id: ROW_ID,
      doc,
      updated_at: doc.updatedAt,
    });
    if (error) throw error;
    setSyncState("idle");
  } catch {
    setSyncState("error");
  }
}

function debouncedPush(doc: Doc) {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => pushNow(doc), 1200);
}

export async function syncNow() {
  await pullDoc();
  await pushNow(getDoc());
}

/* ---------- init ---------- */

export function initSync() {
  registerChangeHook(debouncedPush);
  sb.auth.getSession().then(({ data }) => {
    session = data.session;
    sessionListeners.forEach((l) => l(session));
  });
  sb.auth.onAuthStateChange((_evt, s) => {
    session = s;
    sessionListeners.forEach((l) => l(session));
  });
  pullDoc();
}
