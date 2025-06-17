import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    endpoints: [
      { method: 'GET',    path: '/api/user', description: 'List all users' },
      { method: 'GET',    path: '/api/user?id=...', description: 'Get user by ID' },
      { method: 'POST',   path: '/api/user', description: 'Create user (signup)' },
      { method: 'GET',    path: '/api/profile', description: 'List all profiles' },
      { method: 'GET',    path: '/api/profile?id=...', description: 'Get profile by ID' },
      { method: 'POST',   path: '/api/profile', description: 'Create profile' },
      { method: 'GET',    path: '/api/post', description: 'List all posts' },
      { method: 'GET',    path: '/api/post?id=...', description: 'Get post by ID' },
      { method: 'POST',   path: '/api/post', description: 'Create post' },
      { method: 'GET',    path: '/api/comment', description: 'List all comments' },
      { method: 'GET',    path: '/api/comment?id=...', description: 'Get comment by ID' },
      { method: 'POST',   path: '/api/comment', description: 'Create comment' },
      { method: 'GET',    path: '/api/friend-request', description: 'List all friend requests' },
      { method: 'GET',    path: '/api/friend-request?id=...', description: 'Get friend request by ID' },
      { method: 'POST',   path: '/api/friend-request', description: 'Create friend request' },
      { method: 'POST',   path: '/api/auth/signup', description: 'Signup (with password, email, etc.)' },
      { method: 'POST',   path: '/api/auth/login', description: 'Login (returns JWT or session)' },
      { method: 'POST',   path: '/api/auth/logout', description: 'Logout (if using sessions)' },
      { method: 'POST',   path: '/api/auth/forgot-password', description: 'Request password reset' },
      { method: 'POST',   path: '/api/auth/reset-password', description: 'Reset password' },
    ]
  });
} 