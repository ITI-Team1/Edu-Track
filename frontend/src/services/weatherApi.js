// Simple weather service using Open-Meteo (no API key required)
// Docs: https://open-meteo.com/

const PORT_SAID_COORDS = { lat: 31.2653, lon: 32.3019 };

export async function fetchPortSaidWeather() {
  const { lat, lon } = PORT_SAID_COORDS;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Africa%2FCairo`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('فشل في جلب حالة الطقس');
  const data = await res.json();
  const cw = data?.current_weather;
  if (!cw) throw new Error('لا توجد بيانات طقس حالية');
  return {
    temperature: cw.temperature, // °C
    windspeed: cw.windspeed, // km/h
    weathercode: cw.weathercode,
    is_day: cw.is_day, // 1/0
    time: cw.time,
  };
}

// Map Open-Meteo weather code to Arabic description and a simple emoji icon
export function describeWeatherCode(code) {
  const map = {
    0: { text: 'صافي', icon: '☀️' },
    1: { text: 'صحو غالباً', icon: '🌤️' },
    2: { text: 'غائم جزئياً', icon: '⛅' },
    3: { text: 'غائم كلياً', icon: '☁️' },
    45: { text: 'ضباب', icon: '🌫️' },
    48: { text: 'ضباب متجمد', icon: '🌫️' },
    51: { text: 'رذاذ خفيف', icon: '🌦️' },
    53: { text: 'رذاذ متوسط', icon: '🌦️' },
    55: { text: 'رذاذ كثيف', icon: '🌧️' },
    56: { text: 'رذاذ متجمد خفيف', icon: '🌨️' },
    57: { text: 'رذاذ متجمد كثيف', icon: '🌨️' },
    61: { text: 'مطر خفيف', icon: '🌦️' },
    63: { text: 'مطر متوسط', icon: '🌧️' },
    65: { text: 'مطر غزير', icon: '🌧️' },
    66: { text: 'مطر متجمد خفيف', icon: '🌨️' },
    67: { text: 'مطر متجمد غزير', icon: '🌨️' },
    71: { text: 'ثلوج خفيفة', icon: '❄️' },
    73: { text: 'ثلوج متوسطة', icon: '❄️' },
    75: { text: 'ثلوج كثيفة', icon: '❄️' },
    77: { text: 'حبات ثلج', icon: '❄️' },
    80: { text: 'زخات مطر خفيفة', icon: '🌦️' },
    81: { text: 'زخات مطر', icon: '🌧️' },
    82: { text: 'زخات مطر غزيرة', icon: '🌧️' },
    85: { text: 'زخات ثلج خفيفة', icon: '❄️' },
    86: { text: 'زخات ثلج كثيفة', icon: '❄️' },
    95: { text: 'عاصفة رعدية', icon: '⛈️' },
    96: { text: 'عاصفة رعدية مع برد', icon: '⛈️' },
    99: { text: 'عاصفة رعدية شديدة مع برد', icon: '⛈️' },
  };
  return map[code] || { text: 'غير متوفر', icon: 'ℹ️' };
}
