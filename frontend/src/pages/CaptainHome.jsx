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
import myTaxyLogo from '../assets/MyTaxy.png'

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
            transform:'translateY(0)',
            duration: 0.5,
            ease: "power3.out"
        })
    }else{
        gsap.to(ridePopupPanelRef.current,{
            transform:'translateY(100%)',
            duration: 0.4,
            ease: "power2.in"
        })
    }
},[ridePopupPanel])

useGSAP(()=>{
    if(confirmRidePopupPanel){
        gsap.to(confirmRidePopupPanelRef.current,{
            transform:'translateY(0)',
            duration: 0.5,
            ease: "power3.out"
        })
    }else{
        gsap.to(confirmRidePopupPanelRef.current,{
            transform:'translateY(100%)',
            duration: 0.4,
            ease: "power2.in"
        })
    }
},[confirmRidePopupPanel])

  return (
    <div className="relative h-screen w-full">
      <div className='h-screen relative overflow-hidden bg-gray-50'>
        {/* Header with blur effect */}
        <div className='fixed px-6 py-2 top-0 flex items-center justify-between w-screen z-50 bg-white/10 backdrop-blur-xs shadow-sm'>
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => window.location.reload()}
          >
            <img className='w-12 h-12' src={myTaxyLogo} alt="MyTaxy Captain"/>
            <span className="text-2xl font-bold text-gray-900">MyTaxy</span>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowAvailableRides(!showAvailableRides)}
              className='h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md hover:bg-gray-50 transition-colors text-gray-700 cursor-pointer relative'
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
              className='h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md hover:bg-gray-50 transition-colors text-gray-700 cursor-pointer'
            >
              <i className="text-xl ri-user-line"></i>
            </Link>
            <Link 
              to='/captain/logout' 
              className='h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md hover:bg-gray-50 transition-colors text-gray-700 cursor-pointer'
            >
              <i className="text-xl ri-logout-box-r-line"></i>
            </Link>
          </div>
        </div>

        {/* Full screen map */}
        <div className='h-full w-full fixed top-0 left-0 z-0'>
          <LiveTracking rideData={null} />
        </div>

        {/* Stats Section */}
        <div className='absolute bottom-0 inset-x-0 z-10 max-w-2xl mx-auto md:max-w-2xl md:mx-auto shadow-lg rounded-t-3xl overflow-hidden'>
          <div className='p-6 bg-white'>
            <CaptainDetails/>
          </div>
        </div>

        {/* Available Rides Panel */}
        {showAvailableRides && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40">
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white/80 backdrop-blur-sm p-4 border-b flex justify-between items-center rounded-t-3xl z-50">
                <h2 className="text-xl font-semibold text-gray-800">Available Rides</h2>
                <button 
                  onClick={() => setShowAvailableRides(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              <AvailableRidesList 
                rides={availableRides}
                onAccept={handleAcceptRide}
                onReject={handleRejectRide}
              />
            </div>
          </div>
        )}

        {/* Ride Popup Panel */}
        <div ref={ridePopupPanelRef} className='fixed w-full z-50 bottom-0 translate-y-full bg-white rounded-t-3xl shadow-lg px-6 py-8 md:max-w-2xl md:left-1/2 md:-translate-x-1/2'>
          <RidePopUp 
            ride={ride}
            setRidePopupPanel={setRidePopupPanel} 
            setConfirmRidePopupPanel={setConfirmRidePopupPanel}
            confirmRide={() => handleAcceptRide(ride)}
          />
        </div>

        {/* Confirm Ride Popup Panel */}
        <div ref={confirmRidePopupPanelRef} className='fixed w-full z-50 h-screen bottom-0 translate-y-full bg-white rounded-t-3xl shadow-lg px-6 py-8 md:max-w-2xl md:left-1/2 md:-translate-x-1/2'>
          <ConfirmRidePopUp
            ride={ride}
            setConfirmRidePopupPanel={setConfirmRidePopupPanel} 
            setRidePopupPanel={setRidePopupPanel} 
          />
        </div>
      </div>
    </div>
  )
}

export default CaptainHome