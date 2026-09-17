import { URL } from 'url';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

const REPOSITORY_QUERY = `
  query RepositoryIntelligence($owner: String!, $name: String!, $commitCursor: String) {
    repository(owner: $owner, name: $name) {
      name
      description
      owner { login }
      createdAt
      updatedAt
      isArchived
      defaultBranchRef {
        name
        target {
          ... on Commit {
            history(first: 100, after: $commitCursor) {
              totalCount
              pageInfo { hasNextPage endCursor }
              nodes { committedDate author { user { login } } }
            }
          }
        }
      }
      licenseInfo { name spdxId }
      stargazerCount
      forkCount
      watchers { totalCount }
      issues(first: 1, states: OPEN) { totalCount }
      closedIssues: issues(first: 1, states: CLOSED) { totalCount }
      pullRequests(first: 1, states: [OPEN, CLOSED, MERGED]) { totalCount }
      releases(first: 1) { totalCount }
      readme: object(expression: "HEAD:README.md") {
        ... on Blob { text }
      }
      pullRequestNodes: pullRequests(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes { createdAt }
      }
    }
  }
`;

export function parseGitHubRepositoryUrl(value) {
  if (!value || typeof value !== 'string') return null;

  try {
    const url = new URL(value.trim());
    if (url.hostname.toLowerCase() !== 'github.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const name = parts[1].replace(/\.git$/, '');
    if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(name)) return null;
    return { owner, name, url: `https://github.com/${owner}/${name}` };
  } catch {
    return null;
  }
}

function monthKey(date) {
  return date.toISOString().slice(0, 7);
}

function daysSince(value, now = new Date()) {
  return Math.max(0, (now.getTime() - value.getTime()) / 86400000);
}

function formatElapsedDays(days) {
  if (days < 45) return `${Math.max(1, Math.round(days))} days`;
  if (days < 365) return `${Math.max(1, Math.round(days / 30))} months`;
  return `${Math.max(1, Math.round(days / 365))} years`;
}

function calculateScore({ repository, readmeLength, commits, contributors }) {
  const recentCommits = commits.filter(commit => daysSince(new Date(commit.committedDate)) <= 180).length;
  const recentReleases = repository.releases.totalCount > 0 ? 1 : 0;
  const documentation = Math.min(1, readmeLength / 1200) * 0.6 + (readmeLength > 0 ? 0.25 : 0) + 0.15;
  const development = Math.min(1, recentCommits / 40) * 0.8 + recentReleases * 0.2;
  const community = Math.min(1, contributors / 10) * 0.6 + Math.min(1, repository.pullRequests.totalCount / 20) * 0.4;
  const adoption = Math.min(1, repository.stargazerCount / 200) * 0.6 + Math.min(1, repository.forkCount / 50) * 0.4;
  const issueTotal = repository.issues.totalCount + repository.closedIssues.totalCount;
  const maintenance = issueTotal === 0 ? 0.7 : Math.min(1, repository.closedIssues.totalCount / issueTotal);

  return Math.max(0, Math.min(100, Math.round(
    documentation * 25 + development * 25 + community * 20 + adoption * 15 + maintenance * 15
  )));
}

function buildAnalysis(repository, readmeText) {
  const commits = repository.defaultBranchRef?.target?.history?.nodes || [];
  const commitDates = commits.map(commit => new Date(commit.committedDate)).filter(date => !Number.isNaN(date.getTime()));
  const lastCommitAt = commitDates.length > 0 ? new Date(Math.max(...commitDates.map(date => date.getTime()))) : null;
  const contributorLogins = new Set(commits.map(commit => commit.author?.user?.login).filter(Boolean));
  const pullRequestDates = (repository.pullRequestNodes?.nodes || [])
    .map(pullRequest => new Date(pullRequest.createdAt))
    .filter(date => !Number.isNaN(date.getTime()));
  const activityByMonth = {};

  commits.forEach(commit => {
    const date = new Date(commit.committedDate);
    if (Number.isNaN(date.getTime())) return;
    const key = monthKey(date);
    activityByMonth[key] ||= { commits: 0, contributors: new Set(), pullRequests: 0 };
    activityByMonth[key].commits += 1;
    if (commit.author?.user?.login) activityByMonth[key].contributors.add(commit.author.user.login);
  });

  pullRequestDates.forEach(date => {
    const key = monthKey(date);
    activityByMonth[key] ||= { commits: 0, contributors: new Set(), pullRequests: 0 };
    activityByMonth[key].pullRequests += 1;
  });

  const peak = Object.entries(activityByMonth).sort(([, first], [, second]) => {
    return (second.commits + second.pullRequests) - (first.commits + first.pullRequests);
  })[0];
  const peakActivity = peak ? {
    month: peak[0],
    commits: peak[1].commits,
    contributors: peak[1].contributors.size,
    pullRequests: peak[1].pullRequests
  } : { month: null, commits: 0, contributors: 0, pullRequests: 0 };

  const lastActivity = lastCommitAt || new Date(repository.updatedAt);
  const inactivityDays = daysSince(lastActivity);
  const status = repository.isArchived || inactivityDays > 730 ? 'Abandoned' : inactivityDays > 180 ? 'Dormant' : 'Healthy';
  const cause = status === 'Healthy'
    ? 'Unknown'
    : contributorLogins.size <= 1
      ? 'Maintainer Attrition'
      : readmeText.length < 300
        ? 'Documentation Debt'
        : inactivityDays > 365
          ? 'Stalled Development'
          : repository.stargazerCount < 10
            ? 'Low Community Adoption'
            : 'Incomplete MVP';
  const score = calculateScore({ repository, readmeLength: readmeText.length, commits, contributors: contributorLogins.size });

  return {
    githubRepoOwner: repository.owner.login,
    githubRepoName: repository.name,
    githubDescription: repository.description || '',
    githubCreatedAt: new Date(repository.createdAt),
    githubLastUpdatedAt: new Date(repository.updatedAt),
    githubDefaultBranch: repository.defaultBranchRef?.name || null,
    githubLicense: repository.licenseInfo?.spdxId || repository.licenseInfo?.name || null,
    githubTotalCommits: repository.defaultBranchRef?.target?.history?.totalCount || 0,
    githubCommitFrequency: commitDates.length > 1 ? Number((commitDates.length / Math.max(1, (Math.max(...commitDates.map(date => date.getTime())) - Math.min(...commitDates.map(date => date.getTime()))) / 604800000)).toFixed(2)) : 0,
    githubLastCommitAt: lastCommitAt,
    githubContributors: contributorLogins.size,
    githubOpenIssues: repository.issues.totalCount,
    githubClosedIssues: repository.closedIssues.totalCount,
    githubPullRequests: repository.pullRequests.totalCount,
    githubReleases: repository.releases.totalCount,
    githubStars: repository.stargazerCount,
    githubForks: repository.forkCount,
    githubWatchers: repository.watchers.totalCount,
    githubReadmeExists: Boolean(readmeText),
    githubReadmeLength: readmeText.length,
    revivalScore: score,
    autopsyStatus: status,
    autopsyCause: cause,
    autopsyLastActivity: formatElapsedDays(inactivityDays),
    autopsyDifficulty: score >= 70 ? 'Easy' : score >= 40 ? 'Medium' : 'Hard',
    peakActivityMonth: peakActivity.month,
    peakActivityCommits: peakActivity.commits,
    peakActivityContributors: peakActivity.contributors,
    peakActivityPullRequests: peakActivity.pullRequests,
    githubAnalyzedAt: new Date()
  };
}

export async function analyzeGitHubRepository(repositoryUrl) {
  const parsed = parseGitHubRepositoryUrl(repositoryUrl);
  if (!parsed) throw new Error('A valid public GitHub repository URL is required');
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not configured');

  const requestPage = async (commitCursor = null) => {
    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Digital-Graveyard-Repository-Intelligence'
      },
      body: JSON.stringify({ query: REPOSITORY_QUERY, variables: { ...parsed, commitCursor } })
    });
    const payload = await response.json();
    if (!response.ok || payload.errors?.length) {
      throw new Error(payload.errors?.[0]?.message || `GitHub GraphQL request failed (${response.status})`);
    }
    if (!payload.data?.repository) throw new Error('GitHub repository was not found or is not accessible');
    return payload.data.repository;
  };

  const repository = await requestPage();
  const initialHistory = repository.defaultBranchRef?.target?.history;
  while (initialHistory?.pageInfo?.hasNextPage) {
    const nextPage = await requestPage(initialHistory.pageInfo.endCursor);
    const nextHistory = nextPage.defaultBranchRef?.target?.history;
    initialHistory.nodes.push(...(nextHistory?.nodes || []));
    initialHistory.pageInfo = nextHistory?.pageInfo || { hasNextPage: false, endCursor: null };
  }

  const readmeText = repository.readme?.text || '';
  return { githubRepoUrl: parsed.url, ...buildAnalysis(repository, readmeText) };
}