// store/apiStore.js
import { defineStore } from "pinia";
import axios from "axios";

export const useApiStore = defineStore("api", {
    state: () => ({
        posts: [],
    }),
    actions: {
        async fetchPosts(){
            try {
                const response = await axios.get("http://localhost:5173/posts");
                this.posts = response.data;
            } catch (error) {
                console.log("게시글을 가져오는 데 실패했습니다.:", error);
            }
        },
    },
});