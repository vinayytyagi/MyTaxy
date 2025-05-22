import React, { useContext, useEffect, useState } from 'react';
import { CaptainDataContext } from '../context/CaptainContext';
import { SocketContext } from '../context/SocketContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'remixicon/fonts/remixicon.css';

const CaptainProfile = () => {
  const { captain, setCaptain } = useContext(CaptainDataContext);
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();
  const [rideHistory, setRideHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    vehicleType: '',
    plate: '',
    color: ''
  });

  useEffect(() => {
    const fetchRideHistory = async () => {
      try {
        const token = localStorage.getItem('captainToken');
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/captain/history`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setRideHistory(response.data.rides || []);
      } catch (err) {
        console.error('Error fetching ride history:', err);
        setError('Failed to load ride history');
      } finally {
        setLoading(false);
      }
    };

    fetchRideHistory();
  }, []);

  useEffect(() => {
    if (captain) {
      // console.log('Raw captain data in useEffect:', captain); // Debug log
      setFormData({
        firstname: captain.fullname?.firstname || '',
        lastname: captain.fullname?.lastname || '',
        email: captain.email || '',
        phone: captain.phone || '',
        vehicleType: captain.vehicle?.vehicleType || '',
        plate: captain.vehicle?.plate || '',
        color: captain.vehicle?.color || ''
      });
    }
  }, [captain]);

  const handleLogout = () => {
    localStorage.removeItem('captainToken');
    setCaptain(null);
    if (socket) {
      socket.disconnect();
    }
    navigate('/captain-login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
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
      const token = localStorage.getItem('captainToken');
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/captains/profile/photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.profilePhoto) {
        setCaptain({ ...captain, profilePhoto: response.data.profilePhoto });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError(error.response?.data?.message || 'Failed to upload profile photo');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setUploading(true);

    // Validate required fields
    const requiredFields = {
      firstname: 'First Name',
      lastname: 'Last Name',
      email: 'Email',
      phone: 'Phone Number',
      vehicleType: 'Vehicle Type',
      plate: 'Vehicle Plate',
      color: 'Vehicle Color'
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !formData[field])
      .map(([_, label]) => label);

    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setUploading(false);
      return;
    }

    try {
      const token = localStorage.getItem('captainToken');
      const updateData = {
        fullname: {
          firstname: formData.firstname,
          lastname: formData.lastname
        },
        email: formData.email,
        phone: formData.phone,
        vehicle: {
          vehicleType: formData.vehicleType,
          plate: formData.plate,
          color: formData.color
        }
      };

      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/captains/profile`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.data) {
        const currentCaptain = captain || {};
        const updatedCaptain = {
          ...currentCaptain,
          fullname: {
            ...currentCaptain.fullname,
            ...response.data.data.fullname
          },
          vehicle: {
            ...currentCaptain.vehicle,
            ...response.data.data.vehicle
          },
          email: response.data.data.email || currentCaptain.email,
          phone: response.data.data.phone || formData.phone,
          _id: response.data.data._id || currentCaptain._id
        };
        
        setCaptain(updatedCaptain);
        
        const storedCaptain = localStorage.getItem('captainData');
        if (storedCaptain) {
          localStorage.setItem('captainData', JSON.stringify(updatedCaptain));
        }
        
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      } else {
        throw new Error('No data received from server');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.join(', ') || 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  if (!captain) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex justify-between items-center">
        <button 
          onClick={() => navigate('/captain-home')}
          className="text-gray-600 hover:text-gray-800"
        >
          <i className="ri-arrow-left-line text-2xl"></i>
        </button>
        <h1 className="text-xl font-bold">Captain Profile</h1>
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
            {captain.profilePhoto ? (
              <img 
                src={captain.profilePhoto} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600">
                {captain.fullname.firstname.charAt(0).toUpperCase()}
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
              {captain.fullname.firstname} {captain.fullname.lastname}
            </h2>
            <p className="text-gray-600">{captain.email}</p>
            <p className="text-gray-600">{captain.phone || 'Not set'}</p>
          </div>
        </div>

        {/* Edit Profile Button */}
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      minLength="10"
                      pattern="[0-9]{10,}"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Vehicle Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Vehicle Type</option>
                      <option value="car">Car</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Vehicle Plate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="plate"
                      value={formData.plate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      minLength="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Vehicle Color <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      minLength="3"
                    />
                  </div>
                </div>
                {error && (
                  <div className="text-red-500 text-sm mt-2">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-green-500 text-sm mt-2">
                    {success}
                  </div>
                )}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploading ? 'Saving...' : 'Save Changes'}
                  </button>
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
                        {captain.fullname.firstname} {captain.fullname.lastname}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Email</span>
                      <span className="font-medium">{captain.email}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Phone</span>
                      <span className="font-medium">{captain.phone || 'Not set'}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Vehicle Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Vehicle Type</span>
                      <span className="font-medium">{captain.vehicle?.vehicleType || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Plate Number</span>
                      <span className="font-medium">{captain.vehicle?.plate || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Color</span>
                      <span className="font-medium">{captain.vehicle?.color || 'Not set'}</span>
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
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-4">{error}</div>
            ) : rideHistory.length > 0 ? (
              <div className="space-y-4">
                {rideHistory.map((ride) => (
                  <div key={ride._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">
                          {ride.pickupAddress} → {ride.destinationAddress}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(ride.bookingTime)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                        {ride.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Fare: ₹{ride.fare}</p>
                      {ride.distance && (
                        <p>Distance: {(ride.distance / 1000).toFixed(1)} km</p>
                      )}
                    </div>
                  </div>
                ))}
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
                  <h4 className="font-medium">Payment Settings</h4>
                  <p className="text-sm text-gray-600">Manage your payment settings</p>
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

export default CaptainProfile; 