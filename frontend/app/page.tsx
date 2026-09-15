"use client";

export default function Home() {
  const loginWithGoogle = () => {
    window.location.href =
      `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-xl font-bold text-white">
              R
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              ReachInbox
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Smart email outreach scheduler
            </p>
          </div>

          <button
            onClick={loginWithGoogle}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Continue with Google
          </button>

          <p className="mt-6 text-center text-xs text-slate-400">
            Sign in to manage your email campaigns
          </p>
        </div>
      </div>
    </main>
  );
}