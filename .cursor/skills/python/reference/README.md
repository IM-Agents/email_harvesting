# Python — reference

**Canonical standard:** [../SKILL.md](../SKILL.md)  
**Suite index:** [../../SKILL.md](../../SKILL.md)

## Reference files

- [folder-structure.md](folder-structure.md) — src layout, FastAPI, Django.
- [typing-and-async.md](typing-and-async.md) — hints, Pydantic, asyncio.
- [framework-patterns.md](framework-patterns.md) — FastAPI and Django patterns.
- [security-performance.md](security-performance.md) — SQL, auth, logging, performance.

## Local development

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
pytest
ruff check .
mypy src
```

## Checklist

- [ ] Type hints on public APIs; mypy/pyright clean in CI
- [ ] Pydantic (or equivalent) validates HTTP input
- [ ] No `SELECT *`; parameterized SQL only
- [ ] `.env.example` committed; secrets not in repo
- [ ] pytest covers services and critical API paths
