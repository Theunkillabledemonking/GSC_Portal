import { defineStore } from "pinia";
import * as subjectApi from "@/services/subjectService";

export const useSubjectStore = defineStore("subjectStore", {
    state: () => ({
        subjects: [],
    }),
    actions: {
        async loadSubjects() {
            const { subjects } = await subjectApi.getSubjects();
            this.subjects = subjects;
        },
        async addSubject(subject) {
            await subjectApi.createSubject(subject);
            await this.loadSubjects();

        },
        async updateSubject(subject) {
            await subjectApi.updateSubject(subject);
            await this.loadSubjects();
        },
        async deleteSubject(id) {
            await subjectApi.deleteSubject(id);
            await this.loadSubjects();
        }
    }
});