/**
 * Application-wide constants
 */
export const CONSTANTS = {
  // Bcrypt salt rounds
  SALT_ROUNDS: 12,

  // Share ID length
  SHARE_ID_LENGTH: 8,

  // Max code size in characters
  MAX_CODE_SIZE: 50000,

  // Max stdin size in characters
  MAX_STDIN_SIZE: 10000,

  // Max title length
  MAX_TITLE_LENGTH: 100,

  // Pagination defaults
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,

  // Docker container limits
  MAX_OUTPUT_SIZE: 65536, // 64KB max output

  // Queue settings
  MAX_CONCURRENT_EXECUTIONS: 5,
} as const;
