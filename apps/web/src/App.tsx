import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import MarketingHome from "./pages/MarketingHome";
import CommunityFeed from "./pages/CommunityFeed";
import DjProfilePage from "./pages/DjProfilePage";
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import CompleteProfilePage from "./pages/CompleteProfilePage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import StudioPage from "./pages/StudioPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MarketingHome />} />
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
