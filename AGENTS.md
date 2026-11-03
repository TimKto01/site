# Инструкции для следующих сессий

Читайте PROGRESS.md, ROADMAP.md, ARCHITECTURE.md и DECISIONS.md перед изменениями. Техническое задание сохранено в docs/MASTER_PROMPT.md; исходный файл обрывается в начале раздела 21.

Развивайте GreenStore по этапам, не пропускайте критические проверки. Обновляйте PROGRESS.md после значимых шагов; не называйте незавершённые операции работающими.

Используйте существующий checkout в изолированной облачной среде; не создавайте worktree без явного запроса пользователя. Сохраняйте изменения пользователя. Не добавляйте секреты, .env, артефакты, чужие изображения и вымышленные данные продавца в Git.

Стек: Next.js App Router, TypeScript strict, Tailwind 4, shadcn/ui, Prisma 7 + PostgreSQL. Общая бизнес-логика — сервисы, не дублировать в вебе и будущем Telegram-боте. Все пользовательские данные проверять на сервере. Цены — целые копейки.

После изменений: npm run db:generate, npm run typecheck, npm run lint, npm test, npm run build; для интерфейса npm run test:e2e. Vitest не должен захватывать Playwright tests/e2e. Не подменяйте недоступные интеграции успешными ответами. Реальные платежи и отправления запрещены без отдельных доступов и разрешения.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## После этапа 2

Публичные страницы требуют PostgreSQL и применённых миграций: npm run db:up, npm run db:deploy, npm run db:seed. Seed одноразовый и не должен перезаписывать правки. Данные локального администратора находятся в игнорируемом storage/admin-bootstrap.txt; не читайте/не выводите их в инструменты и чат для диагностики. Для тестов создаются отдельные случайные credentials через scripts/e2e.mjs.

Используйте npm run test:e2e (создаёт и удаляет свою БД), не запускайте мутационные browser tests на рабочей базе напрямую. Production persistence check: npm run build, затем npm run test:production. Новые мутации всегда требуют session + Origin и Zod. Не отключайте body/image limits, контроль версии и журналы ради проходящих тестов. Не импортируйте demo-data в публичный UI; он предназначен для seed/tests. UPLOAD_DIR — runtime data вне сборки.
