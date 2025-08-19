import {defineStore} from "pinia";
import {ref} from "vue";
import api from "@/http";

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const isAuth = ref(false)

    async function login() {
        const {data} = await api.post('/api/login')

    }
})
