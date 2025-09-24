import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
    try {
        // Get the token from cookies
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'No token found' },
                { status: 401 }
            );
        }

        try {
            // Try to verify the token
            const secretKey = new TextEncoder().encode(
                process.env.JWT_SECRET || 'your-secret-key'
            );

            const decodedToken = await jwtVerify(token, secretKey);

            // Return token info 
            return NextResponse.json({
                success: true,
                message: 'Token is valid',
                payload: decodedToken.payload,
                exp: new Date((decodedToken.payload.exp as number) * 1000).toISOString(),
                iat: new Date((decodedToken.payload.iat as number) * 1000).toISOString()
            });
        } catch (error) {
            // Properly handle the unknown error type
            console.error('JWT verification error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);

            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid token',
                    error: errorMessage
                },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Error checking token:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        return NextResponse.json(
            {
                success: false,
                message: 'Error checking token',
                error: errorMessage
            },
            { status: 500 }
        );
    }
}