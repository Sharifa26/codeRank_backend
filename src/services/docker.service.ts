import Docker from "dockerode";
import { Writable } from "stream";
import {
  IExecutionRequest,
  IExecutionResult,
  IQueueJob,
  ExecutionStatus,
} from "../types/index";
import { LANGUAGE_CONFIG } from "../config/docker";
import env from "../config/env";
import { CONSTANTS } from "../utils/constants";
import queueService from "./queue.service";
import { sanitizeCode } from "../utils/helpers";

/**
 * Docker Execution Service
 * Manages containerized code execution with resource limits
 * Each execution runs in an isolated Docker container
 *
 */
class DockerService {
  private docker: Docker;
  private isInitialized: boolean = false;

  constructor() {
    const isWindows = process.platform === "win32";

    this.docker = new Docker({
      socketPath: isWindows ? "//./pipe/docker_engine" : "/var/run/docker.sock",
    });
    this.initialize();
  }

  /**
   * Initialize Docker service and set up queue executor
   */
  private async initialize(): Promise<void> {
    try {
      await this.docker.ping();
      console.log("🐳 Docker connection established");

      await this.ensureImage();

      queueService.setExecutor(this.executeJob.bind(this));

      this.isInitialized = true;
      console.log("✅ Docker service initialized");
    } catch (error) {
      console.error("❌ Docker initialization failed:", error);
      console.warn(
        "⚠️ Running in fallback mode - code execution will be simulated",
      );

      queueService.setExecutor(this.fallbackExecutor.bind(this));
      this.isInitialized = false;
    }
  }

  /**
   * Ensure the executor Docker image exists
   */
  private async ensureImage(): Promise<void> {
    try {
      await this.docker.getImage("coderank-executor").inspect();
      console.log("✅ Executor image found");
    } catch {
      console.warn(
        "⚠️ Executor image not found. Build it with: npm run docker:build",
      );
    }
  }

  /**
   * Execute a queued job in a Docker container
   * This is called by the queue service
   */
  private async executeJob(job: IQueueJob): Promise<IExecutionResult> {
    const { language, code, stdin } = job.executionRequest;
    const config = LANGUAGE_CONFIG[language];
    const sanitizedCode = sanitizeCode(code);

    const startTime = Date.now();
    let container: Docker.Container | null = null;

    try {
      // Build the execution command
      let cmd: string;
      if (config.compileCmd) {
        // For compiled languages: compile then run
        cmd = `${config.compileCmd} 2>&1 && ${config.runCmd}`;
      } else {
        cmd = config.runCmd;
      }

      // Wrap with stdin handling
      const fullCmd = stdin
        ? `echo '${Buffer.from(stdin).toString("base64")}' | base64 -d | bash -c "${cmd}"`
        : `bash -c "${cmd}"`;

      // Create container with resource limits
      container = await this.docker.createContainer({
        Image: config.image,
        Cmd: [
          "/bin/bash",
          "-c",
          `cat > /code/${config.fileName} << 'CODEEOF'\n${sanitizedCode}\nCODEEOF\n${fullCmd}`,
        ],
        WorkingDir: "/code",
        User: "coderunner",
        NetworkDisabled: true,
        HostConfig: {
          Memory: this.parseMemoryLimit(env.MEMORY_LIMIT),
          NanoCpus: Math.floor(env.CPU_LIMIT * 1e9),
          PidsLimit: 100,
          ReadonlyRootfs: false,
          AutoRemove: false,
          SecurityOpt: ["no-new-privileges"],
        },
      });

      // Start container
      await container.start();

      const result = await this.waitForContainer(container, config.timeout);

      const executionTime = Date.now() - startTime;

      return {
        stdout: result.stdout.substring(0, CONSTANTS.MAX_OUTPUT_SIZE),
        stderr: result.stderr.substring(0, CONSTANTS.MAX_OUTPUT_SIZE),
        exitCode: result.exitCode,
        executionTime,
        status:
          result.exitCode === 0
            ? ExecutionStatus.COMPLETED
            : ExecutionStatus.ERROR,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      if (error.message?.includes("timeout")) {
        return {
          stdout: "",
          stderr: "Execution timed out. Your code took too long to execute.",
          exitCode: 124,
          executionTime,
          status: ExecutionStatus.TIMEOUT,
        };
      }

      return {
        stdout: "",
        stderr: error.message || "Unknown execution error",
        exitCode: 1,
        executionTime,
        status: ExecutionStatus.ERROR,
      };
    } finally {
      if (container) {
        try {
          await container.stop({ t: 0 }).catch(() => {});
          await container.remove({ force: true }).catch(() => {});
        } catch {}
      }
    }
  }

  /**
   * Wait for container to finish and collect output
   * Implements timeout mechanism
   */
  private async waitForContainer(
    container: Docker.Container,
    timeout: number,
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          await container.stop({ t: 0 });
        } catch {}
        reject(new Error("Execution timeout"));
      }, timeout);

      try {
        const waitResult = await container.wait();

        clearTimeout(timer);

        const logs = await container.logs({
          stdout: true,
          stderr: true,
          follow: false,
        });

        const { stdout, stderr } = this.parseDockerLogs(logs);

        resolve({
          stdout,
          stderr,
          exitCode: waitResult.StatusCode,
        });
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * Parse Docker multiplexed stream output
   * Docker prepends an 8-byte header to each frame
   */
  private parseDockerLogs(buffer: Buffer): {
    stdout: string;
    stderr: string;
  } {
    let stdout = "";
    let stderr = "";
    let offset = 0;

    while (offset < buffer.length) {
      if (offset + 8 > buffer.length) {
        stdout += buffer.slice(offset).toString("utf8");
        break;
      }

      const streamType = buffer[offset];
      const frameSize = buffer.readUInt32BE(offset + 4);
      const frameData = buffer
        .slice(offset + 8, offset + 8 + frameSize)
        .toString("utf8");

      if (streamType === 1) {
        stdout += frameData;
      } else if (streamType === 2) {
        stderr += frameData;
      } else {
        stdout += frameData;
      }

      offset += 8 + frameSize;
    }

    return { stdout: stdout.trim(), stderr: stderr.trim() };
  }

  /**
   * Parse memory limit string to bytes
   */
  private parseMemoryLimit(limit: string): number {
    const value = parseInt(limit);
    const unit = limit.replace(/\d/g, "").toLowerCase();

    switch (unit) {
      case "k":
        return value * 1024;
      case "m":
        return value * 1024 * 1024;
      case "g":
        return value * 1024 * 1024 * 1024;
      default:
        return 64 * 1024 * 1024; // Default 64MB
    }
  }

  /**
   * Fallback executor for development without Docker
   * Simulates code execution with basic output
   */
  private async fallbackExecutor(job: IQueueJob): Promise<IExecutionResult> {
    console.warn(
      `⚠️ Using fallback executor for job ${job.id} (Docker not available)`,
    );

    const { language, code, stdin } = job.executionRequest;
    const startTime = Date.now();

    await new Promise((resolve) => setTimeout(resolve, 500));

    const executionTime = Date.now() - startTime;

    return {
      stdout: `[Fallback Mode] Code received for ${language} execution.\nCode length: ${code.length} characters\nStdin: ${stdin || "none"}\n\nNote: Docker is not available. Install Docker and build the executor image to run actual code.`,
      stderr: "",
      exitCode: 0,
      executionTime,
      status: ExecutionStatus.COMPLETED,
    };
  }

  /**
   * Execute code through the queue system
   */
  async execute(request: IExecutionRequest): Promise<IExecutionResult> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return queueService.enqueue(jobId, request);
  }
}

const dockerService = new DockerService();
export default dockerService;
