[@concept-design-overview](../background/concept-design-overview.md)

# question: how do we make sure concepts are modular?
# response:

Concept design ensures modularity through several key principles and mechanisms outlined in the text:

1.  **Mutual Independence:** This is the most significant distinguishing feature. Each concept is explicitly "defined without reference to any other concepts, and can be understood in isolation." This means no direct dependencies or internal coupling between concepts.

2.  **Strong Separation of Concerns:** Concepts are designed to address "only a single, coherent aspect of the functionality." They avoid conflating different functionalities that could be separated. For example, user-related functions like authentication, profiles, and notifications are split into distinct concepts (*UserAuthentication*, *Profile*, *Notification*) instead of being combined into a single *User* class.

3.  **Completeness of Functionality:** Each concept is "complete with respect to their functionality and don't rely on functionality from other concepts." A concept that needs to perform an action (like sending a notification) must contain that functionality itself, rather than calling an action in another concept.

4.  **Self-Contained State:** "Each concept maintains its own state," which is sufficiently rich to support its behavior but "no richer than it need be." This ensures that a concept's internal data is isolated and relevant only to its specific purpose, preventing external concepts from needing to know about or modify its internal workings.

5.  **Polymorphism and Generic Interfaces:** Designers are encouraged to make concepts "as free as possible of any assumptions about the content and interpretation of objects passed as action arguments." This generic design makes concepts highly reusable and independent of the specific data types or contexts they might operate on.

6.  **Composition by Synchronization (Absence of Direct Coupling):** Because concepts are fully independent and cannot refer to or use each other's services directly, their interaction is mediated by external "synchronizations" (syncs). Syncs are rules that define how an action in one concept can trigger an action in another, based on certain conditions in their respective states. This mechanism allows concepts to collaborate without breaking their internal independence, as the orchestration logic is external to the concepts themselves.

In essence, concept design enforces modularity by defining concepts as completely independent, self-contained units with a focused purpose, and then providing an external mechanism (synchronization) for them to interact without creating internal dependencies.