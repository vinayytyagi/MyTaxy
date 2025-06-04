import React, { useRef } from 'react'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const LocationSearchPanel = ({ 
    suggestions, 
    setPanelOpen, 
    setPickup, 
    setDestination, 
    activeField, 
    pickup, 
    destination,
    setPickupSuggestions,
    setDestinationSuggestions 
}) => {
    const panelRef = useRef(null);

    useGSAP(function () {
        gsap.from(panelRef.current, {
            y: 100,
            duration: 0.5,
            ease: "power3.out"
        })
    }, [])

    const handleSuggestionClick = (suggestion) => {
        if (activeField === 'pickup') {
            setPickup(suggestion);
            setPickupSuggestions([]); // Clear suggestions after selection
        } else {
            setDestination(suggestion);
            setDestinationSuggestions([]); // Clear suggestions after selection
        }
        setPanelOpen(false); // Just close the panel
    }

    return (
        <div ref={panelRef} className='p-6'>
            <h4 className='text-lg font-semibold mb-4 text-gray-800'>Suggestions</h4>
            <div className='space-y-3'>
                {suggestions.map((suggestion, index) => (
                    <div
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className='flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors'
                    >
                        <div className='h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center'>
                            <i className="ri-map-pin-line text-gray-600"></i>
                        </div>
                        <div>
                            <h5 className='text-gray-800 font-medium'>{suggestion}</h5>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default LocationSearchPanel 