import { spawn } from "node:child_process";
import net from "node:net";

const backendHost = process.env.BITEBUDDY_API_HOST || "127.0.0.1";
const backendPort = Number(process.env.BITEBUDDY_API_PORT || 8787);
const children = [];

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill());
  process.exitCode = exitCode;
}

function watch(child) {
  child.on("exit", (code) => stop(code || 0));
  child.on("error", (error) => {
    console.error(`Local development service failed to start: ${error.message}`);
    stop(1);
  });
}

function canConnect() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: backendHost, port: backendPort });
    socket.setTimeout(250);
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("timeout", () => { socket.destroy(); resolve(false); });
    socket.once("error", () => resolve(false));
  });
}

async function waitForBackend() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await canConnect()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Mock backend did not become ready on ${backendHost}:${backendPort}.`);
}

async function start() {
  const backend = spawn(process.execPath, ["server/index.js"], { stdio: "inherit" });
  children.push(backend);
  watch(backend);
  await waitForBackend();
  if (stopping) return;
  const frontend = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--strictPort"], { stdio: "inherit" });
  children.push(frontend);
  watch(frontend);
}

start().catch((error) => {
  console.error(`Local development services failed to start: ${error.message}`);
  stop(1);
});

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
