const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ_MODELS = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

// Initial State with Rich Section Breakdowns for Problem Statement Materials
let state = {
  documents: [
    {
      id: 'doc-bio-1',
      title: 'Biology_Plant_Physiology_Syllabus_and_Textbook.pdf',
      subject: 'Biology',
      docType: 'Syllabus & Textbook',
      size: '3.8 MB',
      pages: 48,
      uploadedAt: '2026-11-10T09:00:00Z',
      topicsCount: 5,
      sections: [
        {
          sectionNumber: 'Section 1.1',
          title: 'Photosynthesis Overview & Chloroplast Ultrastructure',
          chapter: 'Chapter 1: Plant Physiology',
          page: 6,
          summary: 'Anabolic synthesis of hexose sugars from CO2 and H2O using light trapped by chlorophyll pigments.',
          concepts: ['Chlorophyll a (Primary)', 'Chlorophyll b & Carotenoids', 'Thylakoid Membrane vs Stroma'],
          formulas: ['6CO2 + 12H2O -> C6H12O6 + 6O2 + 6H2O'],
          definitions: ['Photosynthesis: Endergonic conversion of radiant energy to chemical bond energy.']
        },
        {
          sectionNumber: 'Section 1.2',
          title: 'Light-Dependent Reactions & Photophosphorylation',
          chapter: 'Chapter 1: Plant Physiology',
          page: 12,
          summary: 'Water splitting at PS II, Z-scheme electron transport chain, and chemiosmotic ATP synthesis via proton gradient in thylakoid lumen.',
          concepts: ['Photolysis of Water', 'Oxygen Evolving Complex (OEC)', 'Z-Scheme', 'CF0-CF1 ATP Synthase', 'Non-cyclic Photophosphorylation'],
          formulas: ['2H2O -> 4H+ + 4e- + O2', 'Proton Motive Force: delta-pH ~3.0 across thylakoid membrane'],
          definitions: ['Photolysis: Water oxidation providing replacement electrons for oxidized P680 reaction center.']
        },
        {
          sectionNumber: 'Section 1.3',
          title: 'Dark Reactions & Calvin-Benson Cycle',
          chapter: 'Chapter 1: Plant Physiology',
          page: 22,
          summary: 'Three enzymatic stages in chloroplast stroma: RuBisCO carbon fixation, 3-PGA reduction, and RuBP regeneration.',
          concepts: ['RuBisCO Enzyme', 'Carbon Fixation', '3-PGA to G3P Reduction', 'RuBP Regeneration'],
          formulas: ['6 CO2 + 18 ATP + 12 NADPH -> 1 C6H12O6 + 18 ADP + 12 NADP+'],
          definitions: ['RuBisCO: Ribulose-1,5-bisphosphate carboxylase-oxygenase, primary carbon fixing enzyme.']
        },
        {
          sectionNumber: 'Section 1.4',
          title: 'Cellular Respiration & Glycolytic Energy Balance',
          chapter: 'Chapter 1: Plant Physiology',
          page: 32,
          summary: 'Catabolic breakdown of glucose via cytoplasm glycolysis, mitochondrial matrix Krebs cycle, and inner membrane cristae ETC.',
          concepts: ['Glycolysis (Anaerobic)', 'Krebs Cycle (Link Reaction)', 'Oxidative Phosphorylation', 'Chemiosmosis'],
          formulas: ['Net Glycolysis: 2 ATP + 2 NADH', 'Total Theoretical Yield: 30-32 ATP per Glucose', 'RQ = CO2 evolved / O2 consumed'],
          definitions: ['Respiratory Quotient (RQ): Ratio of carbon dioxide volume produced to oxygen consumed.']
        },
        {
          sectionNumber: 'Section 1.5',
          title: 'Transpiration & Stomatal Guard Cell Mechanics',
          chapter: 'Chapter 1: Plant Physiology',
          page: 42,
          summary: 'Dixon-Joly Cohesion-Tension theory: transpirational pull creates negative tension in xylem water columns maintained by high water cohesion.',
          concepts: ['Cohesion-Tension Theory', 'Negative Hydrostatic Tension', 'Guard Cell Turgor Pressure', 'K+ Ion Influx'],
          formulas: ['Tensile strength of water columns in xylem > 15-20 MPa'],
          definitions: ['Transpiration: Evaporative water vapor loss from aerial plant surfaces via stomatal pores.']
        }
      ],
      content: `Subject: Biology. Chapter 1: Plant Physiology.
Section 1.1: Photosynthesis Overview & Chloroplast Ultrastructure.
6CO2 + 12H2O -> C6H12O6 + 6O2 + 6H2O. Thylakoid membranes contain Photosystems I and II. Stroma contains carbon fixation enzymes.

Section 1.2: Light-Dependent Reactions & Photophosphorylation.
Photolysis at PS II: 2H2O -> 4H+ + 4e- + O2. Protons accumulate inside the thylakoid lumen, driving CF0-CF1 ATP synthase. Z-scheme: PS II -> PQ -> Cytochrome b6f -> PC -> PS I -> Ferredoxin -> NADPH.

Section 1.3: Dark Reactions (Calvin-Benson Cycle).
Stroma. Phase 1: RuBisCO fixes CO2 with RuBP into 3-PGA. Phase 2: Reduction of 3-PGA to G3P consuming ATP and NADPH. Phase 3: RuBP regeneration. Synthesizing 1 glucose consumes 18 ATP and 12 NADPH.

Section 1.4: Cellular Respiration in Plants.
Glycolysis (cytosol): net 2 ATP, 2 NADH. Krebs cycle (mitochondria matrix): NADH, FADH2, GTP. Oxidative phosphorylation: ETC on cristae yields ~30-32 ATP. RQ of Carbohydrates = 1.0; Fats = 0.7.

Section 1.5: Transpiration & Stomatal Mechanics.
Cohesion-Tension Theory (Dixon & Joly): Negative tension in mesophyll cells pulls water columns upward through xylem. Hydrogen bond cohesion and wall adhesion prevent cavitation. Guard cell K+ influx opens stomata.`
    },
    {
      id: 'doc-bio-2',
      title: 'Biology_Past_5_Years_Question_Papers_Analysis.pdf',
      subject: 'Biology',
      docType: 'Previous Question Papers',
      size: '1.9 MB',
      pages: 22,
      uploadedAt: '2026-11-10T09:15:00Z',
      topicsCount: 4,
      sections: [
        {
          sectionNumber: 'Section 2.1',
          title: 'Exam Blueprint & Chapter 1 Mark Distribution',
          chapter: 'Exam Weightage Blueprint',
          page: 2,
          summary: 'Photosynthesis & Light Reactions account for 35% of total Chapter 1 questions (highest frequency).',
          concepts: ['35% Light Reactions & Photolysis', '25% Calvin Cycle', '25% Cellular Respiration', '15% Transpiration'],
          formulas: ['Total Chapter Marks: 18 / 70'],
          definitions: ['Exam Blueprint: Official topic weightage distribution guidelines.']
        },
        {
          sectionNumber: 'Section 2.2',
          title: 'High-Frequency Exam Question Types & Misconception Analysis',
          chapter: 'Misconception Breakdown',
          page: 8,
          summary: 'Analysis of recurring student mistakes in Board Exams: 68% of students mistakenly draw proton accumulation in the stroma instead of thylakoid lumen.',
          concepts: ['Thylakoid Lumen Proton Gradient', 'Oxygen Source from H2O (not CO2)', 'Light vs Dark Reaction Daylight Synchronization'],
          formulas: ['Mn2+ and Cl- required for OEC water photolysis'],
          definitions: ['Misconception Diagnosis: Identifying the root false premise behind an incorrect answer.']
        }
      ],
      content: `Previous 5 Years Question Papers & Blueprint Analysis (2021-2025).
Exam Weightage: Photosynthesis & Light Reactions: 35%. Calvin Cycle: 25%. Cellular Respiration: 25%. Transpiration: 15%.
Repeated Board Exam Questions:
1. Explain chemiosmotic hypothesis: 68% miss that protons accumulate in the thylakoid lumen (low pH ~5).
2. Photolysis of water: 2H2O -> 4H+ + 4e- + O2. Requires Mn2+ and Cl-.
3. ATP/NADPH cost: 18 ATP and 12 NADPH for 1 glucose.`
    },
    {
      id: 'doc-os-1',
      title: 'Operating_Systems_Concepts_Ch7_Deadlocks.pdf',
      subject: 'Operating Systems',
      docType: 'Textbook PDF',
      size: '2.4 MB',
      pages: 28,
      uploadedAt: '2026-11-09T10:30:00Z',
      topicsCount: 3,
      sections: [
        {
          sectionNumber: 'Section 7.1',
          title: 'The Deadlock Problem & 4 Coffman Conditions',
          chapter: 'Chapter 7: Deadlocks',
          page: 6,
          summary: 'Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait must hold simultaneously for deadlock.',
          concepts: ['Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'Circular Wait'],
          formulas: ['Circular Wait Set: {P0 -> P1 -> ... -> Pn -> P0}'],
          definitions: ['Deadlock: A state where every process in a set is waiting for an event caused only by another process in the set.']
        },
        {
          sectionNumber: 'Section 7.4',
          title: 'Deadlock Avoidance & Dijkstra Banker Algorithm',
          chapter: 'Chapter 7: Deadlocks',
          page: 18,
          summary: 'Requires processes to declare Max needs. Safety algorithm determines if a safe execution sequence exists.',
          concepts: ['Available Vector', 'Max Matrix', 'Allocation Matrix', 'Need Matrix (Max - Allocation)', 'Safety Algorithm'],
          formulas: ['Need[i][j] = Max[i][j] - Allocation[i][j]', 'Work = Work + Allocation[i]'],
          definitions: ['Safe State: System can allocate resources to each process in some order without deadlocking.']
        }
      ],
      content: `Operating Systems Concepts - Chapter 7: Deadlocks.
Section 7.1: Four conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.
Section 7.4: Banker's Algorithm. Available, Max, Allocation, Need matrices. Safe state if a sequence exists where every process can terminate.`
    }
  ],
  quizzes: [
    {
      id: 'quiz-bio-ps',
      title: 'Plant Physiology: Photosynthesis & Light Reactions Diagnostic',
      subject: 'Biology',
      difficulty: 'Medium',
      totalQuestions: 4,
      score: 1,
      accuracy: 25,
      date: 'Today, 11:20 AM',
      topic: 'Photosynthesis & Chloroplast Anatomy',
      questions: [
        {
          id: 'q-bio-1',
          question: 'During the light-dependent reactions of photosynthesis, what is the immediate source of replacement electrons for the oxidized reaction center of Photosystem II (P680)?',
          options: [
            'A. Photolysis of water molecules at the Oxygen Evolving Complex',
            'B. Atmospheric carbon dioxide entering via stomata',
            'C. Oxidation of NADPH in the stroma by Calvin cycle enzymes',
            'D. Glycolytic degradation of glucose in the cytoplasm'
          ],
          correctAnswer: 'A',
          userAnswer: null,
          explanation: 'Water molecules undergo photolytic cleavage at the Oxygen-Evolving Complex (OEC) associated with PS II: 2H2O -> 4H+ + 4e- + O2. The liberated electrons replenish the electron deficiency in photo-excited P680.',
          misconception: 'Believing electrons or oxygen come from CO2; CO2 is used in the stroma Calvin cycle, not PS II photolysis.',
          citation: 'Biology_Plant_Physiology_Syllabus_and_Textbook.pdf (Section 1.2: Light-Dependent Reactions)'
        },
        {
          id: 'q-bio-2',
          question: 'Where do protons (H+) specifically accumulate to generate the electrochemical proton motive force that drives ATP synthase during photophosphorylation?',
          options: [
            'A. Inside the thylakoid lumen (generating a low pH)',
            'B. In the outer chloroplast intermembrane space',
            'C. In the chloroplast stroma surrounding the thylakoids',
            'D. Inside the plant cell vacuole'
          ],
          correctAnswer: 'A',
          userAnswer: null,
          explanation: 'Protons from water photolysis and Cytochrome b6f pumping accumulate inside the internal thylakoid lumen (pH ~5). They diffuse through CF0-CF1 ATP synthase into the stroma (pH ~8), driving ATP phosphorylation.',
          misconception: 'Thinking protons accumulate in the stroma; the stroma has low proton concentration and receives protons from the lumen.',
          citation: 'Biology_Plant_Physiology_Syllabus_and_Textbook.pdf (Section 1.2, Page 12)'
        },
        {
          id: 'q-bio-3',
          question: 'Which enzyme catalyzes the initial carbon-fixing step in the Calvin-Benson cycle by combining CO2 with Ribulose-1,5-bisphosphate (RuBP)?',
          options: [
            'A. RuBisCO (Ribulose-1,5-bisphosphate carboxylase/oxygenase)',
            'B. PEP Carboxylase',
            'C. Pyruvate Kinase',
            'D. Carbonic Anhydrase'
          ],
          correctAnswer: 'A',
          userAnswer: null,
          explanation: 'RuBisCO fixes atmospheric CO2 into 5-carbon RuBP, generating an unstable 6C intermediate that splits into two molecules of 3-PGA.',
          misconception: 'Confusing C3 plant carbon fixation (RuBisCO) with C4 mesophyll fixation (PEP Carboxylase).',
          citation: 'Biology_Plant_Physiology_Syllabus_and_Textbook.pdf (Section 1.3: Dark Reactions)'
        },
        {
          id: 'q-bio-4',
          question: 'According to Dixon and Joly\'s Cohesion-Tension Theory, what provides the primary physical driving force for the continuous upward movement of water in xylem vessels?',
          options: [
            'A. Transpirational pull generating negative hydrostatic tension in leaf mesophyll cells',
            'B. Active ATP-dependent pumping by xylem tracheid living cells',
            'C. Positive root pressure forcing water up against gravity',
            'D. Atmospheric barometric pressure pushing on root hairs'
          ],
          correctAnswer: 'A',
          userAnswer: null,
          explanation: 'Evaporative water loss through stomata creates negative hydrostatic tension in leaf mesophyll cells, which pulls water upward through continuous xylem columns via intermolecular hydrogen bond cohesion.',
          misconception: 'Assuming active biological pumps exist in xylem vessels; mature xylem elements are dead, hollow conduits.',
          citation: 'Biology_Plant_Physiology_Syllabus_and_Textbook.pdf (Section 1.5: Transpiration)'
        }
      ]
    }
  ],
  topics: [
    {
      id: 'top-bio-1',
      name: 'Photosynthesis & Chloroplast Anatomy',
      chapter: 'Chapter 1: Plant Physiology',
      status: 'weak',
      accuracy: 35,
      attempts: 12,
      correct: 4,
      incorrect: 8,
      reason: 'Student repeatedly answered questions incorrectly about the light-dependent reaction and photolysis of water.',
      recommendation: 'Revise Section 1.2 (Light Reaction) and practice 5 questions on the Z-scheme.'
    },
    {
      id: 'top-bio-2',
      name: 'Light-Dependent Reaction (Photophosphorylation)',
      chapter: 'Chapter 1: Plant Physiology',
      status: 'weak',
      accuracy: 30,
      attempts: 10,
      correct: 3,
      incorrect: 7,
      reason: 'Confusing thylakoid lumen proton accumulation with stroma, and mistaking oxygen origin as CO2 instead of H2O.',
      recommendation: 'Review Z-scheme electron transport chain and chemiosmosis proton gradient.'
    },
    {
      id: 'top-bio-3',
      name: 'Dark Reaction (Calvin-Benson Cycle)',
      chapter: 'Chapter 1: Plant Physiology',
      status: 'medium',
      accuracy: 65,
      attempts: 8,
      correct: 5,
      incorrect: 3,
      reason: 'Inconsistent answers on RuBisCO dual enzymatic activity and ATP/NADPH consumption ratios.',
      recommendation: 'Memorize 3 steps of Calvin cycle: Carbon Fixation, 3-PGA Reduction, and RuBP Regeneration.'
    },
    {
      id: 'top-bio-4',
      name: 'Cellular Respiration in Plants',
      chapter: 'Chapter 1: Plant Physiology',
      status: 'medium',
      accuracy: 71,
      attempts: 7,
      correct: 5,
      incorrect: 2,
      reason: 'Minor errors calculating net ATP yield in oxidative phosphorylation vs substrate-level glycolysis.',
      recommendation: 'Review mitochondrial cristae chemiosmosis and respiratory quotient (RQ) tables.'
    },
    {
      id: 'top-bio-5',
      name: 'Transpiration & Stomatal Mechanics',
      chapter: 'Chapter 1: Plant Physiology',
      status: 'strong',
      accuracy: 88,
      attempts: 8,
      correct: 7,
      incorrect: 1,
      reason: 'Demonstrated mastery of Dixon & Joly Cohesion-Tension theory and guard cell osmotic turgor pressure.',
      recommendation: 'Mastered! Ready for board exam.'
    }
  ],
  students: [
    {
      id: 'std-1',
      name: 'Alex Rivera (Demo Student)',
      email: 'demo@gapfinder.ai',
      avatar: 'A',
      institution: 'Stanford School of Engineering',
      enrolledSubjects: ['Biology (Plant Physiology)', 'Operating Systems'],
      totalQuizzes: 4,
      accuracy: 38,
      timeSpentHours: 6.2,
      timeSpentMinutes: 372,
      lastActive: 'Active Now',
      status: 'Online',
      loginsCount: 14,
      lastLogin: 'Today, 03:45 PM',
      device: 'Chrome 124 / Windows 11',
      weakTopics: ['Photosynthesis & Chloroplast Anatomy', 'Light-Dependent Reaction (Photophosphorylation)'],
      mediumTopics: ['Dark Reaction (Calvin-Benson Cycle)', 'Deadlock Avoidance & Banker Algorithm'],
      strongTopics: ['Transpiration & Stomatal Mechanics'],
      recentQuizzes: [
        { id: 'q-sub-1', title: 'Plant Physiology: Photosynthesis & Light Reactions', score: '1 / 4', accuracy: 25, date: 'Today, 11:20 AM', timeTaken: '8m 42s' },
        { id: 'q-sub-2', title: 'Deadlock Avoidance & Banker Algorithm Diagnostic', score: '3 / 4', accuracy: 75, date: 'Today, 10:45 AM', timeTaken: '12m 15s' },
        { id: 'q-sub-3', title: 'Virtual Memory & Page Fault Check', score: '2 / 4', accuracy: 50, date: 'Yesterday, 04:30 PM', timeTaken: '9m 50s' }
      ],
      loginLogs: [
        { timestamp: 'Today, 03:45 PM', ip: '192.168.1.42', location: 'San Francisco, US', device: 'Chrome 124 / Windows 11', status: 'Active Session' },
        { timestamp: 'Today, 10:30 AM', ip: '192.168.1.42', location: 'San Francisco, US', device: 'Chrome 124 / Windows 11', status: 'Signed Out' },
        { timestamp: 'Yesterday, 04:15 PM', ip: '192.168.1.42', location: 'San Francisco, US', device: 'Edge 123 / Windows 11', status: 'Signed Out' },
        { timestamp: 'Nov 08, 09:10 AM', ip: '192.168.1.42', location: 'San Francisco, US', device: 'Chrome 124 / Windows 11', status: 'Signed Out' },
        { timestamp: 'Nov 07, 02:20 PM', ip: '192.168.1.42', location: 'San Francisco, US', device: 'Chrome Mobile / Android', status: 'Signed Out' }
      ]
    },
    {
      id: 'std-2',
      name: 'Priya Sharma',
      email: 'priya.sharma@stanford.edu',
      avatar: 'P',
      institution: 'Stanford Biological Sciences',
      enrolledSubjects: ['Biology (Plant Physiology)'],
      totalQuizzes: 6,
      accuracy: 74,
      timeSpentHours: 9.8,
      timeSpentMinutes: 588,
      lastActive: '18 mins ago',
      status: 'Away',
      loginsCount: 22,
      lastLogin: 'Today, 02:15 PM',
      device: 'Safari 17 / macOS Sonoma',
      weakTopics: ['Light-Dependent Reaction (Photophosphorylation)'],
      mediumTopics: ['Cellular Respiration in Plants'],
      strongTopics: ['Photosynthesis Overview', 'Dark Reaction (Calvin-Benson Cycle)', 'Transpiration & Stomata'],
      recentQuizzes: [
        { id: 'q-sub-4', title: 'Photosynthesis & Electron Transport Diagnostic', score: '4 / 5', accuracy: 80, date: 'Today, 02:30 PM', timeTaken: '14m 20s' },
        { id: 'q-sub-5', title: 'Plant Cellular Respiration Check', score: '3 / 4', accuracy: 75, date: 'Yesterday, 03:10 PM', timeTaken: '11m 05s' }
      ],
      loginLogs: [
        { timestamp: 'Today, 02:15 PM', ip: '172.56.21.90', location: 'Palo Alto, US', device: 'Safari 17 / macOS Sonoma', status: 'Active Session' },
        { timestamp: 'Yesterday, 11:00 AM', ip: '172.56.21.90', location: 'Palo Alto, US', device: 'Safari 17 / macOS Sonoma', status: 'Signed Out' }
      ]
    },
    {
      id: 'std-3',
      name: 'Marcus Vance',
      email: 'm.vance@mit.edu',
      avatar: 'M',
      institution: 'MIT Department of EECS',
      enrolledSubjects: ['Operating Systems & Concurrency'],
      totalQuizzes: 8,
      accuracy: 88,
      timeSpentHours: 14.5,
      timeSpentMinutes: 870,
      lastActive: '2 hours ago',
      status: 'Offline',
      loginsCount: 31,
      lastLogin: 'Today, 12:40 PM',
      device: 'Firefox 125 / Ubuntu Linux',
      weakTopics: [],
      mediumTopics: ['Virtual Memory & Page Replacement'],
      strongTopics: ['Deadlock Avoidance & Banker Algorithm', 'Process Synchronization', 'CPU Scheduling'],
      recentQuizzes: [
        { id: 'q-sub-6', title: 'Deadlock Avoidance & Banker Algorithm Diagnostic', score: '5 / 5', accuracy: 100, date: 'Today, 01:10 PM', timeTaken: '10m 05s' },
        { id: 'q-sub-7', title: 'CPU Scheduling Algorithms Test', score: '4 / 4', accuracy: 100, date: 'Nov 09, 10:00 AM', timeTaken: '8m 30s' }
      ],
      loginLogs: [
        { timestamp: 'Today, 12:40 PM', ip: '18.29.0.12', location: 'Cambridge, US', device: 'Firefox 125 / Linux', status: 'Signed Out' }
      ]
    },
    {
      id: 'std-4',
      name: 'Sophia Chen',
      email: 'sophia.chen@berkeley.edu',
      avatar: 'S',
      institution: 'UC Berkeley Bioengineering',
      enrolledSubjects: ['Biology (Plant Physiology)', 'Operating Systems'],
      totalQuizzes: 5,
      accuracy: 42,
      timeSpentHours: 4.8,
      timeSpentMinutes: 288,
      lastActive: '5 hours ago',
      status: 'Offline',
      loginsCount: 9,
      lastLogin: 'Today, 09:20 AM',
      device: 'Chrome Mobile / Android 14',
      weakTopics: ['Photosynthesis & Chloroplast Anatomy', 'Dark Reaction (Calvin-Benson Cycle)'],
      mediumTopics: ['Cellular Respiration in Plants'],
      strongTopics: ['Transpiration & Stomatal Mechanics'],
      recentQuizzes: [
        { id: 'q-sub-8', title: 'Plant Physiology Comprehensive Diagnostic', score: '2 / 5', accuracy: 40, date: 'Today, 09:45 AM', timeTaken: '16m 30s' }
      ],
      loginLogs: [
        { timestamp: 'Today, 09:20 AM', ip: '128.32.0.8', location: 'Berkeley, US', device: 'Chrome Mobile / Android', status: 'Signed Out' }
      ]
    }
  ]
};

// Helper: Call Groq API
async function callGroq(messages, temperature = 0.2, jsonMode = false) {
  let lastErr = null;
  for (const model of GROQ_MODELS) {
    try {
      const response = await new Promise((resolve, reject) => {
        const payload = { model, messages, temperature };
        if (jsonMode) payload.response_format = { type: 'json_object' };
        const data = JSON.stringify(payload);

        const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
          },
          timeout: 25000
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(body);
                resolve(parsed.choices[0].message.content);
              } catch (e) {
                reject(new Error('JSON parse error: ' + e.message));
              }
            } else {
              reject(new Error(`Groq HTTP ${res.statusCode}: ${body}`));
            }
          });
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Groq request timed out'));
        });
        req.write(data);
        req.end();
      });
      return response;
    } catch (err) {
      console.warn(`Groq model ${model} failed:`, err.message);
      lastErr = err;
    }
  }
  throw lastErr || new Error('All Groq models failed');
}

// Request parser
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Extract Sections from Document Text (via AI + Regex fallback)
async function extractDocumentSections(title, content, subject) {
  const prompt = `Analyze this educational study document and extract its structured chapter and section hierarchy.
DOCUMENT TITLE: ${title}
SUBJECT: ${subject}
DOCUMENT TEXT (first 4000 characters):
${content.substring(0, 4000)}

Extract 2 to 5 distinct sections with key concepts, formulas, and definitions.
Return ONLY a valid JSON object matching this schema:
{
  "sections": [
    {
      "sectionNumber": "Section 1.1",
      "title": "Section Title",
      "chapter": "Chapter Name",
      "page": 1,
      "summary": "Brief summary of what this section covers",
      "concepts": ["Concept 1", "Concept 2"],
      "formulas": ["Formula 1"],
      "definitions": ["Definition 1"]
    }
  ]
}`;

  try {
    const aiRaw = await callGroq([
      { role: 'system', content: 'You are an educational syllabus analyzer. Return valid JSON only with exact section extractions.' },
      { role: 'user', content: prompt }
    ], 0.1, true);
    const parsed = JSON.parse(aiRaw);
    if (parsed.sections && parsed.sections.length > 0) {
      return parsed.sections;
    }
  } catch (err) {
    console.warn('AI section extraction fallback:', err.message);
  }

  // Fallback: Rule-based section parsing
  const sections = [];
  const lines = content.split('\n');
  let currentSec = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(SECTION|Chapter|Unit)\s+[\d\.]+/i.test(trimmed)) {
      if (currentSec) sections.push(currentSec);
      currentSec = {
        sectionNumber: trimmed.split(':')[0] || 'Section 1',
        title: trimmed.split(':')[1]?.trim() || trimmed,
        chapter: subject + ' Fundamentals',
        page: sections.length * 5 + 1,
        summary: 'Educational content on ' + trimmed,
        concepts: [trimmed],
        formulas: [],
        definitions: []
      };
    } else if (currentSec && currentSec.concepts.length < 4 && trimmed.length > 10 && trimmed.length < 80) {
      if (/^[0-9\-\*•]/.test(trimmed)) {
        currentSec.concepts.push(trimmed.replace(/^[0-9\-\*•\.\s]+/, ''));
      }
    }
  }
  if (currentSec) sections.push(currentSec);

  if (sections.length === 0) {
    sections.push({
      sectionNumber: 'Section 1.1',
      title: title.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      chapter: subject + ' Core',
      page: 1,
      summary: content.substring(0, 150) + '...',
      concepts: ['Core Concepts in ' + subject],
      formulas: [],
      definitions: []
    });
  }

  return sections;
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // AUTHENTICATION LOGIN ROUTE (STUDENT & ADMIN)
    if (method === 'POST' && pathname === '/api/auth/login') {
      const data = await parseBody(req);
      const email = (data.email || '').trim().toLowerCase();
      const password = (data.password || '').trim();

      if (email === 'admin@gapfinder.ai' && password === 'Admin@2026') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          role: 'admin',
          user: { name: 'Prof. David Vance', email: 'admin@gapfinder.ai', role: 'Administrator' }
        }));
        return;
      }

      if (email === 'demo@gapfinder.ai' && password === 'GapFinder@2026') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          role: 'student',
          user: { name: 'Alex Rivera', email: 'demo@gapfinder.ai', role: 'Student' }
        }));
        return;
      }

      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Invalid credentials. Demo: demo@gapfinder.ai / GapFinder@2026 | Admin: admin@gapfinder.ai / Admin@2026'
      }));
      return;
    }

    // ADMIN: GET /api/admin/students
    if (method === 'GET' && pathname === '/api/admin/students') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state.students));
      return;
    }

    // ADMIN: GET /api/admin/student/:id
    if (method === 'GET' && pathname.startsWith('/api/admin/student/')) {
      const stdId = pathname.replace('/api/admin/student/', '');
      const student = state.students.find(s => s.id === stdId);
      if (student) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(student));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Student not found' }));
      }
      return;
    }

    // ADMIN: GET /api/admin/analytics (Cohort Summary)
    if (method === 'GET' && pathname === '/api/admin/analytics') {
      const totalStudents = state.students.length;
      let totalQuizzes = 0;
      let totalAccuracySum = 0;
      let totalHours = 0;

      state.students.forEach(s => {
        totalQuizzes += s.totalQuizzes;
        totalAccuracySum += s.accuracy;
        totalHours += s.timeSpentHours;
      });

      const avgAccuracy = totalStudents > 0 ? Math.round(totalAccuracySum / totalStudents) : 0;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        totalStudents,
        totalQuizzes,
        avgAccuracy,
        totalHours: totalHours.toFixed(1),
        activeSessions: state.students.filter(s => s.status === 'Online').length,
        classWeakTopics: [
          { name: 'Light-Dependent Reactions & Photolysis', failureRate: 68, affectedStudents: 3 },
          { name: 'Banker\'s Algorithm Safe State Logic', failureRate: 58, affectedStudents: 2 },
          { name: 'Effective Access Time (EAT) under TLB Misses', failureRate: 52, affectedStudents: 2 },
          { name: 'RuBisCO Dual Enzymatic Regulation', failureRate: 40, affectedStudents: 2 },
          { name: 'Transpiration Cohesion-Tension', failureRate: 14, affectedStudents: 1 }
        ]
      }));
      return;
    }

    // 1. GET /api/documents
    if (method === 'GET' && pathname === '/api/documents') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state.documents));
      return;
    }

    // 2. POST /api/documents/upload (DIRECT FILE UPLOAD WITH SECTION EXTRACTION)
    if (method === 'POST' && (pathname === '/api/documents/upload' || pathname === '/api/documents')) {
      const data = await parseBody(req);
      const docTitle = data.title || 'Uploaded_Document_' + Date.now() + '.txt';
      const docSubject = data.subject || 'Biology';
      const docType = data.docType || 'Syllabus & Textbook';
      const docContent = data.content || '';

      if (!docContent.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Document content cannot be empty. Please provide text or notes.' }));
        return;
      }

      // Extract Structured Relevant Sections via Groq / Rule engine
      const extractedSections = await extractDocumentSections(docTitle, docContent, docSubject);

      const newDoc = {
        id: 'doc-' + Date.now(),
        title: docTitle,
        subject: docSubject,
        docType: docType,
        size: (Buffer.byteLength(docContent, 'utf8') / 1024).toFixed(1) + ' KB',
        pages: Math.max(1, Math.ceil(docContent.length / 1500)),
        uploadedAt: new Date().toISOString(),
        topicsCount: extractedSections.length,
        sections: extractedSections,
        content: docContent
      };

      state.documents.unshift(newDoc);

      // Register topics from sections
      extractedSections.forEach((sec, idx) => {
        state.topics.unshift({
          id: 'top-' + Date.now() + '-' + idx,
          name: sec.title,
          chapter: sec.chapter || 'Chapter 1',
          status: 'not_assessed',
          accuracy: 0,
          attempts: 0,
          correct: 0,
          incorrect: 0,
          reason: `Extracted from ${sec.sectionNumber} in ${docTitle}. Not yet assessed in diagnostic quiz.`,
          recommendation: `Take a diagnostic quiz on ${sec.title} to assess baseline understanding.`
        });
      });

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: `Successfully uploaded and extracted ${extractedSections.length} relevant sections!`,
        document: newDoc,
        sections: extractedSections
      }));
      return;
    }

    // 3. DELETE /api/documents/:id
    if (method === 'DELETE' && pathname.startsWith('/api/documents/')) {
      const docId = pathname.replace('/api/documents/', '');
      const prevLen = state.documents.length;
      state.documents = state.documents.filter(d => d.id !== docId);

      if (state.documents.length < prevLen) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Document deleted successfully', id: docId }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Document not found' }));
      }
      return;
    }

    // 4. GET /api/quizzes
    if (method === 'GET' && pathname === '/api/quizzes') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state.quizzes));
      return;
    }

    // 5. DELETE /api/quizzes/:id
    if (method === 'DELETE' && pathname.startsWith('/api/quizzes/')) {
      const quizId = pathname.replace('/api/quizzes/', '');
      const prevLen = state.quizzes.length;
      state.quizzes = state.quizzes.filter(q => q.id !== quizId);

      if (state.quizzes.length < prevLen) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Quiz attempt deleted', id: quizId }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Quiz not found' }));
      }
      return;
    }

    // 6. DELETE /api/quizzes
    if (method === 'DELETE' && pathname === '/api/quizzes') {
      state.quizzes = [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'All quiz attempts cleared' }));
      return;
    }

    // 7. POST /api/quiz/generate (Grounded in uploaded documents)
    if (method === 'POST' && pathname === '/api/quiz/generate') {
      const data = await parseBody(req);
      const topicName = data.topic || 'Photosynthesis & Chloroplast Anatomy';
      const numQuestions = Math.min(Math.max(1, parseInt(data.count) || 3), 5);
      const difficulty = data.difficulty || 'Medium';

      const docsContext = state.documents.map(d => `--- SOURCE: ${d.title} (Type: ${d.docType}) ---\n${d.content.substring(0, 3000)}`).join('\n\n');

      const prompt = `You are an expert diagnostic quiz generator for GapFinder AI.
Generate ${numQuestions} multiple-choice diagnostic questions on "${topicName}" at "${difficulty}" difficulty.
REQUIREMENTS:
1. Every question MUST be grounded strictly in the provided study material.
2. Provide 4 options labeled "A", "B", "C", "D".
3. Specify the exact correct answer letter ("A", "B", "C", or "D").
4. Provide a thorough pedagogical explanation of why the correct answer is right.
5. Provide a specific misconception analysis explaining why students pick wrong options.
6. Provide an exact source citation citing the document name, section, and page.

STUDY MATERIAL:
${docsContext}

Return ONLY a valid JSON object matching this schema:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text...",
      "options": [
        "A. Option 1",
        "B. Option 2",
        "C. Option 3",
        "D. Option 4"
      ],
      "correctAnswer": "A",
      "explanation": "Detailed explanation...",
      "misconception": "Why students pick incorrect options...",
      "citation": "${state.documents[0]?.title || 'Syllabus.pdf'} (Section 1.2)"
    }
  ]
}`;

      try {
        const aiRaw = await callGroq([
          { role: 'system', content: 'You are a rigorous diagnostic examiner. Return valid JSON only with exact citations.' },
          { role: 'user', content: prompt }
        ], 0.2, true);

        const parsed = JSON.parse(aiRaw);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          topic: topicName,
          difficulty: difficulty,
          questions: parsed.questions || []
        }));
      } catch (err) {
        console.error('Quiz generation error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Quiz generation failed: ' + err.message }));
      }
      return;
    }

    // 8. POST /api/quiz/submit
    if (method === 'POST' && pathname === '/api/quiz/submit') {
      const data = await parseBody(req);
      const questions = data.questions || [];
      const userAnswers = data.answers || {};
      const topicName = data.topic || 'Plant Physiology';

      let correctCount = 0;
      const evaluated = questions.map(q => {
        const uAns = userAnswers[q.id] || null;
        const isCorrect = uAns && uAns.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
        if (isCorrect) correctCount++;
        return {
          ...q,
          userAnswer: uAns,
          isCorrect: !!isCorrect
        };
      });

      const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

      const newQuiz = {
        id: 'quiz-' + Date.now(),
        title: topicName + ' Assessment',
        subject: data.subject || 'Biology',
        difficulty: data.difficulty || 'Medium',
        totalQuestions: questions.length,
        score: correctCount,
        accuracy: accuracy,
        date: 'Just now',
        topic: topicName,
        questions: evaluated
      };

      state.quizzes.unshift(newQuiz);

      // Update topic gap status
      const existingTopic = state.topics.find(t => t.name.toLowerCase().includes(topicName.toLowerCase()) || topicName.toLowerCase().includes(t.name.toLowerCase()));
      if (existingTopic) {
        existingTopic.attempts += questions.length;
        existingTopic.correct += correctCount;
        existingTopic.incorrect += (questions.length - correctCount);
        existingTopic.accuracy = Math.round((existingTopic.correct / existingTopic.attempts) * 100);
        if (existingTopic.accuracy < 50) {
          existingTopic.status = 'weak';
          existingTopic.reason = `Accuracy ${existingTopic.accuracy}%. Repeated difficulty with core concepts.`;
          existingTopic.recommendation = `Prioritize revision on ${topicName} and practice targeted numericals.`;
        } else if (existingTopic.accuracy < 80) {
          existingTopic.status = 'medium';
          existingTopic.reason = `Accuracy ${existingTopic.accuracy}%. Partial understanding with occasional errors.`;
          existingTopic.recommendation = `Review core formulas and practice targeted questions.`;
        } else {
          existingTopic.status = 'strong';
          existingTopic.reason = `Accuracy ${existingTopic.accuracy}%. Consistently demonstrated mastery.`;
          existingTopic.recommendation = `Mastered! Keep updated before final exams.`;
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        quiz: newQuiz,
        score: correctCount,
        total: questions.length,
        accuracy: accuracy,
        questions: evaluated
      }));
      return;
    }

    // 9. POST /api/chat
    if (method === 'POST' && pathname === '/api/chat') {
      const data = await parseBody(req);
      const userMessage = data.message || '';

      if (!userMessage.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Message cannot be empty' }));
        return;
      }

      const docsContext = state.documents.map(d => `[DOCUMENT: ${d.title} | Subject: ${d.subject}]\n${d.content.substring(0, 3000)}`).join('\n\n');

      const messages = [
        {
          role: 'system',
          content: `You are the GapFinder AI Personal Tutor.
CRITICAL INSTRUCTIONS:
1. Explain topics strictly based on the student's uploaded learning materials provided below.
2. If the concept is not found in the uploaded text, state clearly: "This topic could not be found in your uploaded materials."
3. Every explanation MUST include an exact source citation at the end in the format:
[Source: Document_Name, Section: X, Page: Y]
4. Highlight common misconceptions and provide clear step-by-step breakdowns.

UPLOADED STUDENT MATERIALS:
${docsContext}`
        },
        { role: 'user', content: userMessage }
      ];

      try {
        const aiReply = await callGroq(messages, 0.3, false);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          reply: aiReply,
          model: 'Groq AI (LPU Inference Engine)'
        }));
      } catch (err) {
        console.error('Chat error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'AI Tutor failed: ' + err.message }));
      }
      return;
    }

    // 10. GET /api/gaps
    if (method === 'GET' && pathname === '/api/gaps') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state.topics));
      return;
    }

    // 11. POST /api/revision/generate
    if (method === 'POST' && pathname === '/api/revision/generate') {
      const data = await parseBody(req);
      const days = parseInt(data.days) || 5;
      const hoursPerDay = parseInt(data.hours) || 2;
      const weakTopics = state.topics.filter(t => t.status === 'weak').map(t => t.name).join(', ') || 'Photosynthesis, Light Reaction';

      const prompt = `Create a prioritized ${days}-day revision plan for an exam student with ${hoursPerDay} hours available daily.
Focus especially on their diagnosed WEAK TOPICS: ${weakTopics}.
Organize by day. For each day list 2-3 specific study tasks with allocated minutes matching the problem statement style:
Day 1:
- Photosynthesis - 45 minutes
- Light Reaction - 45 minutes
- Practice Quiz - 30 minutes
Day 2:
- Respiration - 60 minutes
- Transpiration - 30 minutes
- Practice Quiz - 30 minutes

Return ONLY a valid JSON object matching this schema:
{
  "plan": [
    {
      "day": 1,
      "title": "Day 1: Foundations & High-Risk Gaps",
      "duration": "120 mins",
      "tasks": [
        { "topic": "Photosynthesis - Overview & Pigments", "duration": "45 mins", "action": "Review chloroplast anatomy and absorption spectrum" },
        { "topic": "Light Reaction - Z-Scheme & Photolysis", "duration": "45 mins", "action": "Study PS II water splitting and chemiosmosis" },
        { "topic": "Diagnostic Retest", "duration": "30 mins", "action": "Take 5-question retest on GapFinder" }
      ]
    }
  ]
}`;

      try {
        const aiRaw = await callGroq([
          { role: 'system', content: 'You are an educational study planning specialist. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ], 0.2, true);
        const parsed = JSON.parse(aiRaw);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, plan: parsed.plan || [] }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Revision planner failed: ' + e.message }));
      }
      return;
    }

    // SERVE FRONTEND (preview.html)
    if (pathname === '/' || pathname === '/index.html' || pathname === '/preview.html') {
      const filePath = path.join(__dirname, 'preview.html');
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error loading preview.html: ' + err.message);
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }

    // Default 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));

  } catch (globalErr) {
    console.error('Server error:', globalErr);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error: ' + globalErr.message }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`GapFinder AI Production Server running live at http://localhost:${PORT}`);
  console.log(`Groq API Connected with active models: ${GROQ_MODELS.join(', ')}`);
});
