import React, { useContext, useState, useEffect } from 'react';
import { UserDataContext } from '../context/UserContext';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import 'remixicon/fonts/remixicon.css';

const UserProfile = () => {
    const { user, setUser } = useContext(UserDataContext);
    const [rideHistory, setRideHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        phone: ''
    });
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Initialize form data with user data
        if (user) {
            setFormData({
                firstname: user.fullname?.firstname || '',
                lastname: user.fullname?.lastname || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        }

        // Fetch user's ride history
        const fetchRideHistory = async () => {
            const token = localStorage.getItem('token');
            if (!user || !token) {
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/history`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const sortedRides = response.data.rides.sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                setRideHistory(sortedRides || []);
            } catch (error) {
                console.error('Error fetching ride history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRideHistory();
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg','image/webp','image/gif','image/heif','image/avif'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Please upload a JPEG, PNG, or JPG image.');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            setError('File size too large. Maximum size is 5MB.');
            return;
        }

        const formData = new FormData();
        formData.append('profilePhoto', file);

        try {
            setUploading(true);
            setError(null);
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/users/profile/photo`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (response.data.profilePhoto) {
                setUser({ ...user, profilePhoto: response.data.profilePhoto });
                setSuccess('Profile photo updated successfully!');
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            setError(error.response?.data?.message || 'Failed to upload profile photo');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setUploading(true);

        try {
            const response = await axios.put(
                `${import.meta.env.VITE_BASE_URL}/users/profile`,
                {
                    fullname: {
                        firstname: formData.firstname,
                        lastname: formData.lastname
                    },
                    email: formData.email,
                    phone: formData.phone
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            setUser(response.data.data);
            setSuccess('Profile updated successfully!');
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow-md p-4 flex justify-between items-center">
                <button 
                    onClick={() => navigate('/home')}
                    className="text-gray-600 hover:text-gray-800"
                >
                    <i className="ri-arrow-left-line text-2xl"></i>
                </button>
                <h1 className="text-xl font-bold">Profile</h1>
                <button 
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-800"
                >
                    <i className="ri-logout-box-r-line text-2xl"></i>
                </button>
            </div>

            {/* Profile Info */}
            <div className="bg-white p-6 shadow-md">
                <div className="flex items-center mb-6">
                    <div className="relative">
                        {user.profilePhoto ? (
                            <img 
                                src={user.profilePhoto} 
                                alt="Profile" 
                                className="w-20 h-20 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600">
                                {user.fullname?.firstname?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        {isEditing && (
                            <label 
                                htmlFor="photo-upload"
                                className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 cursor-pointer hover:bg-blue-600"
                            >
                                <i className="ri-camera-line"></i>
                            </label>
                        )}
                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                            disabled={uploading}
                        />
                    </div>
                    <div className="ml-4">
                        <h2 className="text-2xl font-bold">
                            {user?.fullname?.firstname && user?.fullname?.lastname 
                                ? `${user.fullname.firstname} ${user.fullname.lastname}`
                                : user?.name || 'User'}
                        </h2>
                        <p className="text-gray-600">{user?.email || 'user@example.com'}</p>
                        <p className="text-gray-600">{user?.phone || 'Not set'}</p>
                    </div>
                </div>

                {/* Single Edit Profile Button */}
                <div className="mb-6">
                    <button
                        onClick={(e) => {
                            if (isEditing) {
                                e.preventDefault();
                                handleSubmit(e);
                            } else {
                                setIsEditing(true);
                            }
                        }}
                        className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        disabled={uploading}
                    >
                        {uploading ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
                    </button>
                </div>

                {/* Error and Success Messages */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                        {success}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b mb-4">
                    <button 
                        className={`py-2 px-4 ${activeTab === 'profile' ? 'border-b-2 border-black font-semibold' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile
                    </button>
                    <button 
                        className={`py-2 px-4 ${activeTab === 'rides' ? 'border-b-2 border-black font-semibold' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('rides')}
                    >
                        Ride History
                    </button>
                    <button 
                        className={`py-2 px-4 ${activeTab === 'settings' ? 'border-b-2 border-black font-semibold' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        Settings
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'profile' && (
                    <div>
                        {isEditing ? (
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold mb-2">Edit Profile</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                            <input
                                                type="text"
                                                name="firstname"
                                                value={formData.firstname}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                name="lastname"
                                                value={formData.lastname}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div>
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-600">Name</span>
                                            <span className="font-medium">
                                                {user?.fullname?.firstname && user?.fullname?.lastname 
                                                    ? `${user.fullname.firstname} ${user.fullname.lastname}`
                                                    : 'Not set'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-600">Email</span>
                                            <span className="font-medium">{user?.email || 'Not set'}</span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-600">Phone</span>
                                            <span className="font-medium">{user?.phone || 'Not set'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'rides' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Recent Rides</h3>
                        {loading ? (
                            <div className="text-center py-4">Loading ride history...</div>
                        ) : rideHistory.length > 0 ? (
                            <div className="space-y-4">
                                {rideHistory.map((ride) => {
                                    // Format booking time
                                    const bookingDate = ride.bookingTime ? new Date(ride.bookingTime) : null;
                                    const formattedBookingDate = bookingDate ? bookingDate.toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    }) : 'Not known';
                                    const formattedBookingTime = bookingDate ? bookingDate.toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : 'Not known';

                                    // Format scheduled time if exists
                                    let scheduledTimeDisplay = null;
                                    if (ride.scheduledTime) {
                                        const scheduledDate = new Date(ride.scheduledTime);
                                        scheduledTimeDisplay = {
                                            date: scheduledDate.toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                            }),
                                            time: scheduledDate.toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                        };
                                    }

                                    // Get status color and text
                                    const getStatusInfo = (status) => {
                                        switch (status) {
                                            case 'completed':
                                                return {
                                                    color: 'bg-green-100 text-green-800',
                                                    text: 'Completed'
                                                };
                                            case 'cancelled':
                                                return {
                                                    color: 'bg-red-100 text-red-800',
                                                    text: 'Cancelled'
                                                };
                                            case 'ongoing':
                                                return {
                                                    color: 'bg-blue-100 text-blue-800',
                                                    text: 'Ongoing'
                                                };
                                            case 'pending':
                                                return {
                                                    color: 'bg-yellow-100 text-yellow-800',
                                                    text: 'Pending'
                                                };
                                            default:
                                                return {
                                                    color: 'bg-gray-100 text-gray-800',
                                                    text: status.charAt(0).toUpperCase() + status.slice(1)
                                                };
                                        }
                                    };

                                    const statusInfo = getStatusInfo(ride.status);

                                    return (
                                        <div key={ride._id} className={`bg-white p-4 rounded-lg shadow-sm ${ride.status === 'cancelled' ? 'border border-red-200' : ''}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="text-sm text-gray-500">
                                                        <span>Booked on: {formattedBookingDate}</span>
                                                        <span className="ml-2">{formattedBookingTime}</span>
                                                    </div>
                                                    {scheduledTimeDisplay && (
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            <span>Scheduled for: {scheduledTimeDisplay.date}</span>
                                                            <span className="ml-2">{scheduledTimeDisplay.time}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                    {statusInfo.text}
                                                </span>
                                            </div>
                                            <div className="space-y-2"> {/* Increased vertical spacing */}
                                                <div className="flex justify-between items-start">
                                                    <span className="text-gray-600 text-sm w-1/4">From</span>
                                                    <span className="font-medium text-sm text-right leading-5 w-3/4">{ride.pickupAddress}</span>
                                                </div>

                                                <div className="flex justify-between items-start">
                                                    <span className="text-gray-600 text-sm w-1/4">To</span>
                                                    <span className="font-medium text-sm text-right w-3/4">{ride.destinationAddress}</span>
                                                </div>

                                                <div className="flex justify-between items-start">
                                                    <span className="text-gray-600 text-sm w-1/4">Fare</span>
                                                    <span className="font-medium text-right w-3/4">₹{ride.fare}</span>
                                                </div>

                                                {ride.duration && (
                                                    <div className="flex justify-between text-sm text-gray-500">
                                                    <span className="w-1/4 text-sm">Duration</span>
                                                    <span className="w-3/4 text-right">{Math.round(ride.duration / 60)} mins</span>
                                                    </div>
                                                )}

                                                {ride.distance && (
                                                    <div className="flex justify-between text-sm text-gray-500">
                                                    <span className="w-1/4 text-sm ">Distance</span>
                                                    <span className="w-3/4 text-right">{(ride.distance / 1000).toFixed(1)} km</span>
                                                    </div>
                                                )}
                                                </div>

                                            {ride.captain && (
                                                <div className="mt-3 pt-3 border-t border-gray-100">
                                                    <div className="text-sm font-medium text-gray-600 mb-1">Captain Details</div>
                                                    <div className="text-sm">
                                                        <span className="font-medium">
                                                            {`${ride.captain.fullname.firstname} ${ride.captain.fullname.lastname}`}
                                                        </span>
                                                        <span className="ml-2 text-gray-500">{ride.captain.phone}</span>
                                                    </div>
                                                    {ride.captain.vehicle && (
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            Vehicle: {ride.captain.vehicle.plate}
                                                            {ride.captain.vehicle.color && ` (${ride.captain.vehicle.color})`}
                                                            {ride.captain.vehicle.type && ` - ${ride.captain.vehicle.type}`}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                No ride history available
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Settings</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <h4 className="font-medium">Notifications</h4>
                                    <p className="text-sm text-gray-600">Manage your notification preferences</p>
                                </div>
                                <i className="ri-arrow-right-s-line text-xl"></i>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <h4 className="font-medium">Payment Methods</h4>
                                    <p className="text-sm text-gray-600">Add or remove payment methods</p>
                                </div>
                                <i className="ri-arrow-right-s-line text-xl"></i>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <h4 className="font-medium">Privacy</h4>
                                    <p className="text-sm text-gray-600">Manage your privacy settings</p>
                                </div>
                                <i className="ri-arrow-right-s-line text-xl"></i>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <h4 className="font-medium">Help & Support</h4>
                                    <p className="text-sm text-gray-600">Get help with your account</p>
                                </div>
                                <i className="ri-arrow-right-s-line text-xl"></i>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile; 