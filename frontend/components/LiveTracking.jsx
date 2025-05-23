import React, { useState, useEffect, useContext, useRef } from 'react';
import { GoogleMap, Marker, Polyline,Circle } from '@react-google-maps/api';
import { SocketContext } from '../src/context/SocketContext';
import axios from 'axios'; // Required for fetching route

const containerStyle = {
    width: '100%',
    height: '100%',
};

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

// Validates coordinates
const isValidCoordinate = (coord) => {
    return coord &&
        typeof coord.lat === 'number' &&
        typeof coord.lng === 'number' &&
        !isNaN(coord.lat) &&
        !isNaN(coord.lng) &&
        coord.lat >= -90 &&
        coord.lat <= 90 &&
        coord.lng >= -180 &&
        coord.lng <= 180;
};

const LiveTracking = ({ rideData }) => {
    const [currentPosition, setCurrentPosition] = useState(null);
    const [driverPosition, setDriverPosition] = useState(null);
    const [routePath, setRoutePath] = useState([]);
    const { socket } = useContext(SocketContext);
    const mapRef = useRef(null);
    const [mapType, setMapType] = useState('satellite');
    const [mapInstance, setMapInstance] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Get current location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                setCurrentPosition({ lat: latitude, lng: longitude });
            });

            const watchId = navigator.geolocation.watchPosition((position) => {
                const { latitude, longitude } = position.coords;
                setCurrentPosition({ lat: latitude, lng: longitude });
            });

            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    // Listen for driver's real-time updates
    useEffect(() => {
        if (socket && rideData?._id) {
            socket.emit('join-ride', { rideId: rideData._id });

            socket.on(`driverLocation:${rideData._id}`, (location) => {
                if (location && location.latitude && location.longitude) {
                    setDriverPosition({
                        lat: location.latitude,
                        lng: location.longitude,
                    });
                }
            });

            return () => {
                socket.off(`driverLocation:${rideData._id}`);
            };
        }
    }, [socket, rideData]);

    // Fetch route from Google Directions API
    useEffect(() => {
        const fetchRoute = () => {
            if (!rideData?.pickup || !rideData?.destination) {
                console.log('Missing pickup or destination coordinates');
                return;
            }

            // console.log('Fetching route with coordinates:', {
            //     pickup: rideData.pickup,
            //     destination: rideData.destination
            // });

            const directionsService = new window.google.maps.DirectionsService();

            directionsService.route(
                {
                    origin: rideData.pickup,
                    destination: rideData.destination,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    // console.log('Directions API response:', result);
                    // console.log('Directions API status:', status);
                    
                    if (status === window.google.maps.DirectionsStatus.OK) {
                        if (!result.routes || result.routes.length === 0) {
                            console.error('No routes found in the response');
                            return;
                        }

                        const route = result.routes[0];
                        // console.log('Route object:', route);
                        
                        if (!route.overview_polyline) {
                            console.error('No overview_polyline in the route');
                            return;
                        }

                        // console.log('Overview polyline:', route.overview_polyline);
                        
                        // The overview_polyline is a string containing the encoded polyline
                        const encodedPolyline = route.overview_polyline;

                        if (!encodedPolyline) {
                            console.error('Encoded polyline is undefined or empty');
                            return;
                        }

                        // console.log('Encoded polyline:', encodedPolyline);

                            // If points exist, decode the polyline path
                            if (window.google?.maps?.geometry?.encoding) {
                            try {
                                const decodedPath = window.google.maps.geometry.encoding.decodePath(encodedPolyline);
                                // console.log('Decoded path:', decodedPath);
                                
                                if (decodedPath && decodedPath.length > 0) {
                                setRoutePath(decodedPath);
                            } else {
                                    console.error('Decoded path is empty');
                                }
                            } catch (error) {
                                console.error('Error decoding polyline:', error);
                            }
                        } else {
                            console.warn('Google geometry library not loaded.');
                        }
                    } else {
                        console.error('Directions request failed with status:', status);
                        if (status === window.google.maps.DirectionsStatus.ZERO_RESULTS) {
                            console.error('No route found between the origin and destination.');
                        }
                    }
                }
            );
        };

        if (window.google) {
            fetchRoute();
        } else {
            console.error('Google Maps API not loaded');
        }
    }, [rideData]);

    useEffect(() => {
        if (routePath.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            routePath.forEach((point) => bounds.extend(point));
            setTimeout(() => mapRef.current?.fitBounds(bounds), 500); // using ref
        }
    }, [routePath]);

    const getMapCenter = () => {
        if (driverPosition && isValidCoordinate(driverPosition)) return driverPosition;
        if (currentPosition && isValidCoordinate(currentPosition)) return currentPosition;
        if (rideData?.pickup && isValidCoordinate(rideData.pickup)) return rideData.pickup;
        return DEFAULT_CENTER;
    };

    const recenterMap = () => {
        if (mapInstance && currentPosition) {
            mapInstance.setCenter(currentPosition);
            mapInstance.setZoom(15);
        }
    };

    // Add fullscreen change listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={getMapCenter()}
                zoom={15}
                mapTypeId={mapType}
                options={{
                    disableDefaultUI: true,
                    scaleControl: true,
                    scaleControlOptions: {
                        position: window.google.maps.ControlPosition.LEFT_BOTTOM
                    },
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        },
                        {
                            featureType: "transit",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        }
                    ],
                    mapTypeControl: false,
                    mapTypeId: mapType
                }}
                onLoad={(map) => {
                    setMapInstance(map);
                    mapRef.current = map;
                    map.setMapTypeId(mapType);
                    if (routePath.length > 0) {
                        const bounds = new window.google.maps.LatLngBounds();
                        routePath.forEach((point) => bounds.extend(point));
                        map.fitBounds(bounds);
                    }
                }}
                onUnmount={() => {
                    mapRef.current = null;
                    setMapInstance(null);
                }}
            >
                {currentPosition && (
                    <>
                        <Circle
                            center={currentPosition}
                            radius={150}
                            options={{
                                fillColor: "#fdc700",
                                fillOpacity: 0.15,
                                strokeColor: "#fdc700",
                                strokeOpacity: 0.3,
                                strokeWeight: 2,
                            }}
                        />
                        <Marker
                            position={currentPosition}
                            icon={{
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 10,
                                fillColor: "#fdc700",
                                fillOpacity: 1,
                                strokeColor: "#ffffff",
                                strokeWeight: 3,
                            }}
                        />
                    </>
                )}

                {driverPosition && (
                    <>
                    <Circle
                            center={driverPosition}
                            radius={150}
                            options={{
                                fillColor: "#fdc700",
                                fillOpacity: 0.15,
                                strokeColor: "#fdc700",
                                strokeOpacity: 0.3,
                                strokeWeight: 2,
                            }}
                        />
                    
                    <Marker
                        position={driverPosition}
                        icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: "#fdc700",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 3,
                        }}
                    />
                    </>
                )}

                {rideData?.pickup && (
                    <Marker
                        position={rideData.pickup}
                        icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: "#fdc700",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 3,
                        }}
                    />
                )}

                {rideData?.destination && (
                    <Marker
                        position={rideData.destination}
                        icon={{
                            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                            scaledSize: new window.google.maps.Size(40, 40),
                            anchor: new window.google.maps.Point(20, 40)
                        }}
                    />
                )}

                {/* Route line with gradient effect */}
                {routePath.length > 0 && (
                    <Polyline
                        path={routePath}
                        options={{
                            strokeColor: '#fdc700',
                            strokeOpacity: 0.8,
                            strokeWeight: 5,
                            icons: [{
                                icon: {
                                    path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                    scale: 3,
                                    fillColor: '#fdc700',
                                    fillOpacity: 1,
                                    strokeColor: '#ffffff',
                                    strokeWeight: 1,
                                },
                                offset: '50%',
                                repeat: '100px'
                            }]
                        }}
                    />
                )}
            </GoogleMap>

            {/* Map Type Indicator with animation */}
            <div 
                onClick={() => {
                    const newMapType = mapType === 'satellite' ? 'roadmap' : 'satellite';
                    setMapType(newMapType);
                    if (mapInstance) {
                        mapInstance.setMapTypeId(newMapType);
                    }
                }}
                style={{
                    position: 'absolute',
                    top: 80,
                    left: 20,
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    zIndex: 10,
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(253, 199, 0, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
                className="hover:bg-gray-50 hover:scale-105"
                title="Click to change map type"
            >
                <i className="ri-map-2-line" style={{ 
                    color: '#fdc700',
                    fontSize: '18px'
                }}></i>
                <span style={{ 
                    color: '#1a1a1a', 
                    fontWeight: 500,
                    fontSize: '14px',
                    textTransform: 'capitalize'
                }}>
                    {mapType === 'satellite' ? 'Satellite View' : 'Map View'}
                </span>
            </div>

            {/* Minimize Button with pulse effect */}
            {isFullscreen && (
                <button
                    onClick={() => document.exitFullscreen()}
                    style={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        background: '#fdc700',
                        border: 'none',
                        borderRadius: '50%',
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                        zIndex: 10,
                        transition: 'all 0.3s ease'
                    }}
                    className="hover:bg-[#fdc700]/90 hover:scale-110 active:scale-95"
                    title="Minimize"
                >
                    <i className="ri-fullscreen-exit-line" style={{ fontSize: 20, color: '#ffffff' }}></i>
                </button>
            )}

            {/* Custom Controls Container with new layout */}
            <div style={{
                position: 'absolute',
                right: 20,
                top: 80,
                display: 'flex',
                flexDirection: 'column',
                gap: '30px',
                zIndex: 10
            }}>
                {/* Fullscreen Button */}
                <button
                    onClick={() => {
                        const mapElement = document.querySelector('.gm-style');
                        if (mapElement) {
                            if (document.fullscreenElement) {
                                document.exitFullscreen();
                            } else {
                                mapElement.requestFullscreen();
                            }
                        }
                    }}
                    style={{
                        background: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                        // position: 'absolute',
                        // top: -100,
                        right: 0,
                        transition: 'all 0.3s ease'
                    }}
                    className="hover:bg-[#fdc700]/90 hover:scale-110 active:scale-95"
                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                    <i className={isFullscreen ? "ri-fullscreen-exit-line" : "ri-fullscreen-line"} 
                       style={{ fontSize: 22, color: '#fdc700' }}></i>
                </button>

                {/* Zoom Controls Container */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    padding: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(253, 199, 0, 0.2)',
                }}>
                {/* Zoom In Button */}
                <button
                    onClick={() => {
                        if (mapInstance) {
                            const currentZoom = mapInstance.getZoom();
                            mapInstance.setZoom(currentZoom + 1);
                        }
                    }}
                    style={{
                            // background: 'gray',
                            border: '2px solid #fdc700',
                            color: 'gray',
                        borderRadius: '50%',
                        cursor: 'pointer',
                            width: 36,
                            height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                            transition: 'all 0.3s ease'
                    }}
                        className="hover:color-[#fdc700]/90 hover:scale-110 active:scale-95"
                    title="Zoom in"
                >
                        <i className="ri-add-line" style={{ fontSize: 18, color: '#fdc700' }}></i>
                </button>

                {/* Zoom Out Button */}
                <button
                    onClick={() => {
                        if (mapInstance) {
                            const currentZoom = mapInstance.getZoom();
                            mapInstance.setZoom(currentZoom - 1);
                        }
                    }}
                    style={{
                            border: '2px solid #fdc700',
                            color: 'gray',                            borderRadius: '50%',
                        cursor: 'pointer',
                            width: 36,
                            height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                            transition: 'all 0.3s ease'
                    }}
                        className="hover:color-[#fdc700]/90 hover:scale-110 active:scale-95"
                    title="Zoom out"
                >
                        <i className="ri-subtract-line" style={{ fontSize: 18, color: '#fdc700' }}></i>
                </button>
                </div>
            </div>

            {/* My Location Button with pulse animation */}
            <button
                onClick={recenterMap}
                style={{
                    position: 'absolute',
                    right: 20,
                    top: 280,
                    background: '#fdc700',
                    border: 'none',
                    borderRadius: '50%',
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'all 0.3s ease'
                }}
                className="hover:bg-[#fdc700]/90 hover:scale-110 active:scale-95"
                title="Go to my location"
            >
                <i className="ri-crosshair-2-line" style={{ fontSize: 22, color: '#ffffff' }}></i>
            </button>

            {/* Distance and ETA Info (if route exists) */}
            {routePath.length > 0 && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '12px 24px',
                    borderRadius: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    zIndex: 10,
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(253, 199, 0, 0.2)',
                    maxWidth: '90%',
                    margin: '0 auto'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="ri-route-line" style={{ color: '#fdc700', fontSize: '20px' }}></i>
                        <span style={{ color: '#1a1a1a', fontWeight: 500 }}>2.5 km</span>
                    </div>
                    <div style={{ 
                        width: '1px', 
                        height: '24px', 
                        background: 'rgba(0,0,0,0.1)' 
                    }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="ri-time-line" style={{ color: '#fdc700', fontSize: '20px' }}></i>
                        <span style={{ color: '#1a1a1a', fontWeight: 500 }}>8 min</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveTracking;
