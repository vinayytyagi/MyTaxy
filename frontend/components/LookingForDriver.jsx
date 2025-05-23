import React from 'react'

const LookingForDriver = (props) => {
  return (
    <div>
      <div className="w-full h-2 rounded-sm bg-gray-200 overflow-hidden">
        <div className="w-full h-full bg-green-500 animate-loading"></div>
      </div>
      <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
        props.setVehicleFound(false)
      }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
      <h3 className='text-2xl font-semibold mb-5'>Looking for a Driver</h3>

      <div className='flex gap-2 justify-between flex-col items-center'>
        <img className='h-20' src="https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg" alt="" />
        <div className='w-full mt-5'>
          <div className='flex items-center gap-5 px-1 py-3 border-b-2'>
            <i className="ri-map-pin-user-fill text-3xl"></i>
            <div>
              <h3 className='text-lg font-semibold'>Pickup</h3>
              <p className='text-sm -mt-1 text-gray-600'>{props.pickup}</p>
            </div>
          </div>
          <div className='flex items-center gap-5 px-1 py-3 border-b-2'>
            <i className="ri-map-pin-2-fill text-3xl"></i>
            <div>
              <h3 className='text-lg font-semibold'>Destination</h3>
              <p className='text-sm -mt-1 text-gray-600'>{props.destination}</p>
            </div>
          </div>
          <div className='flex items-center gap-5 px-1 py-3 border-b-2'>
            <i className="ri-currency-line text-3xl"></i>
            <div>
              <h3 className='text-lg font-semibold'>₹{props.fare[ props.vehicleType ]} </h3>
              <p className='text-sm -mt-1 text-gray-600'>Cash</p>
            </div>
          </div>
          <div className='flex items-center gap-5 px-1 py-3'>
            <i className="ri-shield-keyhole-line text-3xl"></i>
            <div>
              <h3 className='text-lg font-semibold'>OTP</h3>
              <p className='text-sm -mt-1 text-gray-600'>{props.ride?.otp}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LookingForDriver