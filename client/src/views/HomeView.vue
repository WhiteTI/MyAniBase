<script setup lang="ts">
import Header from "@/components/Header.vue";
import {useQuery} from "@pinia/colada";
import api from "@/http";

const {data, error, isLoading} = useQuery({
    key: ['now'],
    query: () => api.get('/now').then((res) => res.data)
})

console.log(error)
</script>

<template>
    <div class="max-w-dvw">
        <Header/>
        <main class="min-h-svh container mx-auto">
            <div v-if="data">
                {{data}}
            </div>
        </main>
    </div>
</template>
