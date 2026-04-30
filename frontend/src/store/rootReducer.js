import { combineReducers } from "redux";

import authReducer from "../features/auth/authSlice";
import usersReducer from "../features/users/usersSlice";
import coursesReducer from "../features/courses/coursesSlice";
import lessonsReducer from "../features/lessons/lessonsSlice";
import chatRoomsReducer from "../features/chat/chatRoomsSlice";
import paymentsReducer from "../features/payments/paymentsSlice";
import categoriesReducer from "../features/category/categoriesSlice";
import uiReducer from "../features/ui/uiSlice";
import auditLogReducer from "../features/auditLog/auditLogSlice";
import rolesReducer from "../features/roles/roleSlice";
import modalReducer from "../features/modal/modalSlice";
import permissionsReducer from "../features/permissions/permissionsSlice";
import rolePermissionsReducer from "../features/role_permissions/rolePermissionsSlice";
import messagesReducer from "../features/chat/messagesSlice";
import commentsReducer from "../features/comment/commentsSlice";
import instructorsReducer from "../features/instructor/instructorsSlice";
import studentsReducer from "../features/student/studentsSlice";
import cartReducer from "../features/cart/cartSlice";
import ordersReducer from "../features/orders/ordersSlice";
import discountsReducer from "../features/discounts/discountSlice";
import quizzessReducer from "../features/quizzes/quizzesSlice";
import questionsReducer from "../features/questions/questionsSlice";
import studentQuizAttemptReducer from "../features/studentQuizAttempt/studentQuizAttemptSlice";

import modulesReducer from "../features/modules/modulesSlice";
import enrollmentReducer from "../features/enrollment/enrollment.slice";
import lessonProgressReducer from "../features/lessonProgress/lessonProgressSlice";
import notificatioReducer from "../features/notifications/notificationSlice";
import searchReducer from "../features/search/searchSlice";
import chatRequestsReducer from "../features/chat/chatRequestsSlice";
import chatSuggestionsReducer from "../features/chat/chatSuggestionsSlice";
import userRelationsReducer from "../features/chat/userRelationsSlice";
import dashboardsReducer from "../features/dashboard/dashboardSlice";
import chatNotificationsReducer from "../features/chat/chatNotificationsSlice";
import certificatesReducer from "../features/certificate/certificateSlice";
import statsReducer from "../features/stats/statsSlice";
import contactsReducer from "../features/contact/contactsSlice";
import instructorRequestReducer from "../features/instructorRequest/instructorRequestSlice";

const appReducer = combineReducers({
  auth: authReducer,
  users: usersReducer,
  courses: coursesReducer,
  lessons: lessonsReducer,
  chatRooms: chatRoomsReducer,
  payments: paymentsReducer,
  categories: categoriesReducer,
  auditLogs: auditLogReducer,
  ui: uiReducer,
  roles: rolesReducer,
  modals: modalReducer,
  permissions: permissionsReducer,
  rolePermissions: rolePermissionsReducer,
  messages: messagesReducer,
  comments: commentsReducer,
  instructors: instructorsReducer,
  students: studentsReducer,
  cart: cartReducer,
  orders: ordersReducer,
  discounts: discountsReducer,
  quizzes: quizzessReducer,
  questions: questionsReducer,
  studentQuizAttempt: studentQuizAttemptReducer,
  modules: modulesReducer,
  enrollment: enrollmentReducer,
  lessonProgress: lessonProgressReducer,
  notifications: notificatioReducer,
  search: searchReducer,
  chatRequests: chatRequestsReducer,
  chatSuggestions: chatSuggestionsReducer,
  userRelations: userRelationsReducer,
  dashboard: dashboardsReducer,
  chatNotifications: chatNotificationsReducer,
  certificates: certificatesReducer,
  stats: statsReducer,
  contacts: contactsReducer,
  instructorRequest: instructorRequestReducer,
});

/**
 * 🔥 ROOT REDUCER (WRAPPER RESET)
 */
const rootReducer = (state, action) => {
  if (action.type === "auth/logoutApi/fulfilled") {
    state = undefined;
  }

  return appReducer(state, action);
};

export default rootReducer;
