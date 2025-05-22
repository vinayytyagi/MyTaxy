import React from 'react'

const RidePopUp = (props) => {
  return (
    <div>
        <h5 className='p-3 text-center w-[93%] absolute top-0' 
                onClick={()=>{
                   props.setRidePopupPanel(false);
            }}><i className=" text-2xl text-gray-300 ri-arrow-down-wide-fill"></i></h5>
        <h3 className='text-2xl font-semibold mb-5'>New Ride Available!</h3>

        <div className='flex items-center justify-between bg-yellow-400 rounded-lg p-3'> 
                <div className='flex items-center justify-start gap-3'>
                    {props.ride?.user.profilePhoto ? (
                        <img 
                            className='h-12 w-12 rounded-full object-cover' 
                            src={props.ride?.user.profilePhoto} 
                            alt={`${props.ride?.user.fullname.firstname} ${props.ride?.user.fullname.lastname}`} 
                        />
                    ) : (
                        <div className='h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center text-lg font-bold text-gray-600'>
                            {props.ride?.user.fullname.firstname?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                    <h4 className='text-lg font-medium'>{props.ride?.user.fullname.firstname+" "+props.ride?.user.fullname.lastname}</h4>
                </div> 


                <h5 className='text-lg font-semibold'>{props.ride?.distance?.toFixed(1)} KM</h5>
             
        </div>

        <div className='flex gap-2 justify-between flex-col items-center'>
            <div className='w-full mt-5'>
                <div className='flex items-center gap-5 px-1 py-3 border-b-2 border-gray-200'>
                    <i className="ri-map-pin-2-fill text-3xl"></i>
                    <div>
                        <h3 className='text-lg font-semibold'>Pickup</h3>
                        <p className='text-sm -mt-1 text-gray-600'>{props.ride?.pickupAddress}</p>
                    </div>
                </div>
                <div className='flex items-center gap-5 px-1 py-3 border-b-2 border-gray-200'>
                    <i className="ri-map-pin-2-fill text-3xl"></i>
                    <div>
                        <h3 className='text-lg font-semibold'>Destination</h3>
                        <p className='text-sm -mt-1 text-gray-600'>{props.ride?.destinationAddress}</p>
                    </div>
                </div>
                <div className='flex items-center gap-5 px-1 py-3 '>
                    <i className="ri-currency-line text-3xl"></i>
                    <div>
                        <h3 className='text-lg font-semibold'>₹{props.ride?.fare}</h3>
                        <p className='text-gray-600 -mt-1'>Cash</p>
                    </div>
                </div>
            </div>
            <div className='w-full mt-5 flex items-center justify-between'>
                <button onClick={()=>{
                        props.setRidePopupPanel(false);

                    }} className=' bg-gray-300 text-gray-700 font-semibold p-3 px-10 rounded-lg' >Ignore</button>
                    
                <button onClick={()=>{
                        props.setConfirmRidePopupPanel(true)
                        props.confirmRide()
                    }} className='  bg-green-600 text-white font-semibold p-3 px-10 rounded-lg' >Accept</button>
            </div>
        </div>
    </div>
  )
}

export default RidePopUp