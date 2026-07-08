const { spawn } = require("child_process");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const processes = [];

const run = (name, cwd) => {
  const child = spawn(npmCommand, ["run", "dev"], {
    cwd,
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code, signal) => {
    if (signal) return;
    if (code && !process.exitCode) process.exitCode = code;
    shutdown();
  });

  processes.push(child);
};

const shutdown = () => {
  for (const child of processes) {
    if (!child.killed) child.kill("SIGTERM");
  }
};

process.on("SIGINT", () => {
  shutdown();
  process.exit(130);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(143);
});

run("server", "server");
run("client", "client");
