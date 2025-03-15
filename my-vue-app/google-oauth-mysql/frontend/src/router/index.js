import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/store/authStore.js";

import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/Login/LoginView.vue';
import RegisterView from '@/views/Login/RegisterView.vue';

import DashboardView from '@/views/DashboardView.vue';
import MainDashboardView from "@/views/MainDashboardView.vue";
import AdminUserView from '@/views/Login/AdminUserList.vue';

import NoticesView from '@/views/Notices/NoticesView.vue';
import NoticeForm from "@/views/Notices/NoticeCreateView.vue";
import NoticeDetailView from "@/views/Notices/NoticeDetailView.vue";
import NoticeEditView from "@/views/Notices/NoticeEditView.vue";
import SubjectManage from "@/components/admin/SubjectManage.vue";
import TimetableView from "@/views/TimetableView.vue";

import CalendarWithEvents from "@/components/specific/CalendarWithEvents.vue";

const routes = [
    { path: '/', name: 'Home', component: HomeView },
    { path: '/login', name: 'Login', component: LoginView },
    { path: '/register', name: 'Register', component: RegisterView },

    { path: '/main-dashboard', name: 'MainDashboard', component: MainDashboardView, meta: { requiresAuth: true } },
    { path: '/dashboard', name: 'Dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/admin/users', name: 'AdminUserList', component: AdminUserView, meta: { requiresAuth: true } },
    { path: '/calendar', name: 'Calendar', component: CalendarWithEvents, meta: { requiresAuth: true } },

    { path: '/notices', name: 'Notices', component: NoticesView },
    { path: '/notices/create', name: 'NoticeCreate', component: NoticeForm },
    { path: '/notices/:id', name: 'NoticeDetail', component: NoticeDetailView },
    { path: '/notices/edit/:id', name: 'NoticeEdit', component: NoticeEditView },

    { path: '/admin/subjects', name: 'SubjectManage', component: SubjectManage, meta: { requiresAuth: true } },

    { path: '/timetables', name: 'TimetableView', component: TimetableView, meta: { requiresAuth: true } }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        console.warn("로그인 필요! 로그인 페이지로 이동");
        next('/login');
    }// 관리자 권한 검사
    else if (to.meta.requiresAdmin && authStore.role !== 1) {
        console.warn("🚨 관리자 권한이 필요합니다!");
        next("/dashboard"); // 권한 없으면 대시보드로 리다이렉트
    }
    else {
        next();
    }
});

export default router;
