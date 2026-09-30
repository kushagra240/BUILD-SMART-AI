.PHONY: help setup dev test lint format train migrate clean

help:
	@echo "BuildSmart AI Makefile"
	@echo "  make setup    - Install dependencies and setup pre-commit"
	@echo "  make dev      - Start PostgreSQL database via Docker"
	@echo "  make lint     - Run Ruff, mypy, ESLint typechecks"
	@echo "  make format   - Run auto-formatters (Ruff format, Prettier)"
	@echo "  make test     - Run unit and property tests"
	@echo "  make train    - Execute ML model training pipeline"
	@echo "  make migrate  - Run database migrations via Alembic"
	@echo "  make clean    - Remove build artifacts and temp files"

setup:
	python -m pip install --upgrade pip
	pip install ruff mypy pytest pre-commit
	pre-commit install

dev:
	docker-compose up -d postgres

lint:
	ruff check .
	mypy ml apps/api
	cd apps/web && npm run lint

format:
	ruff format .
	cd apps/web && npx prettier --write .

test:
	pytest apps/api/tests ml/tests
	cd apps/web && npm test -- --run

train:
	python -m ml.src.train --config ml/configs/train_v1.yaml

migrate:
	cd apps/api && alembic upgrade head

clean:
	rm -rf .pytest_cache .mypy_cache .ruff_cache __pycache__
	find . -type d -name "__pycache__" -exec rm -rf {} +
