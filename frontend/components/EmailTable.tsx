interface Email {
  id: string;
  recipient: string;
  subject: string;
  body?: string;
  status: "SCHEDULED" | "PROCESSING" | "SENT" | "FAILED";
  scheduledAt: string;
  sentAt?: string | null;
}

interface EmailTableProps {
  emails: Email[];
  loading?: boolean;
}

function getStatusClasses(status: Email["status"]) {
  switch (status) {
    case "SENT":
      return "bg-green-100 text-green-700";

    case "FAILED":
      return "bg-red-100 text-red-700";

    case "PROCESSING":
      return "bg-blue-100 text-blue-700";

    case "SCHEDULED":
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

export default function EmailTable({
  emails,
  loading = false,
}: EmailTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

            <p className="text-sm text-slate-500">
              Loading emails...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
          ✉
        </div>

        <h3 className="mt-4 text-base font-semibold text-slate-900">
          No emails yet
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Your scheduled and sent emails will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recipient
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Subject
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scheduled
              </th>
            </tr>
          </thead>

          <tbody>
            {emails.map((email) => (
              <tr
                key={email.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {email.recipient}
                </td>

                <td className="max-w-xs truncate px-5 py-4 text-sm text-slate-700">
                  {email.subject}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                      email.status
                    )}`}
                  >
                    {email.status}
                  </span>
                </td>

                <td className="px-5 py-4 text-sm text-slate-500">
                  {new Date(email.scheduledAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}