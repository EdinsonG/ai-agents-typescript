import { existsSync, mkdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ObservabilityCollector } from '@/observability/collector.js';
import type { LLMCallRecord } from '@/types/index.js';

const TEST_DIR = join(tmpdir(), 'observability-test');
const TEST_FILE = join(TEST_DIR, 'test-records.jsonl');

function makeRecord(agentName: string, ok = true): LLMCallRecord {
  return {
    timestamp: new Date().toISOString(),
    agentName,
    model: 'test-model',
    kind: 'text',
    ok,
    latencyMs: 100,
    usage: { promptTokens: 50, completionTokens: 25, totalTokens: 75 },
  };
}

afterEach(() => {
  if (existsSync(TEST_FILE)) unlinkSync(TEST_FILE);
  try {
    rmdirSync(TEST_DIR);
  } catch {}
});

describe('ObservabilityCollector file I/O', () => {
  it('saveToFile creates a JSONL file with records', () => {
    const collector = new ObservabilityCollector();
    collector.record(makeRecord('agent-a'));
    collector.record(makeRecord('agent-b'));

    collector.saveToFile(TEST_FILE);

    expect(existsSync(TEST_FILE)).toBe(true);
    const content = readFileSync(TEST_FILE, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());
    expect(lines).toHaveLength(2);

    const parsed0 = JSON.parse(lines[0]);
    expect(parsed0.agentName).toBe('agent-a');
    const parsed1 = JSON.parse(lines[1]);
    expect(parsed1.agentName).toBe('agent-b');
  });

  it('saveToFile creates parent directories recursively', () => {
    const nestedFile = join(TEST_DIR, 'nested', 'deep', 'records.jsonl');
    const collector = new ObservabilityCollector();
    collector.record(makeRecord('agent-x'));

    collector.saveToFile(nestedFile);

    expect(existsSync(nestedFile)).toBe(true);
    const content = readFileSync(nestedFile, 'utf-8');
    expect(content.trim()).toBeTruthy();

    // Cleanup
    try {
      unlinkSync(nestedFile);
      rmdirSync(join(TEST_DIR, 'nested', 'deep'));
      rmdirSync(join(TEST_DIR, 'nested'));
    } catch {}
  });

  it('loadFromFile appends records from a JSONL file', () => {
    const collector = new ObservabilityCollector();

    // First write
    collector.record(makeRecord('agent-1'));
    collector.saveToFile(TEST_FILE);

    // Load into a new collector
    const collector2 = new ObservabilityCollector();
    collector2.loadFromFile(TEST_FILE);

    expect(collector2.getRecords()).toHaveLength(1);
    expect(collector2.getRecords()[0].agentName).toBe('agent-1');
  });

  it('loadFromFile appends to existing records', () => {
    const collector = new ObservabilityCollector();
    collector.record(makeRecord('existing'));
    collector.saveToFile(TEST_FILE);

    const collector2 = new ObservabilityCollector();
    collector2.record(makeRecord('new-record'));
    collector2.loadFromFile(TEST_FILE);

    expect(collector2.getRecords()).toHaveLength(2);
    expect(collector2.getRecords()[0].agentName).toBe('new-record');
    expect(collector2.getRecords()[1].agentName).toBe('existing');
  });

  it('loadFromFile skips malformed lines gracefully', () => {
    if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
    const validRecord = makeRecord('valid-agent');
    const content = [
      JSON.stringify(validRecord),
      'this is not json',
      JSON.stringify(makeRecord('another-agent')),
    ].join('\n');
    writeFileSync(TEST_FILE, content, 'utf-8');

    const collector = new ObservabilityCollector();
    collector.loadFromFile(TEST_FILE);

    expect(collector.getRecords()).toHaveLength(2);
  });

  it('loadFromFile does nothing if file does not exist', () => {
    const collector = new ObservabilityCollector();
    collector.record(makeRecord('existing'));

    collector.loadFromFile('/nonexistent/path/records.jsonl');

    expect(collector.getRecords()).toHaveLength(1);
  });

  it('saveToFile overwrites existing file', () => {
    const collector = new ObservabilityCollector();
    collector.record(makeRecord('first'));
    collector.saveToFile(TEST_FILE);

    collector.clear();
    collector.record(makeRecord('second'));
    collector.saveToFile(TEST_FILE);

    const content = readFileSync(TEST_FILE, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]).agentName).toBe('second');
  });

  it('toJSON returns a summary object', () => {
    const collector = new ObservabilityCollector();
    collector.record(makeRecord('agent-a'));
    collector.record(makeRecord('agent-b', false));

    const json = collector.toJSON();
    expect(json.totalCalls).toBe(2);
    expect(json.okCalls).toBe(1);
    expect(json.failedCalls).toBe(1);
    expect(json.byAgent).toHaveLength(2);
  });
});
