import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SocketContext } from '../context/SocketContext'
import LiveTracking from '../../components/LiveTracking'
import axios from 'axios'
import { getToken } from '../services/auth.service'

const Riding = () => {
    const location = useLocation()
    const { ride } = location.state || {} // Retrieve ride data
    const { socket } = useContext(SocketContext)
    const navigate = useNavigate()
    const [formattedRideData, setFormattedRideData] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [razorpayLoaded, setRazorpayLoaded] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    // Format ride data for LiveTracking component
    useEffect(() => {
        if (ride) {
            setFormattedRideData({
                _id: ride._id,
                pickup: {
                    lat: parseFloat(ride.pickup.split(',')[0]),
                    lng: parseFloat(ride.pickup.split(',')[1])
                },
                destination: {
                    lat: parseFloat(ride.destination.split(',')[0]),
                    lng: parseFloat(ride.destination.split(',')[1])
                }
            })
        }
    }, [ride])

    useEffect(() => {
        if (socket) {
    socket.on("ride-ended", () => {
        navigate('/home')
    })
        }

        return () => {
            if (socket) {
                socket.off("ride-ended")
            }
        }
    }, [socket, navigate])

    // Load Razorpay script on component mount
    useEffect(() => {
        const loadRazorpay = async () => {
            try {
                const res = await initializeRazorpay()
                setRazorpayLoaded(res)
                console.log('Razorpay loaded:', res)
            } catch (error) {
                console.error('Error loading Razorpay:', error)
                setRazorpayLoaded(false)
            }
        }
        loadRazorpay()
    }, [])

    const initializeRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                console.log('Razorpay already loaded')
                resolve(true)
                return
            }

            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.onload = () => {
                console.log('Razorpay script loaded successfully')
                resolve(true)
            }
            script.onerror = () => {
                console.error('Failed to load Razorpay script')
                resolve(false)
            }
            document.body.appendChild(script)
        })
    }

    const handlePayment = async () => {
        try {
            console.log('Starting payment process...')
            setIsLoading(true)
            setError(null)

            if (!razorpayLoaded) {
                console.log('Razorpay not loaded, attempting to load...')
                const loaded = await initializeRazorpay()
                if (!loaded) {
                    throw new Error('Failed to load Razorpay SDK')
                }
                setRazorpayLoaded(true)
            }

            const token = getToken('user')
            if (!token) {
                throw new Error('Authentication required')
            }

            console.log('Creating order...')
            const orderResponse = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/api/payment/create-order`,
                {
                    rideId: ride._id,
                    amount: ride.fare
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            console.log('Order created:', orderResponse.data)

            if (!orderResponse.data || !orderResponse.data.id) {
                throw new Error('Failed to create order')
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderResponse.data.amount,
                currency: orderResponse.data.currency,
                name: 'RideUber',
                description: `Payment for ride #${ride._id}`,
                order_id: orderResponse.data.id,
                prefill: {
                    name: ride.user?.name || '',
                    email: ride.user?.email || '',
                    contact: ride.user?.phone || ''
                },
                theme: {
                    color: '#1360db'
                },
                handler: async function (response) {
                    console.log('Payment successful, verifying...', response)
                    try {
                        const verifyResponse = await axios.post(
                            `${import.meta.env.VITE_BASE_URL}/api/payment/verify`,
                            {
                                rideId: ride._id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            }
                        )

                        console.log('Payment verification response:', verifyResponse.data)

                        if (verifyResponse.data.success) {
                            try {
                                await axios.put(
                                    `${import.meta.env.VITE_BASE_URL}/api/rides/${ride._id}/complete-payment`,
                                    {},
                                    {
                                        headers: {
                                            Authorization: `Bearer ${token}`
                                        }
                                    }
                                )
                                // Emit socket event to notify driver about payment
                                console.log('Emitting payment-successful event:', {
                                    rideId: ride._id,
                                    captainId: ride.captain._id
                                });
                                
                                // Make sure socket is connected before emitting
                                if (socket && socket.connected) {
                                    socket.emit('payment-successful', {
                                        rideId: ride._id,
                                        captainId: ride.captain._id
                                    });
                                    console.log('Payment success event emitted');
                                } else {
                                    console.error('Socket not connected');
                                }
                                
                                navigate('/home')
                            } catch (updateError) {
                                console.error('Error updating ride status:', updateError)
                                navigate('/home')
                            }
                        } else {
                            throw new Error('Payment verification failed')
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error)
                        setError('Payment verification failed. Please try again.')
                    }
                },
                modal: {
                    ondismiss: function() {
                        console.log('Payment modal dismissed')
                        setIsLoading(false)
                    }
                },
                config: {
                    display: {
                        blocks: {
                            banks: {
                                name: "Pay using UPI",
                                instruments: [
                                    {
                                        method: "upi"
                                    }
                                ]
                            }
                        },
                        sequence: ["block.banks"],
                        preferences: {
                            show_default_blocks: true
                        }
                    }
                },
                image: {
                    width: "100",
                    height: "100"
                },
                notes: {
                    address: "RideUber Payment"
                },
                retry: {
                    enabled: true,
                    max_count: 3
                }
            }

            console.log('Opening Razorpay payment window...')
            const paymentObject = new window.Razorpay(options)
            paymentObject.open()

        } catch (error) {
            console.error('Payment error:', error)
            setError(error.message || 'Payment initialization failed')
        } finally {
            setIsLoading(false)
        }
    }

  return (
    <div className='h-screen'>
        <Link to='/home' className='fixed right-2 top-2 h-10 w-10 bg-white flex items-center justify-center rounded-full'>
            <i className="text-lg font-medium ri-home-5-line"></i>
        </Link>
        <div className='h-1/2'>
            {formattedRideData && (
                <LiveTracking rideData={formattedRideData} />
            )}
        </div>
        <div className='h-1/2 p-4'>
            <div className='flex items-center justify-between'>
                <img className='h-17' src="https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_538,w_956/v1688398971/assets/29/fbb8b0-75b1-4e2a-8533-3a364e7042fa/original/UberSelect-White.png" />
                <div className='text-right'>
                    <h2 className='text-lg font-medium capitalize '>{ride?.captain.fullname.firstname}</h2>
                    <h4 className='text-xl font-semibold -mt-1 -mb-1'>{ride?.captain.vehicle.plate}</h4>
                    <p className='text-sm text-gray-600'>{ride?.captain.vehicle.model}</p>
                </div>
            </div>

            <div className='flex gap-2 justify-between flex-col items-center'>
                <div className='w-full mt-5'>
                    <div className='flex items-center gap-5 p-3 border-b-2 border-gray-200'>
                        <i className="text-lg ri-map-pin-2-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>Destination</h3>
                            <p className='text-gray-600 -mt-1'>{ride?.destinationAddress}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3 '>
                        <i className="ri-currency-line"></i>
                        <div>
                            <h3 className='text-lg font-medium'>₹{ride?.fare}</h3>
                            <p className='text-gray-600 -mt-1'>Cash Payment</p>
                        </div>
                    </div>
                </div>
                {error && (
                    <div className="mt-2 p-2 bg-red-50 text-red-600 rounded-md text-sm">
                        {error}
                    </div>
                )}
                <button 
                    onClick={handlePayment}
                    disabled={isLoading || !razorpayLoaded}
                    className={`w-full mt-5 font-semibold p-2 rounded-lg transition-colors ${
                        isLoading || !razorpayLoaded
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                    {isLoading ? 'Processing...' : 'Make Payment'}
                </button>
                {!razorpayLoaded && (
                    <p className="mt-2 text-sm text-yellow-600 text-center">
                        Loading payment gateway...
                    </p>
                )}
            </div>
        </div>
    </div>
  )
}

export default Riding