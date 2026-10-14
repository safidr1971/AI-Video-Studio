export type TargetDuration = '30s' | '60s' | '90s' | '180s';
export type AspectRatio = '9:16' | '16:9' | '1:1';
export type ResearchMode = 'combined' | 'internet' | 'ai_only';
export type ResearchDepth = 'deep' | 'standard' | 'exhaustive';
export type ProjectStatus =
  | 'draft'
  | 'ideation'
  | 'research'
  | 'scripting'
  | 'storyboarding'
  | 'rendering'
  | 'review'
  | 'approved'
  | 'published';

export type VerificationStatus =
  | 'Supported'
  | 'Partially supported'
  | 'Disputed'
  | 'Unverified'
  | 'Contradicted';

export type ConfidenceAssessment = 'High' | 'Medium' | 'Low' | 'Pending';

export interface FactualClaim {
  id: string;
  claimText: string;
  associatedScene: number;
  status: VerificationStatus;
  confidenceAssessment: ConfidenceAssessment;
  evidence?: string;
  contradictingEvidence?: string;
  sourceReferences?: string[];
  reviewerNotes?: string;
  updatedAt?: string;
}

export interface ScriptScene {
  sceneNumber: number;
  narration: string;
  visualPrompt: string;
  durationSeconds: number;
  transition?: string;
  soundCue?: string;
}

export interface ScriptData {
  version: number;
  title: string;
  hook: string;
  scenes: ScriptScene[];
  callToAction: string;
  estimatedDuration: number;
  contentHash?: string;
  lastEditedAt: string;
}

export interface ApprovalRecord {
  approvedBy: string;
  approvedAt: string;
  approvedScriptHash: string;
  approvedScriptVersion: number;
  status: 'approved' | 'rejected' | 'invalidated';
  notes?: string;
}

export interface PublicationRecord {
  publishedBy: string;
  publishedAt: string;
  approvedScriptHash: string;
  platform: string;
  targetAccount?: string;
  status: 'published' | 'scheduled' | 'pending';
}

export interface StoryIdea {
  id: string;
  title: string;
  hook: string;
  angle: string;
  synopsis: string;
  whyRecommended?: string;
  isRecommended?: boolean;
}

export interface StoryboardScene {
  id: string;
  sceneOrder: number;
  narrationText: string;
  estimatedDuration: number;
  visualDescription: string;
  assetUrl?: string;
  assetType?: 'image' | 'video' | 'placeholder';
  subtitleText: string;
  transition: string;
  soundMusicInstructions?: string;
  sourceLicensingInfo?: string;
}

export interface WorkflowStages {
  research: 'pending' | 'in_progress' | 'completed' | 'unimplemented';
  evidence: 'pending' | 'in_progress' | 'verified' | 'unverified';
  script: 'draft' | 'in_progress' | 'ready' | 'revised';
  storyboard: 'pending' | 'in_progress' | 'ready' | 'unimplemented';
  voiceVisuals: 'pending' | 'in_progress' | 'ready';
  videoPreview: 'pending' | 'ready';
  approval: 'pending' | 'approved' | 'rejected';
  publishing: 'pending' | 'scheduled' | 'published' | 'unimplemented';
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: string;
  language: string;
  targetAudience: string;
  targetDuration: TargetDuration;
  narrationStyle: string;
  visualStyle: string;
  aspectRatio: AspectRatio;
  researchMode: ResearchMode;
  researchDepth: ResearchDepth;
  scriptTransformation: string;
  publishingWorkflow: string;
  status: ProjectStatus;
  workflowStages: WorkflowStages;
  ideas?: StoryIdea[];
  selectedIdeaIndex?: number;
  script?: ScriptData;
  scriptVersions?: ScriptData[];
  claims?: FactualClaim[];
  storyboard?: StoryboardScene[];
  currentScriptHash?: string;
  expectedScriptHash?: string;
  approvalRecord?: ApprovalRecord | null;
  publicationRecord?: PublicationRecord | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoryCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  projectCount: number;
  isCustom?: boolean;
  enabled: boolean;
}

export interface AuditEvent {
  id: string;
  projectId?: string;
  projectTitle?: string;
  action: string;
  details: string;
  timestamp: string;
  type?: 'create' | 'update' | 'ai_generate' | 'delete' | 'verification' | 'approval';
}

export interface ProjectStats {
  totalProjects: number;
  projectsInProgress: number;
  completedScripts: number;
  videosReadyForReview: number;
  pendingApprovals: number;
  publishedCount: number;
}
