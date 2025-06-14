import React, { useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserDataContext } from '../context/UserContext';
import { userLogout } from '../services/auth.service';
import { showToast } from '../components/CustomToast';
import Loader from '../components/Loader';

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
                showToast.success('Logout successful');
                // Finally navigate to login
                navigate('/login');
            } catch (error) {
                console.error('Logout error:', error);
                // Still navigate to login even if logout fails
                showToast.error('Logout failed. Please try again.');
                navigate('/login');
            }
        };

        performLogout();
    }, [navigate, setUser]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader />
        </div>
    );
};

export default UserLogout;