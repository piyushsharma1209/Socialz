import { setAccessToken, getAccessToken, removeAccessToken, isAuthenticated } from './localstorage.js';
import { endpoints } from './api.js';

async function sendRequest(endpoint, method = 'GET', payload = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: payload ? JSON.stringify(payload) : null
    };

    return fetch(endpoints[endpoint], options);
}

function isValidEmail(email) {
    return /@(noroff\.no|stud\.noroff\.no)$/.test(email);
}

async function registerUser(username, email, password, avatar = '', banner = '') {
    if (!isValidEmail(email)) {
        console.error('Invalid email. Only @noroff.no and @stud.noroff.no emails are allowed.');
        return;
    }

    const response = await sendRequest('register', 'POST', {
        name: username,
        email: email,
        password: password,
        avatar: avatar,
        banner: banner
    });

    if (response.ok) {
        console.log('Successfully registered.');
        localStorage.setItem('name', username);  // Store the user's name for profile.js
        document.querySelector('#login-tab').click();
    } else {
        console.error('Failed to register:', await response.text());
    }
}

async function loginUser(email, password) {
    if (!isValidEmail(email)) {
        console.error('Invalid email. Only @noroff.no and @stud.noroff.no emails are allowed.');
        return;
    }

    const response = await sendRequest('login', 'POST', { email, password });

    if (response.ok) {
        const result = await response.json();
        console.log('Logged in successfully:', result);
        setAccessToken(result.accessToken);
        localStorage.setItem('name', result.name);
        window.location.href = 'home.html';
    } else {
        console.error('Failed to login:', await response.text());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#registerForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = event.target.name.value;
        const email = event.target.email.value;
        const password = event.target.password.value;
        await registerUser(username, email, password);
    });

    document.querySelector('#loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = event.target.loginEmail.value;
        const password = event.target.loginPassword.value;
        await loginUser(email, password);
    });

    if (isAuthenticated()) {
        console.log('User is authenticated.');
    } else {
        console.log('User is not authenticated.');
    }
});
