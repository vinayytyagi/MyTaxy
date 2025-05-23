// in this we service section we fetch the data from the adress 
const captainModel = require('../models/captain.model');
const axios=require('axios');
module.exports.getAddressCoordinate=async(address)=>{

    const apiKey=process.env.GOOGLE_MAPS_API;
    //this is to convert the address given by us int he api readable format 
    const encodedAddress = encodeURIComponent(address);
    // now me make api call 
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    try {
        const response=await axios.get(url);
        if(response.data.status === 'OK'){
            const location=response.data.results[0].geometry.location;
            return {
                ltd:location.lat,
                lng:location.lng
            };
        }else{
            throw new Error('Unable to fetch the coordinates');
        }
    } catch (error) {
        console.error('Error fetching coordinates:', error.message);
        throw error;
    }
}

module.exports.getAddressFromCoordinates = async (lat, lng) => {
    const apiKey = process.env.GOOGLE_MAPS_API;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    
    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK') {
            return response.data.results[0].formatted_address;
        } else {
            throw new Error('Unable to fetch the address');
        }
    } catch (error) {
        console.error('Error fetching address:', error.message);
        throw error;
    }
}

//the response is shown in this format 
/*

{
  data: {
    results: [ 
      {
        geometry: {
          location: {
            lat: 37.4224764,
            lng: -122.0842499
          }
        }
      }
    ],
    status: "OK"
  },
  status: 200,
  headers: { ... },
  config: { ... },
  request: { ... }
}

*/ 

module.exports.getDistanceTime=async(origin,destination)=>{
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    const apiKey = process.env.GOOGLE_MAPS_API;

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

    try {


        const response = await axios.get(url);
        if (response.data.status === 'OK') {

            if (response.data.rows[ 0 ].elements[ 0 ].status === 'ZERO_RESULTS') {
                throw new Error('No routes found');
            }

            return response.data.rows[ 0 ].elements[ 0 ];
        } else {
            throw new Error('Unable to fetch distance and time');
        }

    } catch (err) {
        console.error(err);
        throw err;
    }
    
}

// the response shoen by this api 
/*


{
  "destination_addresses": ["Los Angeles, CA, USA"],
  "origin_addresses": ["New York, NY, USA"],
  "rows": [
    {
      "elements": [
        {
          "distance": {
            "text": "4,489 km",
            "value": 4489000
          },
          "duration": {
            "text": "1 day 18 hours",
            "value": 151200
          },
          "status": "OK"
        }
      ]
    }
  ],
  "status": "OK"
}


*/
module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('query is required');
    }

    const apiKey = process.env.GOOGLE_MAPS_API;
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&components=country:in&types=address`;

    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS') {
            return response.data.predictions.map(prediction => prediction.description).filter(value => value);
        } else {
            console.error('Google Places API error:', response.data);
            throw new Error(`Google Places API error: ${response.data.status}`);
        }
    } catch (err) {
        console.error('Error in getAutoCompleteSuggestions:', err);
        if (err.response) {
            console.error('API Response:', err.response.data);
        }
        throw new Error('Unable to fetch suggestions');
    }
}

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius, vehicleType) => {
  // Map 'moto' to 'motorcycle' for database query
  const dbVehicleType = vehicleType === 'moto' ? 'motorcycle' : vehicleType;

  // radius in km
  console.log('Searching for captains with params:', {
    ltd,
    lng,
    radius,
    vehicleType,
    dbVehicleType
  });

  // First check all captains with matching vehicle type
  const allCaptainsWithVehicle = await captainModel.find({
    'vehicle.vehicleType': dbVehicleType
  });
  console.log('All captains with vehicle type:', allCaptainsWithVehicle.length);

  // Then check captains in radius without vehicle type filter
  const captainsInRadius = await captainModel.find({
    location: {
        $geoWithin: {
            $centerSphere: [ [ lng, ltd ], radius / 6371 ]
        }
    }
  });
  console.log('All captains in radius:', captainsInRadius.length);
  console.log('Captains in radius details:', JSON.stringify(captainsInRadius, null, 2));

  // Now check with both filters
  const captains = await captainModel.find({
    location: {
        $geoWithin: {
            $centerSphere: [ [ lng, ltd ], radius / 6371 ]
        }
    },
    'vehicle.vehicleType': dbVehicleType
  });

  console.log('Final filtered captains:', captains.length);
  if (captains.length === 0) {
    console.log('Sample captain data:', await captainModel.findOne());
  }

  return captains;
}
