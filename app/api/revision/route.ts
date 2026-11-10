export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, RevisionPlan, RevisionTask } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subjectId = request.nextUrl.searchParams.get('subject_id');

    let query = supabase
      .from('revision_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    const { data: plans, error } = await query;

    if (error) {
      console.error('Error fetching revision plans:', error);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to fetch revision plans' },
        { status: 500 }
      );
    }

    // Fetch tasks for each plan
    const plansWithTasks: Array<RevisionPlan & { tasks: RevisionTask[] }> = [];

    for (const plan of plans || []) {
      const { data: tasks, error: tasksError } = await supabase
        .from('revision_tasks')
        .select('*')
        .eq('plan_id', plan.id)
        .order('day_number', { ascending: true })
        .order('priority', { ascending: true });

      if (tasksError) {
        console.error(`Error fetching tasks for plan ${plan.id}:`, tasksError);
      }

      plansWithTasks.push({
        ...plan,
        tasks: (tasks || []) as RevisionTask[],
      } as RevisionPlan & { tasks: RevisionTask[] });
    }

    return NextResponse.json<
      ApiResponse<Array<RevisionPlan & { tasks: RevisionTask[] }>>
    >({
      data: plansWithTasks,
    });
  } catch (err) {
    console.error('Revision GET error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { task_id, completed } = body as {
      task_id: string;
      completed: boolean;
    };

    if (!task_id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'task_id is required' },
        { status: 400 }
      );
    }

    if (typeof completed !== 'boolean') {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'completed must be a boolean' },
        { status: 400 }
      );
    }

    // Fetch the task and verify ownership through the plan
    const { data: task, error: taskError } = await supabase
      .from('revision_tasks')
      .select(`
        id,
        plan_id,
        revision_plans!inner (
          user_id
        )
      `)
      .eq('id', task_id)
      .single();

    if (taskError || !task) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    const planData = task.revision_plans as unknown as { user_id: string };
    if (planData.user_id !== user.id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update task completion status
    const { data: updatedTask, error: updateError } = await supabase
      .from('revision_tasks')
      .update({ completed })
      .eq('id', task_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating revision task:', updateError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<RevisionTask>>({
      data: updatedTask as RevisionTask,
    });
  } catch (err) {
    console.error('Revision PATCH error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
