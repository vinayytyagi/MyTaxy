import React, { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { CaptainDataContext } from '../context/CaptainContext';
import { captainLogin, setToken } from '../services/auth.service';
import { toast } from 'react-toastify';
import axios from 'axios';

const CaptainLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { setCaptain } = useContext(CaptainDataContext);
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
    
        try {
            const data = await captainLogin(email, password);
            console.log('Login response:', data); // Debug log
            if (data.token) {
                setToken(data.token, 'captain');
                console.log('Setting captain data after login:', data.captain); // Debug log
                setCaptain(data.captain);
                toast.success('Logged in successfully');
                navigate('/captain-home');
            } else {
                throw new Error('No token received from server');
            }
        } catch (error) {
            console.error('Login error:', error.response?.data); // Debug log
            const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
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
            const data = await captainLogin('testcaptain@gmail.com', 'testcaptain');
            console.log('Guest login response:', data); // Debug log
            if (data.token) {
                setToken(data.token, 'captain');
                console.log('Setting captain data after guest login:', data.captain); // Debug log
                setCaptain(data.captain);
                toast.success('Guest login successful');
                navigate('/captain-home');
            } else {
                throw new Error('No token received from server');
            }
        } catch (error) {
            console.error('Guest login error:', error.response?.data); // Debug log
            // If login fails with 401, try to create the test account
            if (error.response?.status === 401) {
                try {
                    // Create test captain account
                    const createResponse = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/register`, {
                        fullname: {
                            firstname: 'Test',
                            lastname: 'Captain'
                        },
                        email: 'testcaptain@gmail.com',
                        password: 'testcaptain',
                        vehicle: {
                            color: 'Black',
                            plate: 'TEST123',
                            capacity: 4,
                            vehicleType: 'car'
                        }
                    });

                    if (createResponse.status === 201) {
                        // Now try to login again
                        toast.info('Guest captain account created, logging in...');
                        const loginData = await captainLogin('testcaptain@gmail.com', 'testcaptain');
                        if (loginData.token) {
                            setToken(loginData.token, 'captain');
                            setCaptain(loginData.captain);
                            toast.success('Logged in as guest captain');
                            navigate('/captain-home');
                        }
                    }
                } catch (createError) {
                    const errorMessage = createError.response?.data?.message || 'Failed to create guest captain account';
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
       <img className='w-16 mb-10' src="https://www.svgrepo.com/show/505031/uber-driver.svg" alt="" />
                <form onSubmit={submitHandler}>
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
                        {isLoading ? 'Logging in...' : 'Login as Guest Captain'}
                    </button>

                    <p className='text-center'>Join a fleet? <Link to='/captain-signup' className='text-blue-600'>Register as a Captain</Link></p>
        </form>
       </div>
       <div>
            <Link to='/login'
                className='bg-[#d5622d] flex items-center justify-center text-white font-semibold mb-7 px-4 py-2 rounded w-full text-lg placeholder:text-base'
            >Sign in as User</Link> 
       </div>
    </div>
  )
}

export default CaptainLogin