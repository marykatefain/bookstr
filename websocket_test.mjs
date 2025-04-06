
import { get } from "https";

const options = {
  hostname: "relay.primal.net",
  port: 443,
  path: "/",
  method: "GET",
  headers: {
    "Connection": "Upgrade",
    "Upgrade": "websocket",
    "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
    "Sec-WebSocket-Version": "13"
  }
};

const req = get(options, (res) => {
  console.log("Status Code:", res.statusCode);
  console.log("Headers:", res.headers);
  res.on("data", (chunk) => {
    console.log("Body:", chunk.toString());
  });
});

req.on("error", (e) => {
  console.error("Error:", e);
});

req.on("upgrade", (res, socket, upgradeHead) => {
  console.log("WebSocket upgrade successful!");
});

req.end();

