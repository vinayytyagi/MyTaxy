import React, { useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaptainDataContext } from '../context/CaptainContext';
import { captainLogout } from '../services/auth.service';
import { toast } from 'react-toastify';

const CaptainLogout = () => {
    const navigate = useNavigate();
    const { setCaptain } = useContext(CaptainDataContext);

    useEffect(() => {
        const performLogout = async () => {
            try {
                await captainLogout();
                setCaptain(null);
                toast.success('Logout successful');
                navigate('/captain-login');
            } catch (error) {
                console.error('Logout error:', error);
                toast.error('Logout failed. Please try again.');
                // Still navigate to login even if logout fails
                setCaptain(null);
                navigate('/captain-login');
            }
        };

        performLogout();
    }, [navigate, setCaptain]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
};

export default CaptainLogout; 