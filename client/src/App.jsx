import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Courses from "./Pages/Courses";
import CourseContent from "./Pages/CourseContent";
import CourseDescription from "./Pages/CourseDescription";
import YourBuddy from "./Pages/YourBuddy";
import Home from "./Pages/Home";
import UserPreferencesForm from "./Pages/userPreferencesForm";
import AdminDashboard from "./Pages/AdminDashboard";
import LoginForm from "./Pages/LoginForm";
import RegistrationForm from "./Pages/RegistrationForm";
import UserDashboard from "./Pages/UserDashboard";
import GroupPage from "./Pages/GroupPage";
import ClassroomPage from "./Pages/ClassroomPage";
import CourseMaterialPage from "./Pages/CourseMaterialPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/yourbuddy" element={<YourBuddy />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/course/:courseName" element={<CourseDescription />} />
        <Route path="/course-content/:courseName" element={<CourseContent />} />
        <Route path="/course-material/:courseName" element={<CourseMaterialPage />} />
        <Route index element={<Home />} /> {/* Default route */}
        <Route path="/preferences" element={<UserPreferencesForm />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/group/:groupId" element={<GroupPage />} />
        <Route path="/classroom/:classroomId" element={<ClassroomPage />} />
      </Route>
    </Routes>
  );
}

export default App;
