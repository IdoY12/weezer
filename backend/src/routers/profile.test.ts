import request from "supertest"
import app, { start } from "../app"
import { sign } from "jsonwebtoken"
import { randomUUID } from "crypto"
import config from "config"

describe('profile routers tests', () => {
    describe('GET / tests', () => {
        test('returns 401 if no auth header', async () => {
            await start()
            const result = await request(app).get('/profile')
            // console.log(result)  -->  statusCode: 401,
            expect(result.statusCode).toBe(401)
        })

        test('it should return an array of posts', async () => {
            const jwt = sign({id: '034485be-cfd2-48a7-b80d-f54773eab18c'}, config.get<string>('app.jwtSecret'))
            // usually we use a separate test env and database
            // sign up as a new user
            // add some posts as new user
            await start()
            const result = await request(app)
            .get('/profile')
            .set({                        // <-- this is how i add headers in supertest
                authorization: `Bearer ${jwt}`
            })
            expect(result.statusCode).toBe(200)
            expect(Array.isArray(result.body)).toBeTruthy()
            expect(result.body[0]).toHaveProperty('id')
            expect(result.body[0].id).toBe('06bb35a0-db3a-4a9f-aed6-c4578d6b3526')
        })
    })
})