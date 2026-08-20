import Badge from "./Badge";
import { statusMeta } from "../data/mockTickets";

export default function StatusBadge({ status }) {
  const tone = statusMeta[status]?.tone ?? "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}
