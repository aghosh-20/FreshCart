
import * as Location from 'expo-location';

export async function getCurrentLocation() {
  const { status } =
    await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  const addresses = await Location.reverseGeocodeAsync({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    address: addresses[0],
  };
}
