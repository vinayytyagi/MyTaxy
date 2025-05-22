import React, { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CaptainDataContext } from '../context/CaptainContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const CaptainSignup = () => {
    const navigate=useNavigate();
    const [email,setEmail]=useState('');
    const [password,setPassword]=useState('');
    const [firstName,setFirstName]=useState('');
    const [lastName,setLastName]=useState('');
    const [phone, setPhone] = useState('');
    const [vehicleColor, setVehicleColor] = useState('')
    const [vehiclePlate, setVehiclePlate] = useState('')
    const [vehicleCapacity, setVehicleCapacity] = useState('')
    const [vehicleType, setVehicleType] = useState('')

    const {captain,setCaptain}=useContext(CaptainDataContext);

    const validatePhoneNumber = (phoneNumber) => {
        // Remove any non-digit characters
        const cleaned = phoneNumber.replace(/\D/g, '');
        // Check if it's a valid 10-digit number
        return cleaned.length === 10;
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        // Only allow digits
        if (value === '' || /^\d+$/.test(value)) {
            setPhone(value);
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        // Frontend validation
        if (!firstName || firstName.length < 3) {
            toast.error('First name must be at least 3 characters long');
            return;
        }

        if (!lastName || lastName.length < 3) {
            toast.error('Last name must be at least 3 characters long');
            return;
        }

        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        if (!validatePhoneNumber(phone)) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        if (!vehicleColor || vehicleColor.length < 3) {
            toast.error('Vehicle color must be at least 3 characters long');
            return;
        }

        if (!vehiclePlate || vehiclePlate.length < 3) {
            toast.error('Vehicle plate must be at least 3 characters long');
            return;
        }

        if (!vehicleCapacity || isNaN(vehicleCapacity) || parseInt(vehicleCapacity) < 1) {
            toast.error('Please enter a valid vehicle capacity (minimum 1)');
            return;
        }

        // Map frontend vehicle types to backend expected values
        const vehicleTypeMap = {
            'car': 'car',
            'auto': 'auto',
            'motorcycle': 'motorcycle'
        };

        if (!vehicleType || !vehicleTypeMap[vehicleType]) {
            toast.error('Please select a valid vehicle type');
            return;
        }

        const captainData = {
            fullname: {
                firstname: firstName.trim(),
                lastname: lastName.trim()
            },
            email: email.trim(),
            password: password,
            phone: phone.trim(),
            vehicle: {
                color: vehicleColor.trim(),
                plate: vehiclePlate.trim(),
                capacity: parseInt(vehicleCapacity),
                vehicleType: vehicleTypeMap[vehicleType]
            },
            location: {
                type: 'Point',
                coordinates: [0, 0]
            }
        };

        console.log('Sending captain data:', captainData); // Debug log

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/captains/register`,
                captainData
            );

            console.log('Registration response:', response.data); // Debug log

            if (response.status === 201) {
                const data = response.data;
                console.log('Setting captain data:', data.captain); // Debug log
                setCaptain(data.captain);
                localStorage.setItem('captainToken', data.token);
                toast.success('Captain registered successfully');
                navigate('/captain-home');
            }

            // Clear form fields
            setEmail('');
            setFirstName('');
            setLastName('');
            setPassword('');
            setPhone('');
            setVehicleColor('');
            setVehiclePlate('');
            setVehicleCapacity('');
            setVehicleType('');
        } catch (error) {
            console.error('Registration error:', error.response?.data); // Debug log
            if (error.response?.data?.errors) {
                // Handle validation errors
                error.response.data.errors.forEach(err => {
                    toast.error(err.msg);
                });
            } else {
                const msg = error.response?.data?.message || 'Signup failed. Please try again.';
                toast.error(msg);
            }
        }
    };

    return (
        <div>
            <div className='p-7 h-screen flex flex-col justify-between'>
                <div>
                    <img className='w-16 mb-10' src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" alt="" />
                    <form onSubmit={submitHandler}>
                        <h3 className='text-base font-medium mb-2'>What's our Captain's name</h3>
                        <div className='flex gap-4 mb-6 '>
                            <input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className='bg-[#eeeeee] px-4 py-2 rounded w-1/2 text-base placeholder:text-sm'
                                type="text" 
                                placeholder='First name' />

                            <input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className='bg-[#eeeeee] px-4 py-2 rounded w-1/2 text-base placeholder:text-sm'
                                type="text" 
                                placeholder='Last name' />
                        </div>

                        <h3 className='text-base font-medium mb-2'>What's our Captain email</h3>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className='bg-[#eeeeee] mb-6 px-4 py-2 rounded w-full text-base placeholder:text-sm'
                            type="email" 
                            placeholder='example@gmail.com' />

                        <h3 className='text-base font-medium mb-2'>Phone Number</h3>
                        <input
                            value={phone}
                            onChange={handlePhoneChange}
                            required
                            className='bg-[#eeeeee] mb-6 px-4 py-2 rounded w-full text-base placeholder:text-sm'
                            type="tel"
                            placeholder='Enter your 10-digit phone number'
                            maxLength="10"
                            pattern="[0-9]{10}"
                            title="Please enter a valid 10-digit phone number"
                        />

                        <h3 className='text-base font-medium mb-2'>Enter Password</h3>
                        <input 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            className='bg-[#eeeeee] mb-6 px-4 py-2 rounded w-full text-base placeholder:text-sm'
                            type="password"
                            placeholder='password' />

                        <h3 className='text-base font-medium mb-2'>Vehicle Information</h3>
                        <div className='flex gap-4 mb-7'>
                            <input
                                required
                                className='bg-[#eeeeee] w-1/2 rounded-lg px-4 py-2 border text-lg placeholder:text-sm'
                                type="text"
                                placeholder='Vehicle Color'
                                value={vehicleColor}
                                onChange={(e) => setVehicleColor(e.target.value)}
                            />
                            <input
                                required
                                className='bg-[#eeeeee] w-1/2 rounded-lg px-4 py-2 border text-lg placeholder:text-sm'
                                type="text"
                                placeholder='Vehicle Plate'
                                value={vehiclePlate}
                                onChange={(e) => setVehiclePlate(e.target.value)}
                            />
                        </div>
                        <div className='flex gap-4 mb-7'>
                            <input
                                required
                                className='bg-[#eeeeee] w-1/2 rounded-lg px-4 py-2 border text-lg placeholder:text-sm'
                                type="number"
                                placeholder='Vehicle Capacity'
                                value={vehicleCapacity}
                                onChange={(e) => setVehicleCapacity(e.target.value)}
                            />
                            <select
                                required
                                className='bg-[#eeeeee] w-1/2 rounded-lg px-4 py-2 border text-sm placeholder:text-medium'
                                value={vehicleType}
                                onChange={(e) => setVehicleType(e.target.value)}
                            >
                                <option value="">Select Vehicle Type</option>
                                <option value="car">Car</option>
                                <option value="auto">Auto</option>
                                <option value="motorcycle">Motorcycle</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className='bg-[#111] text-white font-semibold mb-3 px-4 py-2 rounded w-full text-lg placeholder:text-base'
                        >
                            Create account
                        </button>

                        <p className='text-center'>Already have an account? <Link to='/captain-login' className='text-blue-600'>Login here</Link></p>
                    </form>
                </div>
                <div>
                    <p className='text-[10px] leading-tight'>This site is protected by reCAPTCHA and the <span className='underline'>Google Privacy Policy</span> and <span className='underline'>Terms of Service apply</span>.</p>
                </div>
            </div>
        </div>
    );
};

export default CaptainSignup;