import React, { useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaptainDataContext } from '../context/CaptainContext';
import { captainLogout } from '../services/auth.service';
import { showToast } from '../components/CustomToast';
import Loader from '../components/Loader';

const CaptainLogout = () => {
    const navigate = useNavigate();
    const { setCaptain } = useContext(CaptainDataContext);

    useEffect(() => {
        const performLogout = async () => {
            try {
                await captainLogout();
                setCaptain(null);
                showToast.success('Logout successful');
                navigate('/captain-login');
            } catch (error) {
                console.error('Logout error:', error);
                showToast.error('Logout failed. Please try again.');
                // Still navigate to login even if logout fails
                setCaptain(null);
                navigate('/captain-login');
            }
        };

        performLogout();
    }, [navigate, setCaptain]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader />
        </div>
    );
};

export default CaptainLogout; 