import fs from 'fs';
import path from 'path';
import { Project, StoryCategory, AuditEvent, ProjectStats, FactualClaim, ScriptData } from '../src/types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'app_data.json');

const INITIAL_CATEGORIES: StoryCategory[] = [
  {
    id: 'scary-stories',
    name: 'Scary Stories',
    description: 'Eerie folklore, creepy urban legends, psychological horror, and unexplained encounters.',
    icon: 'Ghost',
    color: '#8b5cf6', // purple
    projectCount: 1,
    enabled: true,
  },
  {
    id: 'historical-figures',
    name: 'Historical Figures',
    description: 'Intriguing biographies, hidden motivations, and turning points in the lives of historical leaders.',
    icon: 'Crown',
    color: '#f59e0b', // amber
    projectCount: 1,
    enabled: true,
  },
  {
    id: 'greek-mythology',
    name: 'Greek Mythology',
    description: 'Epic tales of the Olympian gods, heroes, tragic hubris, monsters, and divine vengeance.',
    icon: 'Zap',
    color: '#3b82f6', // blue
    projectCount: 1,
    enabled: true,
  },
  {
    id: 'historical-events',
    name: 'Historical Events',
    description: 'Cataclysmic battles, scientific breakthroughs, espionage, and moments that altered world history.',
    icon: 'Landmark',
    color: '#10b981', // emerald
    projectCount: 0,
    enabled: true,
  },
  {
    id: 'true-crime',
    name: 'True Crime',
    description: 'Unsolved mysteries, forensic breakthroughs, high-stakes heists, and investigative deep dives.',
    icon: 'ShieldAlert',
    color: '#ef4444', // red
    projectCount: 0,
    enabled: true,
  },
  {
    id: 'stoic-motivation',
    name: 'Stoic Motivation',
    description: 'Ancient philosophical wisdom from Marcus Aurelius, Seneca, and Epictetus applied to modern discipline.',
    icon: 'Flame',
    color: '#d97706', // orange
    projectCount: 1,
    enabled: true,
  },
  {
    id: 'jokes-funny-stories',
    name: 'Jokes & Funny Stories',
    description: 'Clever observational humor, historical ironies, wit, satire, and comedic timing.',
    icon: 'Smile',
    color: '#ec4899', // pink
    projectCount: 0,
    enabled: true,
  },
];

const SEED_PROJECTS: Project[] = [
  {
    id: 'proj-stoic-mindset',
    title: 'Marcus Aurelius and the Plague of Rome',
    description: 'How Rome’s philosopher emperor faced the Antonine Plague with unwavering Stoic calm and sold royal treasures to feed citizens.',
    category: 'Stoic Motivation',
    language: 'English',
    targetAudience: 'Self-Improvement Seekers & History Buffs',
    targetDuration: '60s',
    narrationStyle: 'Deep, Calm & Authoritative',
    visualStyle: 'Cinematic Ancient Roman Noir',
    aspectRatio: '9:16',
    researchMode: 'combined',
    researchDepth: 'deep',
    scriptTransformation: 'Original script based on research',
    publishingWorkflow: 'Manual approval required',
    status: 'review',
    workflowStages: {
      research: 'completed',
      evidence: 'verified',
      script: 'ready',
      storyboard: 'ready',
      voiceVisuals: 'ready',
      videoPreview: 'ready',
      approval: 'pending',
      publishing: 'pending',
    },
    ideas: [
      {
        id: 'idea-1',
        title: 'The Emperor Who Pawed His Own Crown',
        hook: 'When death knocked on Rome’s gates, Marcus Aurelius didn’t raise taxes—he auctioned off his palace.',
        angle: 'Stoic leadership under catastrophe',
        synopsis: 'Marcus faced the deadly Antonine plague and Northern frontier wars simultaneously, refusing to panic.',
        isRecommended: true,
        whyRecommended: 'Strong historical resonance with universal lessons on leadership and emotional resilience.'
      },
      {
        id: 'idea-2',
        title: 'Meditation in the Trenches',
        hook: 'He wrote the world’s most famous journal while watching an empire burn.',
        angle: 'Personal reflection amid chaos',
        synopsis: 'Focusing on the private journal of Marcus written at the Danubian battlefields.',
        isRecommended: false
      },
      {
        id: 'idea-3',
        title: 'Memento Mori: The Roman Reminder',
        hook: 'You could leave life right now: let that determine what you do and say.',
        angle: 'Daily stoic mortality reflection',
        synopsis: 'Practical breakdown of the Stoic death contemplation technique.',
        isRecommended: false
      }
    ],
    selectedIdeaIndex: 0,
    script: {
      version: 1,
      title: 'The Emperor Who Pawned His Palace',
      hook: 'In 165 AD, a mysterious plague decimated Rome. One third of the population perished. But Marcus Aurelius did something unthinkable.',
      scenes: [
        {
          sceneNumber: 1,
          narration: 'In 165 AD, a mysterious plague decimated Rome. One third of the population perished. But Marcus Aurelius did something unthinkable.',
          visualPrompt: 'Marcus Aurelius standing in a candlelit imperial chamber, looking over a stricken ancient Rome through heavy rain.',
          durationSeconds: 12,
          transition: 'Fade in',
          soundCue: 'Distant storm rumbling, mournful cello melody'
        },
        {
          sceneNumber: 2,
          narration: 'Instead of raising taxes on grieving families, he carried the imperial jewels, silk garments, and golden goblets directly into the Forum—and auctioned them to the public.',
          visualPrompt: 'Close up of imperial golden chalices and royal robes placed on auction tables in Trajan\'s Forum before Roman citizens.',
          durationSeconds: 16,
          transition: 'Quick cut',
          soundCue: 'Chatter of crowd, coins clinking'
        },
        {
          sceneNumber: 3,
          narration: 'He wrote in his journal: "Be like the promontory against which the waves continually break, but it stands firm and tames the fury of the water."',
          visualPrompt: 'Craggy sea cliff enduring colossal ocean waves, morphing into marble bust of Marcus Aurelius with warm backlight.',
          durationSeconds: 18,
          transition: 'Dissolve',
          soundCue: 'Ocean waves crashing, resonant bell'
        },
        {
          sceneNumber: 4,
          narration: 'True power isn\'t controlling the storm. It’s controlling yourself while the storm rages.',
          visualPrompt: 'Silhouette of Marcus on horseback at dusk on the frontier line, looking forward with stoic resolve.',
          durationSeconds: 14,
          transition: 'Fade to black',
          soundCue: 'Inspirational orchestral swell'
        }
      ],
      callToAction: 'Follow for daily timeless wisdom from history\'s greatest minds.',
      estimatedDuration: 60,
      lastEditedAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    claims: [
      {
        id: 'cl-1',
        claimText: 'The Antonine Plague struck the Roman Empire beginning around 165 AD and caused massive mortality.',
        associatedScene: 1,
        status: 'Supported',
        confidenceAssessment: 'High',
        evidence: 'Documented by Galen and contemporary Roman historians; identified generally as an outbreak of smallpox or measles.',
        sourceReferences: ['Galen: Methodus Medendi', 'Cassius Dio: Roman History, Book 72'],
        reviewerNotes: 'Verified historical consensus.'
      },
      {
        id: 'cl-2',
        claimText: 'Marcus Aurelius auctioned imperial palace furnishings and royal treasures in the Forum to fund the war effort and state relief.',
        associatedScene: 2,
        status: 'Supported',
        confidenceAssessment: 'High',
        evidence: 'Historia Augusta (Life of Marcus Aurelius 17.4-5) records a two-month auction in the Forum of Trajan selling gold cups, crystal vessels, and empress robes.',
        sourceReferences: ['Historia Augusta, Vita Marci Antonini Philosophi, 17.4-5'],
        reviewerNotes: 'Documented primary reference.'
      },
      {
        id: 'cl-3',
        claimText: 'Marcus Aurelius wrote the promontory quote in Meditations.',
        associatedScene: 3,
        status: 'Supported',
        confidenceAssessment: 'High',
        evidence: 'Meditations Book 4, Chapter 49: "Be like the cliff against which the waves continually break..."',
        sourceReferences: ['Marcus Aurelius, Meditations, Book IV, 49'],
        reviewerNotes: 'Direct quote verified.'
      }
    ],
    storyboard: [
      {
        id: 'sb-1',
        sceneOrder: 1,
        narrationText: 'In 165 AD, a mysterious plague decimated Rome. One third of the population perished.',
        estimatedDuration: 12,
        visualDescription: 'Dramatic low-angle view of imperial Roman columns veiled in mist and torchlight.',
        subtitleText: 'In 165 AD, a mysterious plague decimated Rome...',
        transition: 'Fade in from black',
        soundMusicInstructions: 'Ominous drone + solo cello'
      },
      {
        id: 'sb-2',
        sceneOrder: 2,
        narrationText: 'Instead of raising taxes on grieving families, he carried the imperial jewels into the Forum.',
        estimatedDuration: 16,
        visualDescription: 'Roman citizens gathered around wooden trestle tables as gold plates and silks are presented.',
        subtitleText: 'He auctioned the imperial palace treasures to fund relief.',
        transition: 'Whip pan to auction block',
        soundMusicInstructions: 'Subtle percussive heartbeat'
      },
      {
        id: 'sb-3',
        sceneOrder: 3,
        narrationText: 'Be like the promontory against which the waves continually break.',
        estimatedDuration: 18,
        visualDescription: 'Stylized cinematic shot of rock fortress enduring crashing sea waves at twilight.',
        subtitleText: '"Be like the cliff against which the waves break..."',
        transition: 'Slow cross-dissolve',
        soundMusicInstructions: 'Strings rising in majestic harmony'
      },
      {
        id: 'sb-4',
        sceneOrder: 4,
        narrationText: 'True power isn\'t controlling the storm. It’s controlling yourself while the storm rages.',
        estimatedDuration: 14,
        visualDescription: 'Golden sunset over the Roman Campagna, Marcus Aurelius silhouette standing tall.',
        subtitleText: 'Control yourself while the storm rages.',
        transition: 'Fade out',
        soundMusicInstructions: 'Deep lingering sub-bass swell'
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'proj-icarus-myth',
    title: 'The Real Warning of Icarus: The Sun Was Only Half the Story',
    description: 'Daedalus warned his son against flying too high near the sun, but also against flying too low near the sea spray.',
    category: 'Greek Mythology',
    language: 'English',
    targetAudience: 'Mythology Enthusiasts & Short Story Fans',
    targetDuration: '60s',
    narrationStyle: 'Dramatic & Suspenseful',
    visualStyle: 'Epic Mythological Bronze Age',
    aspectRatio: '9:16',
    researchMode: 'combined',
    researchDepth: 'deep',
    scriptTransformation: 'Original script based on research',
    publishingWorkflow: 'Manual approval required',
    status: 'scripting',
    workflowStages: {
      research: 'completed',
      evidence: 'verified',
      script: 'ready',
      storyboard: 'pending',
      voiceVisuals: 'pending',
      videoPreview: 'pending',
      approval: 'pending',
      publishing: 'pending',
    },
    ideas: [
      {
        id: 'idea-ic-1',
        title: 'The Forgotten Warning: Don’t Fly Too Low',
        hook: 'Everyone remembers Icarus flew too close to the sun. Almost everyone forgets his father\'s second warning.',
        angle: 'The balance between ambition and apathy',
        synopsis: 'Daedalus warned that the damp sea spray would weigh down the feathers just as fatally as the sun would melt the wax.',
        isRecommended: true
      }
    ],
    selectedIdeaIndex: 0,
    script: {
      version: 1,
      title: 'The Real Warning of Icarus',
      hook: 'You’ve been told the story of Icarus all wrong. Everyone says it\'s a story about hubris—flying too high. But that was only half the lesson.',
      scenes: [
        {
          sceneNumber: 1,
          narration: 'You’ve been told the story of Icarus all wrong. Everyone remembers flying too close to the sun. But that was only half the lesson.',
          visualPrompt: 'Wings made of feathers and beeswax flapping against brilliant azure skies above the Aegean Sea.',
          durationSeconds: 15
        },
        {
          sceneNumber: 2,
          narration: 'Before strapping on the wings, Daedalus gave two rules: If you fly too high, the heat will melt the wax. But if you fly too low, the ocean mist will soak your feathers and drag you under.',
          visualPrompt: 'Daedalus solemnly binding harness to young Icarus in the stone tower of the Cretan labyrinth.',
          durationSeconds: 22
        },
        {
          sceneNumber: 3,
          narration: 'The Greeks didn’t just fear overconfidence. They feared complacency. Flying too low is just as fatal as flying too high.',
          visualPrompt: 'Dramatic split-screen: scorching sun on one side, churning dark ocean waves on the other.',
          durationSeconds: 23
        }
      ],
      callToAction: 'Which danger do you struggle with more: aiming too high, or settling too low? Tell us in the comments.',
      estimatedDuration: 60,
      lastEditedAt: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    claims: [
      {
        id: 'cl-ic-1',
        claimText: 'Ovid\'s Metamorphoses records Daedalus warning Icarus against both flying too high and flying too low.',
        associatedScene: 2,
        status: 'Supported',
        confidenceAssessment: 'High',
        evidence: 'Ovid, Metamorphoses Book VIII, lines 203-208: "Fly a middle course: if too low, the wave will weight your feathers; if too high, the fires will scorch them."',
        sourceReferences: ['Ovid, Metamorphoses, Book VIII']
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'proj-black-forest',
    title: 'The Whispering Pines of the Black Forest',
    description: '18th-century folklore concerning travellers who heard melodic voices calling their exact childhood nicknames from deep between the trees.',
    category: 'Scary Stories',
    language: 'English',
    targetAudience: 'Horror & Creepypasta Fans',
    targetDuration: '30s',
    narrationStyle: 'Eerie, Intimate Whisper',
    visualStyle: 'Dark Folk Horror & Fog',
    aspectRatio: '9:16',
    researchMode: 'ai_only',
    researchDepth: 'standard',
    scriptTransformation: 'Original script based on research',
    publishingWorkflow: 'Manual approval required',
    status: 'ideation',
    workflowStages: {
      research: 'completed',
      evidence: 'unverified',
      script: 'draft',
      storyboard: 'pending',
      voiceVisuals: 'pending',
      videoPreview: 'pending',
      approval: 'pending',
      publishing: 'pending',
    },
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString()
  }
];

interface DatabaseData {
  projects: Project[];
  categories: StoryCategory[];
  auditLogs: AuditEvent[];
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readData(): DatabaseData {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    const initialData: DatabaseData = {
      projects: SEED_PROJECTS,
      categories: INITIAL_CATEGORIES,
      auditLogs: [
        {
          id: 'log-1',
          action: 'System Initialized',
          details: 'AI Video Studio workspace initialized with standard categories and sample projects.',
          timestamp: new Date().toISOString(),
          type: 'create'
        }
      ]
    };
    writeData(initialData);
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      projects: parsed.projects || [],
      categories: parsed.categories || INITIAL_CATEGORIES,
      auditLogs: parsed.auditLogs || []
    };
  } catch (err) {
    console.error('Failed reading database file, using default structure', err);
    return {
      projects: SEED_PROJECTS,
      categories: INITIAL_CATEGORIES,
      auditLogs: []
    };
  }
}

function writeData(data: DatabaseData): void {
  ensureDataDir();
  const tmpFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DATA_FILE);
}

// Public Database API
export const db = {
  getProjects(): Project[] {
    const data = readData();
    return data.projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getProjectById(id: string): Project | undefined {
    const data = readData();
    return data.projects.find(p => p.id === id);
  },

  createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'workflowStages'> & { id?: string }): Project {
    const data = readData();
    const id = projectData.id || `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newProject: Project = {
      ...projectData,
      id,
      createdAt: now,
      updatedAt: now,
      status: projectData.status || 'draft',
      workflowStages: {
        research: 'pending',
        evidence: 'pending',
        script: 'draft',
        storyboard: 'pending',
        voiceVisuals: 'pending',
        videoPreview: 'pending',
        approval: 'pending',
        publishing: 'pending',
      },
    };

    data.projects.unshift(newProject);

    // Update category count
    const cat = data.categories.find(c => c.name.toLowerCase() === newProject.category.toLowerCase());
    if (cat) {
      cat.projectCount = (cat.projectCount || 0) + 1;
    }

    // Add audit log
    data.auditLogs.unshift({
      id: `log-${Date.now()}`,
      projectId: newProject.id,
      projectTitle: newProject.title,
      action: 'Project Created',
      details: `Project "${newProject.title}" in category "${newProject.category}" was created.`,
      timestamp: now,
      type: 'create'
    });

    writeData(data);
    return newProject;
  },

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const data = readData();
    const index = data.projects.findIndex(p => p.id === id);
    if (index === -1) return null;

    const existing = data.projects[index];
    const now = new Date().toISOString();

    // If script updated, record version
    let scriptVersions = existing.scriptVersions || [];
    if (updates.script && (!existing.script || JSON.stringify(updates.script.scenes) !== JSON.stringify(existing.script.scenes))) {
      if (existing.script) {
        scriptVersions.push({ ...existing.script });
      }
    }

    const updated: Project = {
      ...existing,
      ...updates,
      scriptVersions,
      updatedAt: now,
    };

    data.projects[index] = updated;

    data.auditLogs.unshift({
      id: `log-${Date.now()}`,
      projectId: updated.id,
      projectTitle: updated.title,
      action: 'Project Updated',
      details: `Settings/content for project "${updated.title}" updated.`,
      timestamp: now,
      type: 'update'
    });

    writeData(data);
    return updated;
  },

  deleteProject(id: string): boolean {
    const data = readData();
    const index = data.projects.findIndex(p => p.id === id);
    if (index === -1) return false;

    const [deleted] = data.projects.splice(index, 1);

    // Update category count
    const cat = data.categories.find(c => c.name.toLowerCase() === deleted.category.toLowerCase());
    if (cat && cat.projectCount > 0) {
      cat.projectCount--;
    }

    data.auditLogs.unshift({
      id: `log-${Date.now()}`,
      projectId: deleted.id,
      projectTitle: deleted.title,
      action: 'Project Deleted',
      details: `Project "${deleted.title}" was removed.`,
      timestamp: new Date().toISOString(),
      type: 'delete'
    });

    writeData(data);
    return true;
  },

  updateClaim(projectId: string, claimId: string, updates: Partial<FactualClaim>): FactualClaim | null {
    const data = readData();
    const project = data.projects.find(p => p.id === projectId);
    if (!project || !project.claims) return null;

    const claim = project.claims.find(c => c.id === claimId);
    if (!claim) return null;

    Object.assign(claim, updates, { updatedAt: new Date().toISOString() });
    project.updatedAt = new Date().toISOString();

    // Recompute evidence stage status
    const allClaims = project.claims;
    const allVerified = allClaims.every(c => c.status === 'Supported');
    const hasDisputed = allClaims.some(c => c.status === 'Disputed' || c.status === 'Contradicted');

    if (hasDisputed) {
      project.workflowStages.evidence = 'in_progress';
    } else if (allVerified && allClaims.length > 0) {
      project.workflowStages.evidence = 'verified';
    }

    data.auditLogs.unshift({
      id: `log-${Date.now()}`,
      projectId: project.id,
      projectTitle: project.title,
      action: 'Claim Verification Updated',
      details: `Claim "${claim.claimText.slice(0, 50)}..." updated to status: ${claim.status}.`,
      timestamp: new Date().toISOString(),
      type: 'verification'
    });

    writeData(data);
    return claim;
  },

  getCategories(): StoryCategory[] {
    const data = readData();
    // Dynamically recalculate project count
    const countMap: Record<string, number> = {};
    for (const p of data.projects) {
      const key = p.category.toLowerCase();
      countMap[key] = (countMap[key] || 0) + 1;
    }
    return data.categories.map(c => ({
      ...c,
      projectCount: countMap[c.name.toLowerCase()] || 0
    }));
  },

  addCategory(category: Omit<StoryCategory, 'projectCount'>): StoryCategory {
    const data = readData();
    const newCat: StoryCategory = {
      ...category,
      projectCount: 0,
      isCustom: true
    };
    data.categories.push(newCat);
    writeData(data);
    return newCat;
  },

  toggleCategory(id: string): StoryCategory | null {
    const data = readData();
    const cat = data.categories.find(c => c.id === id);
    if (!cat) return null;
    cat.enabled = !cat.enabled;
    writeData(data);
    return cat;
  },

  getStats(): ProjectStats {
    const projects = this.getProjects();
    return {
      totalProjects: projects.length,
      projectsInProgress: projects.filter(p => p.status !== 'approved' && p.status !== 'published').length,
      completedScripts: projects.filter(p => p.workflowStages.script === 'ready' || p.workflowStages.script === 'revised').length,
      videosReadyForReview: projects.filter(p => p.status === 'review' || p.workflowStages.videoPreview === 'ready').length,
      pendingApprovals: projects.filter(p => p.workflowStages.approval === 'pending' && p.workflowStages.videoPreview === 'ready').length,
      publishedCount: projects.filter(p => p.status === 'published').length,
    };
  },

  getAuditLogs(limit = 50): AuditEvent[] {
    const data = readData();
    return data.auditLogs.slice(0, limit);
  }
};
