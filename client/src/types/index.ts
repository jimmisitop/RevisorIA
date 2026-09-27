export interface ChecklistItem {
  id: string;
  label: string;
  status: "passed" | "warning" | "failed";
  completed: boolean;
  required: boolean;
  description?: string;
}

export interface FindingItem {
  id: string;
  category:
    | "sensitive_files"
    | "tests_missing"
    | "security_concern"
    | "documentation"
    | "best_practice";
  title: string;
  description: string;
  severity: "high" | "medium" | "low" | "unspecified";
  remediation?: string;
  files?: string[];
  subagent: "security" | "tests" | "documentation" | "unknown";
}

export interface ChangedFile {
  filename: string;
  status: "added" | "modified" | "deleted";
  additions: number;
  deletions: number;
  isSensitive: boolean;
  diffSnippet: string;
}

export interface SubagentTrace {
  name: "Security Subagent" | "Test Subagent" | "Documentation Subagent";
  icon: string;
  status: "idle" | "running" | "completed" | "flagged";
  durationMs: number;
  findingsCount: number;
  logSummary: string[];
}

export interface PullRequest {
  id: number;
  prNumber: number;
  title: string;
  repo: string;
  baseBranch: string;
  headBranch: string;
  author: {
    name: string;
    avatar: string;
    email: string;
    role: string;
  };
  createdAt: string;
  reviewedAt: string;
  status: "Reviewed" | "Pending" | "Changes Requested" | "Approved";
  riskLevel: "High" | "Medium" | "Low";
  riskScore: number;
  riskSummary: string;
  filesCount: number;
  additions: number;
  deletions: number;
  testsStatus: "Missing" | "Incomplete" | "Passing";
  files: ChangedFile[];
  findings: FindingItem[];
  checklist: ChecklistItem[];
  subagentTraces: SubagentTrace[];
  engineUsed?: "ibm_bob_shell" | "local_heuristics";
  userId?: string;
  htmlUrl?: string;
  jevDecisionMatrix?: {
    securityWeight: number;
    testCoverageWeight: number;
    blastRadiusWeight: number;
    finalDecision: string;
  };
}

export interface DashboardStats {
  totalPRs: number;
  reviewedCount: number;
  pendingCount: number;
  avgReviewTime: string;
  reviewTimeSavings: string;
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export type ActiveView =
  | "home"
  | "dashboard"
  | "history"
  | "pr-detail"
  ;

export interface GitHubRepoItem {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  htmlUrl: string;
  stars: number;
  forks: number;
  openIssuesCount: number;
  defaultBranch: string;
}

export interface GitHubPRItem {
  id: number;
  number: number;
  title: string;
  state: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  user: {
    login: string;
    avatarUrl: string;
  };
  headBranch: string;
  baseBranch: string;
  draft: boolean;
  body: string | null;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
}
