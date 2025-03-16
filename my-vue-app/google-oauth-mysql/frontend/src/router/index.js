import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/store/authStore.js";

import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/Login/LoginView.vue';
import OauthSuccessView from "@/views/Login/OauthSuccessView.vue";
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
    { path: '/oauth/success', name: 'OauthSuccess', component: OauthSuccessView },

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

// ✅ 모든 라우트 이동 전에 실행
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated; // ✅ 로그인 여부
    const userStatus = authStore.user?.status; // ✅ 승인 상태 (0: 대기, 1: 승인, 2: 거부)

    if (to.meta.requiresAuth && !isAuthenticated) {
        // 🚨 로그인되지 않은 경우 로그인 페이지로 이동
        next('/login');
    } else if (to.meta.requiresAuth && userStatus === 0) {
        // 🚨 승인 대기 중인 경우 로그인 페이지로 이동
        alert("⏳ 관리자 승인이 필요합니다.");
        next('/login');
    } else {
        next();
    }
});
export default router;
