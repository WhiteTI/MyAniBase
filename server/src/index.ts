import { Elysia } from "elysia";
import swagger from "@elysiajs/swagger";
import cors from "@elysiajs/cors";
import auth from "./routes/auth";
import anime from "./routes/anime";
import {logger} from "@tqman/nice-logger";

const app = new Elysia()
    .use(logger())
    .use(cors())
    .use(swagger())
    .use(anime)
    .use(auth)
    .get("/", () => "Hello Elysia").listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
