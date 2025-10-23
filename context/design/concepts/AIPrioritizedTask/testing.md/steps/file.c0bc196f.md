---
timestamp: 'Thu Oct 23 2025 15:57:58 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_155758.4cdad5fd.md]]'
content_id: c0bc196fd15966bf97c8396b391559bbd6b1e71deed779eac2e64d168bf7882b
---

# file: src/concepts/gemini-llm.ts

```typescript
// src/concepts/gemini-llm.ts
import { Deno } from "@utils/types.ts"; // Import Deno type if not globally available

/**
 * A simple wrapper for interacting with the Google Gemini LLM API.
 * Requires a GEMINI_API_KEY environment variable to be set.
 */
export class GeminiLLM {
  private readonly apiKey: string;
  private readonly apiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

  constructor({ apiKey }: { apiKey: string }) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required for GeminiLLM.");
    }
    this.apiKey = apiKey;
  }

  /**
   * Executes a prompt against the Gemini LLM and returns the generated text.
   * @param prompt The text prompt to send to the LLM.
   * @returns The generated text from the LLM, or an error message.
   */
  async executeLLM(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ LLM API Error: ${response.status} ${response.statusText} - ${errorText}`,
        );
        throw new Error(
          `LLM API call failed with status ${response.status}: ${errorText}`,
        );
      }

      const data = await response.json();
      // Expecting data.candidates[0].content.parts[0].text
      if (
        data.candidates && data.candidates.length > 0 &&
        data.candidates[0].content && data.candidates[0].content.parts &&
        data.candidates[0].content.parts.length > 0 &&
        data.candidates[0].content.parts[0].text
      ) {
        return data.candidates[0].content.parts[0].text;
      } else {
        console.warn("⚠️  Unexpected LLM response structure:", data);
        throw new Error("Unexpected LLM response structure.");
      }
    } catch (error) {
      console.error(`❌ Network or parsing error during LLM call: ${error}`);
      throw new Error(`Failed to get LLM response: ${(error as Error).message}`);
    }
  }
}
```

Next, the implementation of the `AIPrioritizedTask` concept.
