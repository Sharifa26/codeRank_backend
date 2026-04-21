import { IQueueJob, IExecutionResult } from "../types/index";
import { CONSTANTS } from "../utils/constants";
import env from "../config/env";

/**
 * In-Memory Queue Service for managing code execution jobs
 * Implements a simple FIFO queue with concurrency control
 *
 */
class QueueService {
  private queue: IQueueJob[] = [];
  private activeJobs: number = 0;
  private maxConcurrent: number = CONSTANTS.MAX_CONCURRENT_EXECUTIONS;
  private maxQueueSize: number = env.MAX_QUEUE_SIZE;
  private executor: ((job: IQueueJob) => Promise<IExecutionResult>) | null =
    null;

  /**
   * Set the executor function that processes jobs
   */
  setExecutor(executor: (job: IQueueJob) => Promise<IExecutionResult>): void {
    this.executor = executor;
  }

  /**
   * Add a job to the queue
   * Returns a promise that resolves when the job completes
   */
  enqueue(
    id: string,
    executionRequest: IQueueJob["executionRequest"],
  ): Promise<IExecutionResult> {
    if (this.queue.length >= this.maxQueueSize) {
      return Promise.reject(
        new Error("Queue is full. Please try again later."),
      );
    }

    return new Promise<IExecutionResult>((resolve, reject) => {
      const job: IQueueJob = {
        id,
        executionRequest,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.queue.push(job);
      console.log(
        `📥 Job ${id} added to queue. Queue size: ${this.queue.length}, Active: ${this.activeJobs}`,
      );

      this.processNext();
    });
  }

  /**
   * Process the next job in the queue
   * Respects concurrency limits
   */
  private async processNext(): Promise<void> {
    if (this.activeJobs >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    if (!this.executor) {
      console.error("❌ No executor set for queue service");
      return;
    }

    const job = this.queue.shift()!;
    this.activeJobs++;

    console.log(
      `⚡ Processing job ${job.id}. Active: ${this.activeJobs}, Remaining: ${this.queue.length}`,
    );

    try {
      const result = await this.executor(job);
      job.resolve(result);
    } catch (error: any) {
      job.reject(error);
    } finally {
      this.activeJobs--;
      console.log(
        `✅ Job ${job.id} completed. Active: ${this.activeJobs}, Remaining: ${this.queue.length}`,
      );

      this.processNext();
    }
  }

  /**
   * Get current queue status - O(1)
   */
  getStatus(): {
    queueLength: number;
    activeJobs: number;
    maxConcurrent: number;
  } {
    return {
      queueLength: this.queue.length,
      activeJobs: this.activeJobs,
      maxConcurrent: this.maxConcurrent,
    };
  }

  /**
   * Clear all pending jobs from queue - O(n)
   */
  clear(): void {
    this.queue.forEach((job) => {
      job.reject(new Error("Queue cleared"));
    });
    this.queue = [];
  }
}

const queueService = new QueueService();
export default queueService;
