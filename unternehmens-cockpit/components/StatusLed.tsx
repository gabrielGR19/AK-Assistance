import type { StatusAmpel } from "@/lib/types";

const LABEL: Record<StatusAmpel, string> = {
  ok: "OK",
  beobachten: "Beobachten",
  handlung: "Handlung nötig",
};

// Gedämpfte Status-LED mit Text: grün (ok), gelb (beobachten), rot (Handlung nötig).
export function StatusLed({ status }: { status: StatusAmpel }) {
  return (
    <span className={`led led--${status}`}>
      <span className="led__punkt" aria-hidden="true" />
      {LABEL[status]}
    </span>
  );
}
