const getAuthorName = (id) => {
    return fetch(`http://jsonplaceholder.typicode.com/posts/${id}`)
        .then((response) => response.json())
        .then((post) => post.userId)
        .then((userId) => {
            return fetch(`http://jsonplaceholder.typicode.com/users/${userId}`)
                .then((response) => response.json())
                .then((user) => user.name)
        })
        .catch(error => console.log('error', error))
}

// getAuthorName(1).then((name) => console.log("name: ", name))

const getAuthorName2 = async (id) => {
    try {
        // 첫 번째 비동기 호출: 게시물 정보를 가져옵니다.
        const postResponse = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
        const post = await postResponse.json();
        const userId = post.userId;

        // 두 번째 비동기 호출: 게시물 작성자(사용자) 정보를 가져옵니다.
        const userResponse = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
        const user = await userResponse.json();
        const userName = user.name;

        console.log("name:", userName);
    } catch (error) {
        console.log("error:", error);
    }
}

getAuthorName2(1);