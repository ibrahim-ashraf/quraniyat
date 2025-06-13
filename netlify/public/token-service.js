// وظائف إدارة التوكن
export function saveToken(token, isTemporary = false) {
  if (!token) return;
  if (isTemporary) {
    sessionStorage.setItem('temp_token', token);
  }
  // تخزين التوكن في localStorage
  localStorage.setItem('auth_token', token);
}

export function getToken() {
  return localStorage.getItem('auth_token');
}

export function removeToken() {
  localStorage.removeItem('auth_token');
}

export function getTokenPayload() {
  const token = getToken();
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export async function validateToken() {
  const token = getToken();
  if (!token) return false;

  try {
    const response = await fetch('/.netlify/functions/verify-token', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function refreshToken() {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch('/.netlify/functions/refresh-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.token) {
      saveToken(data.token);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}