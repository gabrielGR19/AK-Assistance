import { Sidebar } from "@/components/Sidebar";

// Gemeinsames Layout aller Cockpit-Bereiche: feste Sidebar links, Inhalt rechts.
// Report (Druckansicht) und Styleguide liegen bewusst außerhalb dieser Route-Group.
export default function CockpitLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="inhalt">{children}</div>
    </div>
  );
}
