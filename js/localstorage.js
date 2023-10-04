// Define keys used in local storage
const ACCESS_TOKEN_KEY = 'accessToken';

// Store access token
export function setAccessToken(token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

// Retrieve access token
export function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

// Remove access token
export function removeAccessToken() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// Check if user is authenticated
export function isAuthenticated() {
    return !!getAccessToken();
}
