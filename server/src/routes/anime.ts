import {Elysia} from "elysia";

const API = 'https://api.jikan.moe/v4'

const anime = new Elysia()
    .get('/now', async () => await fetch(API + '/seasons/now'))

export default anime