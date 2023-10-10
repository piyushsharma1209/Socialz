import { getAccessToken } from './localstorage.js';
import { endpoints } from './api.js';

async function getProfileData() {
    try {
        const token = getAccessToken();
        const name = localStorage.getItem('name');

        if (!token) {
            console.error("No access token found.");
            return;
        }

        if (!name || name === "null" || name === "") {
            console.error("No username found in local storage.");
            return;
        }

        const response = await fetch(`${endpoints.profile}/${name}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        if (response.ok) {
            const profileData = await response.json();
            displayProfile(profileData);
        } else {
            console.error('Error fetching profile:', await response.text());
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

async function searchUsers(query) {
    try {
        const token = getAccessToken();

        if (!token) {
            console.error("No access token found.");
            return;
        }

        const response = await fetch(`${endpoints.profile}/${query}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        if (response.ok) {
            const profileData = await response.json();
            displayProfile(profileData); // This will override the current profile display. You might want to clear or replace the container or show the result in a different manner.
        } else {
            console.error('Error fetching searched profile:', await response.text());
        }
    } catch (error) {
        console.error('Error fetching searched profile:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    getProfileData();

    const searchBar = document.getElementById("userSearch");
    const searchBtn = document.getElementById("searchBtn");

    // Searching when pressing the Enter key in the search bar.
    searchBar.addEventListener('keyup', (event) => {
        if (event.key === "Enter") {
            searchUsers(searchBar.value);
        }
    });

    // Searching when pressing the search button.
    searchBtn.addEventListener('click', () => {
        searchUsers(searchBar.value);
    });
});

function displayProfile(data) {
    const container = document.getElementById("profile-container");
    container.innerHTML = ''; // Clear existing content

    if (data.avatar) {
        const avatar = document.createElement("img");
        avatar.src = data.avatar;
        avatar.alt = `${data.name}'s Avatar`;
        avatar.className = "profile-avatar";
        container.appendChild(avatar);
    }

    if (data.name) {
        const name = document.createElement("h2");
        name.textContent = data.name;
        name.className = "profile-name";
        container.appendChild(name);
    }

    if (data._count) {
        const countsContainer = document.createElement("div");
        countsContainer.className = "counts";

        const postsCount = document.createElement("p");
        postsCount.textContent = `Posts: ${data._count.posts}`;
        countsContainer.appendChild(postsCount);

        const followersCount = document.createElement("p");
        followersCount.textContent = `Followers: ${data._count.followers}`;
        countsContainer.appendChild(followersCount);

        const followingCount = document.createElement("p");
        followingCount.textContent = `Following: ${data._count.following}`;
        countsContainer.appendChild(followingCount);

        container.appendChild(countsContainer);
    }

}

