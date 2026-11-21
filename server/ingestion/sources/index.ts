import { SourceConnector, ConnectorHealth, IngestionResult } from './types.ts';
import { DgddiConnector } from './dgddi/DgddiConnector.ts';
import { InseeConnector } from './insee/InseeConnector.ts';
import { EurostatConnector } from './eurostat/EurostatConnector.ts';
import { ComtradeConnector } from './comtrade/ComtradeConnector.ts';
import { JodiConnector } from './jodi/JodiConnector.ts';
import { EiaConnector } from './eia/EiaConnector.ts';
import { SdesConnector } from './sdes/SdesConnector.ts';
import { OverpassConnector } from './overpass/OverpassConnector.ts';
import { IgnConnector } from './ign/IgnConnector.ts';
import { dbRepository } from '../../db/repository.ts';

class SourceRegistry {
  private connectors: Map<string, SourceConnector> = new Map();

  constructor() {
    this.register(new DgddiConnector());
    this.register(new InseeConnector());
    this.register(new EurostatConnector());
    this.register(new ComtradeConnector());
    this.register(new JodiConnector());
    this.register(new EiaConnector());
    this.register(new SdesConnector());
    this.register(new OverpassConnector());
    this.register(new IgnConnector());
  }

  register(connector: SourceConnector): void {
    this.connectors.set(connector.id, connector);
  }

  getConnector(id: string): SourceConnector | undefined {
    return this.connectors.get(id);
  }

  getAllConnectors(): SourceConnector[] {
    return Array.from(this.connectors.values());
  }

  async checkAllConnectorsHealth(): Promise<{ [sourceId: string]: ConnectorHealth }> {
    const results: { [sourceId: string]: ConnectorHealth } = {};
    for (const [id, connector] of this.connectors.entries()) {
      if (connector.liveExtractionImplemented !== true) {
        results[id] = {
          reachable: false,
          latencyMs: 0,
          message: 'Aucune extraction réelle implémentée; la source n’a pas été interrogée.',
          lastCheckedAt: new Date().toISOString(),
          status: 'NOT_AVAILABLE',
        };
        continue;
      }
      try {
        results[id] = await connector.healthCheck();
      } catch (err: any) {
        results[id] = {
          reachable: false,
          latencyMs: 0,
          message: `Health check error: ${err.message}`,
          lastCheckedAt: new Date().toISOString(),
        };
      }
    }
    return results;
  }

  async runAllIngestions(): Promise<{
    results: { [sourceId: string]: IngestionResult<any> };
    totalRecords: number;
    totalDurationMs: number;
  }> {
    const start = Date.now();
    const results: { [sourceId: string]: IngestionResult<any> } = {};
    let totalRecords = 0;

    for (const [id, connector] of this.connectors.entries()) {
      if (connector.liveExtractionImplemented !== true) {
        results[id] = {
          sourceId: id,
          status: 'NOT_AVAILABLE',
          recordsCount: 0,
          durationMs: 0,
          records: [],
          warnings: ['Live extraction is not implemented; synthetic connector data is disabled.'],
        };
        continue;
      }
      try {
        const res = await connector.run();

        // Populate database repository with multi-source records
        if (id === 'insee') {
          await dbRepository.saveInseeIndicators(res.records);
        } else if (id === 'jodi' || id === 'sdes') {
          await dbRepository.saveEnergyObservations(res.records);
        }
        results[id] = {
          ...res,
          status: res.status ?? (res.recordsCount > 0 ? 'SUCCESS' : 'PARTIAL'),
        };
        totalRecords += res.recordsCount;
      } catch (err: any) {
        results[id] = {
          sourceId: id,
          status: 'NOT_AVAILABLE',
          recordsCount: 0,
          durationMs: 0,
          records: [],
          warnings: [`Ingestion execution failed: ${err.message}`],
        };
      }
    }

    return {
      results,
      totalRecords,
      totalDurationMs: Date.now() - start,
    };
  }
}

export const sourceRegistry = new SourceRegistry();
