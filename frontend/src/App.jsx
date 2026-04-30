import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import ToastContainer from "./components/toast/ToastContainer";
import ThemeInitializer from "./context/ThemeInitializer";
import ModalHost from "./components/modal/ModalHost";
import GlobalLoader from "./components/ui/GlobalLoader";
import PublicLayout from "./components/layout/PublicLayout";
import CertificateCelebrationModal from "./components/modal/CertificateCelebrationModal.jsx";
import HomePage from "./pages/Home/HomePage";
import RoleSelection from "./components/auth/RoleSelection";
import CourseCategoryPage from "./pages/Courses/Public/CourseCategoryPage";
import MyBookmarksPage from "./pages/Courses/Public/MyBookmarksPage";
import About from "./pages/About/About";
import CourseLayout from "./components/layout/CourseLayout";
import CourseOverviewPage from "./pages/Courses/Public/CourseOverviewPage";
import ProtectedCourseRoute from "./components/courses/ProtectedCourseRoute";
import CourseLearningPage from "./pages/Courses/Public/CourseLearningPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/Auth/ResetPasswordPage";
import SetPasswordPage from "./pages/Auth/SetPasswordPage";
import VerifyResetOtpPage from "./pages/Auth/VerifyResetOtpPage";
import ChatPage from "./pages/Chat/Public/ChatPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import CourseQuizzesPage from "./pages/Courses/Public/CourseQuizzesPage";
import QuizTakingPage from "./pages/Quizz/Public/QuizTakingPage";
import CartPage from "./pages/Cart/CartPage";
import ContactPage from "./pages/Contact/Public/ContactPage";
import NotificationsPage from "./pages/Notification/NotificationsPage";
import DashboardGuard from "./components/auth/DashboardGuard";
import { AccessControlProvider } from "./context/DashboardContext";
import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import DashboardPage from "./pages/Dashboard/DashboardPage.jsx";
import CoursesPage from "./pages/Courses/CoursesPage";

import UserPage from "./pages/User/UsersPage.jsx";
import RolesPage from "./pages/Role/RolesPage.jsx";
import PermissionsPage from "./pages/Permission/PermissionsPage.jsx";
import RolePermissionsPage from "./pages/RolePermission/RolePermissionsPage.jsx";
import CommentsPage from "./pages/Comment/CommentsPage.jsx";
import InstructorsPage from "./pages/Instructor/InstructorsPage.jsx";
import StudentsPage from "./pages/Student/StudentsPage.jsx";
import ChatRoomsAdminPage from "./pages/Chat/Admin/ChatRoomsAdminPage";
import PaymentPage from "./pages/Payment/PaymentPage.jsx";
import DiscountPage from "./pages/Discount/DiscountPage.jsx";
import QuizzesPage from "./pages/Quizz/QuizzesPage.jsx";
import LessonPage from "./pages/Lesson/LessonPage.jsx";
import QuestionsPage from "./pages/Question/QuestionsPage.jsx";
import StudentQuizAttemptsPage from "./pages/StudentQuizAttempt/StudentQuizAttemptsPage.jsx";
import LessonProgressPage from "./pages/Lesson/LessonProgressPage.jsx";
import ModulesPage from "./pages/Module/ModulesPage.jsx";
import ContactsAdminPage from "./pages/Contact/Admin/ContactsAdminPage";
import CategoriesPage from "./pages/Category/CategoriesPage.jsx";
import CertificatesPage from "./pages/Certificate/CertificatesPage";
import OrdersPage from "./pages/Order/OrdersPage";
import { fetchMe, restoreAuth } from "./features/auth/authThunks.js";
import InstructorRequestModal from "./components/modal/InstructorRequestModal.jsx";
import DemoVideoModal from "./components/modal/DemoVideoModal.jsx";
import RoleModal from "./components/modal/RoleModal.jsx";
import useModal from "./hooks/useModal.js";
import AuthModal from "./components/modal/AuthModal.jsx";
import AttemptDetailModal from "./components/modal/AttemptDetailModal.jsx";
import SettingsModal from "./components/modal/SettingsModal.jsx";
import CertificateModal from "./components/modal/CertificateModal.jsx";

const PrivateRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) return;

      const res = await dispatch(restoreAuth());

      if (restoreAuth.fulfilled.match(res)) {
        try {
          await dispatch(fetchMe());
        } catch (e) {
          console.log(e, "me failed");
        }
      }
    };

    initAuth();
  }, [dispatch]);

  const authModal = useModal("AUTH");

  return (
    <>
      <ToastContainer />
      <ThemeInitializer />
      <CertificateCelebrationModal />
      <ModalHost />
      <InstructorRequestModal />
      <DemoVideoModal />
      <RoleModal />
      <GlobalLoader />
      <AttemptDetailModal />

      {authModal.isOpen && (
        <AuthModal
          onClose={authModal.close}
          initialStep={authModal.data?.initialStep}
        />
      )}
      {isAuthenticated && <SettingsModal />}
      {isAuthenticated && <CertificateModal />}
      <Routes>
        {/*  PUBLIC LAYOUT */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/select-role" element={<RoleSelection />} />
          <Route path="/categories" element={<CourseCategoryPage />} />
          <Route path="/myBookMark" element={<MyBookmarksPage />} />
          <Route path="/categories/:slug" element={<CourseCategoryPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses/:slug" element={<CourseLayout />}>
            <Route index element={<CourseOverviewPage />} />
            <Route element={<ProtectedCourseRoute />}>
              <Route path="learning" element={<CourseLearningPage />} />
            </Route>
          </Route>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:slug" element={<ProfilePage />} />
          <Route
            path="/courses/:slug/quizzes"
            element={<CourseQuizzesPage />}
          />
          <Route path="/quiz/:quizId" element={<QuizTakingPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* PRIVATE LAYOUT (Dashboard) */}
        <Route element={<PrivateRoute />}>
          <Route element={<DashboardGuard />}>
            <Route
              path="/dashboard"
              element={
                <AccessControlProvider>
                  <DashboardLayout />
                </AccessControlProvider>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="certificates" element={<CertificatesPage />} />
              <Route path="users" element={<UserPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="permissions" element={<PermissionsPage />} />
              <Route
                path="role-permissions"
                element={<RolePermissionsPage />}
              />
              <Route path="comments" element={<CommentsPage />} />
              <Route path="instructors" element={<InstructorsPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="chat-rooms" element={<ChatRoomsAdminPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="payments" element={<PaymentPage />} />
              <Route path="discounts" element={<DiscountPage />} />
              <Route path="quizzes" element={<QuizzesPage />} />
              <Route path="lessons" element={<LessonPage />} />
              <Route path="questions" element={<QuestionsPage />} />
              <Route
                path="student-quiz-attempts"
                element={<StudentQuizAttemptsPage />}
              />
              <Route
                path="lesson-progresses"
                element={<LessonProgressPage />}
              />
              <Route path="modules" element={<ModulesPage />} />
              <Route path="contact" element={<ContactsAdminPage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
