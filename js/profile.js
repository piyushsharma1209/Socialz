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

async function getPostsByProfile(name, token) {
    const response = await fetch(`${endpoints.profile}/${name}/posts`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    });

    if (response.ok) {
        return await response.json();
    } else {
        console.error('Error fetching posts:', await response.text());
        return null;
    }
}

function displayPosts(posts) {
    const container = document.getElementById("profile-container");

    const postsContainer = document.createElement('div');
    postsContainer.className = "posts-container";

    posts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';

        const postHeader = document.createElement('div');
        postHeader.className = 'post-header';

        const postTitle = document.createElement('h3');
        postTitle.textContent = post.title;
        postTitle.className = 'post-title';
        postHeader.appendChild(postTitle);

        const postDate = document.createElement('span');
        postDate.textContent = new Date(post.created).toDateString();
        postDate.className = 'post-date';
        postHeader.appendChild(postDate);

        postDiv.appendChild(postHeader);

        const postBody = document.createElement('p');
        postBody.textContent = post.body;
        postBody.className = 'post-body';
        postDiv.appendChild(postBody);

        if (post.media) {
            const postMedia = document.createElement('img');
            postMedia.src = post.media;
            postMedia.className = 'post-media';
            postDiv.appendChild(postMedia);
        }

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'edit-post-btn';
        editButton.onclick = () => editPost(post, postDiv);
        postDiv.appendChild(editButton);


        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'post-actions';

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-btn';
        deleteButton.addEventListener('click', () => deletePost(post.id)); // Event listener for delete
        actionsDiv.appendChild(deleteButton);

        postDiv.appendChild(actionsDiv);

        postsContainer.appendChild(postDiv);
    });

    container.appendChild(postsContainer);
}

document.addEventListener('DOMContentLoaded', async () => {
    await getProfileData();

    const name = localStorage.getItem('name');
    const token = getAccessToken();
    const updateAvatarBtn = document.getElementById("updateAvatarBtn");
    const avatarInput = document.getElementById("avatarInput");

    updateAvatarBtn.addEventListener('click', () => {
        if (avatarInput.value.trim()) {
            updateAvatar(avatarInput.value.trim());
        } else {
            console.error('Please provide a valid avatar URL.');
        }
    });
    if (name && token) {
        const posts = await getPostsByProfile(name, token);
        if (posts) {
            displayPosts(posts);
        }
    }
});

function displayProfile(data) {
    const container = document.getElementById("profile-container");
    container.innerHTML = ''; // Clear existing content

    const avatar = document.createElement("img");
    if (data.avatar) {
        avatar.src = data.avatar;
        avatar.alt = `${data.name}'s Avatar`;
    } else {
        // Placeholder image
        avatar.src = './path_to_your_directory/user.png'; // Modify path accordingly
        avatar.alt = 'Placeholder Avatar';
    }
    avatar.className = "profile-avatar";
    container.appendChild(avatar);


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


// Function to update avatar
async function updateAvatar(avatarUrl) {
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

    try {
        const response = await fetch(`${endpoints.profile}/${name}/media`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                avatar: avatarUrl,
            }),
        });

        if (response.ok) {
            console.log("Avatar updated successfully.");
            getProfileData(); // Refresh profile data after updating
        } else {
            console.error('Error updating avatar:', await response.text());
        }
    } catch (error) {
        console.error('Error updating avatar:', error);
    }
}

async function getUserPosts() {
    const token = getAccessToken();
    const name = localStorage.getItem('name');

    if (!token || !name) {
        console.error("No access token or username found.");
        return;
    }

    try {
        const response = await fetch(`${endpoints.profile}/${name}/posts`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const postData = await response.json();
            displayPosts(postData);
        } else {
            console.error('Error fetching posts:', await response.text());
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

function editPost(postData, postDiv) {
    postDiv.innerHTML = '';  // Clear the post content

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'edit-post-title';
    titleInput.value = postData.title;
    titleInput.placeholder = 'Title';
    postDiv.appendChild(titleInput);

    const bodyTextarea = document.createElement('textarea');
    bodyTextarea.className = 'edit-post-body';
    bodyTextarea.value = postData.body;
    bodyTextarea.placeholder = 'Content'; // Added placeholder
    postDiv.appendChild(bodyTextarea);

    const mediaInput = document.createElement('input');
    mediaInput.type = 'text';
    mediaInput.className = 'edit-post-media';
    mediaInput.placeholder = 'Image URL'; // Added placeholder
    mediaInput.value = postData.media;
    postDiv.appendChild(mediaInput);

    const updateButton = document.createElement('button');
    updateButton.textContent = 'Update Post';
    updateButton.className = 'update-post-btn';
    updateButton.onclick = () => updatePost(postData.id, titleInput.value, bodyTextarea.value, mediaInput.value);
    postDiv.appendChild(updateButton);
}

async function updatePost(id, title, body, media) {
    const token = getAccessToken();

    if (!token) {
        console.error("No access token found.");
        return;
    }

    try {
        const response = await fetch(`${endpoints.posts}/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                body: body,
                media: media
            })
        });

        if (response.ok) {
            const updatedPost = await response.json();
            console.log("Post updated successfully:", updatedPost);
            getProfileData(), getUserPosts(); // Refresh the profile and its posts
        } else {
            console.error('Error updating post:', await response.text());
        }
    } catch (error) {
        console.error('Error updating post:', error);
    }
}


async function deletePost(postId) {
    const token = getAccessToken();
    if (!token) {
        console.error("No access token found.");
        return;
    }

    try {
        const response = await fetch(`${endpoints.posts}/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            console.log("Post deleted successfully.");
            getProfileData(), getUserPosts(); // Refresh the profile and its posts
        } else {
            console.error('Error deleting post:', await response.text());
        }
    } catch (error) {
        console.error('Error deleting post:', error);
    }
}
