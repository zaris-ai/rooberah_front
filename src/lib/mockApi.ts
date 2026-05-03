import type { ActiveSession, Spot, Unit } from '../types/parking';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

type ApiEnvelope<T> = T & {
  success?: boolean;
  message?: string;
};

type FoodPortionType = 'full' | 'half' | 'khorak';

export type FoodMenuDay = {
  id?: number;
  dayOfWeek: string;
  food1: string;
  food2: string;
  weekStartDate?: string;
  canModify?: boolean;
  modifyDeadline?: string | null;
};

export type FoodReservation = {
  telegramUserId: string;
  dayOfWeek: string;
  food: string;
  foodSlot: 'f1' | 'f2';
  portionType: FoodPortionType;
  portionLabel: string;
  portionQty: number;
  reservedAt: string;
  weekStartDate?: string;
};

function getTelegramInitData() {
  const tg = (window as any)?.Telegram?.WebApp;
  const initData = tg?.initData;
  const unsafeUser = tg?.initDataUnsafe?.user;

  console.log('[Telegram Debug] WebApp exists:', Boolean(tg));
  console.log('[Telegram Debug] initData exists:', Boolean(initData));
  console.log('[Telegram Debug] unsafe user:', unsafeUser);

  if (!initData) {
    console.error(
      '[Telegram Debug] initData missing. window.Telegram:',
      (window as any)?.Telegram,
    );

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

  const headers: Record<string, string> = {
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

async function readJsonResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
  const text = await response.text();

  if (!text) {
    return {} as ApiEnvelope<T>;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('پاسخ سرور JSON معتبر نیست.');
  }
}

async function apiGet<T>(path: string): Promise<ApiEnvelope<T>> {
  console.log('[API Debug] GET start:', path);

  const response = await fetch(buildUrl(path), {
    method: 'GET',
    headers: buildHeaders(),
  });

  console.log('[API Debug] GET status:', response.status, response.statusText);

  const data = await readJsonResponse<T>(response);
  console.log('[API Debug] GET response:', data);

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'خطا در دریافت اطلاعات.');
  }

  return data;
}

async function apiPost<T>(
  path: string,
  body: Record<string, unknown> = {},
): Promise<ApiEnvelope<T>> {
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

  const data = await readJsonResponse<T>(response);
  console.log('[API Debug] POST response:', data);

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'خطا در ثبت عملیات.');
  }

  return data;
}

function normalizeFoodMenuDay(item: any): FoodMenuDay {
  return {
    id: item.id,
    dayOfWeek: item.dayOfWeek ?? item.day_of_week,
    food1: item.food1 ?? item.food_1 ?? item.food1_text ?? item.food1,
    food2: item.food2 ?? item.food_2 ?? item.food2_text ?? item.food2,
    weekStartDate: item.weekStartDate ?? item.week_start_date,
    canModify: item.canModify,
    modifyDeadline: item.modifyDeadline,
  };
}

function normalizeFoodReservation(item: any): FoodReservation {
  return {
    telegramUserId: item.telegramUserId ?? item.telegram_user_id,
    dayOfWeek: item.dayOfWeek ?? item.day_of_week,
    food: item.food,
    foodSlot: item.foodSlot ?? item.food_slot,
    portionType: item.portionType ?? item.portion_type,
    portionLabel: item.portionLabel ?? item.portion_label,
    portionQty: item.portionQty ?? item.portion_qty,
    reservedAt: item.reservedAt ?? item.reserved_at,
    weekStartDate: item.weekStartDate ?? item.week_start_date,
  };
}

/* -------------------------------------------------------------------------- */
/* Parking API                                                                */
/* -------------------------------------------------------------------------- */

export const parkingApi = {
  async getUnits(): Promise<Unit[]> {
    console.log('[Parking API] getUnits');

    const data = await apiGet<{ units: Unit[] }>('/parking/units/');
    return data.units;
  },

  async getSpots(unitId: number): Promise<Spot[]> {
    console.log('[Parking API] getSpots unitId:', unitId);

    const data = await apiGet<{ spots: Spot[] }>(
      `/parking/units/${unitId}/spots/`,
    );

    return data.spots;
  },

  async getActiveSession(): Promise<ActiveSession> {
    console.log('[Parking API] getActiveSession');

    const data = await apiGet<{ session: ActiveSession }>(
      '/parking/sessions/active/',
    );

    return data.session;
  },

  async enter(_unitId: number, spotId: number): Promise<{ message: string }> {
    console.log('[Parking API] enter spotId:', spotId);

    const data = await apiPost<{ message: string }>(
      `/parking/spots/${spotId}/enter/`,
    );

    return {
      message: data.message || 'ورود با موفقیت ثبت شد.',
    };
  },

  async exit(): Promise<{ message: string }> {
    console.log('[Parking API] exit');

    const data = await apiPost<{ message: string }>(
      '/parking/sessions/exit/',
    );

    return {
      message: data.message || 'خروج با موفقیت ثبت شد.',
    };
  },
};

/* -------------------------------------------------------------------------- */
/* Food API                                                                   */
/* -------------------------------------------------------------------------- */

export const foodApi = {
  async getWeeklyMenu(): Promise<FoodMenuDay[]> {
    console.log('[Food API] getWeeklyMenu');

    const data = await apiGet<{ menu: any[] }>('/parking/food/week-menu/');

    return (data.menu || []).map(normalizeFoodMenuDay);
  },

  async getMyReservations(): Promise<FoodReservation[]> {
    console.log('[Food API] getMyReservations');

    const data = await apiGet<{ reservations: any[] }>(
      '/parking/food/reservations/me/',
    );

    return (data.reservations || []).map(normalizeFoodReservation);
  },

  async reserve(params: {
    dayOfWeek: string;
    foodSlot: 'f1' | 'f2';
    portionType: FoodPortionType;
    weekStartDate?: string;
  }): Promise<{ message: string; reservation: FoodReservation }> {
    console.log('[Food API] reserve:', params);

    const data = await apiPost<{
      message: string;
      reservation: any;
    }>('/parking/food/reservations/upsert/', params);

    return {
      message: data.message || 'رزرو غذا با موفقیت ثبت شد.',
      reservation: normalizeFoodReservation(data.reservation),
    };
  },

  async cancel(params: {
    dayOfWeek: string;
    weekStartDate?: string;
  }): Promise<{ message: string }> {
    console.log('[Food API] cancel:', params);

    const data = await apiPost<{ message: string }>(
      '/parking/food/reservations/cancel/',
      params,
    );

    return {
      message: data.message || 'رزرو غذا لغو شد.',
    };
  },
};