import { auth } from './firebase';

export function getIsAdmin(): boolean {
  // 1. Google user admin check
  if (auth.currentUser?.email === 'clodas12345@gmail.com') return true;

  // 2. Check local phone user session
  try {
    const phoneUserSaved = localStorage.getItem('bolao_phone_user');
    if (phoneUserSaved) {
      const parsed = JSON.parse(phoneUserSaved);
      if (parsed?.memberData?.role === 'admin') return true;
    }
  } catch {}

  // 3. Check generic cached user data
  try {
    const cachedData = localStorage.getItem('bolao_cache_user_data');
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      if (parsed?.role === 'admin') return true;
    }
  } catch {}

  return false;
}
