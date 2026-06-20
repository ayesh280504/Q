import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import IntroSplash, { useIntroSplashEnabled } from "./components/IntroSplash";
import MarketingHome from "./pages/MarketingHome";
import DownloadPage from "./pages/DownloadPage";
import CommunityFeed from "./pages/CommunityFeed";
import DjProfilePage from "./pages/DjProfilePage";
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import CompleteProfilePage from "./pages/CompleteProfilePage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import StudioPage from "./pages/StudioPage";
import SettingsPage from "./pages/SettingsPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import FeaturesPage from "./pages/FeaturesPage";
import ForDjsPage from "./pages/ForDjsPage";
import ForCrowdPage from "./pages/ForCrowdPage";
import AboutPage from "./pages/AboutPage";
import IntegrationsPage from "./pages/IntegrationsPage";

export default function AppRoutes() {
  const location = useLocation();
  const introAvailable = useIntroSplashEnabled();
  const [introDone, setIntroDone] = useState(!introAvailable);
  const showIntro = introAvailable && !introDone && location.pathname === "/";

  useEffect(() => {
    document.body.classList.toggle("intro-splash-active", showIntro);
    return () => document.body.classList.remove("intro-splash-active");
  }, [showIntro]);

  return (
    <>
      {showIntro ? <IntroSplash onComplete={() => setIntroDone(true)} /> : null}
      <Routes>
        <Route path="/" element={<MarketingHome />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/booth" element={<DownloadPage />} />
        <Route path="/community" element={<CommunityFeed />} />
        <Route path="/dj/:handle" element={<DjProfilePage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/welcome" element={<CompleteProfilePage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/for-djs" element={<ForDjsPage />} />
        <Route path="/for-crowd" element={<ForCrowdPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
      </Routes>
    </>
  );
}
