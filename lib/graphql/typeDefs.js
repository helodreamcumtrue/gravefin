export const typeDefs = /* GraphQL */ `
  enum ProjectStatus {
    LISTED
    PENDING_APPROVAL
    ACTIVE
    SUBMITTED
    COMPLETED
    GHOSTED_RELISTED
    CANCELLED_RELISTED
    REJECTED_BADFAITH
    CLOSED
  }

  enum CommitmentStatus {
    PENDING_APPROVAL
    ACTIVE
    SUBMITTED
    COMPLETED
    GHOSTED
    CANCELLED
    REJECTED_BADFAITH
  }

  enum MilestoneStatus {
    PENDING
    MET
    MISSED
  }

  enum LedgerType {
    STAKE_LOCK
    STAKE_FORFEIT
    STAKE_REFUND
    REWARD_CREDIT
    REP_DELTA
    GHOST_STRIKE
  }

  type User {
    id: ID!
    alias: String!
    email: String
    credits: Int!
    reputation: Int!
    ghostStrikes: Int!
    banned: Boolean!
    createdAt: String!
    ownedProjects: [Project!]!
    commitments: [Commitment!]!
    ledgerEntries: [LedgerEntry!]!
  }

  type ProjectAutopsy {
    status: String
    cause: String
    lastActivity: String
    difficulty: String
  }

  type ProjectPeakActivity {
    month: String
    commits: Int
    contributors: Int
    pullRequests: Int
  }

  type RevivalScoreDetails {
    overallScore: Int
    codeHealthScore: Int
    docQualityScore: Int
    effortEstimate: String
  }

  type Project {
    id: ID!
    title: String!
    description: String!
    category: String!
    status: ProjectStatus!
    stakeRequired: Int!
    techTags: [String!]!
    completion: Int!
    milestoneMode: Boolean!
    fileUrl: String
    fileName: String
    reviewTimeoutAt: String
    createdAt: String!
    updatedAt: String!

    # GitHub Repository Intelligence
    githubRepoUrl: String
    githubRepoOwner: String
    githubRepoName: String
    githubDescription: String
    githubStars: Int
    githubForks: Int
    githubWatchers: Int
    githubTotalCommits: Int
    githubCommitFrequency: Float
    githubLastCommitAt: String
    githubContributors: Int
    githubOpenIssues: Int
    githubClosedIssues: Int
    revivalScore: Int
    revivalDetails: RevivalScoreDetails
    githubAnalyzedAt: String
    autopsy: ProjectAutopsy
    peakActivity: ProjectPeakActivity

    # Relations
    ownerId: ID!
    owner: User!
    commitments: [Commitment!]!
    activeCommitment: Commitment
  }

  type Commitment {
    id: ID!
    projectId: ID!
    project: Project!
    takerId: ID!
    taker: User!
    status: CommitmentStatus!
    stakeLocked: Int!
    committedAt: String!
    approvedAt: String
    ghostDeadlineAt: String
    submittedAt: String
    submissionNotes: String
    submissionUrl: String
    resolvedAt: String
    milestones: [Milestone!]!
  }

  type Milestone {
    id: ID!
    commitmentId: ID!
    title: String!
    dueAt: String!
    status: MilestoneStatus!
    missCount: Int!
  }

  type LedgerEntry {
    id: ID!
    userId: ID!
    user: User!
    type: LedgerType!
    amount: Int!
    relatedProjectId: String
    relatedCommitmentId: String
    notes: String
    createdAt: String!
  }

  type SystemStats {
    totalProjects: Int!
    totalResurrections: Int!
    totalCreditsStaked: Int!
    activeDiggers: Int!
    averageRevivalScore: Float!
  }

  type CronResult {
    success: Boolean!
    effectiveDate: String!
    events: [String!]!
    summary: String!
  }

  input ProjectFilterInput {
    search: String
    category: String
    tech: String
    status: ProjectStatus
    minRevivalScore: Int
    maxStake: Int
  }

  input CreateProjectInput {
    title: String!
    description: String!
    category: String
    techTags: [String!]!
    stakeRequired: Int!
    githubRepoUrl: String
    milestoneMode: Boolean
  }

  input SubmitDeliverableInput {
    commitmentId: ID!
    notes: String!
    deliverableUrl: String!
  }

  type Query {
    # Catalog & Discovery
    projects(filter: ProjectFilterInput, limit: Int = 20, offset: Int = 0): [Project!]!
    project(id: ID!): Project
    
    # User & Identity
    me: User
    user(id: ID, alias: String): User
    users(limit: Int = 20): [User!]!
    leaderboard(limit: Int = 10): [User!]!

    # Escrow & Commitments
    commitments(projectId: ID, takerId: ID, status: CommitmentStatus): [Commitment!]!
    commitment(id: ID!): Commitment

    # Financial & Audit Trail
    ledgerEntries(userId: ID, limit: Int = 50): [LedgerEntry!]!

    # System Metrics
    systemStats: SystemStats!
  }

  type Mutation {
    # Project lifecycle
    createProject(input: CreateProjectInput!): Project!
    
    # Escrow & Excavation
    commitToProject(projectId: ID!): Commitment!
    approveCommitment(commitmentId: ID!): Commitment!
    submitDeliverable(input: SubmitDeliverableInput!): Commitment!
    acceptDelivery(commitmentId: ID!): Commitment!
    rejectDelivery(commitmentId: ID!, reason: String): Commitment!
    
    # Milestones
    completeMilestone(commitmentId: ID!, milestoneId: ID!): Milestone!

    # Autonomous Cron Protocol
    triggerTimeoutCheck(secret: String, simulateDaysElapsed: Int = 0): CronResult!
  }
`;
