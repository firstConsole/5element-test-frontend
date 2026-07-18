# 5 Element — Chat (frontend)

Веб-интерфейс чата с LLM: авторизация, список чатов, диалог с потоковым
(streaming) ответом, выбор модели и tool calling. Общается с backend только
через REST/SSE API.

Стек: **React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Router.**

---

## Возможности

- Регистрация / вход (JWT), защита маршрутов, авто-выход при протухшем токене.
- Список чатов: создание, переименование и удаление (с подтверждающими модалками).
- Диалог: история сообщений, отправка, **потоковый вывод ответа** (SSE).
- Выбор модели провайдера (`GET /models`).
- Tool calling: тумблер + тултип со списком инструментов (`GET /tools`);
  под ответом — отметка о фактически вызванных инструментах.

---

## Архитектура

```
src/
├── main.tsx            # входная точка: AuthProvider + RouterProvider
├── router.tsx          # маршруты (login / чат / 404) + guard
├── pages/              # страницы (login, chat)
├── components/
│   ├── chat/           # сайдбар, окно диалога, пузырь сообщения, модалки
│   ├── layout/         # корневой лэйаут (Toaster, TooltipProvider)
│   └── ui/             # компоненты shadcn/ui
├── context/            # AuthContext + AuthProvider
└── lib/                # api-клиент, эндпоинты, типы, хранение токена
```

- **`lib/api.ts`** — обёртка над `fetch`: базовый URL, JSON, JWT, `ApiError`,
  авто-разлогин на 401. Стриминг (`lib/messages-api.ts`) читает `ReadableStream`
  и парсит SSE-события `data: {...}`.
- **Auth** — контекст хранит пользователя; при старте токен валидируется через
  `/auth/me`; `RequireAuth` пускает только авторизованных.
- **UI** — shadcn/ui (Radix + Tailwind v4), тема со светлым/тёмным вариантами.

---

## Конфигурация

Единственная переменная — адрес backend (см. `.env.example`):

```env
VITE_API_URL=http://localhost:8000
```

Переменная зашивается в бандл на этапе сборки (браузер ходит к API напрямую).

---

## Запуск

### Локально (dev)

```bash
cp .env.example .env      # при необходимости поправьте VITE_API_URL
npm install
npm run dev               # http://localhost:5173
```

Backend должен быть запущен на `VITE_API_URL` (см. README backend). CORS для
`localhost:5173` уже настроен на стороне API.

### Docker (nginx + статика)

```bash
docker build -t 5element-chat-frontend --build-arg VITE_API_URL=http://localhost:8000 .
docker run -p 5173:80 5element-chat-frontend   # http://localhost:5173
```

### Сборка / линт

```bash
npm run build     # tsc + vite build (dist/)
npm run lint      # oxlint
```

---

## Заметки

- **Tool calling** требует модель с поддержкой tools. `llama3` её **не**
  поддерживает — используйте, например, `qwen2.5`
  (`ollama pull qwen2.5`) и выберите её в селекторе.
- Отметка о вызванных инструментах показывается для только что полученного
  ответа (в историю БД не сохраняется).
