import { Server, Socket } from "socket.io";
import interactiveExecutionService from "../services/interactiveExecution.service";
import {
  IExecutionInputPayload,
  IExecutionStartPayload,
  IExecutionStopPayload,
  IInteractiveExecutionSession,
  Language,
} from "../types/index";
import { CONSTANTS } from "../utils/constants";

const EXECUTION_EVENTS = {
  START: "execution:start",
  STDIN: "execution:stdin",
  STOP: "execution:stop",
  STATUS: "execution:status",
  OUTPUT: "execution:output",
  COMPLETE: "execution:complete",
  ERROR: "execution:error",
} as const;

const SOCKET_RATE_LIMIT = {
  WINDOW_MS: 60_000,
  MAX_STARTS: 10,
  MAX_STDIN: 120,
};

interface SocketRateState {
  windowStartedAt: number;
  starts: number;
  stdin: number;
}

const getRateState = (socket: Socket): SocketRateState => {
  const now = Date.now();
  const current = socket.data.executionRateState as SocketRateState | undefined;

  if (!current || now - current.windowStartedAt > SOCKET_RATE_LIMIT.WINDOW_MS) {
    const next = { windowStartedAt: now, starts: 0, stdin: 0 };
    socket.data.executionRateState = next;
    return next;
  }

  return current;
};

const consumeSocketQuota = (
  socket: Socket,
  type: "starts" | "stdin",
): boolean => {
  const state = getRateState(socket);
  const max =
    type === "starts"
      ? SOCKET_RATE_LIMIT.MAX_STARTS
      : SOCKET_RATE_LIMIT.MAX_STDIN;

  if (state[type] >= max) {
    return false;
  }

  state[type] += 1;
  return true;
};

const isSupportedLanguage = (language: string): language is Language => {
  return Object.values(Language).includes(language as Language);
};

const validateStartPayload = (payload: IExecutionStartPayload): void => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid execution payload");
  }

  if (!isSupportedLanguage(payload.language)) {
    throw new Error("Unsupported language");
  }

  if (typeof payload.code !== "string" || payload.code.trim().length === 0) {
    throw new Error("Code is required");
  }

  if (payload.code.length > CONSTANTS.MAX_CODE_SIZE) {
    throw new Error(`Code cannot exceed ${CONSTANTS.MAX_CODE_SIZE} characters`);
  }

  if (payload.stdin && payload.stdin.length > CONSTANTS.MAX_STDIN_SIZE) {
    throw new Error(
      `Input cannot exceed ${CONSTANTS.MAX_STDIN_SIZE} characters`,
    );
  }
};

export const registerExecutionSocket = (io: Server): void => {
  io.on("connection", (socket: Socket) => {
    let activeSession: IInteractiveExecutionSession | null = null;

    const cleanupActiveSession = async (reason: string) => {
      const session = activeSession;
      activeSession = null;

      if (session) {
        await session.stop(reason);
      }
    };

    socket.on(
      EXECUTION_EVENTS.START,
      async (payload: IExecutionStartPayload) => {
        try {
          if (!consumeSocketQuota(socket, "starts")) {
            throw new Error("Too many execution requests. Please slow down.");
          }

          validateStartPayload(payload);

          if (activeSession) {
            throw new Error("An execution is already running on this socket");
          }

          activeSession = await interactiveExecutionService.start(payload, {
            onStatus: (data) => socket.emit(EXECUTION_EVENTS.STATUS, data),
            onOutput: (data) => socket.emit(EXECUTION_EVENTS.OUTPUT, data),
            onComplete: (data) => {
              socket.emit(EXECUTION_EVENTS.COMPLETE, data);
              activeSession = null;
            },
          });
        } catch (error: unknown) {
          socket.emit(EXECUTION_EVENTS.ERROR, {
            message:
              error instanceof Error
                ? error.message
                : "Unable to start execution",
          });
        }
      },
    );

    socket.on(EXECUTION_EVENTS.STDIN, (payload: IExecutionInputPayload) => {
      if (!consumeSocketQuota(socket, "stdin")) {
        socket.emit(EXECUTION_EVENTS.ERROR, {
          message: "Too much live input sent. Please slow down.",
        });
        return;
      }

      if (!activeSession) {
        socket.emit(EXECUTION_EVENTS.ERROR, {
          message: "No active execution is waiting for input",
        });
        return;
      }

      if (!payload || typeof payload.data !== "string") {
        socket.emit(EXECUTION_EVENTS.ERROR, {
          message: "Input payload must contain data",
        });
        return;
      }

      activeSession.writeStdin(payload.data);
    });

    socket.on(
      EXECUTION_EVENTS.STOP,
      async (_payload?: IExecutionStopPayload) => {
        await cleanupActiveSession("Execution stopped by user.");
      },
    );

    socket.on("disconnect", async () => {
      await cleanupActiveSession("Socket disconnected.");
    });
  });
};

export { EXECUTION_EVENTS };
