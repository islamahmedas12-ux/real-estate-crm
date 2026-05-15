import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Counter, Gauge, Registry, collectDefaultMetrics } from 'prom-client';
import type { Queue } from 'bull';

@Injectable()
export class MonitoringService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly registry: Registry;
  private readonly loginCounter: Counter;
  private readonly contractsCreatedCounter: Counter;
  private readonly paymentsRecordedCounter: Counter;
  private readonly queuePendingGauge: Gauge;
  private readonly queueActiveGauge: Gauge;
  private readonly queueFailedGauge: Gauge;

  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {
    this.registry = new Registry();

    // Collect default metrics (CPU, memory, event loop, etc.)
    collectDefaultMetrics({ register: this.registry });

    // Business metrics counters
    this.loginCounter = new Counter({
      name: 'crm_logins_total',
      help: 'Total number of user logins',
      registers: [this.registry],
    });

    this.contractsCreatedCounter = new Counter({
      name: 'crm_contracts_created_total',
      help: 'Total number of contracts created',
      registers: [this.registry],
    });

    this.paymentsRecordedCounter = new Counter({
      name: 'crm_payments_recorded_total',
      help: 'Total number of payments recorded',
      registers: [this.registry],
    });

    // Queue metrics
    this.queuePendingGauge = new Gauge({
      name: 'crm_queue_email_pending',
      help: 'Number of pending email jobs',
      registers: [this.registry],
    });

    this.queueActiveGauge = new Gauge({
      name: 'crm_queue_email_active',
      help: 'Number of active email jobs',
      registers: [this.registry],
    });

    this.queueFailedGauge = new Gauge({
      name: 'crm_queue_email_failed',
      help: 'Number of failed email jobs',
      registers: [this.registry],
    });
  }

  onApplicationBootstrap() {
    // Start periodic queue metrics collection
    void this.updateQueueMetrics();
    setInterval(() => {
      void this.updateQueueMetrics();
    }, 10000);
    this.logger.log('MonitoringService initialized — queue metrics polling started');
  }

  private async updateQueueMetrics(): Promise<void> {
    try {
      const [pending, active, failed] = await Promise.all([
        this.emailQueue.getWaitingCount(),
        this.emailQueue.getActiveCount(),
        this.emailQueue.getFailedCount(),
      ]);

      this.queuePendingGauge.set(pending);
      this.queueActiveGauge.set(active);
      this.queueFailedGauge.set(failed);
    } catch {
      // Queue not available yet
    }
  }

  incrementLogins() {
    this.loginCounter.inc();
  }

  incrementContractsCreated() {
    this.contractsCreatedCounter.inc();
  }

  incrementPaymentsRecorded() {
    this.paymentsRecordedCounter.inc();
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
