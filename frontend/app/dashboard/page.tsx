"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "../../lib/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import EmailTable from "../../components/EmailTable";
import SlackConnection from "../../components/SlackConnection";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

interface Email {
  id: string;
  recipient: string;
  subject: string;
  body?: string;
  status: "SCHEDULED" | "PROCESSING" | "SENT" | "FAILED";
  scheduledAt: string;
  sentAt?: string | null;
}

interface MeResponse {
  user: User;
}

interface EmailsResponse {
  emails: Email[];
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);

  const [loading, setLoading] = useState(true);
  const [emailLoading, setEmailLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const userData: MeResponse =
          await apiFetch("/auth/me");

        setUser(userData.user);

        setEmailLoading(true);

        const emailData: EmailsResponse =
          await apiFetch("/api/emails");

        setEmails(emailData.emails);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load dashboard"
        );
      } finally {
        setLoading(false);
        setEmailLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function handleLogout() {
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
      });

      router.push("/");
    } catch (error) {
      console.error(error);
      alert("Failed to logout");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="text-slate-500">
            Loading ReachInbox...
          </p>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-slate-900">
            Authentication Required
          </h1>

          <p className="mt-2 text-slate-500">
            Please login with Google to access ReachInbox.
          </p>

          <a
            href="http://localhost:5000/auth/google"
            className="mt-6 inline-block rounded-lg bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800"
          >
            Continue with Google
          </a>
        </div>
      </main>
    );
  }

  const scheduledCount = emails.filter(
    (email) => email.status === "SCHEDULED"
  ).length;

  const sentCount = emails.filter(
    (email) => email.status === "SENT"
  ).length;

  const failedCount = emails.filter(
    (email) => email.status === "FAILED"
  ).length;

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          name={user.name}
          email={user.email}
          avatar={user.avatar}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">

            {/* Page heading */}
            <div className="mb-8">
              <p className="text-sm font-medium text-blue-600">
                WORKSPACE
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Dashboard
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Monitor your email outreach campaigns.
              </p>
            </div>

            {/* Statistics */}
            <section className="grid gap-5 md:grid-cols-3">

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Scheduled
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {scheduledCount}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Waiting to be sent
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Sent
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {sentCount}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Successfully sent
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Failed
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {failedCount}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Need attention
                </p>
              </div>

            </section>

            {/* Emails */}
            <section className="mt-8">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Recent Emails
                </h2>

                <p className="text-sm text-slate-500">
                  Your latest email activity.
                </p>
              </div>

              <EmailTable
                emails={emails.slice(0, 10)}
                loading={emailLoading}
              />
            </section>

            {/* Slack */}
            <section className="mt-8">
              <SlackConnection userId={user.id} />
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}