import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Courses from "./Pages/Courses";
import CourseContent from "./Pages/CourseContent"; 
import CourseDescription from "./Pages/CourseDescription";
import YourBuddy from './Pages/YourBuddy';
import Home from "./Pages/Home";


function App() {
  return (
    <Router>

      <Routes>
      <Route path="/" element={<Layout />}>
      <Route path="/yourbuddy" element={<YourBuddy />} />
      
      <Route path="/courses" element={<Courses />} />
      
      <Route path="/course/:courseName" element={<CourseDescription />} />
      <Route path="/course-content/:courseName" element={<CourseContent />} />
        
          <Route index element={<Home />} /> {/* Default route */}
          
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
