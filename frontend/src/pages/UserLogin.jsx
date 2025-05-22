import React, { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserDataContext } from '../context/UserContext';
import { userLogin, setToken, userRegister } from '../services/auth.service';
import { toast } from 'react-toastify';
import axios from 'axios';

const UserLogin = () => {
    //we use this for data handling in react calle two way binding 

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // const [userData,setUserData]=useState({});

    const { setUser } = useContext(UserDataContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const data = await userLogin(email, password);
            if (data.token) {
                setToken(data.token, 'user');
            setUser(data.user);
            toast.success('Login successful');
            navigate('/home');
            } else {
                throw new Error('No token received from server');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please try again.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setError('');
        setIsLoading(true);

        try {
            // First try to login with test credentials
            const data = await userLogin('guestuser@gmail.com', 'guestuser');
            if (data.token) {
                setToken(data.token, 'user');
            setUser(data.user);
            toast.success('Guest login successful');
            navigate('/home');
            } else {
                throw new Error('No token received from server');
            }
        } catch (error) {
            // If login fails with 401, try to create the test account
            if (error.response?.status === 401) {
                try {
                    // Create test user account
                    const createResponse = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/register`, {
                        fullname: {
                            firstname: 'Guest',
                            lastname: 'User'
                        },
                        email: 'guestuser@gmail.com',
                        password: 'guestuser',
                        phone: '1234567890',
                        location: {
                            type: 'Point',
                            coordinates: [0, 0]
                        }
                    });

                    if (createResponse.status === 201) {
                        // Now try to login again
                        toast.info('Guest account created, logging in...');
                        const loginData = await userLogin('guestuser@gmail.com', 'guestuser');
                        if (loginData.token) {
                            setToken(loginData.token, 'user');
                            setUser(loginData.user);
                            toast.success('Logged in as guest user');
                            navigate('/home');
                        }
                    }
                } catch (createError) {
                    const errorMessage = createError.response?.data?.message || 'Failed to create guest account';
                    toast.error(errorMessage);
                    setError(errorMessage);
                }
            } else {
                const errorMessage = error.response?.data?.message || error.message || 'Guest login failed. Please try again.';
                toast.error(errorMessage);
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className='p-7 h-screen flex flex-col justify-between'>
       <div>
       <img className='w-16 mb-10' src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" alt="" />
        <form onSubmit={handleSubmit}>
            <h3 className='text-lg font-medium mb-2'>What's your email</h3>

            <input
             value={email}
                        onChange={(e) => setEmail(e.target.value)}
             required
             className='bg-[#eeeeee] mb-7 px-4 py-2 rounded border w-full text-lg placeholder:text-base'
             type="email" 
             placeholder='example@gmail.com'
                        disabled={isLoading}
                        autoComplete="email"
                    />

            <h3 className='text-lg font-medium mb-2'>Enter Password</h3>

            <input 
             value={password}
                        onChange={(e) => setPassword(e.target.value)}
            required 
            className='bg-[#eeeeee] mb-7 px-4 py-2 rounded border w-full text-lg placeholder:text-base'
            type="password"
            placeholder='password'
                        disabled={isLoading}
                        autoComplete="current-password"
                    />

            {error && (
                <div className="text-red-500 text-sm mb-4 text-center">
                    {error}
                </div>
            )}

            <button
            type="submit"
            className='bg-[#111] text-white font-semibold mb-3 px-4 py-2 rounded w-full text-lg placeholder:text-base disabled:opacity-50'
            disabled={isLoading}
            >
                {isLoading ? 'Logging in...' : 'Login'}
            </button>

            <button
            type="button"
            onClick={handleGuestLogin}
            className='bg-[#666] text-white font-semibold mb-3 px-4 py-2 rounded w-full text-lg placeholder:text-base disabled:opacity-50'
            disabled={isLoading}
            >
                {isLoading ? 'Logging in...' : 'Login as Guest User'}
            </button>

                    <p className='text-center'>New here? <Link to='/signup' className='text-blue-600'>Create new Account</Link></p>
        </form>
       </div>
       <div>
            <Link to='/captain-login'
                className='bg-[#10b461] flex items-center justify-center text-white font-semibold mb-7 px-4 py-2 rounded w-full text-lg placeholder:text-base'
            >Sign in as Captain</Link> 
       </div>
    </div>
  )
}

export default UserLogin