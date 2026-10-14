import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generatePDF() {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await doc.embedFont(StandardFonts.Courier);
  const fontMonoBold = await doc.embedFont(StandardFonts.CourierBold);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const checkPageBreak = (neededHeight) => {
    if (y - neededHeight < margin + 30) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      drawPageHeaderFooter();
    }
  };

  const drawPageHeaderFooter = () => {
    // Top subtle header line
    page.drawLine({
      start: { x: margin, y: pageHeight - 30 },
      end: { x: pageWidth - margin, y: pageHeight - 30 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8)
    });
    page.drawText('PROJECT GRAVEYARD (GRAVFIN) — GRAPHQL ARCHITECTURE & IMPLEMENTATION', {
      x: margin,
      y: pageHeight - 25,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5)
    });

    // Bottom footer line
    page.drawLine({
      start: { x: margin, y: 35 },
      end: { x: pageWidth - margin, y: 35 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8)
    });
    page.drawText('CONFIDENTIAL & PROPRIETARY — GRAVEFIN ENGINEERING DOCUMENTATION', {
      x: margin,
      y: 22,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5)
    });
  };

  // Draw Header for Page 1
  drawPageHeaderFooter();

  // 1. Title Banner Box
  page.drawRectangle({
    x: margin,
    y: y - 85,
    width: contentWidth,
    height: 85,
    color: rgb(0.06, 0.09, 0.16) // Deep slate
  });

  page.drawText('Gravefin: GraphQL Architecture', {
    x: margin + 16,
    y: y - 32,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  page.drawText('Complete Technical Specification & Implementation Guide', {
    x: margin + 16,
    y: y - 52,
    size: 11,
    font: fontRegular,
    color: rgb(0.75, 0.85, 0.98)
  });

  page.drawText('Version: 1.0.0 (Production)  |  Status: Verified & Tested (100% Pass)  |  Engine: GraphQL Yoga v5', {
    x: margin + 16,
    y: y - 72,
    size: 8,
    font: fontMono,
    color: rgb(0.55, 0.7, 0.85)
  });

  y -= 105;

  // Helper text drawers
  const drawHeading1 = (text) => {
    checkPageBreak(36);
    y -= 12;
    page.drawRectangle({
      x: margin,
      y: y - 2,
      width: 4,
      height: 16,
      color: rgb(0.15, 0.45, 0.95) // Accent blue
    });
    page.drawText(text, {
      x: margin + 10,
      y: y,
      size: 13,
      font: fontBold,
      color: rgb(0.08, 0.12, 0.2)
    });
    y -= 18;
  };

  const drawHeading2 = (text) => {
    checkPageBreak(24);
    y -= 8;
    page.drawText(text, {
      x: margin,
      y: y,
      size: 10.5,
      font: fontBold,
      color: rgb(0.15, 0.2, 0.3)
    });
    y -= 14;
  };

  const drawParagraph = (text) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (fontRegular.widthOfTextAtSize(candidate, 9) > contentWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }
    if (currentLine) lines.push(currentLine);

    const totalHeight = lines.length * 13 + 8;
    checkPageBreak(totalHeight);

    for (const line of lines) {
      page.drawText(line, {
        x: margin,
        y: y,
        size: 9,
        font: fontRegular,
        color: rgb(0.2, 0.25, 0.3)
      });
      y -= 13;
    }
    y -= 6;
  };

  const drawBullet = (boldTitle, text) => {
    const bulletIndent = 16;
    const textAvailableWidth = contentWidth - bulletIndent;
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (fontRegular.widthOfTextAtSize(candidate, 8.8) > textAvailableWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }
    if (currentLine) lines.push(currentLine);

    const totalHeight = lines.length * 13 + 6;
    checkPageBreak(totalHeight);

    // Draw bullet symbol
    page.drawText('•', {
      x: margin + 3,
      y: y,
      size: 11,
      font: fontBold,
      color: rgb(0.15, 0.45, 0.95)
    });

    // Draw bold prefix on first line
    const prefix = boldTitle ? `${boldTitle}: ` : '';
    page.drawText(prefix, {
      x: margin + bulletIndent,
      y: y,
      size: 8.8,
      font: fontBold,
      color: rgb(0.12, 0.16, 0.24)
    });

    const prefixWidth = fontBold.widthOfTextAtSize(prefix, 8.8);
    let isFirst = true;

    // We can format the first line after prefix, or draw the wrapped lines
    // To ensure exact wrapping with prefix:
    let lineIndex = 0;
    // Re-wrap accounting for prefix on first line:
    const customLines = [];
    let cur = '';
    for (const word of words) {
      const maxW = customLines.length === 0 ? textAvailableWidth - prefixWidth : textAvailableWidth;
      const cand = cur ? `${cur} ${word}` : word;
      if (fontRegular.widthOfTextAtSize(cand, 8.8) > maxW) {
        customLines.push(cur);
        cur = word;
      } else {
        cur = cand;
      }
    }
    if (cur) customLines.push(cur);

    for (let i = 0; i < customLines.length; i++) {
      const lineX = i === 0 ? margin + bulletIndent + prefixWidth : margin + bulletIndent;
      page.drawText(customLines[i], {
        x: lineX,
        y: y,
        size: 8.8,
        font: fontRegular,
        color: rgb(0.22, 0.27, 0.33)
      });
      y -= 13;
    }
    y -= 3;
  };

  const drawCodeBox = (lines) => {
    const boxHeight = lines.length * 12 + 14;
    checkPageBreak(boxHeight + 10);
    page.drawRectangle({
      x: margin,
      y: y - boxHeight,
      width: contentWidth,
      height: boxHeight,
      color: rgb(0.96, 0.97, 0.98),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 1
    });

    let lineY = y - 12;
    for (const line of lines) {
      page.drawText(line, {
        x: margin + 10,
        y: lineY,
        size: 7.8,
        font: fontMono,
        color: rgb(0.15, 0.18, 0.24)
      });
      lineY -= 12;
    }
    y -= boxHeight + 12;
  };

  // Section 1
  drawHeading1('1. What GraphQL Is Doing in Gravefin');
  drawParagraph(
    'Gravefin is a blind, trustless, escrow-backed marketplace designed to resurrect abandoned student and developer side projects. In this domain, data entities do not exist in isolation—they form an intricate relational graph connecting dead repositories, anonymous Diggers, forensic autopsies, active escrow commitments, and append-only ledger entries.'
  );

  drawBullet(
    'Graph-Based Single-Round-Trip Retrieval',
    'Eliminates REST waterfall latency. Clients fetch projects, owners, autopsies, and commitments in a single HTTP POST request.'
  );
  drawBullet(
    'Atomic Escrow State Mutations',
    'Executes transactional staking and sign-offs directly with Prisma, ensuring ledger synchronization.'
  );
  drawBullet(
    'Automated Privacy & Identity Shielding',
    'Resolvers dynamically hide emails and credentials, ensuring complete anonymity across all counter-parties.'
  );
  drawBullet(
    'Deterministic Cron Timeouts',
    'Allows clients and simulation engines to trigger 14-day taker dormancy and 7-day owner ghost resolution.'
  );

  y -= 4;

  // Section 2
  drawHeading1('2. System Architecture & Implementation Layers');
  drawParagraph('The GraphQL architecture is organized into four clean, production-grade layers:');

  drawCodeBox([
    '+--------------------------------------------------------------------------+',
    '|  1. SCHEMA DEFINITION: lib/graphql/typeDefs.js                           |',
    '|     - Strict GraphQL SDL (Types: Project, User, Commitment, LedgerEntry) |',
    '|     - Defines Queries (projects, leaderboard, ledgerEntries) & Mutations  |',
    '+--------------------------------------------------------------------------+',
    '|  2. RESOLVERS & BUSINESS LOGIC: lib/graphql/resolvers.js                 |',
    '|     - Top-level query resolvers with multi-attribute filtering           |',
    '|     - Nested field resolvers: Project.owner, Project.commitments         |',
    '|     - Transactional mutations: commitToProject, acceptDelivery           |',
    '+--------------------------------------------------------------------------+',
    '|  3. SERVERLESS ENDPOINT: pages/api/graphql.js                            |',
    '|     - Powered by GraphQL Yoga v5 with embedded GraphiQL Playground IDE   |',
    '|     - Injects session auth context via parseSession(req)                 |',
    '+--------------------------------------------------------------------------+',
    '|  4. IN-APP PROTOCOL EXPLORER: pages/graphql.jsx                          |',
    '|     - Integrated parchment UI page linked from primary navigation bar    |',
    '|     - 4 instant preset queries with live execution timer and JSON viewer |',
    '+--------------------------------------------------------------------------+'
  ]);

  // Section 3
  drawHeading1('3. Core Entity Types & Relational Graph');
  drawParagraph('The schema defines complete representations of the Gravefin protocol:');

  drawBullet('Project', 'Dead codebase with title, stakeRequired, techTags, revivalScore, autopsy, and owner.');
  drawBullet('Commitment', 'Active excavation sprint with stakeLocked, ghostDeadlineAt, submissionNotes, milestones.');
  drawBullet('User', 'Pseudonymous Digger with alias, credits, reputation, ghostStrikes, and audit history.');
  drawBullet('LedgerEntry', 'Immutable financial transaction with type (STAKE_LOCK, STAKE_REFUND), amount, and notes.');

  // PAGE BREAK for Queries
  checkPageBreak(120);

  drawHeading1('4. Real Working Query & Mutation Examples');
  drawHeading2('A. Querying Catalog Specimens with Nested Relational Autopsies:');
  drawCodeBox([
    'query GetCatalogSpecimens {',
    '  projects(limit: 2) {',
    '    id',
    '    title',
    '    status',
    '    stakeRequired',
    '    techTags',
    '    revivalScore',
    '    revivalDetails { overallScore, effortEstimate }',
    '    autopsy { cause, difficulty }',
    '    owner { alias, reputation }',
    '  }',
    '}'
  ]);

  drawHeading2('B. Staking Escrow Collateral & Claiming Codebase (Mutation):');
  drawCodeBox([
    'mutation ClaimSpecimen {',
    '  commitToProject(projectId: "p1") {',
    '    id',
    '    status',
    '    stakeLocked',
    '    committedAt',
    '    taker { alias, credits }',
    '  }',
    '}'
  ]);

  drawHeading2('C. Autonomous Timeout Cron Trigger (Mutation):');
  drawCodeBox([
    'mutation ExecuteCronSweep {',
    '  triggerTimeoutCheck(secret: "graveyard_secret_key", simulateDaysElapsed: 7) {',
    '    success',
    '    effectiveDate',
    '    events',
    '    summary',
    '  }',
    '}'
  ]);

  // Section 5
  drawHeading1('5. How to Access, Test & Verify');
  drawBullet('In-App UI Explorer', 'Open http://localhost:3000/graphql or click GraphQL in the top header.');
  drawBullet('Interactive GraphiQL IDE', 'Open http://localhost:3000/api/graphql in any browser for auto-complete & docs.');
  drawBullet('Automated Test Suite', 'Run `npm run test:graphql` to verify query compilation and mutations.');

  // Write file to disk
  const pdfBytes = await doc.save();
  const outputPath = 'd:/GRAVFIN/Gravefin_GraphQL_Architecture_and_Implementation.pdf';
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`✅ PDF successfully generated at: ${outputPath} (${pdfBytes.length} bytes)`);
}

generatePDF().catch(err => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
