import React, { useState, useEffect } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, Vibration } from 'react-native';
import axios from 'axios';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';

export default function App() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('restaurant');
  const [lastPlaceSpoken, setLastPlaceSpoken] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [isGoActive, setIsGoActive] = useState(false);
  const [route, setRoute] = useState([]);
  const [region, setRegion] = useState({
    latitude: 45.5017,
    longitude: -73.5673,
    latitudeDelta: 0.03,
    longitudeDelta: 0.01,
  });

  const googleMapsApiKey = ''; // Replace with your API key
  const location = { latitude: 45.5017, longitude: -73.5673 }; // Montreal's coordinates
  const radius = 5000;
  const proximityThreshold = 50; // Distance to trigger vibration (in meters)

  const categories = {
    restaurant: 'restaurant',
    metro: 'subway_station',
    park: 'hospital',
    museum: 'museum',
  };
  const categoryLabels = {
    restaurant: 'Resto',
    metro: 'Metro',
    park: 'Health',
    museum: 'Visit',
  };

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const userLocation = await Location.getCurrentPositionAsync();
        console.log("CURRENTLOCATION: ", userLocation)
        setRegion({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.01,
        });
        setLocationLoading(false);
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationLoading(false);
      }
    };
  
    getUserLocation();

    const fetchPlaces = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
          {
            params: {
              location: `${location.latitude},${location.longitude}`,
              radius: radius,
              type: categories[category],
              key: googleMapsApiKey,
            },
          }
        );
        setPlaces(response.data.results);
      } catch (error) {
        console.error('Error fetching places:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [category]);

  const speak = (text) => {
    if (!isGoActive && lastPlaceSpoken !== text) {
      Speech.speak(text);
      Vibration.vibrate();
      setLastPlaceSpoken(text);
    }
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const checkProximity = (fingerPos) => {
    if (!fingerPos || isGoActive) return;

    const distanceToUser = getDistance(
      fingerPos.latitude,
      fingerPos.longitude,
      region.latitude,
      region.longitude
    );
  
    if (distanceToUser <= proximityThreshold) {
      speak("You are here");

    }

    places.forEach((place) => {
      const distance = getDistance(
        fingerPos.latitude,
        fingerPos.longitude,
        place.geometry.location.lat,
        place.geometry.location.lng
      );
      if (distance <= proximityThreshold) {
        speak(place.name);
      }
    });
  };

  const interpolateRoute = (route, numPoints = 10) => {
    let interpolated = [];
    
    for (let i = 0; i < route.length - 1; i++) {
      let start = route[i];
      let end = route[i + 1];
  
      // Add the original waypoint
      interpolated.push(start);
  
      // Generate intermediate points
      for (let j = 1; j < numPoints; j++) {
        let fraction = j / numPoints;
        let lat = start.latitude + fraction * (end.latitude - start.latitude);
        let lng = start.longitude + fraction * (end.longitude - start.longitude);
        interpolated.push({ latitude: lat, longitude: lng });
      }
    }
  
    // Add the final waypoint
    interpolated.push(route[route.length - 1]);
  
    return interpolated;
  };
  
  // Generate a denser set of waypoints
  let detailedRoute = interpolateRoute(route, 10);

  const polylinePoints = route; 

  const handleMove = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

  const fingerPos = { latitude, longitude };
  console.log("POINTS")
  console.log(polylinePoints);
  console.log(detailedRoute);

  if (isGoActive && detailedRoute) {
  // Check if the user is close to any point along the polyline
  detailedRoute.forEach((point) => {
    const distance = getDistance(fingerPos.latitude, fingerPos.longitude, point.latitude, point.longitude);
    if (distance <= proximityThreshold) {
      Vibration.vibrate();  // Trigger vibration when close to a point
    }
  });};
    checkProximity({ latitude, longitude });
  
}
  const summarizeTotal = async (text, placeId) => {
    Speech.speak("Summary")
    try {
      const response = await axios.post('http://192.168.32.225:5000/summarize_and_get_reviews', {
        text: text,
        place_id: placeId
      });
      console.log('Article Summary:', response.data.article_summary);
      console.log('Reviews Summary:', response.data.reviews_summary);
      Speech.speak(response.data.article_summary);  // Speak the article summary
    } catch (error) {
      console.error('Error fetching summary and reviews:', error);
    }
  };

  const summarizeReviews = async (text, placeId) => {
    Speech.speak("Reviews")
    try {
      const response = await axios.post('http://192.168.32.225:5000/summarize_and_get_reviews', {
        text: text,
        place_id: placeId
      });
      console.log('Article Summary:', response.data.article_summary);
      console.log('Reviews Summary:', response.data.reviews_summary);
      Speech.speak(response.data.reviews_summary); // Speak the reviews summary
    } catch (error) {
      console.error('Error fetching summary and reviews:', error);
    }
  };

  const getAccesiblityReviews = async (text, placeId) => {
    Speech.speak("Accesibility")
    try {
      const response = await axios.post('http://192.168.32.225:5000/summarize_and_get_reviews', {
        text: text,
        place_id: placeId
      });
      console.log('Article Summary:', response.data.article_summary);
      console.log('Reviews Summary:', response.data.reviews_summary);
      console.log('Accessiblity Summary:', response.data.reviews_accessiblity);
      Speech.speak(response.data.reviews_accessiblity); // Speak the reviews summary
    } catch (error) {
      console.error('Error fetching accessability reviews:', error);
    }
  };

  const summarizeText = async (text) => {
    try {
      console.log('sending');
      const response = await axios.post(
        'http://192.168.32.225:5000/summarize',  // Make sure the URL points to your Flask API
        { text },  // Send the text in the request body
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Summary:', response.data.summary);  // Assuming the response contains the summary
      return response.data.summary;
    } catch (error) {
      console.error('Error fetching summary:', error);
      return 'Error summarizing text';
    }
  };

  const handleSummaryPress = async (event) => {
    // Check if lastPlaceSpoken is available
    if (!lastPlaceSpoken) return;

    // Find the place in the list that matches lastPlaceSpoken
    const place = places.find(p => p.name === lastPlaceSpoken);
    
    if (place) {
      const details = `
        Name: ${place.name}
        Address: ${place.vicinity}
        Rating: ${place.rating || 'No rating available'}
      `;
      console.log(place);
      const summary = await summarizeTotal(details, place.place_id);  // Get the summary of the details
      console.log(summary); // Speak the summarized text
    }
  };

  const handleRatingsPress = async (event) => {
    // Call the endpoint for ratings
    console.log('Ratings endpoint hit');

    // Check if lastPlaceSpoken is available
    if (!lastPlaceSpoken) return;

    // Find the place in the list that matches lastPlaceSpoken
    const place = places.find(p => p.name === lastPlaceSpoken);
    
    if (place) {
      const details = `
        Name: ${place.name}
        Address: ${place.vicinity}
        Rating: ${place.rating || 'No rating available'}
      `;
      console.log(place);
      const summary = await summarizeReviews(details, place.place_id);  // Get the summary of the details
      console.log(summary); // Speak the summarized text
    }
  };

  const handleAccessiblityPress = async (event) => {
    // Call the endpoint for ratings
    console.log('Accessibility endpoint hit');

    // Check if lastPlaceSpoken is available
    if (!lastPlaceSpoken) return;

    // Find the place in the list that matches lastPlaceSpoken
    const place = places.find(p => p.name === lastPlaceSpoken);
    
    if (place) {
      const details = `
        Name: ${place.name}
        Address: ${place.vicinity}
        Rating: ${place.rating || 'No rating available'}
      `;
      console.log(place);
      const summary = await getAccesiblityReviews(details, place.place_id);  // Get the summary of the details
      console.log(summary); // Speak the summarized text
    }
  };

  const handleGoPress = async () => {
    console.log("GO PRESSED")
    
    if (!lastPlaceSpoken) return;

    if (isGoActive) {
      setIsGoActive(!isGoActive);
      return
    }
    setIsGoActive(!isGoActive);
    Speech.speak("Let's go! Here is how to get there. ");
  
    // Find the place in the list that matches lastPlaceSpoken
    const place = places.find(p => p.name === lastPlaceSpoken);
    
    if (place) {
      const destination = place.geometry.location;
      const userLocation = region;
  
      // Call an API or logic to calculate the route
      try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
          params: {
            origin: `${userLocation.latitude},${userLocation.longitude}`,
            destination: `${destination.lat},${destination.lng}`,
            mode: 'walking', // You can change this to driving, bicycling, etc.
            key: googleMapsApiKey,
          },
        });
        console.log(response);
  
        const routeData = response.data.routes[0].legs[0].steps.map(step => ({
          latitude: step.end_location.lat,
          longitude: step.end_location.lng,
        }));
        
        // Add the origin to the route
        routeData.unshift({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        });

        // Prepare directions data for the server
      const directionsData = {
        routes: response.data.routes,
      };

      // Send the directions data to the server for summarization
      const summaryResponse = await axios.post('http://192.168.32.225:5000/summarize_directions', {
        directions_data: directionsData,
      });

      // Handle the summary response (e.g., route summary)
      if (summaryResponse.data.directions_summary) {
        Speech.speak(summaryResponse.data.directions_summary);  // Speak the summarized directions
        console.log('Directions summary:', summaryResponse.data.directions_summary);
      } else {
        Speech.speak("No summary available.");
      }
  
        // Set the route in state to display it on the map
        setRoute(routeData);
      } catch (error) {
        console.error('Error calculating route:', error);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isTooClose = (place, existingPlaces) => {
    const proximityThreshold = 200; // Distance to trigger vibration (in meters)
  
    // Check if the place is too close to any existing place
    return existingPlaces.some(existingPlace => {
      const distance = getDistance(
        place.geometry.location.lat,
        place.geometry.location.lng,
        existingPlace.geometry.location.lat,
        existingPlace.geometry.location.lng
      );
      return distance !== 0 && distance <= proximityThreshold;
    });
  };
  
  const filteredPlaces = [];
  places.forEach(place => {
    // Add place only if it's not too close to an already added place
    if (!isTooClose(place, filteredPlaces)) {
      filteredPlaces.push(place);
    }
  });

  if (locationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Fetching location...</Text>
      </View>
    );
  }
  

  return (
    <View style={styles.container}>
      {/* Category Buttons */}
      <View style={styles.buttonContainer}>
        {Object.keys(categories).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.button, category === key && styles.activeButton]}
            onPress={() => setCategory(key)}
          >
            <Text style={[styles.buttonText, category === key && styles.activeButtonText]}>
              {categoryLabels[key]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        zoomEnabled={false}
        scrollEnabled={false}
        moveOnMarkerPress={false}
        onPanDrag={handleMove}
      >
        {/* User's Location Pin */}
        <Marker
    coordinate={{
      latitude: region.latitude,
      longitude: region.longitude,
    }}
    title="You are here"
    pinColor="blue" // You can customize the pin color if you like
  />
        {filteredPlaces.map((place, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            }}
            title={place.name}
            description={place.vicinity}
          />
        ))}
        {/* Draw the route if available */}
  {route.length > 0 && (
    <Polyline
      coordinates={route}
      strokeColor="#0000FF"
      strokeWidth={4}
    />
  )}
      </MapView>

      {/* Logo Overlay */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>SenseNav</Text>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSummaryPress}>
          <Text style={styles.buttonText}>Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleRatingsPress}>
          <Text style={styles.buttonText}>Reviews</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleAccessiblityPress}>
          <Text style={styles.buttonText}>Accessibility</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleGoPress}>
          <Text style={styles.buttonText}>Go</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  button: {
    backgroundColor: '#ddd',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  activeButtonText: {
    color: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 20, // Optional, for better positioning
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: 'black',
    textAlign: 'center',
    backgroundColor: 'white',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
});
