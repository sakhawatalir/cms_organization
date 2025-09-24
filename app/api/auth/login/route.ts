import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Make a request to your backend API
        const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8080'}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Authentication failed' },
                { status: response.status }
            );
        }

        // Log the user data received from the backend
        console.log("Backend response user data:", data.user);

        // Handle different possible field names for user type
        const userType = data.user.userType || data.user.user_type || data.user.role || 'undefined';

        // Generate JWT token on our end
        // We do this even if the backend returns a token so we control the token generation
        const token = jwt.sign(
            {
                userId: data.user.id,
                email: data.user.email,
                userType
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Create normalized user object
        const normalizedUser = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            userType
        };

        // Log what we're sending back to the client
        console.log("Normalized user data:", normalizedUser);

        // Return successful response with user data and token
        return NextResponse.json({
            success: true,
            message: 'Login successful',
            user: normalizedUser,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}