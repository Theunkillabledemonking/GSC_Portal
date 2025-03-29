import { defineStore } from "pinia";
import * as subjectApi from "@/services/subjectService.js";
import {getAllSubjects} from "@/services/subjectService.js";

export const useSubjectStore = defineStore("subjectStore", {
    state: () => ({
        all: [],
        byYear: [],
        special: [],
    }),
    actions: {
        async loadAllSubjects() {
            const { subjects } = await subjectApi.getAllSubjects();
            this.all = subjects;
        },

        async loadSubjectsByYear(year) {
            if (!this.byYear[year]) {
                const { subjects } = await subjectApi.getSubjectsByYear(year);
                this.byYear[year] = subjects;
            }
            return this.byYear[year];
        },

        async loadSpecialSubjects() {
            const { specialLectures } = await subjectApi.getSpecialLectures();
            this.special = specialLectures;
        },

        async addSubject(subject) {
            await subjectApi.createSubject(subject);
            this.clearCache();
            await this.loadAllSubjects(); // 기본 전체 로딩
        },

        async updateSubject(subject) {
            await subjectApi.updateSubject(subject);
            this.clearCache();
            await this.loadAllSubjects();
        },

        async deleteSubject(id) {
            await subjectApi.deleteSubject(id);
            this.clearCache();
            await this.loadAllSubjects();
        },

        clearCache() {
            this.byYear = {};
            this.special = [];
        }
    }

});