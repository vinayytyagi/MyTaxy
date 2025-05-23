import React, { useContext } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import UserLogin from './pages/UserLogin'
import UserSignup from './pages/UserSignup'
import CaptainSignup from './pages/CaptainSignup'
import CaptainLogin from './pages/CaptainLogin'
import { LoadScript } from '@react-google-maps/api'
import Home from './pages/Home'
import UserProtectedWrapper from './pages/UserProtectedWrapper'
import UserLogout from './pages/UserLogout'
import CaptainHome from './pages/CaptainHome'
import CaptainProtectWrapper from './pages/CaptainProtectWrapper'
import CaptainLogout from './pages/CaptainLogout'
import Riding from './pages/Riding'
import CaptainRiding from './pages/CaptainRiding'
import UserProfile from './pages/UserProfile'
import Profile from './pages/Profile'
import CaptainProfile from './pages/CaptainProfile'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { UserDataContext } from './context/UserContext'
import { getToken } from './services/auth.service'

const libraries = ['places', 'geometry']

const App = () => {
  const { user } = useContext(UserDataContext)
  const userToken = getToken('user')
  const captainToken = getToken('captain')

  return (
    <LoadScript 
    googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
      loadingElement={<div>Loading...</div>}
      onError={(error) => console.error('Error loading Google Maps:', error)}
    >
      <div>
      <ToastContainer position="top-center" autoClose={3000} />
        <Routes>
            <Route path='/' element={userToken ? <Navigate to="/home" /> : <UserLogin />}/>
            <Route path='/login' element={<UserLogin/>}/>
            <Route path='/signup' element={<UserSignup/>}/>
            <Route path='/captain-login' element={<CaptainLogin/>}/>
            <Route path='/captain-signup' element={<CaptainSignup/>}/>
            <Route path='/riding' element={<Riding/>} />
            <Route path='/captain-riding' element={<CaptainRiding/>}/>
            
            {/* Protected Routes */}
            <Route path='/home' element={
              <UserProtectedWrapper>
                <Home/>
              </UserProtectedWrapper>
            } />
            <Route path='/user/logout' element={
              <UserProtectedWrapper>
                <UserLogout/>
              </UserProtectedWrapper>
            } />
            <Route path='/user/profile' element={
              <UserProtectedWrapper>
                <UserProfile/>
              </UserProtectedWrapper>
            } />
            <Route path='/profile' element={
              <UserProtectedWrapper>
                <Profile />
              </UserProtectedWrapper>
            } />
            <Route path='/captain-home' element={
              <CaptainProtectWrapper>
                <CaptainHome/>
              </CaptainProtectWrapper>
            }/>
            <Route path='/captain/logout' element={
              <CaptainProtectWrapper>
                <CaptainLogout/>
              </CaptainProtectWrapper>
            }/>
            <Route path='/captain-profile' element={
              <CaptainProtectWrapper>
                <CaptainProfile/>
              </CaptainProtectWrapper>
            }/>
        </Routes>
      </div>
    </LoadScript>
  )
}

export default App
