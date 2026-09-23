import { Routes, Route } from "react-router-dom";
import { Dashboard } from "@features/dashboard/components/Dashboard";
import { TrayView } from "@features/tray/components/TrayView";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/tray" element={<TrayView />} />
    </Routes>
  );
}
