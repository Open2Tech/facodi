import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import FacodiLayout from '@/components/layout/FacodiLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PageState } from '@/components/layout/PageState';
import { useAuth } from '@/features/auth/useAuth';

const Home = lazy(() => import('@/pages/Home'));
const Courses = lazy(() => import('@/pages/Courses'));
const CourseDetails = lazy(() => import('@/pages/CourseDetails'));
const ResourceDetails = lazy(() => import('@/pages/ResourceDetails'));
const UnitDetails = lazy(() => import('@/pages/UnitDetails'));
const Units = lazy(() => import('@/pages/Units'));
const Resources = lazy(() => import('@/pages/Resources'));
const Sequences = lazy(() => import('@/pages/Sequences'));
const SequenceDetails = lazy(() => import('@/pages/SequenceDetails'));
const About = lazy(() => import('@/pages/About'));
const Community = lazy(() => import('@/pages/Community'));
const CommunityJoin = lazy(() => import('@/pages/CommunityJoin'));
const EditorCommunity = lazy(() => import('@/pages/EditorCommunity'));
const Notebook = lazy(() => import('@/pages/Notebook'));
const Login = lazy(() => import('@/pages/Login'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Profile = lazy(() => import('@/pages/Profile'));
const Editor = lazy(() => import('@/pages/Editor'));
const EditorStudyPaths = lazy(() => import('@/pages/EditorStudyPaths'));
const EditorCourseQuality = lazy(() => import('@/pages/EditorCourseQuality'));
const PlaylistSubmit = lazy(() => import('@/pages/PlaylistSubmit'));
const EditorPlaylists = lazy(() => import('@/pages/EditorPlaylists'));
const EditorProjectCredits = lazy(() => import('@/pages/EditorProjectCredits'));
const EditorEmailTemplates = lazy(() => import('@/pages/EditorEmailTemplates'));
const SuggestResource = lazy(() => import('@/pages/SuggestResource'));
const EditorSuggestions = lazy(() => import('@/pages/EditorSuggestions'));

const Admin = lazy(() => import('@/pages/Admin'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export function AppRoutes() {
  const { user, role } = useAuth();
  const sessionKey = `${user?.id ?? 'public'}:${role}`;
  return <Suspense fallback={<PageState loading />}><Routes>
    <Route element={<FacodiLayout />}>
      <Route index element={<Home key={sessionKey} />} />
      <Route path="/courses" element={<Courses key={sessionKey} />} />
      <Route path="/courses/:slug" element={<CourseDetails key={sessionKey} />} />
      <Route path="/courses/:slug/units/:unit" element={<UnitDetails key={sessionKey} />} />
      <Route path="/units" element={<Units key={sessionKey} />} />
      <Route path="/resources" element={<Resources key={sessionKey} />} />
      <Route path="/resources/:slug" element={<ResourceDetails key={sessionKey} />} />
      <Route path="/sequences" element={<Sequences key={sessionKey} />} />
      <Route path="/sequences/:slug" element={<SequenceDetails key={sessionKey} />} />
      <Route path="/notes" element={<Notebook key={sessionKey} />} />
      <Route path="/about" element={<About />} />
      <Route path="/community" element={<Community />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="/facodi" element={<Navigate to="/courses" replace />} />
      <Route element={<ProtectedRoute key={sessionKey} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/playlists/submit" element={<PlaylistSubmit />} />
        <Route path="/community/join" element={<CommunityJoin />} />
        <Route path="/suggest" element={<SuggestResource />} />
      </Route>
      <Route element={<ProtectedRoute key={sessionKey} required="editor" />}>
        <Route path="/editor" element={<Editor />} />
        <Route path="/editor/study-paths" element={<EditorStudyPaths />} />
        <Route path="/editor/course-quality" element={<EditorCourseQuality />} />
        <Route path="/editor/project-credits" element={<EditorProjectCredits />} />
        <Route path="/editor/email-templates" element={<EditorEmailTemplates />} />
        <Route path="/editor/community" element={<EditorCommunity />} />
        <Route path="/editor/playlists" element={<EditorPlaylists />} />
        <Route path="/editor/suggestions" element={<EditorSuggestions />} />
      </Route>
      <Route element={<ProtectedRoute key={sessionKey} required="admin" />}><Route path="/admin" element={<Admin />} /></Route>
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes></Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Analytics />
    </BrowserRouter>
  );
}
