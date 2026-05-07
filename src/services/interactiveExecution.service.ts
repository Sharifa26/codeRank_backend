import Docker from "dockerode";
import { Writable } from "stream";
import { LANGUAGE_CONFIG } from "../config/docker";
import env from "../config/env";
import {
  ExecutionStatus,
  IExecutionCallbacks,
  IExecutionStartPayload,
  IInteractiveExecutionSession,
  Language,
} from "../types/index";
import { CONSTANTS } from "../utils/constants";
import { sanitizeCode } from "../utils/helpers";

interface RunningSession {
  id: string;
  startedAt: number;
  container: Docker.Container | null;
  stream: NodeJS.WritableStream | null;
  timeout: NodeJS.Timeout | null;
  idleTimer: NodeJS.Timeout | null;
  completed: boolean;
  stdout: string;
  stderr: string;
  outputBytes: number;
  currentStatus: ExecutionStatus;
}

class InteractiveExecutionService {
  private docker: Docker;

  constructor() {
    const isWindows = process.platform === "win32";
    this.docker = new Docker({
      socketPath: isWindows ? "//./pipe/docker_engine" : env.DOCKER_SOCKET,
    });
  }

  async start(
    payload: IExecutionStartPayload,
    callbacks: IExecutionCallbacks,
  ): Promise<IInteractiveExecutionSession> {
    const config = LANGUAGE_CONFIG[payload.language];

    if (!config) {
      throw new Error("Unsupported language");
    }

    const id = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const marker = `__CODERANK_STATUS_RUNNING_${id}__`;
    const sourceCode =
      payload.language === Language.JAVASCRIPT
        ? this.prepareJavaScriptSource(payload.code)
        : payload.code;
    const source = Buffer.from(sanitizeCode(sourceCode), "utf8").toString(
      "base64",
    );
    const startStatus = config.compileCmd
      ? ExecutionStatus.COMPILING
      : ExecutionStatus.RUNNING;

    const session: RunningSession = {
      id,
      startedAt: Date.now(),
      container: null,
      stream: null,
      timeout: null,
      idleTimer: null,
      completed: false,
      stdout: "",
      stderr: "",
      outputBytes: 0,
      currentStatus: startStatus,
    };

    const command = this.buildCommand(source, config.fileName, marker, {
      compileCmd: config.compileCmd,
      runCmd: config.runCmd,
    });

    const container = await this.docker.createContainer({
      Image: config.image,
      Cmd: ["/bin/bash", "-lc", command],
      WorkingDir: "/code",
      User: "coderunner",
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: true,
      StdinOnce: false,
      Tty: false,
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

    session.container = container;

    const attached = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
      hijack: true,
    });

    session.stream = attached;
    this.attachOutputStreams(attached, session, callbacks, marker);

    callbacks.onStatus({
      executionId: id,
      status: startStatus,
      message: config.compileCmd ? "Compiling source" : "Running program",
    });

    session.timeout = setTimeout(() => {
      this.finish(session, callbacks, ExecutionStatus.TIMEOUT, 124, {
        stderr: "Execution timed out. Your code took too long to execute.",
      });
    }, config.timeout);

    await container.start();

    if (payload.stdin) {
      this.writeStdin(
        session,
        payload.stdin.endsWith("\n") ? payload.stdin : `${payload.stdin}\n`,
      );
    }

    void container
      .wait()
      .then((result) => {
        if (session.completed) {
          return;
        }

        this.finish(
          session,
          callbacks,
          result.StatusCode === 0
            ? ExecutionStatus.COMPLETED
            : ExecutionStatus.ERROR,
          result.StatusCode,
        );
      })
      .catch((error: Error) => {
        if (session.completed) {
          return;
        }

        this.finish(session, callbacks, ExecutionStatus.ERROR, 1, {
          stderr: error.message,
        });
      });

    return {
      id,
      writeStdin: (data: string) => this.writeStdin(session, data),
      stop: (reason?: string) =>
        this.finish(session, callbacks, ExecutionStatus.ERROR, 130, {
          stderr: reason || "Execution stopped.",
        }),
    };
  }

  private buildCommand(
    encodedSource: string,
    fileName: string,
    marker: string,
    commands: { compileCmd?: string; runCmd: string },
  ): string {
    const writeSource = `printf '%s' '${encodedSource}' | base64 -d > /code/${fileName}`;
    const markRunning = `printf '\\n${marker}\\n' >&2`;

    if (commands.compileCmd) {
      return `${writeSource} && ${commands.compileCmd} && ${markRunning} && exec ${commands.runCmd}`;
    }

    return `${writeSource} && ${markRunning} && exec ${commands.runCmd}`;
  }

  private prepareJavaScriptSource(code: string): string {
    return `const __codenovaReadline = require("readline");
const __codenovaClose = __codenovaReadline.Interface.prototype.close;
__codenovaReadline.Interface.prototype.close = function (...args) {
  const result = __codenovaClose.apply(this, args);
  if (process.stdin && !process.stdin.destroyed) {
    process.stdin.destroy();
  }
  return result;
};

${code}`;
  }

  private attachOutputStreams(
    stream: NodeJS.ReadWriteStream,
    session: RunningSession,
    callbacks: IExecutionCallbacks,
    marker: string,
  ): void {
    let stderrBuffer = "";

    const stdout = new Writable({
      write: (chunk, _encoding, done) => {
        this.emitOutput(session, callbacks, "stdout", chunk.toString("utf8"));
        done();
      },
    });

    const stderr = new Writable({
      write: (chunk, _encoding, done) => {
        stderrBuffer += chunk.toString("utf8");
        const markerIndex = stderrBuffer.indexOf(marker);

        if (markerIndex >= 0) {
          const before = stderrBuffer.slice(0, markerIndex).replace(/\n+$/, "");
          const after = stderrBuffer
            .slice(markerIndex + marker.length)
            .replace(/^\n+/, "");

          if (before) {
            this.emitOutput(session, callbacks, "stderr", before);
          }

          this.emitStatus(session, callbacks, ExecutionStatus.RUNNING);
          stderrBuffer = after;
        }

        const keepLength = marker.length - 1;
        if (stderrBuffer.length > keepLength) {
          const safeText = stderrBuffer.slice(0, -keepLength);
          stderrBuffer = stderrBuffer.slice(-keepLength);
          this.emitOutput(session, callbacks, "stderr", safeText);
        }

        done();
      },
      final: (done) => {
        if (stderrBuffer) {
          this.emitOutput(session, callbacks, "stderr", stderrBuffer);
          stderrBuffer = "";
        }
        done();
      },
    });

    this.docker.modem.demuxStream(stream, stdout, stderr);
  }

  private emitOutput(
    session: RunningSession,
    callbacks: IExecutionCallbacks,
    stream: "stdout" | "stderr",
    data: string,
  ): void {
    if (!data || session.completed) {
      return;
    }

    session.outputBytes += Buffer.byteLength(data, "utf8");
    const remaining = CONSTANTS.MAX_OUTPUT_SIZE - session.outputBytes;

    if (remaining <= 0) {
      void this.finish(session, callbacks, ExecutionStatus.ERROR, 1, {
        stderr: "\nOutput limit exceeded.",
      });
      return;
    }

    const boundedData =
      data.length > remaining ? data.slice(0, Math.max(remaining, 0)) : data;

    if (stream === "stdout") {
      session.stdout += boundedData;
    } else {
      session.stderr += boundedData;
    }

    callbacks.onOutput({
      executionId: session.id,
      stream,
      data: boundedData,
    });

    this.scheduleWaitingForInput(session, callbacks);
  }

  private emitStatus(
    session: RunningSession,
    callbacks: IExecutionCallbacks,
    status: ExecutionStatus,
    message?: string,
  ): void {
    if (session.completed || session.currentStatus === status) {
      return;
    }

    session.currentStatus = status;
    callbacks.onStatus({ executionId: session.id, status, message });
    this.scheduleWaitingForInput(session, callbacks);
  }

  private scheduleWaitingForInput(
    session: RunningSession,
    callbacks: IExecutionCallbacks,
  ): void {
    if (
      session.completed ||
      session.currentStatus !== ExecutionStatus.RUNNING
    ) {
      return;
    }

    if (session.idleTimer) {
      clearTimeout(session.idleTimer);
    }

    session.idleTimer = setTimeout(() => {
      this.emitStatus(session, callbacks, ExecutionStatus.WAITING_FOR_INPUT);
    }, 800);
  }

  private writeStdin(session: RunningSession, data: string): void {
    if (session.completed || !session.stream || !data) {
      return;
    }

    if (session.currentStatus === ExecutionStatus.WAITING_FOR_INPUT) {
      session.currentStatus = ExecutionStatus.RUNNING;
    }

    session.stream.write(data, "utf8");
  }

  private async finish(
    session: RunningSession,
    callbacks: IExecutionCallbacks,
    status: ExecutionStatus,
    exitCode: number,
    append?: { stdout?: string; stderr?: string },
  ): Promise<void> {
    if (session.completed) {
      return;
    }

    session.completed = true;

    if (session.timeout) {
      clearTimeout(session.timeout);
    }

    if (session.idleTimer) {
      clearTimeout(session.idleTimer);
    }

    if (append?.stdout) {
      session.stdout += append.stdout;
      callbacks.onOutput({
        executionId: session.id,
        stream: "stdout",
        data: append.stdout,
      });
    }

    if (append?.stderr) {
      session.stderr += append.stderr;
      callbacks.onOutput({
        executionId: session.id,
        stream: "stderr",
        data: append.stderr,
      });
    }

    try {
      session.stream?.end();
    } catch {}

    if (session.container) {
      try {
        await session.container.stop({ t: 0 }).catch(() => {});
        await session.container.remove({ force: true }).catch(() => {});
      } catch {}
    }

    callbacks.onStatus({ executionId: session.id, status });
    callbacks.onComplete({
      executionId: session.id,
      stdout: session.stdout.substring(0, CONSTANTS.MAX_OUTPUT_SIZE),
      stderr: session.stderr.substring(0, CONSTANTS.MAX_OUTPUT_SIZE),
      exitCode,
      executionTime: Date.now() - session.startedAt,
      status,
    });
  }

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
        return 64 * 1024 * 1024;
    }
  }
}

export default new InteractiveExecutionService();
