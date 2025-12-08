import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import ts from "typescript";
import path from "node:path";

const entry = "src/index.ts";
const pkgName = "frontmatter";
const isBrowser = false;
const globalName = "";

const resolvePath = ts.sys.resolvePath;
const fileExists = ts.sys.fileExists;
const deleteFile = ts.sys.deleteFile;
const directoryExists = ts.sys.directoryExists;
const createDirectory = ts.sys.createDirectory;
const writeFile = ts.sys.writeFile;

const wait = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));
const writeOutFile = (filePath: string, content: string) => {
  const resolvedPath = resolvePath(filePath);
  const dir = path.dirname(resolvedPath);
  if (fileExists(resolvedPath) && typeof deleteFile === "function") {
    deleteFile(resolvedPath);
  } else {
    if (!directoryExists(dir)) {
      createDirectory(dir);
    } else {
      if (typeof deleteFile === "function") {
        deleteFile(resolvedPath);
      }
    }
  }
  writeFile(resolvedPath, content);
};

async function clear(folderPath: string) {
  folderPath = path.resolve(process.cwd(), folderPath);
  try {
    const entries = await fs.readdir(folderPath, {
      withFileTypes: true,
    });
    await Promise.all(
      entries.map((entry) =>
        fs.rm(path.join(folderPath, entry.name), { recursive: true })
      )
    );
  } catch (error: unknown) {
    const code = (error as { code?: string } | undefined)?.code;
    if (code !== "ENOENT") {
      throw error;
    }
  }
}

const esmContent = await fs.readFile(entry, "utf-8");
const commonjsCompiler = async () => {
  console.time("Compiled Commonjs");
  const fileName = "index.ts";
  const sourceCode = esmContent.replace(
    `export default ${pkgName};`,
    `export = ${pkgName};`
  );
  const compilerOptions: ts.CompilerOptions = {
    outDir: "dist",
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ESNext,
    lib: ["ESNext"],
    types: ["node"],
    sourceMap: true,
    strict: true,
    esModuleInterop: true,
    noImplicitAny: true,
    declaration: true,
  };
  const createdFiles: Record<string, string> = {};
  const host: ts.CompilerHost = {
    getSourceFile: (file, languageVersion) => {
      if (file === fileName) {
        return ts.createSourceFile(file, sourceCode, languageVersion);
      }
      return undefined;
    },
    writeFile: (fileName, contents) => {
      createdFiles[fileName] = contents;
    },
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    getCurrentDirectory: () => "",
    getDirectories: () => [],
    fileExists: (file) => file === fileName,
    readFile: (file) => (file === fileName ? sourceCode : undefined),
    getCanonicalFileName: (file) => file,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
  };
  // ===
  const program = ts.createProgram([fileName], compilerOptions, host);
  program.emit();
  Object.entries(createdFiles).map(async ([outName, content]) => {
    outName = outName.replace(/.js/g, ".cjs");
    outName = outName.replace(/.map.js/g, ".map.cjs");
    outName = outName.replace(/.d.ts/g, ".d.cts");
    await wait(500);
    writeOutFile(outName, content);
  });
  console.timeEnd("Compiled Commonjs");
};

const esmCompiler = async () => {
  console.time("Compiled ESM");
  const fileName = "index.ts";
  const sourceCode = esmContent;
  const compilerOptions: ts.CompilerOptions = {
    outDir: "dist",
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext,
    sourceMap: true,
    esModuleInterop: true,
    noImplicitAny: true,
    declaration: true,
  };
  const createdFiles: Record<string, string> = {};
  const host: ts.CompilerHost = {
    getSourceFile: (file, languageVersion) => {
      if (file === fileName) {
        return ts.createSourceFile(file, sourceCode, languageVersion);
      }
      return undefined;
    },
    writeFile: (fileName, contents) => {
      createdFiles[fileName] = contents;
    },
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    getCurrentDirectory: () => "",
    getDirectories: () => [],
    fileExists: (file) => file === fileName,
    readFile: (file) => (file === fileName ? sourceCode : undefined),
    getCanonicalFileName: (file) => file,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
  };
  // ===
  const program = ts.createProgram([fileName], compilerOptions, host);
  program.emit();
  Object.entries(createdFiles).map(async ([outName, content]) => {
    await wait(500);
    writeOutFile(outName, content);
  });
  console.timeEnd("Compiled ESM");
};
const browserCompiler = async () => {
  console.time("Compiled Browser");
  const fileName = `${globalName}.ts`;
  const sourceCode = esmContent.replace(`export default ${pkgName};`, "");
  const compilerOptions: ts.CompilerOptions = {
    outDir: "cdn",
    module: ts.ModuleKind.ES2015,
    target: ts.ScriptTarget.ES2015,
    lib: ["DOM"],
    sourceMap: true,
    strict: true,
    noImplicitAny: true,
  };
  const createdFiles: Record<string, string> = {};
  const host: ts.CompilerHost = {
    getSourceFile: (file, languageVersion) => {
      if (file === fileName) {
        return ts.createSourceFile(file, sourceCode, languageVersion);
      }
      return undefined;
    },
    writeFile: (fileName, contents) => {
      createdFiles[fileName] = contents;
    },
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    getCurrentDirectory: () => "",
    getDirectories: () => [],
    fileExists: (file) => file === fileName,
    readFile: (file) => (file === fileName ? sourceCode : undefined),
    getCanonicalFileName: (file) => file,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
  };
  // ===
  const program = ts.createProgram([fileName], compilerOptions, host);
  program.emit();
  Object.entries(createdFiles).map(async ([outName, content]) => {
    await wait(500);
    writeOutFile(outName, content);
  });
  console.timeEnd("Compiled Browser");
};
async function build() {
  if (existsSync("dist")) {
    await clear("dist");
  }
  console.time("Build Time");
  await commonjsCompiler();
  await wait(1000);
  await esmCompiler();
  await wait(1000);
  if (existsSync("cdn")) {
    await clear("cdn");
  }
  if (isBrowser) {
    await browserCompiler();
  }

  console.timeEnd("Build Time");
}

await build();
