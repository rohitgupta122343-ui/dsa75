import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { GuestOnly, RequireAdmin, RequireAuth } from './components/guards.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Challenge from './pages/Challenge.jsx';
import Problems from './pages/Problems.jsx';
import Problem from './pages/Problem.jsx';
import Submissions from './pages/Submissions.jsx';
import SubmissionDetail from './pages/SubmissionDetail.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminQuestions from './pages/admin/AdminQuestions.jsx';
import QuestionForm from './pages/admin/QuestionForm.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="challenge" element={<Challenge />} />
          <Route path="problems" element={<Problems />} />
          <Route path="problems/:slug" element={<Problem />} />
          <Route path="submissions" element={<Submissions />} />
          <Route path="submissions/:id" element={<SubmissionDetail />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="profile" element={<Profile />} />
          <Route element={<RequireAdmin />}>
            <Route path="admin" element={<AdminOverview />} />
            <Route path="admin/questions" element={<AdminQuestions />} />
            <Route path="admin/questions/new" element={<QuestionForm />} />
            <Route path="admin/questions/:id/edit" element={<QuestionForm />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound standalone />} />
    </Routes>
  );
}
