import React, { useRef,useState,useContext,useEffect } from 'react'
import { Link } from 'react-router-dom'
import CaptainDetails from '../../components/CaptainDetails'
import RidePopUp from '../../components/RidePopUp'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ConfirmRidePopUp from '../../components/ConfirmRidePopUp'
import AvailableRidesList from '../../components/AvailableRidesList'
import { CaptainDataContext } from '../context/CaptainContext'  
import { SocketContext } from '../context/SocketContext'
import axios from 'axios'
import LiveTracking from '../../components/LiveTracking'
import { getToken } from '../services/auth.service'

const CaptainHome = () => {
  const [ridePopupPanel, setRidePopupPanel] = useState(false);
  const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false);
  const [showAvailableRides, setShowAvailableRides] = useState(false);
  const [availableRides, setAvailableRides] = useState(() => {
    // Initialize from localStorage if available
    const savedRides = localStorage.getItem('availableRides');
    return savedRides ? JSON.parse(savedRides) : [];
  });
  const ridePopupPanelRef=useRef(null);
  const confirmRidePopupPanelRef=useRef(null);
const [ride, setRide] = useState(null);
  const { socket } = useContext(SocketContext);
  const { captain } = useContext(CaptainDataContext);

//   here we find the captain location and send it to the backend

  useEffect(() => {
    socket.emit('join', {
        userId: captain._id,
        userType: 'captain'
    })
    //this is used tp get curreent location continously
    const updateLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                console.log({ 
                    userId: captain._id,
                    location: {
                        ltd: position.coords.latitude,
                        lng: position.coords.longitude
                    }});
                socket.emit('update-location-captain', {
                    userId: captain._id,
                    location: {
                        ltd: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                })
            })
        }
    }

    const locationInterval = setInterval(updateLocation, 10000)
    updateLocation()

    return () => clearInterval(locationInterval)
}, [])

// Sync available rides with localStorage
useEffect(() => {
    localStorage.setItem('availableRides', JSON.stringify(availableRides));
}, [availableRides]);

// Fetch available rides on component mount
useEffect(() => {
    const fetchAvailableRides = async () => {
        try {
            const token = getToken('captain');
            if (!token) return;

            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/rides/available`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.rides) {
                setAvailableRides(response.data.rides);
            }
        } catch (error) {
            console.error('Error fetching available rides:', error);
        }
    };

    fetchAvailableRides();
}, []);

// Handle socket events
useEffect(() => {
    if (socket) {
        // Handle initial available rides when joining
        socket.on('available-rides', (rides) => {
            console.log('Received initial available rides:', rides);
            if (rides && rides.length > 0) {
                setAvailableRides(rides);
                localStorage.setItem('availableRides', JSON.stringify(rides));
                // Only show the panel if we're not currently on a ride
                if (!ride) {
                    setShowAvailableRides(true);
                }
            }
        });

        socket.on('new-ride', (data) => {
            console.log('New ride received:', data);
            setAvailableRides(prev => {
                const newRides = [...prev, data];
                localStorage.setItem('availableRides', JSON.stringify(newRides));
                return newRides;
            });
            // Only show the panel if we're not currently on a ride
            if (!ride) {
                setShowAvailableRides(true);
            }
        });

        socket.on('ride-no-longer-available', (data) => {
            console.log('Ride no longer available:', data);
            setAvailableRides(prev => {
                const updatedRides = prev.filter(ride => ride._id !== data.rideId);
                localStorage.setItem('availableRides', JSON.stringify(updatedRides));
                return updatedRides;
            });

            // If this was our current ride, reset the ride state
            if (data.rideId === ride?._id) {
                setRidePopupPanel(false);
                setRide(null);
            }

            // If we have no more available rides, hide the panel
            if (availableRides.length <= 1) {
                setShowAvailableRides(false);
            }
        });

        return () => {
            socket.off('available-rides');
            socket.off('new-ride');
            socket.off('ride-no-longer-available');
        };
    }
}, [socket, ride, availableRides]);

const handleAcceptRide = async (selectedRide) => {
    try {
        const token = getToken('captain');
        if (!token) {
            console.error('No captain token found');
            return;
        }

        // Set the ride data first
        setRide(selectedRide);
        setRidePopupPanel(false);
        setConfirmRidePopupPanel(true);

        const response = await axios.post(
            `${import.meta.env.VITE_BASE_URL}/rides/confirm`,
            {
                rideId: selectedRide._id,
                otp: selectedRide.otp || "000000"
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.status === 200) {
            // Emit ride-accepted event
            socket.emit('ride-accepted', { rideId: selectedRide._id });
            
            // Remove the accepted ride from available rides
            setAvailableRides(prev => {
                const updatedRides = prev.filter(ride => ride._id !== selectedRide._id);
                localStorage.setItem('availableRides', JSON.stringify(updatedRides));
                return updatedRides;
            });

            // Close the available rides panel
            setShowAvailableRides(false);
            
            // Update ride data with response data
            setRide(response.data);
        }
    } catch (error) {
        console.error('Error confirming ride:', error);
        // Reset ride data on error
        setRide(null);
        setConfirmRidePopupPanel(false);
    }
};

const handleRejectRide = (rideId) => {
    setAvailableRides(prev => {
        const updatedRides = prev.filter(ride => ride._id !== rideId);
        // Update localStorage
        localStorage.setItem('availableRides', JSON.stringify(updatedRides));
        return updatedRides;
    });
    if (availableRides.length === 1) {
        setShowAvailableRides(false);
    }
};

  useGSAP(()=>{
    if(ridePopupPanel){
        gsap.to(ridePopupPanelRef.current,{
            transform:'translateY(0)'
        })
    }else{
        gsap.to(ridePopupPanelRef.current,{
            transform:'translateY(100%)'
        })
    }
},[ridePopupPanel])

useGSAP(()=>{
    if(confirmRidePopupPanel){
        gsap.to(confirmRidePopupPanelRef.current,{
            transform:'translateY(0)'
        })
    }else{
        gsap.to(confirmRidePopupPanelRef.current,{
            transform:'translateY(100%)'
        })
    }
},[confirmRidePopupPanel])

  return (
    <div className='h-screen'>
        <div className='fixed p-4 top-0 flex items-center justify-between w-screen z-50'>
            <img className='w-16' src="https://cdn.worldvectorlogo.com/logos/uber-2.svg"/>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setShowAvailableRides(!showAvailableRides)}
                    className='h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md hover:bg-gray-100 transition-colors relative'
                >
                    <i className="text-xl ri-route-line"></i>
                    {availableRides.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {availableRides.length}
                        </span>
                    )}
                </button>
                <Link 
                    to='/captain-profile' 
                    className='h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md hover:bg-gray-100 transition-colors'
                >
                    <i className="text-xl ri-user-line"></i>
                </Link>
                <Link 
                    to='/captain/logout' 
                    className='h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md hover:bg-gray-100 transition-colors'
                >
                    <i className="text-xl ri-logout-box-r-line"></i>
                </Link>
            </div>
        </div>
        <div className='h-3/5'>
            <LiveTracking rideData={null} />
        </div>
        <div className='h-2/5 p-6'>
            <CaptainDetails/>
        </div>
        {showAvailableRides && (
            <AvailableRidesList 
                rides={availableRides}
                onAccept={handleAcceptRide}
                onReject={handleRejectRide}
            />
        )}
        <div ref={ridePopupPanelRef} className=' fixed w-full z-10 bottom-0 translate-y-full px-3 py-6 pt-12 bg-white'>
              <RidePopUp 
              ride={ride}
              setRidePopupPanel={setRidePopupPanel} 
              setConfirmRidePopupPanel={setConfirmRidePopupPanel}
              confirmRide={() => handleAcceptRide(ride)}
               />
        </div>
        <div ref={confirmRidePopupPanelRef} className=' fixed w-full z-10 h-screen bottom-0 translate-y-full px-3 py-6 pt-12 bg-white'>
              <ConfirmRidePopUp
                ride={ride}
               setConfirmRidePopupPanel={setConfirmRidePopupPanel} 
               setRidePopupPanel={setRidePopupPanel} />
        </div>
    </div>
  )
}

export default CaptainHome