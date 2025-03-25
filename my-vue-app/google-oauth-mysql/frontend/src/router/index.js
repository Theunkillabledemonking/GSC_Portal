import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/store/authStore.js";

import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/Login/LoginView.vue';
import OauthSuccessView from "@/views/Login/OauthSuccessView.vue";
import RegisterView from '@/views/Login/RegisterView.vue';

import TestDashboard from "@/views/testDashboard.vue";
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
    { path: "/", redirect: "/login" },
    { path: '/login', name: 'Login', component: LoginView },
    { path: '/register', name: 'Register', component: RegisterView },
    { path: '/oauth/success', name: 'OauthSuccess', component: OauthSuccessView },

    { path: '/test-dashboard', name: TestDashboard, component: TestDashboard, meta: { requiresAuth: true } },
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
    const { isAuthenticated, status } = authStore;

    const goingToLogin = to.path === '/login';

    if (to.meta.requiresAuth) {
        if (!isAuthenticated) {
            return goingToLogin ? next() : next('/login');
        }

        if (status === 0) {
            alert("⏳ 관리자 승인이 필요합니다.");
            return goingToLogin ? next() : next('/login');
        }
    }

    next();
});
export default router;
