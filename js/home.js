import { getAccessToken, removeAccessToken } from './localstorage.js';
import { endpoints } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Check user authentication status
    const accessToken = getAccessToken();

    if (!accessToken) {
        window.location.href = 'index.html'; // Redirect to login if not authenticated
    }

    try {
        const posts = await fetchPosts();
        displayPosts(posts);
    } catch (err) {
        console.error('Failed to fetch posts:', err);
    }

    // Logout function
    document.getElementById('logoutLink').addEventListener('click', () => {
        removeAccessToken();
        window.location.href = 'index.html';
    });

    // TODO: Add Profile page navigation when ready
    // document.getElementById('profileLink').addEventListener('click', () => {
    //     window.location.href = 'profile.html';
    // });
});

document.querySelector('#createPostForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = document.getElementById('postTitle').value;
    const body = document.getElementById('postBody').value;
    const media = document.getElementById('postMedia').value;

    try {
        const response = await createPost({ title, body, media });
        console.log('Post created successfully:', response);
        // Fetch the updated posts list and display
        const posts = await fetchPosts();
        displayPosts(posts);
    } catch (err) {
        console.error('Failed to create post:', err);
    }
});

async function createPost(postData) {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify(postData),
    };

    const response = await fetch(endpoints.posts, options);

    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(await response.text());
    }
}


async function fetchPosts() {
    const options = {
        headers: {
            Authorization: `Bearer ${getAccessToken()}`,
        },
    };

    const response = await fetch(endpoints.posts, options);

    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(await response.text());
    }
}

function displayPosts(posts) {
    const container = document.getElementById('postsContainer');
    container.innerHTML = '';

    const latestPosts = posts.slice(0, 5);

    latestPosts.forEach(post => {
        const imageElement = post.media ? `<img src="${post.media}" alt="Post Image">` : '';
        const postElement = `
            <div class="post">
                <h4>${post.title}</h4>
                ${imageElement}
                <p>${post.body}</p>
                <small>Comments: ${post._count.comments} | Reactions: ${post._count.reactions}</small>
            </div>
        `;

        container.innerHTML += postElement;
    });
}

