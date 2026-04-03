import { NextFunction, Request, Response } from "express";
import enforceAuth from "./enforce-auth";
import { sign } from "jsonwebtoken"
import { randomUUID } from "crypto";
import config from "config"

describe('enforce auth unit testing', () => {
    test('calls next with status 401 when jwt cookie missing', () => {
        const request = {
            cookies: {},
        } as unknown as Request
        const response = {} as Response
        const next = jest.fn(err => {})
        enforceAuth(request, response, next)
        expect(next.mock.calls.length).toBe(1)
        expect(next.mock.calls[0][0]).toEqual({
            status: 401,
            message: 'not authenticated',
        })
    })

    test('calls next with status 401 when jwt is invalid', () => {
        const request = {
            cookies: { jwt: 'not-a-valid-jwt' },
        } as unknown as Request
        const response = {} as Response
        const next = jest.fn(err => {})
        enforceAuth(request, response, next)
        expect(next.mock.calls.length).toBe(1)
        expect(next.mock.calls[0][0]).toEqual({
            status: 401,
            message: 'invalid session',
        })
    })

    test('success when jwt cookie is valid', () => {
        const id = randomUUID()
        const jwt = sign({ id }, config.get<string>('app.jwtSecret'))
        const request = {
            cookies: { jwt },
        } as unknown as Request
        const response = {} as Response
        const next = jest.fn(err => {})
        enforceAuth(request, response, next)
        expect(next.mock.calls.length).toBe(1)
        expect(next.mock.calls[0][0]).toBeUndefined()
    })
})
