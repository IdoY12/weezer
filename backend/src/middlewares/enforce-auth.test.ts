import { NextFunction, Request, Response } from "express";
import enforceAuth from "./enforce-auth";
import { sign } from "jsonwebtoken"
import { randomUUID } from "crypto";
import config from "config"

describe('enforce auth unit testing', () => {
    test('calls next with status 401 when authorization header missing', () => {
        const request = {
            headers: {},
            get: (headerName: string) => ''
        } as Request
        const response = {} as Response
        const next = jest.fn(err => {})
        enforceAuth(request, response, next)
        expect(next.mock.calls.length).toBe(1)
        expect(next.mock.calls[0][0]).toEqual({
            status: 401,
            message: 'missing Authorization header'
        })
        // console.log(next.mock.calls)
        // [ [ {status: 401, message: '...'} ] ]
    })

    test('calls next with status 401 when Bearer keyword is mispelled', () => {
        const request = {
            get: (headerName: string) => 'Baerer abcdef'
        } as Request
        const response = {} as Response
        const next = jest.fn(err => {})
        enforceAuth(request, response, next)
        expect(next.mock.calls.length).toBe(1)
        expect(next.mock.calls[0][0]).toEqual({
            status: 401,
            message: 'missing Bearer keyword'
        })
        console.log(next.mock.calls)
        // [ [ {status: 401, message: '...'} ] ]
    })

    test('calls next with status 401 when jwt is missing', () => {
        const request = {
            get: (headerName: string) => 'Bearer'
        } as Request
        const response = {} as Response
        const next = jest.fn(err => {})
        enforceAuth(request, response, next)
        expect(next.mock.calls.length).toBe(1)
        expect(next.mock.calls[0][0]).toEqual({
            status: 401,
            message: 'missing jwt'
        })
    })

    test('success when all is valid', () => {
        const jwt = sign(randomUUID(), config.get<string>('app.jwtSecret'))
        const request = {
            get: (headerName: string) => `Bearer ${jwt}`
        } as Request
        const response = {} as Response
        const next = jest.fn(err => {})
        enforceAuth(request, response, next)
        expect(next.mock.calls.length).toBe(1)
        expect(next.mock.calls[0][0]).toBeUndefined()
    })
})