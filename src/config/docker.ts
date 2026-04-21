import { Language, ILanguageConfig } from "../types/index";

export const LANGUAGE_CONFIG: Record<Language, ILanguageConfig> = {
  [Language.JAVASCRIPT]: {
    image: "coderank-executor",
    fileName: "solution.js",
    runCmd: "node /code/solution.js",
    timeout: 10000,
  },
  [Language.PYTHON]: {
    image: "coderank-executor",
    fileName: "solution.py",
    runCmd: "python3 /code/solution.py",
    timeout: 10000,
  },
  [Language.JAVA]: {
    image: "coderank-executor",
    fileName: "Main.java",
    compileCmd: "javac /code/Main.java",
    runCmd: "java -cp /code Main",
    timeout: 15000,
  },
  [Language.C]: {
    image: "coderank-executor",
    fileName: "solution.c",
    compileCmd: "gcc /code/solution.c -o /code/solution -lm",
    runCmd: "/code/solution",
    timeout: 10000,
  },
  [Language.CPP]: {
    image: "coderank-executor",
    fileName: "solution.cpp",
    compileCmd: "g++ /code/solution.cpp -o /code/solution -lm",
    runCmd: "/code/solution",
    timeout: 10000,
  },
  [Language.RUBY]: {
    image: "coderank-executor",
    fileName: "solution.rb",
    runCmd: "ruby /code/solution.rb",
    timeout: 10000,
  },
  [Language.GO]: {
    image: "coderank-executor",
    fileName: "solution.go",
    runCmd: "go run /code/solution.go",
    timeout: 15000,
  },
  [Language.RUST]: {
    image: "coderank-executor",
    fileName: "solution.rs",
    compileCmd: "rustc /code/solution.rs -o /code/solution",
    runCmd: "/code/solution",
    timeout: 15000,
  },
  [Language.PHP]: {
    image: "coderank-executor",
    fileName: "solution.php",
    runCmd: "php /code/solution.php",
    timeout: 10000,
  },
};
