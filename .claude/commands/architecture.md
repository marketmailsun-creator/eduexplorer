---
description: Generate architecture documentation from the codebase
allowed-tools: Bash(find:*), Bash(cat:*), Bash(git:*), Bash(wc:*)
---

Perform a deep analysis of the codebase and generate a comprehensive architecture document at `docs/ARCHITECTURE.md`. Include:

1. **System Overview**: High-level architecture diagram description
2. **Component Breakdown**: Each module/package with its responsibility
3. **Data Flow**: How data moves through the system
4. **API Contracts**: Key interfaces and endpoints
5. **Database Schema**: Models and relationships (if applicable)
6. **Configuration Management**: Environment variables, config files
7. **Deployment Architecture**: How the application is built and deployed
8. **Security Considerations**: Authentication, authorization, data handling

Use mermaid diagram syntax where applicable for visual representations.