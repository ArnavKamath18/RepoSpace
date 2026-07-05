export interface RepoInfo {
  name: string;
  owner: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  defaultBranch: string;
}

export interface RepoTreeItem {
  path: string;
  type: "blob" | "tree";
  size: number;
}

export interface KeyModule {
  path: string;
  description: string;
}

export interface RepoAnalysis {
  summary: string;
  techStack: string[];
  architecture: string;
  keyModules: KeyModule[];
  improvements: string[];
  suggestedQuestions: string[];
  initialGreeting: string;
}

export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface ScanResult {
  repoInfo: RepoInfo;
  tree: RepoTreeItem[];
  analysis: RepoAnalysis;
}
