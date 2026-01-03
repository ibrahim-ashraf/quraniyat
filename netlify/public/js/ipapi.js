export async function getIpapiData() {
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) throw new Error("فشل جلب بيانات ipapi");
    const data = await response.json();
    return data; // مثال: { ip, city, region, country_name, latitude, longitude, ... }
  } catch (err) {
    console.error("ipapi error:", err);
    return null;
  }
}
