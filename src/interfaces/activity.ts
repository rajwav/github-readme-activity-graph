export interface RepoCommitActivity {
    name: string;
    nameWithOwner: string;
    isPrivate: boolean;
    commits: number;
}

export interface RepoCreationActivity {
    name: string;
    nameWithOwner: string;
    isPrivate: boolean;
    description?: string;
    language?: {
        name: string;
        color: string;
    };
    occurredAt: string;
}

export interface ActivityData {
    name: string;
    login: string;
    month: string;
    totalCommits: number;
    totalCommitRepos: number;
    commitActivities: RepoCommitActivity[];
    createdRepos: RepoCreationActivity[];
    totalCreatedRepos: number;
    totalPullRequests?: number;
    totalIssues?: number;
}
