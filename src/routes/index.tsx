import { createFileRoute } from "@tanstack/react-router";
import { OfficePage } from "@/components/office-page";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <OfficePage />;
}
