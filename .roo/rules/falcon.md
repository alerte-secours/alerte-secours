## RepoFalcon Code Knowledge Graph

This repository has a pre-built code knowledge graph. You MUST use the `falcon_*` MCP tools to understand the codebase before making changes.

**Mandatory workflow:**
1. At the start of every task, call `falcon_architecture` to understand the project structure
2. Before modifying any file, call `falcon_file_context` with its path to see what depends on it
3. Before renaming or refactoring a symbol, call `falcon_symbol_lookup` to find all usages
4. To understand a package's role, call `falcon_package_info` instead of reading files one by one
5. Use `falcon_search` instead of grep/glob for finding symbols, files, or packages by name
6. After major refactoring (renamed packages, moved files), call `falcon_refresh` to re-index

These tools are faster and more accurate than grep — they use a pre-computed dependency graph with full symbol resolution.

If the MCP tools are unavailable, read `.falcon/CONTEXT.md` for a static architecture summary as a fallback.
