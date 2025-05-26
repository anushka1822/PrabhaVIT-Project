import './App.css'
import Login from './components/Login'
import SignUp from './components/SignUp'
import ClubChat from './components/ClubChat'
import FileView from './components/FileView'
import Feed from './components/Feed'
import Form from './components/Form'
import HomePage from './components/HomePage'
import YourClubs from './components/YourClubs'
import ParticularClub from './components/ParticularClub'
import FileUpload from './components/FileUpload'
import CourseFiles from './components/CourseFiles'
import ProfilePage from './components/Profile'
import { useNavigate, BrowserRouter as Router, Route, Routes } from 'react-router-dom'


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/your-clubs" element={<YourClubs />} />
        <Route path="/club/:clubId" element={<ClubChat />} /> {/* Dynamic route */}
        {/* <Route path="/clubchat" element={<ClubChat />} /> */}
        <Route path="/fileview" element={<FileView />} />
        {/* <Route path="/upload/:folderName" element={<FileUpload />} /> */}
        <Route path="/fileUpload" element={<FileUpload />} />
        <Route path="/course/:courseId" element={<CourseFiles />} />
        <Route path="/course-files/:courseId" element={<CourseFiles />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/form" element={<Form />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/profile/:user_id" element={<ProfilePage />} />
        {/* <Route path="/profile" element={<Profile />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
