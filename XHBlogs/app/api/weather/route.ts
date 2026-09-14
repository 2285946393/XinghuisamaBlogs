// app/api/weather/route.ts
// 免密钥天气：改用 Open-Meteo（无需任何 API Key）。
// 返回结构与前端 WeatherWidget 期望的和风 V7 格式保持一致：{ code:"200", now:{ temp, text, icon } }
import { NextResponse } from 'next/server';

// 北京坐标，与前端 WeatherWidget 硬编码的"北京市"保持一致
const LATITUDE = '39.9042';
const LONGITUDE = '116.4074';

type WeatherInfo = { text: string; icon: string };

// WMO 天气码 -> { 中文描述, 和风风格 icon 码 }
// icon 码沿用前端 getWeatherIcon 的区间判断：100 晴 / 101-104 多云阴 / 300-399 雨 / 400-499 雪 / 150-153 夜间晴
function mapWeather(code: number, isDay: boolean): WeatherInfo {
  if (code === 0) return isDay ? { text: '晴', icon: '100' } : { text: '晴', icon: '150' };
  if (code === 1 || code === 2) return isDay ? { text: '多云', icon: '101' } : { text: '多云', icon: '151' };
  if (code === 3) return { text: '阴', icon: '104' };
  if (code === 45 || code === 48) return { text: '雾', icon: '500' };
  if (code >= 51 && code <= 57) return { text: '毛毛雨', icon: '306' };
  if (code >= 61 && code <= 67) return { text: '雨', icon: '307' };
  if (code >= 80 && code <= 82) return { text: '阵雨', icon: '308' };
  if (code >= 71 && code <= 77) return { text: '雪', icon: '408' };
  if (code === 85 || code === 86) return { text: '阵雪', icon: '410' };
  if (code === 95 || code === 96 || code === 99) return { text: '雷阵雨', icon: '303' };
  return { text: '未知', icon: '101' };
}

export async function GET() {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${LATITUDE}&longitude=${LONGITUDE}` +
    `&current=temperature_2m,weather_code,is_day` +
    `&timezone=Asia%2FShanghai`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ code: '500', message: `上游天气服务异常: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    const current = data?.current;
    if (!current || typeof current.temperature_2m !== 'number') {
      return NextResponse.json({ code: '500', message: '天气数据格式异常' }, { status: 500 });
    }

    const isDay = current.is_day === 1;
    const { text, icon } = mapWeather(current.weather_code, isDay);

    return NextResponse.json({
      code: '200',
      now: {
        temp: String(Math.round(current.temperature_2m)),
        text,
        icon,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ code: '500', message: err?.message || '天气请求失败' }, { status: 500 });
  }
}
