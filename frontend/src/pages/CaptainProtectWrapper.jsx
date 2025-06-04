import React, { useContext, useEffect, useState } from 'react'
import { CaptainDataContext } from '../context/CaptainContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { SocketContext } from '../context/SocketContext'

const CaptainProtectWrapper = ({
    children
}) => {
    const token = localStorage.getItem('captainToken')
    const navigate = useNavigate()
    const { captain, setCaptain } = useContext(CaptainDataContext)
    const { joinCaptain } = useContext(SocketContext)
    const [ isLoading, setIsLoading ] = useState(true)

    useEffect(() => {
        if (!token) {
            navigate('/captain-login')
            return
        }

        axios.get(`${import.meta.env.VITE_BASE_URL}/captains/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(response => {
            if (response.status === 200) {
                setCaptain(response.data)
                // Join socket room after captain data is set
                joinCaptain(response.data._id)
                setIsLoading(false)
            }
        })
            .catch(err => {
                console.error('Authentication error:', err)
                localStorage.removeItem('captainToken')
                navigate('/captain-login')
            })
    }, [ token, navigate, setCaptain, joinCaptain ])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <>
            {children}
        </>
    )
}

export default CaptainProtectWrapper