import seedrandom from 'seedrandom';
import { query, execute } from '@/server/db/connection';
import { SEVERITIES, EVENT_STATUSES, SOURCES } from '@/lib/constants';

const SUPPLIERS = [
  'Acme Corp', 'GlobalParts Inc', 'TechSupply Ltd', 'IndustrialCo',
  'MegaComponents', 'PrecisionParts GmbH', 'Eastern Manufacturing',
  'Northern Supplies', 'Delta Components', 'Omega Industries',
];

const PARTS = [
  'Bearing Assembly XJ-200', 'Control Unit V3', 'Hydraulic Pump HP-50',
  'Sensor Module SM-100', 'Valve Assembly VA-75', 'Power Supply PS-300',
  'Circuit Board CB-88', 'Cooling Fan CF-12', 'Drive Motor DM-40',
  'Pressure Regulator PR-22', 'Temperature Sensor TS-15', 'Flow Meter FM-8',
];

const SUMMARIES = [
  'Supplier reported quality deviation in batch',
  'Late delivery impacting production schedule',
  'Certification expired for critical component',
  'Anomalous temperature readings detected',
  'Supply chain disruption due to logistics delay',
  'Component failure rate exceeding threshold',
  'Regulatory compliance flag raised',
  'Sub-tier supplier bankruptcy risk',
  'Geopolitical risk in sourcing region',
  'Counterfeit part detected in shipment',
  'Inventory discrepancy at warehouse',
  'Supplier audit finding — corrective action required',
];

const RECOMMENDED_ACTIONS = [
  'Investigate supplier quality records',
  'Request updated certifications',
  'Escalate to regional procurement lead',
  'Schedule on-site audit within 7 days',
  'Engage alternative supplier contingency plan',
  'Review contract terms and SLAs',
  'Coordinate with legal and compliance teams',
  null,
];

const EVIDENCE_TITLES = [
  'Supplier Quality Report Q3', 'Certificate of Compliance',
  'Inspection Log — Batch 4521', 'Delivery Manifest Oct-2025',
  'Temperature Sensor Logs', 'Audit Finding Summary', 'Regulatory Notice Letter',
];

const NOTE_TEMPLATES = [
  'Initial review complete — escalating to team lead.',
  'Contacted supplier representative, awaiting response.',
  'Evidence reviewed, no anomalies found beyond initial report.',
  'Updated risk assessment score to account for new data.',
  'Performed secondary validation of supplier claims.',
];

export class SeedService {
  private rng: seedrandom.PRNG;

  constructor(seed?: string) {
    this.rng = seedrandom(seed ?? process.env.SEED_FIXED_SEED ?? 'coreguard-default-seed');
  }

  private pick<T>(arr: T[]): T { return arr[Math.floor(this.rng() * arr.length)]; }

  private randomDate(daysBack: number): string {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(this.rng() * daysBack));
    d.setHours(Math.floor(this.rng() * 24), Math.floor(this.rng() * 60));
    return d.toISOString();
  }

  async reset(): Promise<void> {
    console.log('[SeedService] Resetting database...');
    await execute('TRUNCATE TABLE audit_log, notes, evidence, events, users CASCADE');
    await this.seed();
    console.log('[SeedService] Reset complete');
  }

  async seed(): Promise<void> {
    console.log('[SeedService] Seeding database...');

    const userIds = await this.seedUsers();
    const eventIds = await this.seedEvents(userIds);

    const evidenceCount = 30 + Math.floor(this.rng() * 5);
    await this.seedEvidence(eventIds, userIds, evidenceCount);

    const noteCount = 15 + Math.floor(this.rng() * 5);
    await this.seedNotes(eventIds, userIds, noteCount);

    await this.seedAuditLog(eventIds, userIds);

    console.log(`[SeedService] Seeded ${eventIds.length} events, ${evidenceCount} evidence, ${noteCount} notes`);
  }

  private async seedUsers(): Promise<string[]> {
    const users = [
      { name: 'Alice Operator', email: 'alice@coreguard.dev', role: 'operator' },
      { name: 'Bob Operator', email: 'bob@coreguard.dev', role: 'operator' },
      { name: 'Carol Manager', email: 'carol@coreguard.dev', role: 'manager' },
      { name: 'Dan Manager', email: 'dan@coreguard.dev', role: 'manager' },
    ];
    const ids: string[] = [];
    for (const u of users) {
      const rows = await query<{ id: string }>(
        `INSERT INTO users (name, email, role) VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET name = $1, role = $3 RETURNING id`,
        [u.name, u.email, u.role],
      );
      ids.push(rows[0]!.id);
    }
    return ids;
  }

  private async seedEvents(userIds: string[]): Promise<string[]> {
    const total = 25 + Math.floor(this.rng() * 5);
    const ids: string[] = [];
    for (let i = 0; i < total; i++) {
      const resolved = this.pick(EVENT_STATUSES) === 'resolved' ? this.randomDate(30) : null;
      const rows = await query<{ id: string }>(
        `INSERT INTO events (supplier, part_asset, severity, status, summary, detected_at, source, owner_id, recommended_action, resolved_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [
          this.pick(SUPPLIERS), this.pick(PARTS), this.pick(SEVERITIES), this.pick(EVENT_STATUSES),
          this.pick(SUMMARIES), this.randomDate(60), this.pick(SOURCES),
          this.rng() > 0.3 ? this.pick(userIds) : null,
          this.pick(RECOMMENDED_ACTIONS), resolved,
        ],
      );
      ids.push(rows[0]!.id);
    }
    return ids;
  }

  private async seedEvidence(eventIds: string[], userIds: string[], count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      const type = this.pick(['document', 'link', 'screenshot']);
      await execute(
        `INSERT INTO evidence (event_id, title, link, type, added_by) VALUES ($1,$2,$3,$4,$5)`,
        [this.pick(eventIds), this.pick(EVIDENCE_TITLES), type === 'link' ? `https://example.com/evidence/${i}` : null, type, this.pick(userIds)],
      );
    }
  }

  private async seedNotes(eventIds: string[], userIds: string[], count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await execute(
        `INSERT INTO notes (event_id, author_id, content) VALUES ($1,$2,$3)`,
        [this.pick(eventIds), this.pick(userIds), this.pick(NOTE_TEMPLATES)],
      );
    }
  }

  private async seedAuditLog(eventIds: string[], userIds: string[]): Promise<void> {
    for (const id of eventIds.slice(0, 10)) {
      const statuses: string[] = [];
      if (this.rng() > 0.5) statuses.push('new');
      statuses.push(this.pick(['reviewed', 'escalated']));
      if (this.rng() > 0.5) statuses.push('resolved');
      for (let i = 1; i < statuses.length; i++) {
        await execute(
          `INSERT INTO audit_log (event_id, changed_by, action, field_changed, old_value, new_value)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [id, this.pick(userIds), 'status_changed', 'status', statuses[i - 1], statuses[i]],
        );
      }
    }
  }
}