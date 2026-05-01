import { NextResponse } from "next/server"

export type ApiSuccessResponse<T> = {
    success: true
    data: T
}

export type ApiErrorResponse = {
    success: false
    error: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export function ok<T>(data: T, status = 200) {
    return NextResponse.json({ success: true, data }, { status })
}

export function err(message: string, status = 400) {
    return NextResponse.json({ success: false, error: message }, { status })
}
