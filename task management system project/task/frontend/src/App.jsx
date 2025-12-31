import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import NotFound from "./components/NotFound.jsx";
import { PublicLayout } from "./layouts/PublicLayout.jsx";
import { ProtectedLayout } from "./layouts/ProtectedLayout.jsx";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-100">
        <div className="p-6 bg-base-200 shadow-lg rounded-lg">
          <span className="loading loading-infinity loading-xl text-5xl"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Routes>

        <Route element={<PublicLayout/>}>
        <Route path="/home" element={<Home/>} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        </Route>
        

        <Route element={<ProtectedLayout/>}>
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        </Route>

      <Route path="*" element={<NotFound />} />

      </Routes>

    </div>
  
  );
}

export default App;
