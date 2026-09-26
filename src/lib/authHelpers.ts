import { auth } from './firebase';

export function getIsAdmin(): boolean {
  // 1. Google user admin check
  if (auth.currentUser?.email === 'clodas12345@gmail.com') return true;

  // 2. Check local phone user session
  try {
    const phoneUserSaved = localStorage.getItem('bolao_phone_user');
    if (phoneUserSaved) {
      const parsed = JSON.parse(phoneUserSaved);
      const phone = parsed?.memberData?.phone || parsed?.sessionUser?.phone || '';
      const uid = parsed?.sessionUser?.uid || '';
      const cleanP = phone.replace(/\D/g, '');
      if (
        parsed?.memberData?.role === 'admin' ||
        parsed?.sessionUser?.email === 'clodas12345@gmail.com' ||
        uid.startsWith('admin_phone_') ||
        cleanP.includes('11953292570')
      ) return true;
    }
  } catch {}

  // 3. Check generic cached user data
  try {
    const cachedData = localStorage.getItem('bolao_cache_user_data');
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const phone = parsed?.phone || '';
      const cleanP = phone.replace(/\D/g, '');
      if (
        parsed?.role === 'admin' ||
        parsed?.email === 'clodas12345@gmail.com' ||
        cleanP.includes('11953292570')
      ) return true;
    }
  } catch {}

  return false;
}
