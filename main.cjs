const https = require("node:https");

const SOCKET_COUNT = Number(process.env.SOCKET_COUNT || 10);
const sockets = [];
let allResolved = false;

const keepAliveAgent = new https.Agent({ keepAlive: true });

const performRequest = () => {
  const socketPromise = new Promise((resolve) => {
    https
      .get(
        {
          agent: keepAliveAgent,
          hostname: "registry.npmjs.org",
        },
        () => {
          process.stdout.write(".");
          resolve();
        }
      )
      .on("error", (error) => {
        console.error(error);
        resolve();
      });
  });
  sockets.push(socketPromise);
};

process.stdout.write(
  `${new Date().toISOString()} opening ${SOCKET_COUNT} sockets`
);
for (let loops = 0; loops < SOCKET_COUNT; ++loops) {
  performRequest();
}

Promise.all(sockets).then(() => {
  allResolved = true;
  console.log(
    `\n${new Date().toISOString()} all sockets created. requesting report...`
  );
  const report = process.report.getReport();
  
  const socketHandles = Object.values(report.libuv).filter((handle) =>
    ["tcp", "udp"].includes(handle.type)
  );
  console.log(`${new Date().toISOString()} report has ${socketHandles.length} socket handles. destroying client...`);
  console.dir(socketHandles);
  keepAliveAgent.destroy();

  console.log(`${new Date().toISOString()} end`);
});

const check = () => {
  if (!allResolved) {
    setTimeout(check, 200);
    return;
  }
};

check();
