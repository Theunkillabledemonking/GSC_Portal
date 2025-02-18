import { defineStore } from 'pinia';
import axios from 'axios';

export const useUserStore = defineStore('user', {
    state: () => ({
        user: null,
    }),
    actions: {
        async fetchUser() {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No token found');

                const response = await axios.get('http://localhost:5000/api/protected', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                this.user = response.data.user;
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        },
    },
});
