// router/index.js: Vue Router 설정
import {createRouter, createWebHistory } from "vue-router";

// 페이지 별 컴포넌트 가져오기
import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';

import DashboardView from '@/views/DashboardView.vue';
import AdminUserView from '@/views/AdminUserList.vue';

import NoticesView from '@/views/Notices/NoticesView.vue';
import NoticeForm from "@/views/Notices/NoticeCreateView.vue";
import NoticeDetailView from "@/views/Notices/NoticeDetailView.vue";
import NoticeEditView from "@/views/Notices/NoticeEditView.vue";

// 라우트 정의
const routes = [
    { path: '/', name: 'Home', component: HomeView },
    { path: '/login', name: 'Login', component: LoginView },
    { path: '/register', name: 'Register', component: RegisterView },

    { path: '/dashboard', name: 'Dashboard', component: DashboardView },
    { path: '/admin/users', component: AdminUserView },

    { path: '/notices', component: NoticesView },
    { path: '/notices/create', component: NoticeForm },
    { path: '/notices/:id', component: NoticeDetailView },
    { path: '/notices/edit/:id', component: NoticeEditView },

]

// Vue Router 인스턴스 생성
const router = createRouter({
    history: createWebHistory(), // 브라우저의 히스토리 모드 사용
    routes //정의한 라우트 적용
})

export default router; // 라우터 내보내기