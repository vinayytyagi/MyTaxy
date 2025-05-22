import React, { useEffect, useState, useCallback } from 'react'

const LocationSearchPanel = ({ suggestions, setVehiclePanel, setPanelOpen, setPickup, setDestination, activeField, pickup, destination }) => {
    const [recentPickupLocations, setRecentPickupLocations] = useState([]);
    const [recentDestinationLocations, setRecentDestinationLocations] = useState([]);

    // Load recent locations when component mounts
    useEffect(() => {
        const storedPickupLocations = localStorage.getItem('recentPickupLocations');
        const storedDestinationLocations = localStorage.getItem('recentDestinationLocations');
        
        if (storedPickupLocations) {
            setRecentPickupLocations(JSON.parse(storedPickupLocations));
        }
        if (storedDestinationLocations) {
            setRecentDestinationLocations(JSON.parse(storedDestinationLocations));
        }
    }, []);

    const handleSuggestionClick = useCallback((suggestion) => {
        if (activeField === 'pickup') {
            setPickup(suggestion);
            // Update recent pickup locations
            const updatedLocations = [
                suggestion,
                ...recentPickupLocations.filter(loc => loc !== suggestion)
            ].slice(0, 2);
            
            setRecentPickupLocations(updatedLocations);
            localStorage.setItem('recentPickupLocations', JSON.stringify(updatedLocations));
        } else if (activeField === 'destination') {
            setDestination(suggestion);
            // Update recent destination locations
            const updatedLocations = [
                suggestion,
                ...recentDestinationLocations.filter(loc => loc !== suggestion)
            ].slice(0, 2);
            
            setRecentDestinationLocations(updatedLocations);
            localStorage.setItem('recentDestinationLocations', JSON.stringify(updatedLocations));
        }

        // Only close panel and show vehicle panel if both pickup and destination are selected
        if ((activeField === 'pickup' && suggestion && destination) || 
            (activeField === 'destination' && suggestion && pickup)) {
            setVehiclePanel(true);
            setPanelOpen(false);
        }
    }, [activeField, pickup, destination, recentPickupLocations, recentDestinationLocations, setPickup, setDestination, setVehiclePanel, setPanelOpen]);

    const getRecentLocations = () => {
        const locations = activeField === 'pickup' ? recentPickupLocations : recentDestinationLocations;
        const searchText = activeField === 'pickup' ? pickup : destination;
        
        // If there's search text, filter recent locations
        if (searchText) {
            return locations.filter(location => 
                location.toLowerCase().includes(searchText.toLowerCase())
            );
        }
        return locations;
    };

    const filteredRecentLocations = getRecentLocations();

    return (
        <div className="p-4">
            {filteredRecentLocations.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Locations</h3>
                    {filteredRecentLocations.map((location, idx) => (
                        <div 
                            key={`recent-${idx}`} 
                            onClick={() => handleSuggestionClick(location)} 
                            className='flex gap-4 border-2 p-3 border-gray-50 hover:border-gray-700 rounded-xl items-center my-2 justify-start cursor-pointer transition-colors'
                        >
                            <div className='bg-[#eee] h-8 flex items-center justify-center w-12 rounded-full'>
                                <i className="ri-history-line"></i>
                            </div>
                            <h4 className='font-medium text-sm'>{location}</h4>
                        </div>
                    ))}
                </div>
            )}
            
            {suggestions.length > 0 && (
                <>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Suggestions</h3>
                    {suggestions.map((elem, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => handleSuggestionClick(elem)} 
                            className='flex gap-4 border-2 p-3 border-gray-50 hover:border-gray-700 rounded-xl items-center my-2 justify-start cursor-pointer transition-colors'
                        >
                            <div className='bg-[#eee] h-8 flex items-center justify-center w-8 rounded-full'>
                                <i className="ri-map-pin-fill"></i>
                            </div>
                            <h4 className='font-medium text-sm'>{elem}</h4>
                        </div>
                    ))}
                </>
            )}
        </div>
    )
}

export default React.memo(LocationSearchPanel)