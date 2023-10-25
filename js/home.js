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
    const tags = document.getElementById('postTags').value.split(',').map(tag => tag.trim());

    try {
        const response = await createPost({ title, body, media, tags });
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

    const response = await fetch(`${endpoints.posts}?_author=true&_comments=true`, options);

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
        const authorAvatar = post.author.avatar ? post.author.avatar : './img/user.jpg';
        const tagsElement = post.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ');

        // Display author's name and avatar
        const authorElement = `
            <div class="post-author">
            <img src="${authorAvatar}" alt="Author's Avatar">
            <span>${post.author.name}</span>
            </div>
        `;

        // Display comments
        const commentsElement = post.comments.map(comment => `
            <div class="comment">
                <img src="${comment.author.avatar}" alt="Commenter's Avatar">
                <p>${comment.body}</p>
            </div>
        `).join('');

        const postElement = `
            <div class="post">
                ${authorElement}
                <h4>${post.title}</h4>
                ${imageElement}
                <p>${post.body}</p>
                <div class="post-tags">${tagsElement}</div>
                <div class="post-comments">${commentsElement}</div>
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


document.getElementById('filterPosts').addEventListener('change', async (event) => {
    const filter = event.target.value;

    try {
        const posts = await fetchFilteredPosts(filter);
        displayPosts(posts);
    } catch (err) {
        console.error('Failed to fetch filtered posts:', err);
    }
});
async function fetchFilteredPosts(filter) {
    const options = {
        headers: {
            Authorization: `Bearer ${getAccessToken()}`,
        },
    };

    let endpoint = `${endpoints.posts}?_author=true&_comments=true`; // default to all posts

    if (filter === 'following') {
        endpoint = `${endpoints.posts}/following?_author=true&_comments=true`; // update to following posts if filter is "following"
    }

    const response = await fetch(endpoint, options);

    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(await response.text());
    }
}


async function fetchProfile(name) {
    const options = {
        headers: {
            Authorization: `Bearer ${getAccessToken()}`,
        },
    };

    const response = await fetch(`${endpoints.profile}/${name}`, options);

    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(await response.text());
    }
}

async function followProfile(name) {
    const options = {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${getAccessToken()}`,
        },
    };

    const response = await fetch(`${endpoints.profile}/${name}/follow`, options);

    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(await response.text());
    }
}

async function unfollowProfile(name) {
    const options = {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${getAccessToken()}`,
        },
    };

    const response = await fetch(`${endpoints.profile}/${name}/unfollow`, options);

    if (response.ok) {
        return await response.json();
    } else {
        throw new Error(await response.text());
    }
}

function displayProfilePopup(profile) {
    const avatarImage = profile.avatar || './img/user.jpg'; // Use the author's avatar if it exists, else default to user.jpg

    const popup = document.createElement('div');
    popup.id = 'profilePopup';
    popup.innerHTML = `
        <div class="profile-popup-content">
        <img src="${avatarImage}" alt="${profile.name}'s Avatar">
        <h3>${profile.name}</h3>
            <p>Email: ${profile.email}</p>
            <p>Posts: ${profile._count.posts}</p>
            <p>Followers: ${profile._count.followers}</p>
            <p>Following: ${profile._count.following}</p>
            <button id="followBtn">Follow</button>
            <button id="closePopup">Close</button>
        </div>
    `;
    document.body.appendChild(popup);

    // Event listener to close the popup
    document.getElementById('closePopup').addEventListener('click', () => {
        popup.remove();
    });

    // Event listener for the follow button
    document.getElementById('followBtn').addEventListener('click', async () => {
        try {
            await followProfile(profile.name);
            alert('Followed successfully!');
            popup.remove();
        } catch (error) {
            alert('Error following the user.');
        }
    });
}


document.addEventListener('click', async (event) => {
    if (event.target.closest('.post-author span')) {
        const authorName = event.target.textContent;
        try {
            const profile = await fetchProfile(authorName);
            displayProfilePopup(profile);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    }
});
