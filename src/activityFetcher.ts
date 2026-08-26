import axios from 'axios';
import * as dotenv from 'dotenv';
import moment from 'moment';
import { ActivityData, RepoCommitActivity, RepoCreationActivity } from './interfaces/activity';

dotenv.config();

export class ActivityFetcher {
    private readonly username: string;

    constructor(username: string) {
        this.username = username;
    }

    private getGraphQLQuery(from?: string, to?: string) {
        return {
            query: `
                query userActivity($username: String!, $from: DateTime, $to: DateTime) {
                    user(login: $username) {
                        name
                        login
                        contributionsCollection(from: $from, to: $to) {
                            totalCommitContributions
                            totalRepositoryContributions
                            totalPullRequestContributions
                            totalIssueContributions
                            startedAt
                            endedAt
                            commitContributionsByRepository(maxRepositories: 20) {
                                repository {
                                    name
                                    nameWithOwner
                                    isPrivate
                                }
                                contributions {
                                    totalCount
                                }
                            }
                            repositoryContributions(first: 20) {
                                nodes {
                                    occurredAt
                                    repository {
                                        name
                                        nameWithOwner
                                        isPrivate
                                        description
                                        primaryLanguage {
                                            name
                                            color
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `,
            variables: {
                username: this.username,
                from: from || null,
                to: to || null,
            },
        };
    }

    public async fetchActivity(): Promise<ActivityData | string> {
        const token = process.env.TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        const now = moment();
        const startOfMonth = moment(now).startOf('month').utc().toISOString();
        const endOfMonth = moment(now).add(1, 'day').utc().toISOString();

        try {
            // 1. Fetch current month activity
            let response = await axios({
                url: 'https://api.github.com/graphql',
                method: 'POST',
                headers: {
                    Authorization: `bearer ${token}`,
                    'User-Agent': 'GitHub-Activity-Timeline/1.0',
                },
                data: this.getGraphQLQuery(startOfMonth, endOfMonth),
            });

            if (response.data.errors) {
                console.error('GraphQL API Error:', response.data.errors);
                if (response.data.errors[0]?.type === 'RATE_LIMITED') {
                    return '💥 API rate limit exceeded. Please check GitHub Token.';
                }
                return `Can't fetch activity for user @${this.username}`;
            }

            let userData = response.data?.data?.user;
            if (!userData) {
                return `User @${this.username} not found`;
            }

            let collection = userData.contributionsCollection;
            let monthLabel = now.format('MMMM YYYY');

            // If current month has 0 commits and 0 repos, fall back to recent 90-day / 1-year collection
            if (
                collection.totalCommitContributions === 0 &&
                (!collection.repositoryContributions?.nodes ||
                    collection.repositoryContributions.nodes.length === 0)
            ) {
                const ninetyDaysAgo = moment(now).subtract(90, 'days').utc().toISOString();
                const broaderResponse = await axios({
                    url: 'https://api.github.com/graphql',
                    method: 'POST',
                    headers: {
                        Authorization: `bearer ${token}`,
                        'User-Agent': 'GitHub-Activity-Timeline/1.0',
                    },
                    data: this.getGraphQLQuery(ninetyDaysAgo, endOfMonth),
                });

                if (broaderResponse.data?.data?.user) {
                    userData = broaderResponse.data.data.user;
                    collection = userData.contributionsCollection;
                    monthLabel = 'Recent Activity';
                }
            }

            // Parse Commit Activities
            const commitActivities: RepoCommitActivity[] = (
                collection.commitContributionsByRepository || []
            )
                .map((item: any) => ({
                    name: item.repository.name,
                    nameWithOwner: item.repository.nameWithOwner,
                    isPrivate: item.repository.isPrivate,
                    commits: item.contributions.totalCount,
                }))
                .filter((item: RepoCommitActivity) => item.commits > 0)
                .sort((a: RepoCommitActivity, b: RepoCommitActivity) => b.commits - a.commits);

            // Parse Created Repositories
            const createdRepos: RepoCreationActivity[] = (
                collection.repositoryContributions?.nodes || []
            )
                .map((node: any) => ({
                    name: node.repository.name,
                    nameWithOwner: node.repository.nameWithOwner,
                    isPrivate: node.repository.isPrivate,
                    description: node.repository.description,
                    language: node.repository.primaryLanguage
                        ? {
                              name: node.repository.primaryLanguage.name,
                              color: node.repository.primaryLanguage.color || '#58A6FF',
                          }
                        : undefined,
                    occurredAt: node.occurredAt,
                }))
                .sort(
                    (a: RepoCreationActivity, b: RepoCreationActivity) =>
                        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
                );

            return {
                name: userData.name || userData.login,
                login: userData.login,
                month: monthLabel,
                totalCommits: collection.totalCommitContributions || 0,
                totalCommitRepos: commitActivities.length,
                commitActivities,
                createdRepos,
                totalCreatedRepos:
                    collection.totalRepositoryContributions || createdRepos.length,
                totalPullRequests: collection.totalPullRequestContributions || 0,
                totalIssues: collection.totalIssueContributions || 0,
            };
        } catch (error: any) {
            console.error('Error fetching activity:', error?.message || error);
            return `Can't fetch activity for user @${this.username}`;
        }
    }
}
