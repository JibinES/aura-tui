
import YTMusic from 'ytmusic-api';

const api = new YTMusic();
console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(api)));
