import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getBasicProfile } from "../api/profilesApi.js";
import { PublicProfileCard } from "../components/profiles/PublicProfileCard.jsx";
import { ReportUserButton } from "../components/moderation/ReportUserButton.jsx";

export function UserProfilePage() {
  const { userId } = useParams();
  const query = useQuery({
    queryKey: ["basic-profile", userId],
    queryFn: () => getBasicProfile(userId)
  });

  if (query.isLoading) return <p>Loading profile…</p>;
  if (query.isError) {
    return <p role="alert">{query.error.message}</p>;
  }

  return (
    <main className="mx-auto max-w-6xl">
      <Link
        className="mb-5 inline-flex items-center gap-1 font-bold text-leaf hover:underline"
        to="/messages"
      >
        ← Back to messages
      </Link>
      <PublicProfileCard profile={query.data.data} />
      <ReportUserButton
        className="mt-4 flex justify-end"
        userId={query.data.data.id}
        userName={query.data.data.full_name}
      />
    </main>
  );
}
