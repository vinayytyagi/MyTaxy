import React, { useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserDataContext } from '../context/UserContext';
import { userLogout } from '../services/auth.service';
import { toast } from 'react-toastify';
const UserLogout = () => {
    const navigate = useNavigate();
    const { setUser } = useContext(UserDataContext);

    useEffect(() => {
        const performLogout = async () => {
            try {
                // First remove the token to prevent any API calls from other components
                localStorage.removeItem('token');
                setUser(null);
                
                // Then try to logout from the server
                await userLogout();
                toast.success('Logout successful');
                // Finally navigate to login
                navigate('/login');
            } catch (error) {
                console.error('Logout error:', error);
                // Still navigate to login even if logout fails
                toast.error('Logout failed. Please try again.');
                navigate('/login');
            }
        };

        performLogout();
    }, [navigate, setUser]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
};

export default UserLogout;