async function getLocationName(lat: string, lon: string) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'PrayerTimeNext/1.0' } });
    const data = await response.json();
    return data.display_name;
  } catch (error) {
    console.error('Request failed:', error);
    return null;
  }
}

async function getPrayerTimes(lat: string, lon: string) {
  const method = '3';
  const school = '1';
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;

  const prayerTimesUrl = `https://islamicapi.com/api/v1/prayer-time/?lat=${lat}&lon=${lon}&method=${method}&school=${school}&api_key=${apiKey}`;

  try {
    const prayerTimesResponse = await fetch(prayerTimesUrl);
    const prayerTimesData = await prayerTimesResponse.json();

    if (prayerTimesData.status === 'success') {
      return prayerTimesData.data;
    } else {
      throw new Error(prayerTimesData.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Request failed:', error);
    return null;
  }
}

export async function getPrayerData(lat: string, lon: string) {
  try {
    const [times, location] = await Promise.all([
      getPrayerTimes(lat, lon),
      getLocationName(lat, lon),
    ]);

    return { data: times, location };
  } catch (error) {
    console.error('Failed to get prayer data:', error);
    return null;
  }
}
