import { NextResponse } from 'next/server';
import { fetchAndProcessPosts } from '@/lib/reddit';

export async function POST() {
    try {
        const result = await fetchAndProcessPosts();
        return NextResponse.json(result);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to sync data' }, { status: 500 });
    }
}
