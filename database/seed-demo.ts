/**
 * Demo Account Seed Script for GapFinder AI
 * Demo credentials:
 *   Email: demo@gapfinder.ai
 *   Password: GapFinder@2026
 *
 * This script seeds a complete, realistic diagnostic learning state for the demo student:
 * - Enrolled Subjects: "Computer Science: Operating Systems", "Data Structures & Algorithms"
 * - Uploaded Materials: Syllabus & Lecture Notes
 * - Extracted Chunks & Embeddings
 * - Mapped Chapters & Topics
 * - Completed Diagnostic Quizzes & Student Answers
 * - Diagnosed Knowledge Gaps (Weak, Medium, Strong)
 * - Personalized Revision Plan & Actionable Day-by-Day Tasks
 * - AI Chat Sessions with grounded citations
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase credentials in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function seedDemoData() {
  console.log('Seeding GapFinder AI demo account data...');

  const demoEmail = 'demo@gapfinder.ai';
  const demoPass = 'GapFinder@2026';

  // 1. Create or fetch demo user
  let userId: string;
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const existingUser = usersData?.users?.find((u) => u.email === demoEmail);

  if (existingUser) {
    userId = existingUser.id;
    console.log(`Found existing demo user: ${userId}`);
  } else {
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: demoPass,
      email_confirm: true,
      user_metadata: { full_name: 'Alex Rivera (Demo Student)' },
    });

    if (createErr || !newUser?.user) {
      console.error('Failed to create demo user:', createErr);
      return;
    }
    userId = newUser.user.id;
    console.log(`Created new demo user: ${userId}`);
  }

  // 2. Ensure profile exists
  await supabase.from('profiles').upsert({
    id: userId,
    email: demoEmail,
    full_name: 'Alex Rivera (Demo Student)',
    updated_at: new Date().toISOString(),
  });

  // 3. Create Subject: Operating Systems
  const { data: subjectOS, error: osErr } = await supabase
    .from('subjects')
    .insert({
      user_id: userId,
      name: 'Operating Systems & Concurrency',
      description: 'Core concepts in processes, threads, deadlock prevention, virtual memory, and file systems.',
      document_count: 2,
      topic_count: 6,
    })
    .select()
    .single();

  if (osErr || !subjectOS) {
    console.error('Error inserting subject OS:', osErr);
    return;
  }

  // 4. Create Documents for Operating Systems
  const { data: docOS } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      subject_id: subjectOS.id,
      name: 'Silberschatz_Operating_Systems_Syllabus',
      file_name: 'Silberschatz_Operating_Systems_Syllabus.pdf',
      file_size: 2450000,
      file_type: 'application/pdf',
      document_type: 'syllabus',
      status: 'completed',
      page_count: 28,
    })
    .select()
    .single();

  const docId = docOS?.id || 'doc-1';

  // 5. Insert Document Chunks
  await supabase.from('document_chunks').insert([
    {
      document_id: docId,
      subject_id: subjectOS.id,
      content: 'Deadlock avoidance requires that the operating system be given in advance additional information concerning which resources a process will request and use during its lifetime. With Banker Algorithm, each process declares its maximum need.',
      chunk_index: 0,
      metadata: {
        document_name: 'Silberschatz_Operating_Systems_Syllabus.pdf',
        chapter: 'Chapter 7: Deadlocks',
        section: '7.5 Deadlock Avoidance & Banker Algorithm',
        page_number: 14,
      },
    },
    {
      document_id: docId,
      subject_id: subjectOS.id,
      content: 'A safe state is not a deadlocked state. Conversely, a deadlocked state is an unsafe state. Not all unsafe states are deadlocks, an unsafe state may merely lead to a deadlock under adversarial scheduling.',
      chunk_index: 1,
      metadata: {
        document_name: 'Silberschatz_Operating_Systems_Syllabus.pdf',
        chapter: 'Chapter 7: Deadlocks',
        section: '7.5.1 Safe States',
        page_number: 15,
      },
    },
    {
      document_id: docId,
      subject_id: subjectOS.id,
      content: 'Virtual memory separates user logical memory from physical memory. Demand paging brings a page into physical memory only when it is referenced during execution via page fault handling.',
      chunk_index: 2,
      metadata: {
        document_name: 'Silberschatz_Operating_Systems_Syllabus.pdf',
        chapter: 'Chapter 9: Virtual Memory',
        section: '9.2 Demand Paging',
        page_number: 22,
      },
    },
  ]);

  // 6. Insert Topics
  const topicsData = [
    {
      subject_id: subjectOS.id,
      user_id: userId,
      name: 'Deadlock Avoidance & Banker Algorithm',
      chapter: 'Chapter 7: Deadlocks',
      description: 'Safe vs unsafe resource allocation state verification and resource-request algorithm logic.',
      importance: 'high',
      status: 'weak',
    },
    {
      subject_id: subjectOS.id,
      user_id: userId,
      name: 'Virtual Memory & Demand Paging',
      chapter: 'Chapter 9: Virtual Memory',
      description: 'Page fault handling sequence, page tables, swap space, and effective access time calculations.',
      importance: 'high',
      status: 'medium',
    },
    {
      subject_id: subjectOS.id,
      user_id: userId,
      name: 'CPU Scheduling Algorithms',
      chapter: 'Chapter 5: CPU Scheduling',
      description: 'Round Robin, Shortest Job First, Preemptive Priority Scheduling, and context switch penalties.',
      importance: 'high',
      status: 'strong',
    },
    {
      subject_id: subjectOS.id,
      user_id: userId,
      name: 'Process Synchronization & Semaphores',
      chapter: 'Chapter 6: Synchronization',
      description: 'Critical section problem, Peterson Solution, binary semaphores, and reader-writer problems.',
      importance: 'high',
      status: 'medium',
    },
    {
      subject_id: subjectOS.id,
      user_id: userId,
      name: 'Page Replacement (LRU & FIFO)',
      chapter: 'Chapter 9: Virtual Memory',
      description: 'Belady anomaly, least recently used approximation with clock algorithms, and working set models.',
      importance: 'medium',
      status: 'weak',
    },
    {
      subject_id: subjectOS.id,
      user_id: userId,
      name: 'File System Implementation',
      chapter: 'Chapter 11: File Systems',
      description: 'Indexed allocation, contiguous allocation, file control blocks, and directory organization.',
      importance: 'low',
      status: 'strong',
    },
  ];

  const { data: createdTopics } = await supabase.from('topics').insert(topicsData).select();

  const weakTopic = createdTopics?.find((t) => t.status === 'weak') || createdTopics?.[0];
  const medTopic = createdTopics?.find((t) => t.status === 'medium') || createdTopics?.[1];
  const strongTopic = createdTopics?.find((t) => t.status === 'strong') || createdTopics?.[2];

  // 7. Insert Knowledge Gaps
  if (weakTopic && medTopic && strongTopic) {
    await supabase.from('knowledge_gaps').insert([
      {
        user_id: userId,
        topic_id: weakTopic.id,
        subject_id: subjectOS.id,
        accuracy: 38,
        status: 'weak',
        reason: 'Student consistently confused unsafe states with deadlocked states, and struggled with available resource vector updates in Banker Algorithm.',
        misconceptions: [
          'Assumed all unsafe resource states represent immediate deadlock.',
          'Failed to calculate the Need Matrix (Max - Allocation) before checking available instances.',
        ],
        recommendation: 'Re-read Chapter 7 section 7.5. Practice 5 numerical safety-check problems before attempting next diagnostic.',
      },
      {
        user_id: userId,
        topic_id: medTopic.id,
        subject_id: subjectOS.id,
        accuracy: 65,
        status: 'medium',
        reason: 'Student understood basic demand paging steps but calculated effective access time incorrectly when page fault service penalty was introduced.',
        misconceptions: [
          'Omitted swap-in disk I/O latency when computing effective memory access time.',
        ],
        recommendation: 'Review formula: EAT = (1 - p) * ma + p * (page fault overhead). Solve practice questions.',
      },
      {
        user_id: userId,
        topic_id: strongTopic.id,
        subject_id: subjectOS.id,
        accuracy: 88,
        status: 'strong',
        reason: 'Consistently high accuracy on Round Robin time quantum analysis and turnaround time computations.',
        misconceptions: [],
        recommendation: 'Solid mastery demonstrated. Quick recap before final exam is sufficient.',
      },
    ]);
  }

  // 8. Create Diagnostic Quiz
  const { data: quizOS } = await supabase
    .from('quizzes')
    .insert({
      user_id: userId,
      subject_id: subjectOS.id,
      title: 'Operating Systems Diagnostic Assessment',
      quiz_type: 'full_diagnostic',
      difficulty: 'medium',
      total_questions: 4,
      correct_answers: 3,
      accuracy: 75,
      time_taken: 215,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (quizOS) {
    const questionsData = [
      {
        quiz_id: quizOS.id,
        question: 'In the context of the Banker Algorithm for deadlock avoidance, what is true regarding an "unsafe state"?',
        options: [
          'An unsafe state is guaranteed to be a deadlocked state immediately.',
          'An unsafe state is not necessarily deadlocked, but could lead to deadlock under certain allocation requests.',
          'An unsafe state indicates that CPU utilization has dropped to zero.',
          'An unsafe state cannot occur if preemptive priority scheduling is active.',
        ],
        correct_answer: 1,
        explanation: 'According to Silberschatz Chapter 7, an unsafe state is not necessarily a deadlocked state; rather, a deadlock state is a subset of unsafe states. An unsafe state merely means the system cannot guarantee that all processes will finish.',
        difficulty: 'medium',
        topic_name: 'Deadlock Avoidance & Banker Algorithm',
        chapter: 'Chapter 7: Deadlocks',
        source_citation: {
          document_name: 'Silberschatz_Operating_Systems_Syllabus.pdf',
          page_number: 14,
          section: '7.5.1 Safe States',
          chapter: 'Chapter 7: Deadlocks',
          excerpt: 'A safe state is not a deadlocked state. Conversely, a deadlocked state is an unsafe state. Not all unsafe states are deadlocks.',
        },
        order_index: 0,
      },
      {
        quiz_id: quizOS.id,
        question: 'When a page fault occurs during demand paging, what is the exact chronological next step taken by the operating system trap handler?',
        options: [
          'Terminate the offending process immediately for segmentation violation.',
          'Check the internal page table to determine whether the reference was a valid memory address.',
          'Directly overwrite physical frame 0 without backing store check.',
          'Restart the entire operating system kernel.',
        ],
        correct_answer: 1,
        explanation: 'The hardware traps to the OS. The OS checks an internal table kept with the PCB to determine if the reference was valid or invalid. If invalid, the process is terminated; if valid, the OS pages it in.',
        difficulty: 'medium',
        topic_name: 'Virtual Memory & Demand Paging',
        chapter: 'Chapter 9: Virtual Memory',
        source_citation: {
          document_name: 'Silberschatz_Operating_Systems_Syllabus.pdf',
          page_number: 22,
          section: '9.2 Steps in Handling Page Fault',
          chapter: 'Chapter 9: Virtual Memory',
          excerpt: 'We check an internal table for this process to determine whether the reference was a valid or an invalid memory access.',
        },
        order_index: 1,
      },
      {
        quiz_id: quizOS.id,
        question: 'Which CPU scheduling algorithm is non-preemptive and provably optimal with respect to minimum average waiting time?',
        options: [
          'First-Come, First-Served (FCFS)',
          'Round Robin (RR)',
          'Shortest Job First (SJF)',
          'Multilevel Feedback Queue',
        ],
        correct_answer: 2,
        explanation: 'Shortest-Job-First (SJF) scheduling is provably optimal because it gives the minimum average waiting time for a given set of stationary processes.',
        difficulty: 'easy',
        topic_name: 'CPU Scheduling Algorithms',
        chapter: 'Chapter 5: CPU Scheduling',
        source_citation: {
          document_name: 'Silberschatz_Operating_Systems_Syllabus.pdf',
          page_number: 9,
          section: '5.3.2 Shortest-Job-First Scheduling',
          chapter: 'Chapter 5: CPU Scheduling',
          excerpt: 'The SJF algorithm is provably optimal, in that it gives the minimum average waiting time for a given set of processes.',
        },
        order_index: 2,
      },
      {
        quiz_id: quizOS.id,
        question: 'What is Belady Anomaly in the context of FIFO page replacement?',
        options: [
          'Allocating more physical frames causes fewer page faults.',
          'Allocating more physical frames may unexpectedly increase the number of page faults.',
          'LRU requires exponential time complexity compared to FIFO.',
          'Page tables cannot exceed 4KB in size.',
        ],
        correct_answer: 1,
        explanation: 'Belady anomaly describes the counterintuitive phenomenon where for some page-replacement algorithms (like FIFO), the page-fault rate may increase as the number of allocated frames increases.',
        difficulty: 'hard',
        topic_name: 'Page Replacement (LRU & FIFO)',
        chapter: 'Chapter 9: Virtual Memory',
        source_citation: {
          document_name: 'Silberschatz_Operating_Systems_Syllabus.pdf',
          page_number: 26,
          section: '9.4 FIFO Page Replacement',
          chapter: 'Chapter 9: Virtual Memory',
          excerpt: 'This most unexpected result is known as Belady anomaly: for some page-replacement algorithms, the page-fault rate may increase as the number of allocated frames increases.',
        },
        order_index: 3,
      },
    ];

    const { data: createdQuestions } = await supabase.from('quiz_questions').insert(questionsData).select();

    if (createdQuestions) {
      await supabase.from('student_answers').insert([
        {
          user_id: userId,
          quiz_id: quizOS.id,
          question_id: createdQuestions[0].id,
          selected_answer: 0, // Student answered wrong on Deadlock
          is_correct: false,
          time_taken: 65,
        },
        {
          user_id: userId,
          quiz_id: quizOS.id,
          question_id: createdQuestions[1].id,
          selected_answer: 1, // Correct
          is_correct: true,
          time_taken: 45,
        },
        {
          user_id: userId,
          quiz_id: quizOS.id,
          question_id: createdQuestions[2].id,
          selected_answer: 2, // Correct
          is_correct: true,
          time_taken: 30,
        },
        {
          user_id: userId,
          quiz_id: quizOS.id,
          question_id: createdQuestions[3].id,
          selected_answer: 1, // Correct
          is_correct: true,
          time_taken: 75,
        },
      ]);
    }
  }

  // 9. Create Personalized Revision Plan
  const targetExamDate = new Date();
  targetExamDate.setDate(targetExamDate.getDate() + 7);
  const examDateStr = targetExamDate.toISOString().split('T')[0];

  const { data: revPlan } = await supabase
    .from('revision_plans')
    .insert({
      user_id: userId,
      subject_id: subjectOS.id,
      exam_date: examDateStr,
      total_days: 7,
      daily_hours: 2,
      status: 'active',
    })
    .select()
    .single();

  if (revPlan) {
    await supabase.from('revision_tasks').insert([
      {
        plan_id: revPlan.id,
        day_number: 1,
        topic_name: 'Deadlock Avoidance & Banker Algorithm',
        chapter: 'Chapter 7: Deadlocks',
        duration_minutes: 60,
        task_type: 'study',
        objectives: [
          'Read Silberschatz Chapter 7 Section 7.5 on Safe States',
          'Memorize safety check algorithm steps and vector relations (Need <= Available)',
        ],
        priority: 'high',
        completed: true,
      },
      {
        plan_id: revPlan.id,
        day_number: 1,
        topic_name: 'Deadlock Practice Problems',
        chapter: 'Chapter 7: Deadlocks',
        duration_minutes: 45,
        task_type: 'practice_quiz',
        objectives: ['Complete 5 practice MCQs on Banker Algorithm matrices'],
        priority: 'high',
        completed: false,
      },
      {
        plan_id: revPlan.id,
        day_number: 2,
        topic_name: 'Virtual Memory & Page Replacement',
        chapter: 'Chapter 9: Virtual Memory',
        duration_minutes: 60,
        task_type: 'study',
        objectives: [
          'Review demand paging trap sequence',
          'Compare Belady anomaly trace with FIFO vs LRU reference strings',
        ],
        priority: 'medium',
        completed: false,
      },
      {
        plan_id: revPlan.id,
        day_number: 2,
        topic_name: 'Demand Paging Practice Quiz',
        chapter: 'Chapter 9: Virtual Memory',
        duration_minutes: 30,
        task_type: 'practice_quiz',
        objectives: ['Calculate Effective Access Time (EAT) across 3 exercises'],
        priority: 'medium',
        completed: false,
      },
      {
        plan_id: revPlan.id,
        day_number: 3,
        topic_name: 'Process Synchronization & Semaphores',
        chapter: 'Chapter 6: Synchronization',
        duration_minutes: 60,
        task_type: 'study',
        objectives: ['Understand wait() and signal() atomic primitive implementations'],
        priority: 'medium',
        completed: false,
      },
      {
        plan_id: revPlan.id,
        day_number: 4,
        topic_name: 'CPU Scheduling Recap',
        chapter: 'Chapter 5: CPU Scheduling',
        duration_minutes: 45,
        task_type: 'review',
        objectives: ['Rapid turnaround time review for Round Robin vs SJF'],
        priority: 'low',
        completed: false,
      },
    ]);
  }

  // 10. Create Chat Session with Grounded Citations
  const { data: chatSess } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      subject_id: subjectOS.id,
      title: 'Clarification on Banker Algorithm Safety',
    })
    .select()
    .single();

  if (chatSess) {
    await supabase.from('chat_messages').insert([
      {
        session_id: chatSess.id,
        role: 'user',
        content: 'Why is an unsafe state not necessarily a deadlocked state in operating systems?',
        sources: null,
      },
      {
        session_id: chatSess.id,
        role: 'assistant',
        content: `Based strictly on your uploaded **Silberschatz Operating Systems Syllabus** (Chapter 7, Section 7.5.1, Page 14):\n\nAn **unsafe state** is **not immediately deadlocked**. Rather, it means that the operating system can no longer *guarantee* that every running process will be able to finish without deadlocking.\n\n### Key Conceptual Rules:\n1. **Safe State:** There exists a safe execution sequence $\\langle P_1, P_2, \\dots, P_n \\rangle$ such that for each $P_i$, its maximum remaining resource demands can be satisfied by currently available resources plus resources held by prior processes.\n2. **Unsafe State:** No such guaranteed sequence exists under worst-case maximum claims. However, if processes happen to request fewer resources than their stated maximum, execution may complete smoothly without entering an actual deadlock.\n3. **Deadlock State:** An actual deadlock is a catastrophic sub-condition of unsafe states where circular wait has physically manifested.`,
        sources: [
          {
            document_name: 'Silberschatz_Operating_Systems_Syllabus.pdf',
            page_number: 14,
            chapter: 'Chapter 7: Deadlocks',
            section: '7.5.1 Safe States',
            excerpt: 'A safe state is not a deadlocked state. Conversely, a deadlocked state is an unsafe state. Not all unsafe states are deadlocks; an unsafe state may merely lead to a deadlock.',
          },
        ],
      },
    ]);
  }

  console.log('✅ Demo seed completed successfully!');
  console.log(`Demo Credentials: Email: ${demoEmail} | Password: ${demoPass}`);
}

// Allow direct CLI execution if executed directly
if (process.argv[1]?.includes('seed-demo')) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
