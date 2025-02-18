import { defineStore } from "pinia";

export const useBoardStore = defineStore("board", {
    state: () => ({
        posts: JSON.parse(localStorage.getItem("posts")) || [] // ✅ LocalStorage에서 불러오기
    }),
    actions: {
        addPost(content) {
            const newPost = {
                id: Date.now(), // 고유 ID 생성
                content
            };
            this.posts.push(newPost);
            localStorage.setItem("posts", JSON.stringify(this.posts)); // ✅ LocalStorage에 저장
        },
        removePost(id) {
            this.posts = this.posts.filter(post => post.id !== id);
            localStorage.setItem("posts", JSON.stringify(this.posts)); // ✅ LocalStorage 업데이트
        }
    }
});