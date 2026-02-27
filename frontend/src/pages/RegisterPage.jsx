import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setMessage("Account created. Check your email for a confirmation link if required.");
  }

  return (
    <main className="min-h-screen bg-slate-50 grid place-items-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-slate-900">Register</h1>
        <p className="text-sm text-slate-600 mt-1">Create your JLPT study account.</p>

        <label className="block mt-6 text-sm text-slate-700">
          Email
          <input
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="block mt-4 text-sm text-slate-700">
          Password
          <input
            type="password"
            minLength={6}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-brand-500 px-4 py-2 text-white font-medium hover:bg-brand-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-70 transform active:scale-[0.98]"
        >
          {loading ? "Creating..." : "Create account"}
        </button>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account? <Link to="/login" className="text-brand-700 hover:text-brand-500 underline transition-colors">Login</Link>
        </p>
      </form>
    </main>
  );
}
