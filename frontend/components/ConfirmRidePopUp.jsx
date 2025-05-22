import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../src/services/auth.service';

const ConfirmRidePopUp = (props) => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [rideData, setRideData] = useState(null);
    const navigate = useNavigate();
    
    useEffect(() => {
        if (props.ride) {
            setRideData(props.ride);
            console.log('Ride data received:', props.ride);
        }
    }, [props.ride]);
    
    const submitHandler = async (e) => {
        e.preventDefault();
        setError('');

        // Validate ride data
        if (!rideData || !rideData._id) {
            setError('Invalid ride data. Please try again.');
            return;
        }

        // Validate OTP
        if (!otp || otp.length < 4) {
            setError('Please enter a valid OTP');
            return;
        }

        try {
            const token = getToken('captain');
            if (!token) {
                setError('Authentication error. Please login again.');
                return;
            }

            console.log('Starting ride with data:', {
                rideId: rideData._id,
                otp: otp
            });

            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/start-ride`, {
                params: {
                    rideId: rideData._id,
                    otp: otp
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                props.setConfirmRidePopupPanel(false);
                props.setRidePopupPanel(false);
                navigate('/captain-riding', { state: { ride: rideData } });
            }
        } catch (error) {
            console.error('Error starting ride:', error);
            setError(error.response?.data?.message || 'Failed to start ride. Please try again.');
        }
    }

    // If no ride data, show error
    if (!rideData) {
        return (
            <div className="p-4 text-center">
                <p className="text-red-500">No ride data available</p>
                <button 
                    onClick={() => {
                        props.setConfirmRidePopupPanel(false);
                        props.setRidePopupPanel(false);
                    }}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg"
                >
                    Close
                </button>
            </div>
        );
    }

  return (
    <div>
        <h5 className='p-3 text-center w-[93%] absolute top-0' 
                onClick={() => {
                   props.setRidePopupPanel(false);
                }}
            >
                <i className="text-2xl text-gray-300 ri-arrow-down-wide-fill"></i>
            </h5>
        <h3 className='text-2xl font-semibold mb-5'>Confirm this ride to Start</h3>

        <div className='flex items-center justify-between bg-yellow-400 rounded-lg p-3'> 
                <div className='flex items-center justify-start gap-3'>
                    {rideData?.user?.profilePhoto ? (
                        <img 
                            className='h-12 w-12 rounded-full object-cover' 
                            src={rideData.user.profilePhoto} 
                            alt={`${rideData.user.fullname?.firstname || ''} ${rideData.user.fullname?.lastname || ''}`} 
                        />
                    ) : (
                        <div className='h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center text-lg font-bold text-gray-600'>
                            {rideData?.user?.fullname?.firstname?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                    <h4 className='text-lg font-medium'>
                        {rideData?.user?.fullname?.firstname || 'User'}
                    </h4>
                </div> 
                <h5 className='text-lg font-semibold'>
                    {rideData?.distance ? `${(rideData.distance).toFixed(1)} KM` : 'N/A'}
                </h5>
        </div>

        <div className='flex gap-2 justify-between flex-col items-center'>
            <div className='w-full mt-5'>
                <div className='flex items-center gap-5 px-1 py-3 border-b-2 border-gray-200'>
                    <i className="ri-map-pin-2-fill text-3xl"></i>
                    <div>
                        <h3 className='text-lg font-semibold'>Pickup</h3>
                            <p className='text-gray-600 -mt-1'>{rideData?.pickupAddress || 'N/A'}</p>
                    </div>
                </div>
                <div className='flex items-center gap-5 px-1 py-3 border-b-2 border-gray-200'>
                    <i className="ri-map-pin-2-fill text-3xl"></i>
                    <div>
                        <h3 className='text-lg font-semibold'>Destination</h3>
                            <p className='text-gray-600 -mt-1'>{rideData?.destinationAddress || 'N/A'}</p>
                    </div>
                </div>
                <div className='flex items-center gap-5 px-1 py-3'>
                    <i className="ri-currency-line text-3xl"></i>
                    <div>
                            <h3 className='text-lg font-semibold'>₹{rideData?.fare || '0'}</h3>
                        <p className='text-gray-600 -mt-1'>Cash</p>
                    </div>
                </div>
            </div>
           
           <div className='mt-6 w-full'>
                    <form onSubmit={submitHandler}>
                        {error && (
                            <div className="text-red-500 text-sm mb-2">
                                {error}
                            </div>
                        )}
                        <input 
                            value={otp} 
                            onChange={(e) => setOtp(e.target.value)} 
                            type="text" 
                            className='bg-[#eee] px-6 py-2 font-mono rounded-lg text-base w-full mt-5'  
                            placeholder='Enter OTP'
                            maxLength="6"
                            required
                        />
                        <button 
                            type="submit"
                            className='w-full flex justify-center mt-5 bg-green-600 text-white font-semibold p-2 rounded-lg'
                        >
                            Confirm
                        </button>
                        <button 
                            type="button"
                            onClick={() => {
                                props.setConfirmRidePopupPanel(false);
                                props.setRidePopupPanel(false);
                            }} 
                            className='w-full mt-1 bg-red-700 text-white font-semibold p-2 rounded-lg'
                        >
                            Cancel
                        </button>
               </form>
           </div>
        </div>
    </div>
    );
}

export default ConfirmRidePopUp;