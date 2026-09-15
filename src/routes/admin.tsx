import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin-page";

export const Route = createFileRoute("/admin")({
  component: Admin,
  head: () => ({
    meta: [{ title: "Office ledger · The Anthropic Owner" }],
  }),
});

function Admin() {
  return <AdminPage />;
}
