import React, { createContext, useState, useEffect } from 'react'
//this will create the context
export const UserDataContext=createContext();

const UserContext = ({children}) => {
    // Initialize user state from localStorage if available
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : {
            email:'',
            fullname:{
                firstname:'',
                lastname:''
            }
        };
    });

    // Update localStorage whenever user state changes
    useEffect(() => {
        localStorage.setItem('user', JSON.stringify(user));
    }, [user]);

    return (
            <UserDataContext.Provider value={{user,setUser}}>
                {children}
            </UserDataContext.Provider>
    )
}

export default UserContext