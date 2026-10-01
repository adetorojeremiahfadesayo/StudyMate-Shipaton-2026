"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (!result.data.session) throw new Error("Sign-in did not return a session. Please try again.");
      window.location.assign("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in. Please try again.");
      setBusy(false);
    }
  }

  return <main className="mx-auto w-full max-w-md px-6 py-16">
    <Link href="/" className="font-bold text-slate-950">StudyMate</Link>
    <h1 className="mt-8 text-3xl font-black text-slate-950">Continue your study</h1>
    <p className="mt-3 text-slate-600">Sign in with your StudyMate account. Judges can use the provided test account.</p>
    <form className="mt-8 space-y-5" onSubmit={signIn}>
      <label className="block font-semibold text-slate-800">Email
        <input className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required disabled={busy} />
      </label>
      <label className="block font-semibold text-slate-800">Password
        <input className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required disabled={busy} />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button className="w-full rounded-lg bg-slate-950 px-4 py-3 font-bold text-white disabled:opacity-60" disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in"}</button>
    </form>
    <p className="mt-6 text-sm text-slate-600">Want a quick walkthrough? <Link href="/demo" className="font-semibold underline">Try the sample demo</Link>.</p>
  </main>;
}
