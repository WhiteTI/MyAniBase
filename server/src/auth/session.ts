import {password} from 'bun'
import {PrismaClient, Session} from "../generated/prisma";

interface SessionWithToken extends Session {
    token: string;
}

const SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30; // 30 days
const ACTIVITY_CHECK_INTERVAL_SECONDS = 60 * 60; // 1 hour

function generateSecureRandomString(): string {
    const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";

    const bytes = new Uint8Array(24)
    crypto.getRandomValues(bytes)
    
    let randomString = ""
    for (let i = 0; i < bytes.length; i++) {
        randomString += alphabet[bytes[i] >> 3]
    }

    return randomString
}

async function createSession(db: PrismaClient): Promise<SessionWithToken> {
    const secret = generateSecureRandomString()
    const secretHash = await password.hash(secret)

    const session = await db.session.create({
        data: {
            secretHash
        }
    })

    const token = session.id + '.' + secret

    return {
        ...session,
        token
    }
}

async function deleteSession(db: PrismaClient, sessionId: string): Promise<void> {
    await db.session.delete({
        where: {
            id: sessionId
        }
    })
}

async function getSession(db: PrismaClient, sessionId: string): Promise<Session | null> {
    const now = new Date()

    const result = await db.session.findUnique({where: {id: sessionId}})

    if (!result) {
        return null
    }

    if (now.getTime() - result.updateAt.getTime() >= SESSION_EXPIRES_IN_SECONDS * 1000) {
        await deleteSession(db, sessionId)
        return null
    }

    return result
}

async function validateSessionToken(db: PrismaClient, token: string): Promise<Session | null> {
    const now = new Date()

    const tokenParts = token.split('.')

    if (tokenParts.length !== 2) {
        return null
    }

    const sessionId = tokenParts[0]
    const sessionSecret = tokenParts[1]

    const session = await getSession(db, sessionId)

    if (!session) {
        return null
    }

    const validSecret = await password.verify(sessionSecret, session.secretHash)

    if (!validSecret) {
        return null
    }

    if (now.getTime() - session.updateAt.getTime() >= ACTIVITY_CHECK_INTERVAL_SECONDS * 1000) {
        await db.session.update({
            where: {
                id: sessionId,
            },
            data: {
                secretHash: session.secretHash
            }
        })
    }

    return session
}

export {
    createSession,
    deleteSession,
    validateSessionToken,
    getSession,
}