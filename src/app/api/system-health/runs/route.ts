import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

export async function GET() {
    try {
        const conn = await dbConnect();
        const db = conn.useDb('agri_trend_dashboard');
        const Runs = db.collection('pipeline_runs');

        // Fetch last 20 runs
        const runs = await Runs.find({})
            .sort({ start_time: -1 })
            .limit(20)
            .toArray();

        // Transform for frontend
        const formattedRuns = runs.map(run => ({
            id: run.run_id,
            job: run.job_name,
            status: run.status, // RUNNING, SUCCESS, FAILED
            startTime: run.start_time,
            duration: run.duration_seconds || 0,
            error: run.metrics?.error || null,
            steps: run.steps || []
        }));

        return NextResponse.json(formattedRuns);
    } catch (error) {
        console.error("API Error (Pipeline Runs):", error);
        return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 });
    }
}
