import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Circles from "./pages/Circles";
import Journals from "./pages/Journals";
import CreateJournal from "./pages/CreateJournal";
import CircleDetail from "./pages/CircleDetail";
import Profile from "./pages/Profile";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/circles"
          element={
            <ProtectedRoute>
              <Circles />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/circles/:id"
          element={
            <ProtectedRoute>
              <CircleDetail />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/journals"
          element={
            <ProtectedRoute>
              <Journals />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/journals/new"
          element={
            <ProtectedRoute>
              <CreateJournal />
            </ProtectedRoute>
          }
        />
        <Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;