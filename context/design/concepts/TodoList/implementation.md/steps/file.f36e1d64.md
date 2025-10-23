---
timestamp: 'Thu Oct 23 2025 16:45:14 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_164514.8cfe29a2.md]]'
content_id: f36e1d645d06786148db76cf7635d61efea22d1b1333a44a804b43df8dca35f4
---

# file: deno.json

```json
{
    "nodeModulesDir": "auto",
    "imports": {
        "@concepts/": "./src/concepts/",
        "@utils/": "./src/utils/"
    },
    "tasks": {
        "concepts": "deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api"
    }
}
```
