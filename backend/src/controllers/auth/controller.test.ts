import { randomUUID } from "crypto"
import { hashAndSaltPassword } from "./controller"

describe('unit testing for all auth controller functions', () => {
    describe('unit testing for hashAndSaltPassword', () => {
        test('generates sha256 compatible output', () => {
            const result = hashAndSaltPassword(randomUUID())
            // check that it is not undefined
            expect(result).toBeDefined()
            // check that it is is 64 chars long
            expect(result).toHaveLength(64)
            // check that all characters are hexa
            expect(result).toMatch(/^[0-9a-fA-F]+$/)
            // if the test passed all the checks, then this test succeeded
        })
        test('same plain text generates same hash | test pure function', () => {
            const plainTextPassword = randomUUID()
            const result1 = hashAndSaltPassword(plainTextPassword)
            const result2 = hashAndSaltPassword(plainTextPassword)
            expect(result1).toEqual(result2)
        })
        test('different plain text generates different hash', () => {
            const plainTextPassword1 = randomUUID()
            const plainTextPassword2 = randomUUID()
            const result1 = hashAndSaltPassword(plainTextPassword1)
            const result2 = hashAndSaltPassword(plainTextPassword2)
            expect(result1).not.toEqual(result2)
        })
    })
})