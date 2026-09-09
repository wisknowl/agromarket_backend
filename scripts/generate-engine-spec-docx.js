const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
} = require('docx');

// Theme Colors
const COLOR_PRIMARY = '1E3A2F'; // Deep Forest Canopy Green
const COLOR_ACCENT = '10B981'; // Emerald Green
const COLOR_GOLD = 'D97706'; // Harvest Gold
const COLOR_SECONDARY = '334155'; // Slate
const COLOR_DARK = '0F172A'; // Dark Text
const COLOR_MUTED = '64748B'; // Muted Grey
const COLOR_BG_ZEBRA = 'F1F5F9'; // Table Zebra
const COLOR_BG_CALLOUT = 'F0FDF4'; // Callout Light Green
const COLOR_BG_WARN = 'FEF3C7'; // Callout Amber
const COLOR_BORDER = 'CBD5E1'; // Border Grey

function createTitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 150 },
    children: [
      new TextRun({
        text: text,
        font: 'Segoe UI',
        size: 52, // 26pt
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function createSubtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 300 },
    children: [
      new TextRun({
        text: text,
        font: 'Segoe UI',
        size: 26, // 13pt
        italics: true,
        color: COLOR_GOLD,
      }),
    ],
  });
}

function createMeta(label, value) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({ text: `${label}: `, font: 'Segoe UI', size: 20, bold: true, color: COLOR_SECONDARY }),
      new TextRun({ text: value, font: 'Segoe UI', size: 20, color: COLOR_DARK }),
    ],
  });
}

function createHeading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 150 },
    children: [
      new TextRun({
        text: text,
        font: 'Segoe UI Semibold',
        size: 34, // 17pt
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function createHeading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [
      new TextRun({
        text: text,
        font: 'Segoe UI Semibold',
        size: 26, // 13pt
        bold: true,
        color: COLOR_GOLD,
      }),
    ],
  });
}

function createHeading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text: text,
        font: 'Segoe UI Semibold',
        size: 22, // 11pt
        bold: true,
        color: COLOR_SECONDARY,
      }),
    ],
  });
}

function createParagraph(text, options = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 100, line: 300 },
    children: [
      new TextRun({
        text: text,
        font: 'Segoe UI',
        size: 21, // 10.5pt
        color: options.color || COLOR_DARK,
        bold: options.bold || false,
        italics: options.italics || false,
      }),
    ],
  });
}

function createBullet(text, boldPrefix = '') {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix + ' ', font: 'Segoe UI', size: 21, bold: true, color: COLOR_PRIMARY }));
  }
  children.push(new TextRun({ text: text, font: 'Segoe UI', size: 21, color: COLOR_DARK }));

  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 60, after: 60, line: 280 },
    children: children,
  });
}

function createCalloutBox(title, text, type = 'info') {
  const borderColor = type === 'warn' ? COLOR_GOLD : COLOR_ACCENT;
  const bgColor = type === 'warn' ? COLOR_BG_WARN : COLOR_BG_CALLOUT;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: bgColor },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: { style: BorderStyle.SINGLE, size: 30, color: borderColor },
            },
            margins: { top: 180, bottom: 180, left: 240, right: 200 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 60 },
                children: [
                  new TextRun({
                    text: title,
                    font: 'Segoe UI Semibold',
                    size: 22,
                    bold: true,
                    color: type === 'warn' ? COLOR_GOLD : COLOR_PRIMARY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0, line: 280 },
                children: [
                  new TextRun({
                    text: text,
                    font: 'Segoe UI',
                    size: 20,
                    color: COLOR_DARK,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createCodeBlock(codeLines) {
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: '1E293B' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: '334155' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '334155' },
            left: { style: BorderStyle.SINGLE, size: 18, color: COLOR_ACCENT },
            right: { style: BorderStyle.SINGLE, size: 6, color: '334155' },
          },
          margins: { top: 140, bottom: 140, left: 200, right: 180 },
          children: codeLines.map(
            (line) =>
              new Paragraph({
                spacing: { before: 20, after: 20 },
                children: [
                  new TextRun({
                    text: line,
                    font: 'Consolas',
                    size: 18,
                    color: line.startsWith('//') ? '94A3B8' : line.includes('class ') || line.includes('interface ') ? '38BDF8' : 'F1F5F9',
                  }),
                ],
              })
          ),
        }),
      ],
    }),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

function createTable(headers, rows) {
  const tableRows = [];

  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headers.map(
        (h) =>
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: COLOR_PRIMARY },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY },
              bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR_GOLD },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            margins: { top: 120, bottom: 120, left: 140, right: 140 },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: h,
                    font: 'Segoe UI Semibold',
                    size: 19,
                    bold: true,
                    color: 'FFFFFF',
                  }),
                ],
              }),
            ],
          })
      ),
    })
  );

  rows.forEach((row, idx) => {
    const isZebra = idx % 2 === 1;
    tableRows.push(
      new TableRow({
        children: row.map(
          (cellText, colIdx) =>
            new TableCell({
              shading: { type: ShadingType.CLEAR, fill: isZebra ? COLOR_BG_ZEBRA : 'FFFFFF' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cellText,
                      font: 'Segoe UI',
                      size: 19,
                      bold: colIdx === 0,
                      color: colIdx === 0 ? COLOR_PRIMARY : COLOR_DARK,
                    }),
                  ],
                }),
              ],
            })
        ),
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

function buildDocument() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Segoe UI',
            size: 21,
            color: COLOR_DARK,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: [
          // COVER PAGE
          new Paragraph({ spacing: { before: 800, after: 200 } }),
          createTitle('AGROMARKET ECOSYSTEM'),
          createSubtitle('Master Technical Blueprint: Computational Engines, Database Architecture & Risk Underwriting'),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 400 },
            children: [
              new TextRun({
                text: 'Architectural Transition from UI Prototype to Production-Grade Agri-Commerce & Microcredit Ecosystem',
                font: 'Segoe UI',
                size: 20,
                color: COLOR_MUTED,
              }),
            ],
          }),

          createCalloutBox(
            'EXECUTIVE SUMMARY & THESIS',
            'This specification outlines the technical transformation of AgroMarket from a basic UI prototype (approx. 5% production readiness) into an industrial-scale, multi-actor agri-fintech and social commerce platform. It details the 5 foundational engines, the Polyglot Database Blueprint (PostgreSQL + Redis + BullMQ), dynamic payment resolution, and the Victory Eyong Tabi Credit Underwriting Model.'
          ),

          new Paragraph({ spacing: { before: 400, after: 100 } }),
          createMeta('Project', 'AgroMarket (Global Multi-Actor Agricultural Commerce)'),
          createMeta('Principal System Architects', 'Victory Eyong Tabi & Antigravity AI Systems Architect'),
          createMeta('Document Version', '1.2.0 — Enterprise Architecture Specification'),
          createMeta('Date of Ratification', 'September 2026'),
          createMeta('Backend Target', 'Node.js v25, TypeScript, Express, Prisma ORM, PostgreSQL, Redis, BullMQ'),
          createMeta('Frontend Target', 'React Native 0.81, Expo SDK 54, Zustand, FlashList'),

          // Page Break
          new Paragraph({ pageBreakBefore: true }),

          // SECTION 1: THE PARADIGM SHIFT
          createHeading1('1. The Paradigm Shift: UI Prototype vs. Computational Engines'),
          createParagraph(
            'In standard startup engineering, there exists a deceptive phase where an application appears complete because it renders attractive mobile screens with static mock data. However, in true enterprise software, the user interface constitutes less than 10% of total system complexity.'
          ),
          createParagraph(
            'The core value, defensibility, and financial viability of AgroMarket reside in its backend computation engines. Without these engines, the platform cannot underwrite loans, cannot prevent escrow fraud, and cannot surface relevant harvest yields to high-volume buyers.'
          ),

          createTable(
            ['System Dimension', 'Prototype State (Current ~5%)', 'Production Engine State (Target 100%)'],
            [
              ['AgroFeed Delivery', 'Static SELECT * ORDER BY createdAt DESC', 'Multi-factor algorithm (Affinity + Retention + Geo-Proximity)'],
              ['Farmer Credit Scoring', 'Static database integer read from profile table', 'Dynamic 8-Metric behavioral pipeline (Victory Eyong Tabi Model)'],
              ['Escrow & Payments', 'Mock state toggles with hardcoded XAF strings', 'ACID ledger state machine + Dynamic multi-currency gateway routing'],
              ['Social Network', 'Follow counters and superficial UI cards', 'Bidirectional Graph Engine unlocking wholesale pricing & P2P bidding'],
              ['Telemetry & Logging', 'Basic console.log in Express middleware', 'Decoupled 3-tier event ingestion bus (Hot/Warm/Cold path via Redis)'],
              ['Database Structure', 'Single monolithic SQL table approach', 'Polyglot Persistence: PostgreSQL (ACID) + Redis (ZSET Cache/Queues)'],
            ]
          ),

          new Paragraph({ spacing: { before: 200, after: 100 } }),
          createHeading2('1.1 What Is an "Engine" at Code Level?'),
          createParagraph(
            'An engine is an independent, deterministic subsystem of pure business logic and mathematical algorithms. It is completely isolated from HTTP requests, Express controllers, and mobile screens.'
          ),
          createBullet('Single File vs. Folder Subsystem: An engine is NEVER a 1,000-line single file. It is a structured folder containing dedicated collectors, normalizers, formulas, and decision routers.', 'Structural Isolation:'),
          createBullet('Decoupled Input Contracts: Engines take pure DTOs (Data Transfer Objects) and return immutable Decision Contracts.', 'Pure Data Contracts:'),
          createBullet('Zero Transport Dependency: An engine can be executed via HTTP API, background cron worker, or offline unit test runner without modification.', 'Transport Agnostic:'),

          // SECTION 2: GLOBAL ARCHITECTURE & DYNAMIC PAYMENTS
          new Paragraph({ pageBreakBefore: true }),
          createHeading1('2. Global Architecture: Multi-Currency & Dynamic Gateways'),
          createParagraph(
            'AgroMarket is engineered for cross-border African, continental, and international trade. It must never be tied to a single national currency (e.g., FCFA) or local mobile money provider (e.g., MTN/Orange).'
          ),

          createHeading2('2.1 Multi-Currency Database Standard (ISO-4217)'),
          createParagraph(
            'Every financial transaction, catalog yield, and microcredit contract is stored with an explicit ISO-4217 currency code and an exchange rate peg normalized against base USD for cross-border financial reconciliation:'
          ),

          createCodeBlock([
            '// Prisma Schema Multi-Currency Implementation',
            'model Transaction {',
            '  id              String       @id @default(uuid())',
            '  amount          Decimal      @db.Decimal(14, 2)',
            '  currency        String       @default("USD") @db.VarChar(3) // USD, EUR, NGN, KES, XAF',
            '  exchangeRateUsd Decimal      @db.Decimal(10, 6)             // Normalized exchange peg',
            '  status          EscrowStatus @default(PENDING)',
            '  orderId         String',
            '  createdAt       DateTime     @default(now())',
            '}',
          ]),

          new Paragraph({ spacing: { before: 200, after: 100 } }),
          createHeading2('2.2 Dynamic Geo-Location Payment Method Resolution'),
          createParagraph(
            'During checkout or wallet deposit, the client queries the PaymentMethodResolver engine. The engine inspects buyer IP country and order currency to dynamically render only usable, locally optimized payment rails:'
          ),

          createTable(
            ['Geographic Region', 'Currencies Supported', 'Primary Payment Rail', 'Key Capabilities'],
            [
              ['North America & Europe', 'USD, EUR, GBP, CAD', 'Stripe Adapter', 'Visa, Mastercard, Amex, Apple Pay, Google Pay'],
              ['Nigeria, Ghana, Kenya', 'NGN, GHS, KES, ZAR', 'Paystack Adapter', 'Direct Bank Transfer, USSD, Debit Cards, M-Pesa'],
              ['CEMAC / UEMOA (Central/West Africa)', 'XAF, XOF', 'MTN & Orange MoMo Adapter', 'USSD Push Prompts, Mobile Money Wallets'],
              ['Pan-African Cross-Border', '34 African Currencies', 'Flutterwave Multi-Rail', 'Cross-border clearing, Virtual Card issuance'],
            ]
          ),

          // SECTION 3: MASTER DATABASE ARCHITECTURE & BLUEPRINT
          new Paragraph({ pageBreakBefore: true }),
          createHeading1('3. Master Database Architecture & Persistence Blueprint'),
          createSubtitle('Industry-Standard Polyglot Persistence, CQRS & Advanced PostgreSQL Capabilities'),

          createParagraph(
            'A central architectural question is: Are all these engines running on the database? Can a standard relational model handle both microfinance underwriting and high-frequency TikTok-style video telemetry? The answer dictates the entire durability of the platform.'
          ),

          createHeading2('3.1 The Architectural Tension: FinTech ACID vs. Social Media Eventual Consistency'),
          createParagraph(
            'AgroMarket unifies two diametrically opposed database engineering requirements:'
          ),
          createBullet('FinTech Personality (Escrow & Credit): Requires strict ACID compliance. Not a single cent can be lost; loan deductions and escrow releases must lock rows to prevent double-spending.', '1. ACID Strictness:'),
          createBullet('Social Commerce Personality (AgroFeed & Video Telemetry): Generates millions of watch seconds, scroll impressions, and swipe events per hour. Strict row-locking on every swipe would choke the database connection pool.', '2. Eventual Consistency:'),

          new Paragraph({ spacing: { before: 150, after: 100 } }),
          createHeading2('3.2 Where Engines Execute: Application Compute vs. Database State Store'),
          createParagraph(
            'Engines execute in Application Memory (Node.js/TypeScript runtime), NOT inside database SQL stored procedures. Databases are designed to store and query state; application nodes are designed to scale horizontally and execute mathematical algorithms.'
          ),

          createCalloutBox(
            'COMPUTE VS STORAGE SEPARATION',
            'Storing business logic in SQL triggers or stored procedures creates un-versionable monoliths that starve the database CPU. AgroMarket keeps the database as an immutable state store while all normalization formulas, Bayesian calculations, and risk routing execute in testable application memory.'
          ),

          new Paragraph({ spacing: { before: 200, after: 100 } }),
          createHeading2('3.3 Polyglot Persistence: The 3-Tier Storage Architecture'),
          createParagraph(
            'High-scale platforms (TikTok Shop, WeChat, Mercado Libre) deploy a 3-tier persistence strategy:'
          ),

          createCodeBlock([
            '┌────────────────────────────────────────────────────────────────────────┐',
            '│                     AGROMARKET 3-TIER DATA STACK                       │',
            '└───────────────────┬────────────────────────────────┬───────────────────┘',
            '                    │                                │                    ',
            '         Write-Sensitive Actions          High-Frequency Read/Write       ',
            '         (Orders, Escrow, Loans)          (Feed Scroll, Likes, Presence)  ',
            '                    │                                │                    ',
            '                    ▼                                ▼                    ',
            '         ┌──────────────────────┐         ┌──────────────────────┐        ',
            '         │   APPLICATION API    │         │  REDIS IN-MEMORY BUS │        ',
            '         │  (Node.js / Express) │         │ • Video Feed Caching │        ',
            '         └──────────┬───────────┘         │ • Live Presence Dots │        ',
            '                    │                     │ • BullMQ Engine Queue│        ',
            '                    ▼                     └──────────┬───────────┘        ',
            '         ┌──────────────────────┐                    │                    ',
            '         │ POSTGRESQL (PRIMARY) │◄───────────────────┘                    ',
            '         │ • ACID Financials    │   Workers flush buffered telemetry      ',
            '         │ • JSONB Audit Logs   │   in batches every 5-10 seconds         ',
            '         │ • Relational Profile │   (Zero DB row-lock contention!)        ',
            '         └──────────────────────┘                                         ',
          ]),

          new Paragraph({ spacing: { before: 200, after: 100 } }),
          createHeading2('3.4 Realizing Advanced Architecture with PostgreSQL ("Super-Postgres")'),
          createParagraph(
            'We do not need 5 separate database servers (Neo4j, Cassandra, MongoDB, Elasticsearch) on day one. Modern PostgreSQL provides native multi-model capabilities that satisfy enterprise requirements:'
          ),

          createTable(
            ['PostgreSQL Capability', 'Enterprise Role in AgroMarket', 'Implementation Detail'],
            [
              ['ACID Relational Core', 'Escrow, Orders, Microloans, KYC', 'Multi-table atomic transactions via prisma.$transaction'],
              ['JSONB Document Store', 'Behavioral Metric Snapshots & Config', 'Indexed JSONB columns storing 8-metric credit snapshots without schema locks'],
              ['Recursive CTEs', 'Social Graph & AgroPartner Traversal', 'WITH RECURSIVE queries resolving mutual followers and trade network depth'],
              ['PostGIS Extension', 'Geospatial Farm-to-Buyer Proximity', 'ST_DWithin bounding queries matching local buyers with fresh nearby harvests'],
              ['pgvector Extension', 'Machine-Learning Content Recommendation', 'Cosine similarity search matching buyer category interests to video stories'],
            ]
          ),

          new Paragraph({ spacing: { before: 200, after: 100 } }),
          createHeading2('3.5 CQRS: Command Query Responsibility Segregation'),
          createParagraph(
            'To prevent database starvation when thousands of farmers open their dashboards simultaneously, AgroMarket enforces CQRS:'
          ),
          createBullet('Command (Write Path): When an order completes, BullMQ background worker triggers Engine 1 -> recalculates score (e.g., 680) -> commits result to FarmerProfile.creditScore.', 'Write Path (Background):'),
          createBullet('Query (Read Path): When the mobile app requests the profile or loan screen, the API performs a zero-join read directly on FarmerProfile.creditScore. Latency: 3 to 5 milliseconds.', 'Read Path (Real-time):'),

          new Paragraph({ spacing: { before: 200, after: 100 } }),
          createHeading2('3.6 Event Sourcing & The Credit Audit Snapshot Model'),
          createParagraph(
            'In financial underwriting, scores can NEVER be silently overwritten. For institutional auditability, every credit evaluation commits an immutable snapshot to PostgreSQL:'
          ),

          createCodeBlock([
            'model FarmerCreditAuditSnapshot {',
            '  id               String        @id @default(uuid())',
            '  farmerId         String',
            '  score            Int           // e.g., 680',
            '  tier             CreditTier    // BRONZE, SILVER, GOLD',
            '  algorithmVersion String        @default("v1.0.0-tabi")',
            '  metricsSnapshot  Json          // Exact 8 normalized metrics at evaluation time',
            '  triggeredBy      String        // "ORDER_COMPLETED_uuid" or "CRON_RECALCULATION"',
            '  calculatedAt     DateTime      @default(now())',
            '',
            '  farmer           FarmerProfile @relation(fields: [farmerId], references: [id])',
            '  @@index([farmerId, calculatedAt])',
            '}',
          ]),

          new Paragraph({ spacing: { before: 200, after: 100 } }),
          createHeading2('3.7 Production Scaling Roadmap & Database Upgrades'),
          createParagraph(
            'As user activity scales from launch pilot to millions of regional transactions, database infrastructure expands along a clear phased roadmap:'
          ),

          createTable(
            ['Production Phase', 'Active User Scale', 'Database Infrastructure', 'Scaling & Optimization Strategy'],
            [
              ['Phase 1: Pilot Launch', '0 - 50,000 Users', 'Single Managed PostgreSQL (16GB RAM) + Redis', 'PgBouncer connection pooling; Prisma composite indexes'],
              ['Phase 2: Regional Scale', '50,000 - 500,000 Users', 'Primary Writer + 2 Read Replicas + Redis Cluster', 'Reads (Feed, Catalogs) routed to Replicas; Writes to Primary'],
              ['Phase 3: Continental Scale', '500,000 - 5,000,000+ Users', 'Partitioned PostgreSQL + Apache Kafka Event Bus', 'Table partitioning on Orders/Telemetry by Month; Kafka streaming'],
            ]
          ),

          // SECTION 4: MASTER DATA LINEAGE & INTERDEPENDENCY GRAPH
          new Paragraph({ pageBreakBefore: true }),
          createHeading1('4. Master Engine Interdependencies & Data Lineage Graph'),
          createParagraph(
            'The 5 foundational engines operate as an interconnected data network. Transactional events from the Escrow Engine and interaction events from the Social Graph directly feed the 8 behavioral metrics of the Credit Underwriting Engine.'
          ),

          createHeading2('4.1 Visual Data Flow Diagram'),
          createCodeBlock([
            '┌────────────────────────────────────────────────────────────────────────┐',
            '│                  ENGINE 5: TELEMETRY & EVENT BUS                       │',
            '│      (Dispatches: ViewDuration, PostShare, DisputeFiled, LoanRepaid)    │',
            '└───────────────────┬────────────────────────────────┬───────────────────┘',
            '                    │                                │                    ',
            '                    ▼                                ▼                    ',
            '┌──────────────────────────────────────┐   ┌─────────────────────────────┐',
            '│  ENGINE 4: SOCIAL GRAPH & PRIVILEGES │   │  ENGINE 3: ESCROW & ORDERS  │',
            '│  • Mutual Partners (Bidirectional)   │   │  • Multi-Currency Payments  │',
            '│  • Wholesale Pricing Entitlement     │   │  • Order Fulfillment State  │',
            '│  • Network Reach & Followers (M5)    │   │  • Delivery Proof (M4)      │',
            '│  • Verification & Coop (M8)          │   │  • Completed Orders (M1)    │',
            '└───────────────────┬──────────────────┘   │  • Loan Deductions (M7)     │',
            '                    │                      └─────────────┬───────────────┘',
            '                    └──────────────┬─────────────────────┘                ',
            '                                   ▼                                      ',
            '┌────────────────────────────────────────────────────────────────────────┐',
            '│               ENGINE 1: FARMER CREDIT SCORING ENGINE                   │',
            '│                (Victory Eyong Tabi Behavioral Model)                   │',
            '│  Phase 1: 8-Metric Ingestion -> Phase 2: Math Normalization & Weights  │',
            '│  Phase 3: Decision Router -> Bronze / Silver / Gold Credit Tiers       │',
            '└───────────────────┬────────────────────────────────┬───────────────────┘',
            '                    │                                │                    ',
            '                    ▼                                ▼                    ',
            '┌──────────────────────────────────────┐   ┌─────────────────────────────┐',
            '│         FINTECH LOAN DISBURSEMENT    │   │   ENGINE 2: FEED RANKING    │',
            '│ • Dynamic loan credit ceilings       │   │ • High credit score boosts  │',
            '│ • Auto-escrow repayment deduction    │   │   post rank in TikTok feed  │',
            '└──────────────────────────────────────┘   └─────────────────────────────┘',
          ]),

          new Paragraph({ spacing: { before: 200, after: 100 } }),
          createHeading2('4.2 Data Dependency Matrix'),
          createTable(
            ['Metric Identifier', 'Data Source Engine', 'Consuming Engine', 'Event Ingestion Trigger'],
            [
              ['M1: Completed Sales', 'Engine 3 (Escrow Orders)', 'Engine 1 (Credit Underwriting)', 'On Order status -> COMPLETED'],
              ['M2: Listing Regularity', 'Engine 5 (Telemetry Bus)', 'Engine 1 (Credit Underwriting)', 'Rolling 30-day catalog update index'],
              ['M3: Customer Reviews', 'Engine 5 (Telemetry Bus)', 'Engine 1 & Engine 2 (Feed)', 'Bayesian recalculation on review submit'],
              ['M4: Delivery Reliability', 'Engine 3 (Escrow Delivery)', 'Engine 1 (Credit Underwriting)', 'Confirmed receipts vs buyer disputes'],
              ['M5: Follower Network', 'Engine 4 (Social Graph)', 'Engine 1 (Credit Underwriting)', 'Hourly background graph aggregation'],
              ['M6: Engagement Score', 'Engine 5 (Telemetry Bus)', 'Engine 1 & Engine 2 (Feed)', 'Stream: Likes(1x), Comments(2.5x), Shares(4x)'],
              ['M7: Loan Repayments', 'Engine 3 (Escrow Deductions)', 'Engine 1 (Credit Underwriting)', 'Real-time on harvest loan payout deduction'],
              ['M8: KYC & Verification', 'Engine 4 (Identity)', 'Engine 1 (Credit Underwriting)', 'Verified ID, GPS coordinates, coop certs'],
            ]
          ),

          // SECTION 5: FOLDER HIERARCHY & CODE SCALABILITY
          new Paragraph({ pageBreakBefore: true }),
          createHeading1('5. Folder Hierarchy & Code Scalability Blueprint'),
          createParagraph(
            'To ensure scalability without code pollution, the backend organizes each engine into an internal subsystem within its domain module:'
          ),

          createCodeBlock([
            'Backend/src/',
            '├── core/                               <-- Shared Infrastructure',
            '│   ├── database/                       <-- Prisma client singleton & extensions',
            '│   ├── events/                         <-- BullMQ Redis Event Bus',
            '│   ├── payment/                        <-- Multi-Currency Payment Gateway Adapters',
            '│   │   ├── payment-gateway.interface.ts',
            '│   │   ├── payment-resolver.ts         <-- Dynamic Geo-Location Resolver',
            '│   │   └── adapters/',
            '│   │       ├── stripe.adapter.ts',
            '│   │       ├── paystack.adapter.ts',
            '│   │       ├── flutterwave.adapter.ts',
            '│   │       └── momo.adapter.ts',
            '│   └── telemetry/                      <-- Ingestion Logger',
            '│',
            '└── modules/',
            '    ├── fintech/',
            '    │   ├── fintech.controller.ts       <-- HTTP Transport',
            '    │   ├── fintech.routes.ts',
            '    │   └── engine/                     <-- THE FARMER CREDIT SCORING ENGINE',
            '    │       ├── credit-scoring.engine.ts<-- Pipeline Orchestrator',
            '    │       ├── types/                  <-- DTOs & Contracts',
            '    │       ├── collectors/             <-- Metric Ingestion (Phase 1)',
            '    │       ├── normalizers/            <-- Min-Max Math (Phase 2)',
            '    │       ├── formulas/               <-- Weighted Algorithms (Phase 2)',
            '    │       ├── decision/               <-- Decision Router (Phase 3)',
            '    │       └── config/                 <-- Calibration Matrix',
            '    │',
            '    ├── feed/',
            '    │   └── engine/                     <-- THE FEED RANKING ENGINE',
            '    │       ├── feed-ranking.engine.ts',
            '    │       ├── signals/                <-- Watch duration, shares, affinity',
            '    │       └── rankers/                <-- Decay + proximity rankers',
            '    │',
            '    └── orders/',
            '        └── engine/                     <-- THE ESCROW & LEDGER ENGINE',
            '            ├── escrow-machine.ts       <-- Finite State Machine',
            '            └── states/                 <-- Locked, Dispatched, Delivered, Disputed',
          ]),

          // SECTION 6: ENGINE 1 DEEP DIVE
          new Paragraph({ pageBreakBefore: true }),
          createHeading1('6. Engine 1: Farmer Credit Scoring & Risk Underwriting Engine'),
          createSubtitle('Based on the Victory Eyong Tabi Behavioral Model (Figure 3.5)'),

          createParagraph(
            'The Victory Eyong Tabi Credit Engine transforms verifiable trade behavior into an institutional-grade credit score across 3 structured phases:'
          ),

          createHeading2('6.1 Phase 1: The 8 Behavioral Metrics Pipeline'),
          createBullet('M1 (Sales Fulfillment Volume): Total count of successfully completed sales orders over rolling 90 days. Measures commercial cash-flow velocity.', '1. Sales Volume:'),
          createBullet('M2 (Listing Regularity & Crop Diversity): Active harvest variety count multiplied by monthly catalog update frequency. Measures production consistency.', '2. Listing Frequency:'),
          createBullet('M3 (Customer Review Bayesian Average): Weighted average formula preventing new sellers with one 5-star rating from artificially outranking veteran producers.', '3. Bayesian Rating:'),
          createBullet('M4 (Delivery Reliability Ratio): Fulfilled orders delivered on-time without buyer cancellation or product quality dispute.', '4. Fulfillment Trust:'),
          createBullet('M5 (Trade Follower Network): Verified network reach across buyers, wholesalers, and transporters.', '5. Network Reach:'),
          createBullet('M6 (Engagement Metrics): Aggregated story views, likes, comments, and direct wholesale price offer inquiries.', '6. Engagement Velocity:'),
          createBullet('M7 (Loan Repayment Integrity): Ratio of past microcredit principal repaid on-time via automated escrow deductions.', '7. Repayment Integrity:'),
          createBullet('M8 (KYC & Verification Confidence): Verified National ID (30 pts), GPS Farm Coordinates (30 pts), and Agricultural Cooperative Membership (40 pts).', '8. Identity KYC:'),

          new Paragraph({ spacing: { before: 200, after: 100 } }),
          createHeading2('6.2 Phase 2: Processing, Normalization & Weighted Math'),
          createParagraph(
            'Raw data metrics have distinct mathematical units. Min-Max Normalization scales every metric into an identical, dimensionless scalar Z_i in [0, 100]:'
          ),

          createTable(
            ['Metric Identifier', 'Normalized Key', 'Importance Weight (Wi)', 'Underwriting Rationale'],
            [
              ['Loan Repayment Integrity', 'Z_repayment', '0.25 (25%)', 'Strongest statistical predictor of default risk'],
              ['Completed Sales Volume', 'Z_sales', '0.20 (20%)', 'Direct proof of commercial production and cash flow'],
              ['Delivery Reliability', 'Z_delivery', '0.15 (15%)', 'Fulfillment discipline; prevents buyer dispute losses'],
              ['Customer Reviews Average', 'Z_reviews', '0.12 (12%)', 'Produce quality consistency and market satisfaction'],
              ['Produce Listing Regularity', 'Z_listing', '0.10 (10%)', 'Active seasonal farming engagement'],
              ['Story & Post Engagement', 'Z_engagement', '0.08 (8%)', 'Buyer brand loyalty and responsive negotiation'],
              ['Network Trade Followers', 'Z_followers', '0.05 (5%)', 'Network retention and repeat order likelihood'],
              ['KYC & Cooperative Status', 'Z_kyc', '0.05 (5%)', 'Anti-fraud verification and community backing'],
            ]
          ),

          new Paragraph({ spacing: { before: 200, after: 100 } }),
          createHeading2('6.3 Phase 3: Decision Thresholding & Dynamic Routing'),
          createBullet('Score < 500 (Route A — Below Threshold): Automatic Risk Evaluation triggered. Microcredit application locked. System sends an automated educational advisory notification and routes the user to financial coaching modules to improve fulfillment and listing frequency before re-applying.', 'Route A (Below Threshold):'),
          createBullet('Score >= 500 (Route B — Meets Threshold): Score approved. The engine assigns credit tier, commits score to the farmer profile with an immutable audit snapshot, and dynamically renders the credit badge across the UI.', 'Route B (Meets Threshold):'),

          createTable(
            ['Credit Tier', 'Score Range', 'Max Microcredit Ceiling', 'Auto-Escrow Deduction', 'Platform Privileges'],
            [
              ['Bronze Level', '500 - 649', 'Up to $800 USD equivalent', '20% deduction on order payout', 'Seasonal seed & input financing'],
              ['Silver Level', '650 - 749', 'Up to $2,500 USD equivalent', '15% deduction on order payout', 'Equipment loans & priority dispatch'],
              ['Gold Level', '750 - 850', 'Up to $10,000 USD equivalent', '10% deduction on order payout', 'Instant MoMo/Bank payout, commercial lines'],
            ]
          ),

          // SECTION 7: COLD START & UI EVOLUTION
          new Paragraph({ pageBreakBefore: true }),
          createHeading1('7. Solving the Cold-Start Problem & UI Evolution'),

          createHeading2('7.1 Progressive Weighting Strategy for New Farmers'),
          createParagraph(
            'New farmers joining the platform have 0 completed sales, 0 reviews, and 0 loan repayments. The engine dynamically adjusts metric weights based on account maturity:'
          ),

          createTable(
            ['Farmer Account Stage', 'Sales & Repayment Weight', 'KYC, Coop & Catalog Weight', 'Behavioral Objective'],
            [
              ['Stage 1: New (0 - 2 orders)', '0% (Exempt from sales penalty)', '70% (ID, Farm GPS, Coop, Catalog)', 'Encourage complete onboarding and verified listings'],
              ['Stage 2: Emerging (3 - 9 orders)', '35% (Gradual transactional weighting)', '40% (Fulfillment reliability & reviews)', 'Reward on-time dispatches and verified delivery'],
              ['Stage 3: Mature (10+ orders)', '60% (Full Victory Eyong Tabi Model)', '40% (Repayment integrity & volume)', 'Full commercial underwriting and maximum credit limits'],
            ]
          ),

          new Paragraph({ spacing: { before: 200, after: 100 } }),
          createHeading2('7.2 Frontend UI Evolution: From Mock Cards to Actionable Guidance'),
          createBullet('Interactive Behavioral Radar: Visual progress bars show exact metric performance (e.g., "Delivery Reliability: 98% — Outstanding", "Listing Frequency: 40% — Needs Attention").', '1. Performance Breakdown:'),
          createBullet('Predictive Tier Targets: Transparent goal prompts (e.g., "You are 35 points away from Silver Tier ($2,500 credit limit). Complete 2 more verified orders this month to advance").', '2. Transparent Goals:'),
          createBullet('Empathetic Route A Interventions: Farmers below threshold receive specific guidance on cooperative certification and dispute reduction rather than abrupt rejection.', '3. Route A Coaching:'),

          // SECTION 8: IMPLEMENTATION ROADMAP
          new Paragraph({ pageBreakBefore: true }),
          createHeading1('8. Implementation Roadmap & Execution Sprints'),
          createParagraph(
            'The development of these engines will be executed in five disciplined engineering sprints, prioritizing core financial and algorithmic stability before UI wiring:'
          ),

          createTable(
            ['Sprint', 'Focus Domain', 'Key Deliverables & Verification Criteria'],
            [
              ['Sprint 1', 'Engine 1: Farmer Credit Scoring', 'Types, Min-Max Normalizer, Tabi Weighted Formula, Decision Router, Unit Tests'],
              ['Sprint 2', 'Engine 1: DB Collectors & Cold-Start', 'PostgreSQL collector queries, cold-start weighting, profile score persistence'],
              ['Sprint 3', 'Engine 3: Escrow & Multi-Currency', 'ISO-4217 ledger, FSM state machine, Payment Resolver (Stripe, Paystack, MoMo)'],
              ['Sprint 4', 'Engine 2: Algorithmic Feed Ranking', 'Affinity scoring, video watch-time retention, geo-proximity query rankers'],
              ['Sprint 5', 'Frontend UI Modernization & Integration', 'Remove mocks/data.ts, wire live radar charts, credit badges, and loan terms'],
            ]
          ),

          new Paragraph({ spacing: { before: 300, after: 100 } }),
          createCalloutBox(
            'ARCHITECTURAL CONCLUSION',
            'By building these decoupled computational engines backed by a robust 3-tier persistence architecture (PostgreSQL + Redis + BullMQ), AgroMarket establishes a durable, defensible platform capable of transforming agricultural trade and underwriting microfinance across Africa and the global market.'
          ),
        ],
      },
    ],
  });

  return doc;
}

async function main() {
  console.log('Building comprehensive Word Document with Master Database Blueprint...');
  const doc = buildDocument();
  const buffer = await Packer.toBuffer(doc);
  const primaryPath = path.resolve('c:/Users/PC USER/Desktop/AgroMarket/AgroMarket_Master_Engines_Architecture_Specification.docx');
  const fallbackPath = path.resolve('c:/Users/PC USER/Desktop/AgroMarket/AgroMarket_Master_Engines_Architecture_Specification_v1.2.docx');
  
  try {
    fs.writeFileSync(primaryPath, buffer);
    console.log(`Document successfully written to: ${primaryPath}`);
    console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
  } catch (err) {
    if (err.code === 'EBUSY') {
      console.warn(`Primary file is open in Microsoft Word (${primaryPath}). Saving to fallback: ${fallbackPath}`);
      fs.writeFileSync(fallbackPath, buffer);
      console.log(`Document successfully written to: ${fallbackPath}`);
      console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
    } else {
      throw err;
    }
  }
}

main().catch((err) => {
  console.error('Failed to generate document:', err);
  process.exit(1);
});
