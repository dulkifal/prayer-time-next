'use client';

import { useEffect, useState } from 'react';
import { getPrayerData } from '../lib/prayer-times';

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  Firstthird: string;
  Lastthird: string;
}

interface HijriDate {
  date: string;
  month: {
    en: string;
  };
  year: string;
}

interface GregorianDate {
  date: string;
}

interface Qibla {
  direction: {
    degrees: number;
  };
}

interface PrayerData {
  times: PrayerTimes;
  date: {
    hijri: HijriDate;
    gregorian: GregorianDate;
  };
  qibla: Qibla;
}

interface CompassProps {
  qiblaDirection: number;
  heading: number;
}

const Compass: React.FC<CompassProps> = ({ qiblaDirection, heading }) => {
  const compassRotation = -heading;
  const qiblaRotation = qiblaDirection - heading;

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg id="compass" width="192" height="192" xmlns="http://www.w3.org/2000/svg" style={{ transform: `rotate(${compassRotation}deg)` }}>
        <circle cx="96" cy="96" r="90" stroke="black" strokeWidth="2" fill="white" />
        <text x="91" y="25" fontFamily="Arial" fontSize="20" fill="black">N</text>
        <text x="165" y="101" fontFamily="Arial" fontSize="20" fill="black">E</text>
        <text x="91" y="175" fontFamily="Arial" fontSize="20" fill="black">S</text>
        <text x="15" y="101" fontFamily="Arial" fontSize="20" fill="black">W</text>
        <line x1="96" y1="30" x2="96" y2="162" stroke="black" strokeWidth="1" />
        <line x1="30" y1="96" x2="162" y2="96" stroke="black" strokeWidth="1" />
      </svg>
      <div
        className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
        style={{ transform: `rotate(${qiblaRotation}deg)` }}
      >
        <svg width="24" height="120" viewBox="0 0 24 120">
          <polygon points="12,0 24,120 0,120" fill="rgba(255, 0, 0, 0.7)" />
        </svg>
      </div>
    </div>
  );
};

export default function Home() {
  const [prayerData, setPrayerData] = useState<{ data: PrayerData; location: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha) {
        setHeading(event.alpha);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const data = await getPrayerData(latitude.toString(), longitude.toString());
            setPrayerData(data as { data: PrayerData; location: string });
          } catch (err) {
            setError('Could not fetch prayer data.');
          }
          setLoading(false);
        },
        (err) => {
          setError('Please allow location access to see prayer times.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
    }
  }, []);
  

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 font-sans dark:bg-gray-900">
      <main className="w-full max-w-4xl p-4">
        {loading && <p className="text-center text-gray-500">Loading...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {prayerData && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
                {currentTime.toLocaleTimeString()}
              </h1>
              {prayerData.location && (
                <p className="text-lg text-gray-600 dark:text-gray-300">{prayerData.location}</p>
              )}
              <div className="flex justify-center gap-4 text-gray-500 dark:text-gray-400 mt-2">
                <span>{prayerData.data.date.gregorian.date}</span>
                <span>|</span>
                <span>
                  {prayerData.data.date.hijri.month.en} {prayerData.data.date.hijri.date.split('-')[2]}, {prayerData.data.date.hijri.year}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Sunrise</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {prayerData.data.times.Sunrise}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Qibla</p>
                <Compass qiblaDirection={prayerData.data.qibla.direction.degrees} heading={heading} />
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800 dark:text-white">Prayer Times</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {Object.entries(prayerData.data.times)
                  .filter(([key]) => !['Sunrise', 'Sunset', 'Imsak', 'Midnight', 'Firstthird', 'Lastthird'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg text-center">
                      <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">{key}</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-white">{value}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

