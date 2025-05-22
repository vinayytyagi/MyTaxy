import { useGSAP } from '@gsap/react';
import axios from 'axios';
import gsap from 'gsap';
import React, { useRef, useState,useContext,useEffect } from 'react'
import 'remixicon/fonts/remixicon.css'
import LocationSearchPanel from '../../components/LocationSearchPanel';
import VehiclePanel from '../../components/VehiclePanel';
import ConfirmRide from '../../components/ConfirmRide';
import LookingForDriver from '../../components/LookingForDriver';
import WaitingForDriver from '../../components/WaitingForDriver';
import { SocketContext } from '../context/SocketContext';
import { UserDataContext } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import LiveTracking from '../../components/LiveTracking';
import { GoogleMap, Marker, Circle } from '@react-google-maps/api';
import { getToken } from '../services/auth.service';
import myTaxyLogo from '../assets/MyTaxy.png';

const Home = () => {

    const [ pickup, setPickup ] = useState('')
    const [ destination, setDestination ] = useState('')
    const [ panelOpen, setPanelOpen ] = useState(false)
    const [userLocation, setUserLocation] = useState({ lat: 28.6139, lng: 77.2090 }); // Default location
    const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 }); // Default center
    const mapRef = useRef(null);
    const vehiclePanelRef = useRef(null)
    const confirmRidePanelRef = useRef(null)
    const vehicleFoundRef = useRef(null)
    const waitingForDriverRef = useRef(null)
    const panelRef = useRef(null)
    const panelCloseRef = useRef(null)
    const pickupInputRef = useRef(null)
    const destinationInputRef = useRef(null)
    const [ vehiclePanel, setVehiclePanel ] = useState(false)
    const [ confirmRidePanel, setConfirmRidePanel ] = useState(false)
    const [ vehicleFound, setVehicleFound ] = useState(false)
    const [ waitingForDriver, setWaitingForDriver ] = useState(false)
    const [ pickupSuggestions, setPickupSuggestions ] = useState([])
    const [ destinationSuggestions, setDestinationSuggestions ] = useState([])
    const [ activeField, setActiveField ] = useState(null)
    const [ fare, setFare ] = useState({})
    const [ vehicleType, setVehicleType ] = useState(null)
    const [ ride, setRide ] = useState(null)
    const [currentRide, setCurrentRide] = useState(null);
    const [showLiveTracking, setShowLiveTracking] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isLoadingPickup, setIsLoadingPickup] = useState(false);
    const [isLoadingDestination, setIsLoadingDestination] = useState(false);
    const [pickupLocationSet, setPickupLocationSet] = useState(false);
    const [destinationLocationSet, setDestinationLocationSet] = useState(false);

    const navigate = useNavigate()

    const { socket } = useContext(SocketContext)
    const { user } = useContext(UserDataContext)

    useEffect(() => {
        socket.emit("join", { userType: "user", userId: user._id })

        socket.on('ride-confirmed', ride => {
            setVehicleFound(false)
            setWaitingForDriver(true)
            setRide(ride)
        })

        socket.on('ride-started', ride => {
            console.log("ride")
            setWaitingForDriver(false)
            navigate('/riding', { state: { ride } })
        })

        socket.on('ride-completed', () => {
            setVehicleFound(false)
            setWaitingForDriver(false)
            setConfirmRidePanel(false)
            setVehiclePanel(false)
            setPanelOpen(false)
            navigate('/')
        })

        // Add handler for automatic ride cancellation
        socket.on('ride-cancelled', (data) => {
            console.log('Ride cancelled:', data);
            setVehicleFound(false)
            setWaitingForDriver(false)
            setConfirmRidePanel(false)
            setVehiclePanel(false)
            setPanelOpen(false)
            // Show notification to user
            alert('Your ride was cancelled because no captain was found within the time limit. Please try again.');
        })

        return () => {
            socket.off('ride-confirmed')
            socket.off('ride-started')
            socket.off('ride-completed')
            socket.off('ride-cancelled')
        }
    }, [user, socket, navigate])

    //this for handlingig=ng pikups
    const handlePickupChange = async (e) => {
        const value = e.target.value;
        setPickup(value);
        setPickupLocationSet(false);
        
        if (!value.trim()) {
            setPickupSuggestions([]);
            return;
        }
        
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
                params: { input: value },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            setPickupSuggestions(response.data)
        } catch {
            // handle error
        }
    }
    const handleDestinationChange = async (e) => {
        const value = e.target.value;
        setDestination(value);
        setDestinationLocationSet(false);
        
        if (!value.trim()) {
            setDestinationSuggestions([]);
            return;
        }
        
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
                params: { input: value },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            setDestinationSuggestions(response.data)
        } catch {
            // handle error
        }
    }

    const submitHandler=(e)=>{
        e.preventDefault();
    }

    useGSAP(function () {
        if (vehiclePanel) {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ vehiclePanel ])

    useGSAP(function () {
        if (confirmRidePanel) {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(0)',
                display: 'block'
            })
        } else {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ confirmRidePanel ])

    useGSAP(function () {
        if (vehicleFound) {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(0)',
                display: 'block'
            })
        } else {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ vehicleFound ])

    useGSAP(function () {
        if (waitingForDriver) {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ waitingForDriver ])

    // Add GSAP animation for location search panel
    useGSAP(function () {
        if (panelOpen) {
            gsap.to(panelRef.current, {
                y: 0,
                duration: 0.5,
                ease: "power3.out"
            })
        } else {
            gsap.to(panelRef.current, {
                y: "100%",
                duration: 0.4,
                ease: "power2.in"
            })
        }
    }, [ panelOpen ])

    // Add effect to focus input when panel opens
    useEffect(() => {
        if (panelOpen && activeField === 'pickup' && pickupInputRef.current) {
            pickupInputRef.current.focus();
        } else if (panelOpen && activeField === 'destination' && destinationInputRef.current) {
            destinationInputRef.current.focus();
        }
    }, [panelOpen, activeField]);

    async function findTrip() {
        setVehiclePanel(true)
        setPanelOpen(false)

        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
            params: { pickup, destination },
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })
        // console.log(response.data);
        setFare(response.data)

    }

    async function createRide() {
        setConfirmRidePanel(false)
        
        // First check if there's an active ride and cancel it
        try {
            const token = getToken('user');
            if (currentRide?._id) {
                await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/cancel/${currentRide._id}`, {}, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setCurrentRide(null);
                setShowLiveTracking(false);
            }
        } catch (error) {
            console.error("Error canceling previous ride:", error);
        }
        
        // Then show looking for driver panel
        setVehicleFound(true)
        const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/create`, {
            pickup,
            destination,
            vehicleType
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })
        console.log(response.data);
    }

    // Add cleanup function to cancel ride when component unmounts
    useEffect(() => {
        const cleanupRide = async () => {
            try {
                const token = getToken('user');
                if (currentRide?._id) {
                    await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/update-status`, {
                        rideId: currentRide._id,
                        status: 'cancelled'
                    }, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    console.log("Ride cancelled due to page leave/refresh");
                }
            } catch (error) {
                console.error("Error cancelling ride during cleanup:", error);
            }
        };

        // Handle page refresh/close
        window.addEventListener('beforeunload', cleanupRide);

        // Handle component unmount
        return () => {
            window.removeEventListener('beforeunload', cleanupRide);
            cleanupRide();
        };
    }, [currentRide]);

    // Modify the fetchActiveRide function to handle accepted rides
    useEffect(() => {
        const fetchActiveRide = async () => {
            try {
                const token = getToken('user');
                if (!token || !user?._id) {
                    console.log("No user token or ID found, skipping active ride fetch");
                    return;
                }

                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/active`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data && response.data.ride) {
                    const ride = response.data.ride;
                    
                    // Check if the ride is in a valid state
                    if (ride.status === 'cancelled' || ride.status === 'completed') {
                        console.log("Ride is already cancelled or completed");
                        return;
                    }

                    // If ride is accepted but user is on homepage, update its status
                    if (ride.status === 'accepted') {
                        try {
                            await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/update-status`, {
                                rideId: ride._id,
                                status: 'cancelled'
                            }, {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            });
                            console.log("Cancelled accepted ride found on homepage");
                            return;
                        } catch (error) {
                            console.error("Error cancelling accepted ride:", error);
                        }
                    }
                    
                    // Rest of the existing ride processing code...
                    const pickupCoords = ride.pickup.split(',');
                    const destinationCoords = ride.destination.split(',');
                    
                    if (pickupCoords.length === 2 && destinationCoords.length === 2) {
                        const pickupLat = parseFloat(pickupCoords[0]);
                        const pickupLng = parseFloat(pickupCoords[1]);
                        const destLat = parseFloat(destinationCoords[0]);
                        const destLng = parseFloat(destinationCoords[1]);
                        
                        if (!isNaN(pickupLat) && !isNaN(pickupLng) && 
                            !isNaN(destLat) && !isNaN(destLng)) {
                            
                            setCurrentRide({
                                _id: ride._id,
                                pickup: {
                                    lat: pickupLat,
                                    lng: pickupLng,
                                    address: ride.pickupAddress
                                },
                                destination: {
                                    lat: destLat,
                                    lng: destLng,
                                    address: ride.destinationAddress
                                }
                            });
                            setShowLiveTracking(true);
                        } else {
                            console.error("Invalid coordinates in ride data:", ride);
                        }
                    } else {
                        // If coordinates are not in the correct format, try to get them from the addresses
                        const getCoordinates = async () => {
                            try {
                                // Use backend service to get coordinates
                                const pickupResponse = await axios.get(
                                    `${import.meta.env.VITE_BASE_URL}/maps/get-coordinates`, {
                                        params: { address: ride.pickup },
                                        headers: {
                                            Authorization: `Bearer ${token}`
                                        }
                                    }
                                );
                                const destResponse = await axios.get(
                                    `${import.meta.env.VITE_BASE_URL}/maps/get-coordinates`, {
                                        params: { address: ride.destination },
                                        headers: {
                                            Authorization: `Bearer ${token}`
                                        }
                                    }
                                );

                                if (pickupResponse.data && destResponse.data) {
                                    setCurrentRide({
                                        _id: ride._id,
                                        pickup: {
                                            lat: pickupResponse.data.ltd,
                                            lng: pickupResponse.data.lng,
                                            address: ride.pickup
                                        },
                                        destination: {
                                            lat: destResponse.data.ltd,
                                            lng: destResponse.data.lng,
                                            address: ride.destination
                                        }
                                    });
                                    setShowLiveTracking(true);
                                } else {
                                    console.error("Could not geocode addresses:", ride);
                                }
                            } catch (error) {
                                console.error("Error geocoding addresses:", error);
                            }
                        };

                        getCoordinates();
                    }
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    console.log("No active ride found");
                } else {
                    console.error("Error fetching active ride:", error);
                }
            }
        };

        fetchActiveRide();
    }, [user]);

    // Listen for ride status updates
    useEffect(() => {
        if (socket && currentRide?._id) {
            socket.on(`ride-status:${currentRide._id}`, (status) => {
                if (status === 'completed' || status === 'cancelled') {
                    setShowLiveTracking(false);
                    setCurrentRide(null);
                }
            });
            
            // Join the ride room for updates
            socket.emit('join-ride', { rideId: currentRide._id });
        }
        
        return () => {
            if (socket && currentRide?._id) {
                socket.off(`ride-status:${currentRide._id}`);
            }
        };
    }, [socket, currentRide]);

    // Add useEffect for getting user's location
    useEffect(() => {
        const getUserLocation = () => {
            if (navigator.geolocation) {
                const options = {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                };

                const successCallback = (position) => {
                        const { latitude, longitude } = position.coords;
                        setUserLocation({ lat: latitude, lng: longitude });
                        setMapCenter({ lat: latitude, lng: longitude });
                };

                const errorCallback = (error) => {
                        console.error("Error getting user location:", error);
                    
                    // Handle different error cases
                    switch (error.code) {
                        case 1: // PERMISSION_DENIED
                            alert("Please enable location access to get accurate ride information. Using default location for now.");
                            setUserLocation({ lat: 28.6139, lng: 77.2090 }); // Default to Delhi
                            setMapCenter({ lat: 28.6139, lng: 77.2090 });
                            break;
                        case 2: // POSITION_UNAVAILABLE
                            alert("Location information is unavailable. Using default location.");
                            setUserLocation({ lat: 28.6139, lng: 77.2090 });
                            setMapCenter({ lat: 28.6139, lng: 77.2090 });
                            break;
                        case 3: // TIMEOUT
                            alert("Location request timed out. Using default location.");
                            setUserLocation({ lat: 28.6139, lng: 77.2090 });
                            setMapCenter({ lat: 28.6139, lng: 77.2090 });
                            break;
                        default:
                            alert("An unknown error occurred. Using default location.");
                            setUserLocation({ lat: 28.6139, lng: 77.2090 });
                            setMapCenter({ lat: 28.6139, lng: 77.2090 });
                    }
                };

                // Try to get location
                navigator.geolocation.getCurrentPosition(
                    successCallback,
                    errorCallback,
                    options
                );
            } else {
                alert("Geolocation is not supported by your browser. So, We're using default location.");
                setUserLocation({ lat: 28.6139, lng: 77.2090 });
                setMapCenter({ lat: 28.6139, lng: 77.2090 });
            }
        };

        getUserLocation();
    }, []);

    const handleMyLocationClick = async (field) => {
        if (field === 'pickup') {
            setIsLoadingPickup(true);
        } else {
            setIsLoadingDestination(true);
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        // First try to get address from Google Maps Geocoder
                        const geocoder = new window.google.maps.Geocoder();
                        geocoder.geocode(
                            { location: { lat: latitude, lng: longitude } },
                            async (results, status) => {
                                if (status === 'OK' && results[0]) {
                                    const address = results[0].formatted_address;
                                    if (field === 'pickup') {
                                        setPickup(address);
                                        setPickupSuggestions([]);
                                        setPickupLocationSet(true);
                                    } else {
                                        setDestination(address);
                                        setDestinationSuggestions([]);
                                        setDestinationLocationSet(true);
                                    }
                                    
                                    // Only close panel if pickup is set and we're setting pickup
                                    if (field === 'pickup' && destination) {
                                        setPanelOpen(false);
                                        setVehiclePanel(true);
                                    }
                                } else {
                                    // Fallback to backend if Google Geocoder fails
                                    const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/reverse-geocode`, {
                                        params: { 
                                            lat: latitude,
                                            lng: longitude
                                        },
                                        headers: {
                                            Authorization: `Bearer ${localStorage.getItem('token')}`
                                        }
                                    });
                                    
                                    if (field === 'pickup') {
                                        setPickup(response.data);
                                        setPickupSuggestions([]);
                                        setPickupLocationSet(true);
                                    } else {
                                        setDestination(response.data);
                                        setDestinationSuggestions([]);
                                        setDestinationLocationSet(true);
                                    }
                                    
                                    // Only close panel if pickup is set and we're setting pickup
                                    if (field === 'pickup' && destination) {
                                        setPanelOpen(false);
                                        setVehiclePanel(true);
                                    }
                                }
                            }
                        );
                    } catch (error) {
                        console.error('Error getting address:', error);
                        alert('Unable to get your address. Please try again.');
                    } finally {
                        if (field === 'pickup') {
                            setIsLoadingPickup(false);
                        } else {
                            setIsLoadingDestination(false);
                        }
                    }
                },
                (error) => {
                    console.error('Error getting location:', error);
                    alert('Unable to get your location. Please check your location settings.');
                    if (field === 'pickup') {
                        setIsLoadingPickup(false);
                    } else {
                        setIsLoadingDestination(false);
                    }
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
            if (field === 'pickup') {
                setIsLoadingPickup(false);
            } else {
                setIsLoadingDestination(false);
            }
        }
    };

    const handleClearInput = (field) => {
        if (field === 'pickup') {
            setPickup('');
            setPickupLocationSet(false);
            setPickupSuggestions([]);
            pickupInputRef.current?.focus();
        } else {
            setDestination('');
            setDestinationLocationSet(false);
            setDestinationSuggestions([]);
            destinationInputRef.current?.focus();
        }
    };

    return (
        <div className="relative h-screen w-full">
            <div className='h-screen relative overflow-hidden bg-gray-50'>
                <div className='fixed px-6 py-2 top-0 flex items-center justify-between w-screen z-50 bg-white/10 backdrop-blur-xs shadow-sm'>
                    <div 
                        className="flex items-center gap-2 cursor-pointer" 
                        onClick={() => window.location.reload()}
                    >
                        <img className='w-12 h-12' src={myTaxyLogo} alt="MyTaxy Logo"/>
                        <span className="text-2xl font-bold text-gray-900">MyTaxy</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link 
                            to='/user/profile' 
                            className='h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md hover:bg-gray-50 transition-colors text-gray-700 cursor-pointer'
                        >
                            <i className="text-xl ri-user-line"></i>
                        </Link>
                        <Link 
                            to='/user/logout' 
                            className='h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md hover:bg-gray-50 transition-colors text-gray-700 cursor-pointer'
                        >
                            <i className="text-xl ri-logout-box-r-line"></i>
                        </Link>
                    </div>
                </div>

                {/* Show live tracking if there's an active ride */}
                {showLiveTracking && currentRide && (
                    <div className="fixed inset-0 z-30 bg-white">
                        <div className="h-full">
                            <LiveTracking rideData={currentRide} />
                        </div>
                        <button 
                            onClick={() => setShowLiveTracking(false)}
                            className="fixed z-40 bottom-4 right-4 bg-gray-100 text-gray-600 p-4 rounded-full shadow-lg hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                            <i className="ri-arrow-down-line"></i>
                        </button>
                    </div>
                )}

                {/* Full screen map */}
                <div className='h-full w-full fixed top-0 left-0 z-0'>
                     <LiveTracking rideData={null} />
                </div>

                {/* Default view when panel is closed */}
                {!panelOpen && (
                    <div className='absolute bottom-0 inset-x-0 z-10 max-w-2xl mx-auto md:max-w-2xl md:mx-auto shadow-lg rounded-t-3xl overflow-hidden'>
                        <div className='p-6 bg-white'>
                             <h4 className='text-2xl font-semibold mb-4 text-gray-800'>Find a trip</h4>
                        <form className='relative py-3' onSubmit={(e) => {
                            submitHandler(e)
                        }}>
                                <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-[#fdc700] rounded-full z-10"></div>
                                <div className="relative">
                            <input
                                        ref={pickupInputRef}
                                onClick={() => {
                                    setPanelOpen(true)
                                    setActiveField('pickup')
                                }}
                                value={pickup}
                                onChange={handlePickupChange}
                                        className='bg-gray-50 px-12 py-3 text-lg rounded-xl w-full border border-gray-200 focus:border-[#fdc700] focus:ring-2 focus:ring-[#fdc700]/20 outline-none transition-all shadow-sm'
                                type="text"
                                placeholder='Add a pick-up location'
                            />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (pickup) {
                                                handleClearInput('pickup');
                                            } else {
                                                handleMyLocationClick('pickup');
                                            }
                                        }}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${pickupLocationSet && !pickup ? 'text-gray-400' : pickup ? 'text-gray-500 hover:text-gray-600' : 'text-gray-500 hover:text-[#fdc700]'} transition-colors cursor-pointer`}
                                        disabled={isLoadingPickup}
                                    >
                                        {isLoadingPickup ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
                                        ) : pickup ? (
                                            <i className="ri-close-circle-line text-xl"></i>
                                        ) : (
                                            <i className="ri-crosshair-2-line"></i>
                                        )}
                                    </button>
                                </div>
                                <div className="relative mt-3">
                            <input
                                        ref={destinationInputRef}
                                onClick={() => {
                                    setPanelOpen(true)
                                    setActiveField('destination')
                                }}
                                value={destination}
                                onChange={handleDestinationChange}
                                        className='bg-gray-50 px-12 py-3 text-lg rounded-xl w-full border border-gray-200 focus:border-[#fdc700] focus:ring-2 focus:ring-[#fdc700]/20 outline-none transition-all shadow-sm'
                                type="text"
                                        placeholder='Enter your destination'
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (destination) {
                                                handleClearInput('destination');
                                            } else {
                                                handleMyLocationClick('destination');
                                            }
                                        }}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${destinationLocationSet && !destination ? 'text-gray-400' : destination ? 'text-gray-500 hover:text-gray-600' : 'text-gray-500 hover:text-[#fdc700]'} transition-colors cursor-pointer`}
                                        disabled={isLoadingDestination}
                                    >
                                        {isLoadingDestination ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
                                        ) : destination ? (
                                            <i className="ri-close-circle-line text-xl"></i>
                                        ) : (
                                            <i className="ri-crosshair-2-line"></i>
                                        )}
                                    </button>
                                </div>
                        </form>
                        <button
                            onClick={findTrip}
                                disabled={!pickup || !destination}
                                className={`bg-[#fdc700] text-gray-800 font-semibold px-4 py-3 rounded-xl mt-4 w-full transition-all shadow-sm ${
                                    !pickup || !destination 
                                        ? 'opacity-50 cursor-not-allowed' 
                                        : 'hover:bg-[#fdc700]/90 hover:shadow-md active:scale-[0.98]'
                                }`}>
                            Find Trip
                        </button>
                        </div>
                    </div>
                )}

                {/* Location Search Panel - Controlled by panelOpen state */}
                {panelOpen && (
                    <div ref={panelRef} className='bg-white h-[calc(100%-80px)] fixed inset-x-0 top-[80px] z-50 shadow-lg rounded-t-3xl overflow-y-auto transform translate-y-full max-w-2xl mx-auto md:max-w-2xl md:mx-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
                        <div className="sticky top-0 bg-white/80 backdrop-blur-sm p-4 border-b flex justify-between items-center rounded-t-3xl z-50">
                            <h4 className="text-lg font-semibold text-gray-800">Select locations</h4>
                            <button 
                                onClick={() => setPanelOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                            >
                                <i className="ri-close-line text-xl"></i>
                            </button>
                        </div>
                        <div className='p-6'>
                            <h4 className='text-2xl font-semibold mb-4 text-gray-800'>Find a trip</h4>
                            <form className='relative py-3' onSubmit={(e) => {
                                submitHandler(e)
                            }}>
                                <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-[#fdc700] rounded-full z-10"></div>
                                <div className="relative">
                                    <input
                                        ref={pickupInputRef}
                                        onClick={() => {
                                            setActiveField('pickup')
                                        }}
                                        value={pickup}
                                        onChange={handlePickupChange}
                                        className='bg-gray-50 px-12 py-3 text-lg rounded-lg w-full border border-gray-200 focus:border-[#fdc700] focus:ring-2 focus:ring-[#fdc700]/20 outline-none transition-all'
                                        type="text"
                                        placeholder='Add a pick-up location'
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (pickup) {
                                                handleClearInput('pickup');
                                            } else {
                                                handleMyLocationClick('pickup');
                                            }
                                        }}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${pickupLocationSet && !pickup ? 'text-gray-400' : pickup ? 'text-gray-500 hover:text-gray-600' : 'text-gray-500 hover:text-[#fdc700]'} transition-colors cursor-pointer`}
                                        disabled={isLoadingPickup}
                                    >
                                        {isLoadingPickup ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
                                        ) : pickup ? (
                                            <i className="ri-close-circle-line text-xl"></i>
                                        ) : (
                                            <i className="ri-crosshair-2-line"></i>
                                        )}
                                    </button>
                                </div>
                                <div className="relative mt-3">
                                    <input
                                        ref={destinationInputRef}
                                        onClick={() => {
                                            setActiveField('destination')
                                        }}
                                        value={destination}
                                        onChange={handleDestinationChange}
                                        className='bg-gray-50 px-12 py-3 text-lg rounded-lg w-full border border-gray-200 focus:border-[#fdc700] focus:ring-2 focus:ring-[#fdc700]/20 outline-none transition-all'
                                        type="text"
                                        placeholder='Enter your destination'
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (destination) {
                                                handleClearInput('destination');
                                            } else {
                                                handleMyLocationClick('destination');
                                            }
                                        }}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${destinationLocationSet && !destination ? 'text-gray-400' : destination ? 'text-gray-500 hover:text-gray-600' : 'text-gray-500 hover:text-[#fdc700]'} transition-colors cursor-pointer`}
                                        disabled={isLoadingDestination}
                                    >
                                        {isLoadingDestination ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
                                        ) : destination ? (
                                            <i className="ri-close-circle-line text-xl"></i>
                                        ) : (
                                            <i className="ri-crosshair-2-line"></i>
                                        )}
                                    </button>
                                </div>
                            </form>
                            <button
                                onClick={findTrip}
                                disabled={!pickup || !destination}
                                className={`bg-[#fdc700] text-gray-800 font-semibold px-4 py-3 rounded-lg mt-4 w-full transition-colors shadow-sm cursor-pointer ${
                                    !pickup || !destination 
                                        ? 'opacity-50 cursor-not-allowed' 
                                        : 'hover:bg-[#fdc700]/90'
                                }`}>
                                Find Trip
                            </button>
                        </div>
                        <LocationSearchPanel
                            suggestions={activeField === 'pickup' ? pickupSuggestions : destinationSuggestions}
                            setPanelOpen={setPanelOpen}
                            setVehiclePanel={setVehiclePanel}
                            setPickup={setPickup}
                            setDestination={setDestination}
                            activeField={activeField}
                            pickup={pickup}
                            destination={destination}
                        />
                    </div>
                )}
                <div className="panels-container relative z-50">
                    <div ref={vehiclePanelRef} className='fixed w-full z-40 bottom-0 translate-y-full bg-white px-3 py-10 pt-12 md:max-w-2xl md:left-1/2 md:-translate-x-1/2'>
                        <VehiclePanel
                            selectVehicle={setVehicleType}
                            fare={fare} 
                            setConfirmRidePanel={setConfirmRidePanel} 
                            setVehiclePanel={setVehiclePanel} 
                        />
                    </div>
                    <div ref={confirmRidePanelRef} className='fixed w-full hidden z-40 bottom-0 translate-y-full bg-white px-3 py-6 pt-12 md:max-w-2xl md:left-1/2 md:-translate-x-1/2'>
                        <ConfirmRide
                            pickup={pickup}
                            destination={destination}
                            fare={fare}
                            vehicleType={vehicleType}
                            setConfirmRidePanel={setConfirmRidePanel} 
                            setVehicleFound={setVehicleFound}
                            createRide={createRide}
                        />
                    </div>
                    <div ref={vehicleFoundRef} className='fixed w-full hidden z-40 bottom-0 translate-y-full bg-white px-3 py-6 pt-12 md:max-w-2xl md:left-1/2 md:-translate-x-1/2'>
                        <LookingForDriver
                            createRide={createRide}
                            pickup={pickup}
                            destination={destination}
                            fare={fare}
                            vehicleType={vehicleType}
                            setVehicleFound={setVehicleFound}
                            ride={ride}
                        />
                    </div>
                    <div ref={waitingForDriverRef} className='fixed w-full z-40 bottom-0 translate-y-full bg-white px-3 py-6 pt-12 md:max-w-2xl md:left-1/2 md:-translate-x-1/2'>
                        <WaitingForDriver
                            ride={ride}
                            setVehicleFound={setVehicleFound}
                            setWaitingForDriver={setWaitingForDriver}
                            waitingForDriver={waitingForDriver}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home 