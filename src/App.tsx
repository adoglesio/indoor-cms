
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './routes/PrivateRoute';
import { Sidebar } from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile/Profile';
import Dashboard from './pages/Dashboard/Dashboard';
import { DevicesList } from './pages/Devices/DevicesList';
import { DeviceEditor } from './pages/Devices/DeviceEditor';
import { MediaLibrary } from './pages/Media/MediaLibrary';
import { PlaylistsList } from './pages/Playlists/PlaylistsList';
import { PlaylistForm } from './pages/Playlists/PlaylistForm';
import { ScheduleList } from './pages/Schedule/ScheduleList';
import { ScheduleForm } from './pages/Schedule/ScheduleForm';
import Plans from './pages/Plans/Plans';
import { AdminRoute } from './routes/AdminRoute';
<<<<<<< HEAD
import AdminUsers from './pages/Admin/Users';
import Users from './pages/Admin/Users';
=======
import Users from './pages/Admin/Users';
import Reports from './pages/Reports/Reports';
>>>>>>> b5c39b3 (Atualização do projeto no relatório)


function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4">{children}</main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/devices" element={<PrivateRoute><Layout><DevicesList /></Layout></PrivateRoute>} />
          <Route path="/devices/new" element={<PrivateRoute><Layout><DeviceEditor /></Layout></PrivateRoute>} />
          <Route path="/devices/:id/edit" element={<PrivateRoute><Layout><DeviceEditor /></Layout></PrivateRoute>} />
          <Route path="/media" element={<PrivateRoute><Layout><MediaLibrary /></Layout></PrivateRoute>} />
          <Route path="/playlists" element={<PrivateRoute><Layout><PlaylistsList /></Layout></PrivateRoute>} />
          <Route path="/playlists/new" element={<PrivateRoute><Layout><PlaylistForm /></Layout></PrivateRoute>} />
          <Route path="/playlists/:id/edit" element={<PrivateRoute><Layout><PlaylistForm /></Layout></PrivateRoute>} />
          <Route path="/schedules" element={<PrivateRoute><Layout><ScheduleList /></Layout></PrivateRoute>} />
          <Route path="/schedules/new" element={<PrivateRoute><Layout><ScheduleForm /></Layout></PrivateRoute>} />
          <Route path="/schedules/:id/edit" element={<PrivateRoute><Layout><ScheduleForm /></Layout></PrivateRoute>} />
          <Route path="/plans" element={<PrivateRoute><Layout><Plans /></Layout></PrivateRoute>} />
<<<<<<< HEAD
          <Route path="/admin/users" element={<PrivateRoute><Layout><AdminUsers /></Layout></PrivateRoute>} />
=======
          <Route path="/reports" element={<PrivateRoute><Layout><Reports /></Layout></PrivateRoute>} />
>>>>>>> b5c39b3 (Atualização do projeto no relatório)
          <Route
            path="/admin/users"
            element={
              <PrivateRoute>
                <Layout>
                  <AdminRoute>
                    <Users />
                  </AdminRoute>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;