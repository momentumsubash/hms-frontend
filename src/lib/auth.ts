import Cookies from 'js-cookie';

export const getAuthHeader = () => {
  const token = Cookies.get('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};
