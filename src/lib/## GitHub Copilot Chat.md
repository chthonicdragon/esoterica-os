## GitHub Copilot Chat

- Extension: 0.38.2 (prod)
- VS Code: 1.110.1 (61b3d0ab13be7dda2389f1d3e60a119c7f660cc3)
- OS: win32 10.0.26200 x64
- GitHub Account: guledwlemenqz

## Network

User Settings:
```json
  "http.systemCertificatesNode": true,
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Connecting to https://api.github.com:
- DNS ipv4 Lookup: 140.82.121.6 (1 ms)
- DNS ipv6 Lookup: Error (1 ms): getaddrinfo ENOTFOUND api.github.com
- Proxy URL: None (1 ms)
- Electron fetch (configured): HTTP 200 (51 ms)
- Node.js https: HTTP 200 (164 ms)
- Node.js fetch: HTTP 200 (52 ms)

Connecting to https://api.githubcopilot.com/_ping:
- DNS ipv4 Lookup: 140.82.114.21 (2 ms)
- DNS ipv6 Lookup: Error (1 ms): getaddrinfo ENOTFOUND api.githubcopilot.com
- Proxy URL: None (2 ms)
- Electron fetch (configured): HTTP 200 (126 ms)
- Node.js https: HTTP 200 (435 ms)
- Node.js fetch: HTTP 200 (408 ms)

Connecting to https://copilot-proxy.githubusercontent.com/_ping:
- DNS ipv4 Lookup: 4.225.11.192 (803 ms)
- DNS ipv6 Lookup: Error (54 ms): getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
- Proxy URL: None (1 ms)
- Electron fetch (configured): HTTP 200 (158 ms)
- Node.js https: HTTP 200 (155 ms)
- Node.js fetch: HTTP 200 (164 ms)

Connecting to https://mobile.events.data.microsoft.com: HTTP 404 (206 ms)
Connecting to https://dc.services.visualstudio.com: HTTP 404 (246 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (408 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (402 ms)
Connecting to https://default.exp-tas.com: HTTP 400 (182 ms)

Number of system certificates: 385

## Documentation

In corporate networks: [Troubleshooting firewall settings for GitHub Copilot](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot).