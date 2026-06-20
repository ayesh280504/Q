import { Route, Routes } from "react-router-dom";
import CrowdHero from "./components/CrowdHero";
import RequestPage from "./pages/RequestPage";
import DjRedirectPage from "./pages/DjRedirectPage";
import NearbyPage from "./pages/NearbyPage";

export default function App() {
  return (
    <Routes>
      <Route path="/nearby" element={<NearbyPage />} />
      <Route path="/dj/:handle" element={<DjRedirectPage />} />
      <Route path="/r/:code" element={<RequestPage />} />
      <Route
        path="*"
        element={
          <div className="app">
            <CrowdHero
              kicker="// Crowd request"
              title={
                <>
                  Scan the <span className="crowd-title-accent">booth QR.</span>
                </>
              }
            >
              <p className="sub">Open the code on the DJ&apos;s laptop to request a track.</p>
              <p className="sub">
                <a href="/nearby">Find a booth nearby</a> (Android Chrome · experimental)
              </p>
            </CrowdHero>
          </div>
        }
      />
    </Routes>
  );
}
