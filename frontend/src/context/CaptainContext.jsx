import { createContext, useState, useContext, useEffect } from 'react';

export const CaptainDataContext = createContext();

const CaptainContext = ({ children }) => {
    const [captain, setCaptain] = useState(() => {
        // Try to get captain data from localStorage on initial load
        const storedCaptain = localStorage.getItem('captainData');
        return storedCaptain ? JSON.parse(storedCaptain) : null;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Update localStorage whenever captain data changes
    useEffect(() => {
        if (captain) {
            localStorage.setItem('captainData', JSON.stringify(captain));
        }
    }, [captain]);

    const updateCaptain = (captainData) => {
        console.log('Updating captain data in context:', captainData); // Debug log
        setCaptain(prevCaptain => {
            const currentCaptain = prevCaptain || {};
            const updatedCaptain = {
                ...currentCaptain,
                fullname: {
                    ...currentCaptain.fullname,
                    ...captainData.fullname
                },
                vehicle: {
                    ...currentCaptain.vehicle,
                    ...captainData.vehicle
                },
                email: captainData.email || currentCaptain.email,
                phone: captainData.phone || currentCaptain.phone,
                _id: captainData._id || currentCaptain._id
            };
            console.log('Updated captain data:', updatedCaptain); // Debug log
            return updatedCaptain;
        });
    };

    const value = {
        captain,
        setCaptain,
        isLoading,
        setIsLoading,
        error,
        setError,
        updateCaptain
    };

    return (
        <CaptainDataContext.Provider value={value}>
            {children}
        </CaptainDataContext.Provider>
    );
};

export default CaptainContext;
