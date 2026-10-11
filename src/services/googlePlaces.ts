import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const REGION = process.env.EXPO_PUBLIC_GOOGLE_PLACES_REGION ?? 'ng';

export const HAS_PLACES_KEY = Boolean(API_KEY);

const AUTOCOMPLETE_ENDPOINT = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const DETAILS_ENDPOINT = 'https://maps.googleapis.com/maps/api/place/details/json';

export interface PlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

export interface ResolvedPlace {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export function newSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function autocomplete(
  query: string,
  sessionToken: string,
  bias?: { lat: number; lng: number },
): Promise<PlacePrediction[]> {
  if (!API_KEY || !query.trim()) return [];

  const { data } = await axios.get(AUTOCOMPLETE_ENDPOINT, {
    timeout: 8000,
    params: {
      input: query,
      key: API_KEY,
      sessiontoken: sessionToken,
      components: `country:${REGION}`,
      ...(bias ? { location: `${bias.lat},${bias.lng}`, radius: 50_000 } : {}),
    },
  });

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(data.error_message || `Google Places returned ${data.status}`);
  }

  return (data.predictions ?? []).map((prediction: GooglePrediction) => ({
    placeId: prediction.place_id,
    mainText: prediction.structured_formatting?.main_text ?? prediction.description,
    secondaryText: prediction.structured_formatting?.secondary_text ?? '',
    description: prediction.description,
  }));
}

export async function getPlaceDetails(
  placeId: string,
  sessionToken: string,
): Promise<ResolvedPlace> {
  if (!API_KEY) throw new Error('Google Places is not configured');

  const { data } = await axios.get(DETAILS_ENDPOINT, {
    timeout: 8000,
    params: {
      place_id: placeId,
      key: API_KEY,
      sessiontoken: sessionToken,
      fields: 'place_id,name,formatted_address,geometry/location',
    },
  });

  if (data.status !== 'OK') {
    throw new Error(data.error_message || `Google Place Details returned ${data.status}`);
  }

  const result: GooglePlaceDetailsResult = data.result;
  return {
    placeId: result.place_id,
    name: result.name,
    address: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
  };
}

interface GooglePrediction {
  place_id: string;
  description: string;
  structured_formatting?: { main_text: string; secondary_text?: string };
}

interface GooglePlaceDetailsResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
}
