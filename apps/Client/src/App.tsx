import './App.css'
import { Navigate, Route, Routes } from 'react-router'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// The pages most visits start on ship in the main bundle. Everything behind
// a login, and the auth forms, are separate chunks downloaded when opened.
import AppLayout from './Layout/AppLayout'
import HomePage from './Pages/HomePage'
import BrowsePage from './Pages/BrowsePage'
import DonationPage from './Pages/DonationPage'
import ProtectRoute from './Components/ProtectRoute'
import ScrollToTop from './Components/ScrollToTop'
import { lazyPage } from './utils/lazyPage'

const ImpactPage = lazyPage(() => import('./Pages/ImpactPage'))
const TipsPage = lazyPage(() => import('./Pages/TipsPage'))
const ProfilePage = lazyPage(() => import('./Pages/ProfilePage'))
const ShareFoodPage = lazyPage(() => import('./Pages/ShareFoodPage'))
const DashboardPage = lazyPage(() => import('./Pages/DashboardPage'))
const PantryPage = lazyPage(() => import('./Pages/PantryPage'))
const MyListingsPage = lazyPage(() => import('./Pages/MyListingsPage'))
const MyRequestsPage = lazyPage(() => import('./Pages/MyRequestsPage'))
const AccountPage = lazyPage(() => import('./Pages/AccountPage'))
const LoginPage = lazyPage(() => import('./Pages/Auth/LoginPage'))
const RegisterPage = lazyPage(() => import('./Pages/Auth/RegisterPage'))
const ForgotPasswordPage = lazyPage(() => import('./Pages/Auth/ForgotPasswordPage'))
const ResetPasswordPage = lazyPage(() => import('./Pages/Auth/ResetPasswordPage'))
const NotFoundPage = lazyPage(() => import('./Pages/NotFoundPage'))

const protect = (page: React.ReactNode) => <ProtectRoute>{page}</ProtectRoute>

function App() {
  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/donations/:id" element={<DonationPage />} />
          <Route path="/impact" element={<ImpactPage />} />
          <Route path="/tips" element={<TipsPage />} />
          <Route path="/people/:id" element={<ProfilePage />} />

          <Route path="/share" element={protect(<ShareFoodPage key="new" />)} />
          <Route path="/donations/:id/edit" element={protect(<ShareFoodPage key="edit" />)} />
          <Route path="/dashboard" element={protect(<DashboardPage />)} />
          <Route path="/pantry" element={protect(<PantryPage />)} />
          <Route path="/my-listings" element={protect(<MyListingsPage />)} />
          <Route path="/my-requests" element={protect(<MyRequestsPage />)} />
          <Route path="/account" element={protect(<AccountPage />)} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Addresses from the first version of the app. */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/signin" element={<Navigate to="/login" replace />} />
          <Route path="/signup" element={<Navigate to="/register" replace />} />
          <Route path="/create-donation" element={<Navigate to="/share" replace />} />
          <Route path="/donations" element={<Navigate to="/my-listings" replace />} />
          <Route path="/history" element={<Navigate to="/pantry" replace />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnHover={false}
        draggable
        limit={3}
      />
      <ScrollToTop />
    </>
  )
}

export default App
