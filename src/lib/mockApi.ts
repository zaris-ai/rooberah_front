import type { ActiveSession, Spot, Unit } from '../types/parking';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

function getTelegramInitData() {
  const tg = (window as any)?.Telegram?.WebApp;
  const initData = tg?.initData;
  const unsafeUser = tg?.initDataUnsafe?.user;

  console.log('[Telegram Debug] WebApp exists:', Boolean(tg));
  console.log('[Telegram Debug] initData exists:', Boolean(initData));
  console.log('[Telegram Debug] unsafe user:', unsafeUser);

  if (!initData) {
    console.error('[Telegram Debug] initData missing. window.Telegram:', (window as any)?.Telegram);
    throw new Error('Telegram initData پیدا نشد. مینی‌اپ باید داخل تلگرام باز شود.');
  }

  return initData;
}

function buildUrl(path: string) {
  const url = `${API_BASE_URL}${path}`;
  console.log('[API Debug] URL:', url);
  return url;
}

function buildHeaders(extraHeaders: Record<string, string> = {}) {
  const initData = getTelegramInitData();

  const headers = {
    Accept: 'application/json',
    'X-Telegram-Init-Data': initData,
    ...extraHeaders,
  };

  console.log('[API Debug] headers:', {
    ...headers,
    'X-Telegram-Init-Data': initData ? '[PRESENT]' : '[MISSING]',
  });

  return headers;
}

async function apiGet<T>(path: string): Promise<T> {
  console.log('[API Debug] GET start:', path);

  const response = await fetch(buildUrl(path), {
    method: 'GET',
    headers: buildHeaders(),
  });

  console.log('[API Debug] GET status:', response.status, response.statusText);

  const data = await response.json();
  console.log('[API Debug] GET response:', data);

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'خطا در دریافت اطلاعات.');
  }

  return data;
}

async function apiPost<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  console.log('[API Debug] POST start:', path);
  console.log('[API Debug] POST body:', body);

  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: buildHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(body),
  });

  console.log('[API Debug] POST status:', response.status, response.statusText);

  const data = await response.json();
  console.log('[API Debug] POST response:', data);

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'خطا در ثبت عملیات.');
  }

  return data;
}

export const parkingApi = {
  async getUnits(): Promise<Unit[]> {
    console.log('[Parking API] getUnits');
    const data = await apiGet<{ success: boolean; units: Unit[] }>('/parking/units/');
    return data.units;
  },

  async getSpots(unitId: number): Promise<Spot[]> {
    console.log('[Parking API] getSpots unitId:', unitId);

    const data = await apiGet<{ success: boolean; spots: Spot[] }>(
      `/parking/units/${unitId}/spots/`,
    );

    return data.spots;
  },

  async getActiveSession(): Promise<ActiveSession> {
    console.log('[Parking API] getActiveSession');

    const data = await apiGet<{ success: boolean; session: ActiveSession }>(
      '/parking/sessions/active/',
    );

    return data.session;
  },

  async enter(_unitId: number, spotId: number): Promise<{ message: string }> {
    console.log('[Parking API] enter spotId:', spotId);

    const data = await apiPost<{ success: boolean; message: string }>(
      `/parking/spots/${spotId}/enter/`,
    );

    return { message: data.message };
  },

  async exit(): Promise<{ message: string }> {
    console.log('[Parking API] exit');

    const data = await apiPost<{ success: boolean; message: string }>(
      '/parking/sessions/exit/',
    );

    return { message: data.message };
  },
};

