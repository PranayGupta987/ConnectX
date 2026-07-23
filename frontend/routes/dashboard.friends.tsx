import { createFileRoute } from "@tanstack/react-router";
import { FriendsPanel } from "@/components/friends/friends-panel";

export const Route = createFileRoute("/dashboard/friends")({
  head: () => ({
    meta: [
      { title: "Friends — ConnectX" },
      { name: "description", content: "Discover people, send requests and manage your ConnectX friends list." },
      { property: "og:title", content: "Friends — ConnectX" },
      { property: "og:description", content: "Search, invite and manage your ConnectX network." },
    ],
  }),
  component: FriendsPanel,
});
