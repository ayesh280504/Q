import { Route, Routes } from "react-router-dom";
import QLogo from "./components/QLogo";
import RequestPage from "./pages/RequestPage";
import DjRedirectPage from "./pages/DjRedirectPage";

export default function App() {
  return (
    <Routes>
      <Route path="/dj/:handle" element={<DjRedirectPage />} />
      <Route path="/r/:code" element={<RequestPage />} />
      <Route path="*" element={
        <div className="app">
          <QLogo size={48} className="brand-mark" />
          <p className="sub">Scan the QR on the DJ&apos;s laptop to request a track.</p>
        </div>
      } />
    </Routes>
  );
}
