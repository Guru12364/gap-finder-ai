import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateRevisionPlan } from '@/lib/rag/pipeline';
import type {
  ApiResponse,
  RevisionPlan,
  RevisionPlanConfig,
  RevisionTask,
} from '@/types';

export async function POST(request: NextRequest) {
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

    const config = (await request.json()) as RevisionPlanConfig;

    if (!config.subject_id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'subject_id is required' },
        { status: 400 }
      );
    }

    if (!config.exam_date) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'exam_date is required' },
        { status: 400 }
      );
    }

    if (!config.daily_hours || config.daily_hours <= 0) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'daily_hours must be a positive number' },
        { status: 400 }
      );
    }

    // Verify subject belongs to user
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('id', config.subject_id)
      .eq('user_id', user.id)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Fetch knowledge gaps for the subject
    const { data: gaps, error: gapsError } = await supabase
      .from('knowledge_gaps')
      .select('*')
      .eq('subject_id', config.subject_id)
      .eq('user_id', user.id);

    if (gapsError) {
      console.error('Error fetching knowledge gaps:', gapsError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to fetch knowledge gaps' },
        { status: 500 }
      );
    }

    // Calculate total days until exam
    const examDate = new Date(config.exam_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = Math.max(
      1,
      Math.ceil(
        (examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    // Generate revision plan using RAG pipeline
    const generatedPlan = await generateRevisionPlan(
      gaps || [],
      config.exam_date,
      config.daily_hours,
      config.subject_id
    );

    // Create revision plan record
    const { data: plan, error: planError } = await supabase
      .from('revision_plans')
      .insert({
        user_id: user.id,
        subject_id: config.subject_id,
        exam_date: config.exam_date,
        total_days: totalDays,
        daily_hours: config.daily_hours,
        status: 'active',
      })
      .select()
      .single();

    if (planError || !plan) {
      console.error('Error creating revision plan:', planError);
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Failed to create revision plan' },
        { status: 500 }
      );
    }

    // Flatten tasks from day-by-day structure
    let allTasks: any[] = [];
    if (Array.isArray(generatedPlan.tasks)) {
      allTasks = generatedPlan.tasks;
    } else if (Array.isArray(generatedPlan.days)) {
      for (const day of generatedPlan.days) {
        if (Array.isArray(day.tasks)) {
          for (const task of day.tasks) {
            allTasks.push({
              ...task,
              day_number: day.day_number || 1,
            });
          }
        }
      }
    }

    // Create revision tasks
    const taskRecords = allTasks.map((task: any) => ({
      plan_id: plan.id,
      day_number: task.day_number || 1,
      topic_id: task.topic_id || null,
      topic_name: task.topic_name || 'General Review',
      chapter: task.chapter || null,
      duration_minutes: task.duration_minutes || 30,
      task_type: task.task_type || 'review',
      objectives: task.objectives || [],
      priority: task.priority || 'medium',
      completed: false,
    }));

    let insertedTasks: RevisionTask[] = [];

    if (taskRecords.length > 0) {
      const { data: tasks, error: tasksError } = await supabase
        .from('revision_tasks')
        .insert(taskRecords)
        .select();

      if (tasksError) {
        console.error('Error creating revision tasks:', tasksError);
        // Clean up the plan
        await supabase.from('revision_plans').delete().eq('id', plan.id);
        return NextResponse.json<ApiResponse<null>>(
          { error: 'Failed to create revision tasks' },
          { status: 500 }
        );
      }

      insertedTasks = (tasks || []) as RevisionTask[];
    }

    const planWithTasks = {
      ...plan,
      tasks: insertedTasks,
    } as RevisionPlan & { tasks: RevisionTask[] };

    return NextResponse.json<
      ApiResponse<RevisionPlan & { tasks: RevisionTask[] }>
    >(
      { data: planWithTasks },
      { status: 201 }
    );
  } catch (err) {
    console.error('Revision generate POST error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
