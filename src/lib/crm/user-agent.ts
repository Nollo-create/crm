// A tiny, dependency-free user-agent describer for the "active sessions" view —
// just enough to show "Chrome on Windows" instead of a raw UA string. Order
// matters (Edge/Opera UAs contain "Chrome"; Chrome's contains "Safari"). Pure.

export interface DeviceInfo {
  browser: string;
  os: string;
  deviceType: "Mobile" | "Tablet" | "Desktop";
  label: string;
}

function browserOf(ua: string): string {
  if (/\bEdg(e|A|iOS)?\//.test(ua)) return "Edge";
  if (/\bOPR\/|\bOpera\b/.test(ua)) return "Opera";
  if (/\bSamsungBrowser\//.test(ua)) return "Samsung Internet";
  if (/\bFirefox\/|\bFxiOS\//.test(ua)) return "Firefox";
  if (/\bChrome\/|\bCriOS\//.test(ua)) return "Chrome";
  if (/\bSafari\//.test(ua) && /\bVersion\//.test(ua)) return "Safari";
  return "Unknown browser";
}

function osOf(ua: string): string {
  if (/\bWindows NT\b/.test(ua)) return "Windows";
  if (/\biPhone\b/.test(ua)) return "iPhone";
  if (/\biPad\b/.test(ua)) return "iPad";
  if (/\bAndroid\b/.test(ua)) return "Android";
  if (/\bCrOS\b/.test(ua)) return "ChromeOS";
  if (/\bMac OS X\b|\bMacintosh\b/.test(ua)) return "macOS";
  if (/\bLinux\b/.test(ua)) return "Linux";
  return "Unknown OS";
}

function deviceTypeOf(ua: string): "Mobile" | "Tablet" | "Desktop" {
  if (/\biPad\b/.test(ua) || /\bTablet\b/.test(ua) || (/\bAndroid\b/.test(ua) && !/\bMobi/.test(ua))) return "Tablet";
  if (/\bMobi/.test(ua) || /\biPhone\b|\biPod\b/.test(ua)) return "Mobile";
  return "Desktop";
}

export function describeUserAgent(ua: string | null | undefined): DeviceInfo {
  const s = (ua ?? "").trim();
  if (!s) return { browser: "Unknown browser", os: "Unknown device", deviceType: "Desktop", label: "Unknown device" };
  const browser = browserOf(s);
  const os = osOf(s);
  const deviceType = deviceTypeOf(s);
  const known = browser !== "Unknown browser" || os !== "Unknown OS";
  const label = known ? `${browser} on ${os}` : "Unknown device";
  return { browser, os, deviceType, label };
}
