import {Elysia, t} from "elysia";
import prisma from "../libs/prisma";
import {createSession, validateSessionToken} from "../auth/session";

const auth = new Elysia({prefix: '/auth'})
    .post(
        '/register',
        async ({body, status, cookie: { token }}) => {
            const {name, username, password, image} = body

            const existingUser = await prisma.user.findUnique({
                where: {
                    username: username,
                }
            })

            if (existingUser) {
                return status('Conflict', 'User already exists')
            }

            const hashPassword = await Bun.password.hash(password)

            const session = await createSession(prisma)

            const user = await prisma.user.create({
                data: {
                    name,
                    username,
                    password: hashPassword,
                    session: {
                        connect: {
                            id: session.id
                        }
                    }
                }
            })

            token.set({
                value: session.token,
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 30,
                path: '/'
            })

            return {
                message: `User create successfully.`,
                data: {
                    name: user.name,
                    username: user.username,
                    image: user.image
                }
            }
        }, {
            body: t.Object({
                name: t.String({minLength: 3}),
                username: t.String({minLength: 3}),
                password: t.String({minLength: 5}),
                image: t.Optional(t.File())
            })
        }
    )
    .post(
        '/login',
        async ({body, status, cookie: {token}}) => {
            const {username, password} = body

            const user = await prisma.user.findUnique({
                where: {
                    username
                }
            })

            if (!user) {
                return status('Unauthorized', 'Wrong username or password')
            }

            const isPasswordValid = await Bun.password.verify(password, user.password)

            if (!isPasswordValid) {
                return status('Unauthorized', 'Wrong username or password')
            }

            const session = await createSession(prisma)

            await prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    session: {
                        connect: {
                            id: session.id
                        }
                    }
                }
            })

            token.set({
                value: session.token,
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 30,
                path: '/'
            })

            return {
                message: `Login successfully.`,
                data: {
                    name: user.name,
                    username: user.username,
                    image: user.image
                }
            }
        }, {
            body: t.Object({
                username: t.String({minLength: 3}),
                password: t.String({minLength: 5}),
            })
        }
    )
    .post(
        '/logout',
        async ({cookie: {token}, status}) => {
            if (!token || !token.value) {
                return status('Unauthorized', 'Wrong token')
            }

            const session = await validateSessionToken(prisma, token.value)

            if (!session) {
                return status('Unauthorized')
            }

            await prisma.session.delete({
                where: {id: session.id}
            })

            token.remove()

            return 'Logout successfully.'
        }
    )

export default auth