import { getAccessToken, removeAccessToken } from './localstorage.js';
import { endpoints } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = getAccessToken();

    if (!accessToken) {
        window.location.href = 'index.html';
    }

    try {
        const posts = await fetchPosts();
        displayPosts(posts);
        document.querySelector('#createPostForm').reset();
    } catch (err) {
        console.error('Failed to fetch posts:', err);
    }

    // Logout function
    document.getElementById('logoutLink').addEventListener('click', () => {
        removeAccessToken();
        window.location.href = 'index.html';
    });
});

document.querySelector('#createPostForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = document.getElementById('postTitle').value;
    const body = document.getElementById('postBody').value;
    const media = document.getElementById('postMedia').value;

    try {
        const response = await createPost({ title, body, media });
        console.log('Post created successfully:', response);
        const posts = await fetchPosts();
        displayPosts(posts);

        // Reset the form
        document.querySelector('#createPostForm').reset();
    } catch (err) {
        console.error('Failed to create post:', err);
    }
});

document.getElementById('searchInput').addEventListener('input', async (e) => {
    const query = e.target.value;
    if (query.length >= 1) {
        try {
            const users = await searchUsers(query);
            displayUsers(users);
        } catch (err) {
            console.error('Failed to search users:', err);
        }
    } else {
        // Hide results if the query is empty
        document.getElementById('searchResults').style.display = 'none';
    }
});

async function searchUsers(query) {
    const options = {
        headers: {
            Authorization: `Bearer ${getAccessToken()}`,
        },
    };

    const response = await fetch(endpoints.profile, options);

    if (response.ok) {
        const users = await response.json();
        // Filter users based on the query and return
        return users.filter(user => user.name.toLowerCase().startsWith(query.toLowerCase()));
    } else {
        throw new Error(await response.text());
    }
}

function displayUsers(users) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';
    container.style.display = users.length > 0 ? 'block' : 'none';

    users.forEach(user => {
        const userElement = `<div>${user.name}</div>`;
        container.innerHTML += userElement;
    });
}


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
                <button class="react" data-id="${post.id}" data-symbol="👍">👍</button>
                <div class="comments">
                    <form class="comment-form" data-post-id="${post.id}">
                        <input type="text" placeholder="Add a comment..." class="comment-input">
                        <button type="submit">Post</button>
                    </form>
                </div>
            </div>
        `;

        container.innerHTML += postElement;
    });
    const reactButtons = document.querySelectorAll('.react');
    reactButtons.forEach(button => {
        button.addEventListener('click', handleReactionClick);
    });
    document.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', handleCommentSubmit);
    });
}

async function handleReactionClick(event) {
    const postId = event.target.getAttribute('data-id');
    const symbol = event.target.getAttribute('data-symbol');

    try {
        const reactionResponse = await reactToPost(postId, symbol);

        // Fetch the updated post to get the new reaction count
        const updatedPost = await fetchSinglePost(postId);
        updateReactionCount(postId, updatedPost._count.reactions);

    } catch (err) {
        console.error('Failed to react:', err);
    }
}


async function reactToPost(postId, symbol) {
    const options = {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${getAccessToken()}`,
        },
    };

    const response = await fetch(`${endpoints.posts}/${postId}/react/${symbol}`, options);

    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(await response.text());
    }
}

async function fetchSinglePost(postId) {
    const options = {
        headers: {
            Authorization: `Bearer ${getAccessToken()}`,
        },
    };

    const response = await fetch(`${endpoints.posts}/${postId}`, options);

    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(await response.text());
    }
}

function updateReactionCount(postId, newCount) {
    const postsContainer = document.getElementById('postsContainer');
    const reactionButton = postsContainer.querySelector(`.react[data-id="${postId}"]`);
    const countElement = reactionButton.previousElementSibling;

    if (countElement && countElement.matches('small')) {
        const updatedText = countElement.textContent.replace(/Reactions: \d+/, `Reactions: ${newCount}`);
        countElement.textContent = updatedText;
    }
}


// Post a comment to a specific post
async function postComment(postId, body, replyToId = null) {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ body, replyToId }),
    };

    const response = await fetch(`${endpoints.posts}/${postId}/comment`, options);

    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(await response.text());
    }
}

// Function to handle comment form submission
async function handleCommentSubmit(event) {
    event.preventDefault();

    const postId = event.target.getAttribute('data-post-id');
    const body = event.target.querySelector('.comment-input').value;

    try {
        await postComment(postId, body);
        // Once the comment is posted successfully, fetch and display the posts again
        const posts = await fetchPosts();
        displayPosts(posts);
    } catch (err) {
        console.error('Failed to post comment:', err);
    }
}


