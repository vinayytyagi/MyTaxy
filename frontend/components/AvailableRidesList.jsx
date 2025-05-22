import React from 'react';

const AvailableRidesList = ({ rides, onAccept, onReject }) => {
    return (
        <div className="fixed top-20 right-4 w-72 bg-white rounded-lg shadow-lg z-50">
            <div className="p-3 border-b flex items-center justify-between">
                <h2 className="text-base font-semibold">Available Rides</h2>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {rides.length} new
                </span>
            </div>
            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
                {rides.map((ride) => (
                    <div key={ride._id} className="p-3 border-b hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <i className="ri-route-line text-green-600"></i>
                                </div>
                            </div>
                            <div className="flex-grow min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-green-600">₹{ride.fare}</span>
                                    <span className="text-xs text-gray-500">{ride.distance?.toFixed(1)} km</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <i className="ri-map-pin-line text-gray-400"></i>
                                        <p className="text-sm text-gray-600 truncate">{ride.pickupAddress}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className="ri-map-pin-line text-gray-400"></i>
                                        <p className="text-sm text-gray-600 truncate">{ride.destinationAddress}</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        onClick={() => onReject(ride._id)}
                                        className="p-1.5 text-gray-800 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <i className="ri-close-line bg-red-500 p-1 rounded-[2px]"></i>
                                    </button>
                                    <button
                                        onClick={() => onAccept(ride)}
                                        className="p-1.5 text-gray-800 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors"
                                    >
                                        <i className="ri-check-line bg-green-500 p-1 rounded-[2px]"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AvailableRidesList; 