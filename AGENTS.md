# AGENTS.md — Kiosk Monitoring System

Руководство для AI-агентов и разработчиков: архитектура, структура файлов, как запускать и где что искать.

---

## Что это за проект

**Система мониторинга и управления киосками** из трёх частей:

1. **client** (Electron + React + Vite + Tailwind) — приложение на каждом киоске: kiosk-режим, WebSocket к бэкенду, передача экрана/камеры/звука, выполнение команд (открыть URL, закрыть сайт, выключить ПК). UI на React (экран ожидания, webview). Идентификация по постоянному `device_id`, реконнект с теми же настройками.
2. **backend** (Python, FastAPI) — хаб: WebSocket для клиентов и монитора, REST API для команд, реестр клиентов и групп, авторизация по токену.
3. **monitor** (React + Vite + Tailwind) — веб-панель: список устройств и групп, просмотр экрана/камеры, управление (по одному устройству или по группе), создание групп, переименование/смена группы клиента.

---

## Структура репозитория

```
kiosk-app/
├── client/                 # Electron-клиент (киоск), UI: React + Vite + Tailwind
│   ├── main.js             # Точка входа, окно, kiosk, unlock shortcut, desktopCapturer IPC, загрузка dist/index.html
│   ├── preload.js          # contextBridge: onConfig, quitApp, shutdown, saveGroupId, getScreenSourceId
│   ├── index.html          # Точка входа Vite (корень для сборки)
│   ├── vite.config.js      # Vite + React + Tailwind, base: './', outDir: dist
│   ├── src/
│   │   ├── main.jsx        # React root
│   │   ├── App.jsx         # Состояние, WebSocket, команды, WaitingScreen / BrowserView
│   │   ├── index.css       # Tailwind @import + ключевые кадры анимации
│   │   ├── WaitingScreen.jsx  # Экран ожидания (тёмный, статус, индикатор)
│   │   └── BrowserView.jsx     # Полноэкранный webview
│   ├── unlock.html         # Окно ввода пароля разблокировки
│   ├── unlock-preload.js   # IPC для unlock
│   ├── config.json         # backendWsUrl, authToken, groupId, unlockPassword, unlockShortcut
│   ├── js/
│   │   ├── websocket.js    # WS с реконнектом и экспоненциальной задержкой
│   │   ├── capture.js      # Экран (desktopCapturer + getUserMedia), камера, аудио → base64
│   │   └── commands.js     # Обработка open_url, close_site, close_app, shutdown, set_group
│   └── package.json        # react, vite, tailwind; scripts: build, start (= build && electron .), build:win
│
├── backend/                # FastAPI
│   ├── app/
│   │   ├── main.py         # FastAPI app, CORS, /health, WebSocket /kiosk-api/ws/client, /kiosk-api/ws/monitor
│   │   ├── config.py       # Settings из .env (AUTH_TOKEN, PORT, WS paths)
│   │   ├── auth.py         # Проверка токена (WS query, REST X-Token)
│   │   ├── models/schemas.py    # ClientRegister, ClientInfo, ClientMediaFrame, OpenUrlBody и т.д.
│   │   ├── state/
│   │   │   ├── registry.py # ClientRegistry: клиенты по client_id и device_id, reattach при реконнекте
│   │   │   └── groups.py   # GroupsStore: группы, client_ids
│   │   ├── websocket/
│   │   │   ├── manager.py  # ConnectionManager: клиенты + мониторы, send_to_client, broadcast_to_monitors
│   │   │   └── handlers.py # handle_client_message: register, media, current_url, pong
│   │   ├── routers/
│   │   │   ├── clients.py  # GET /kiosk-api/clients, GET /kiosk-api/groups, PATCH /kiosk-api/clients/:id (group_id, display_name)
│   │   │   ├── commands.py # POST .../open_url, close_site, close_app, shutdown (клиент + группа)
│   │   │   ├── groups.py   # POST /kiosk-api/groups (создать группу)
│   │   │   └── schema_*.py # Тела запросов
│   │   └── services/connection_manager.py  # get_manager() — синглтон ConnectionManager
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── monitor/                # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx         # Состояние: clients, groups, media, selectedGroupId, selectedClientId
│   │   ├── config.js       # VITE_API_URL, VITE_WS_URL, VITE_AUTH_TOKEN
│   │   ├── api/client.js   # REST: getClients, getGroups, createGroup, updateClient, openUrl, ...
│   │   ├── hooks/useWebSocket.js  # Подписка на WS, обновление clients/groups/media
│   │   └── components/
│   │       ├── GroupSidebar.jsx   # Список групп + форма «Создать группу» (+)
│   │       ├── GroupPanel.jsx     # Действия по группе (открыть URL, закрыть сайт/клиент, выключить)
│   │       ├── DeviceCard.jsx     # Карточка: превью экран+камера, меню ⋯ (URL, имя/группа, команды)
│   │       └── DeviceDetailView.jsx # Полноэкранный вид одного устройства + меню ⋯
│   ├── .env.example
│   └── Dockerfile          # Node build → nginx
│
├── docker-compose.yml      # backend (8000), monitor (3000)
├── README.md
└── AGENTS.md               # этот файл
```

---

## Как запускать

- **Локально (без Docker):**  
  1) Backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`  
  2) Monitor: `cd monitor && npm i && npm run dev` → http://localhost:5173  
  3) Client: `cd client && npm i`, в `config.json` указать `backendWsUrl`, `authToken`, затем `npm run build && npm start` (или `npm start` — он сам запускает build)

- **Docker:** из корня `docker compose up -d` → backend :8000, monitor :3000.

- **Сборка portable Windows-клиента:** `cd client && npm run build:win` → `dist-app/Kiosk App-1.0.0-portable.exe`.

---

## Важные конвенции

- **Авторизация:** один токен для всех. Backend: `AUTH_TOKEN` в `.env`. Monitor: `VITE_AUTH_TOKEN`. Client: `authToken` в `config.json`. WS: `?token=...`, REST: заголовок `X-Token`. Пустой `AUTH_TOKEN` отключает проверку.
- **Идентификация клиента:** постоянный `device_id` (UUID в `userData/device_id.json`). При реконнекте бэкенд находит того же клиента по `device_id` и не создаёт дубликат.
- **Отображение имени:** в мониторе показывается `display_name` (если задан с монитора) или `hostname`. Меняется через PATCH `/kiosk-api/clients/:id` и меню «Имя / группа» на карточке.

---

## Где что править

| Задача | Где смотреть |
|--------|----------------|
| Команды с монитора (open_url, close_site и т.д.) | `backend/app/routers/commands.py`, `monitor/src/api/client.js` |
| Логика регистрации и реконнекта клиента | `backend/app/websocket/handlers.py`, `backend/app/state/registry.py`, `client/js/websocket.js` |
| Захват экрана на клиенте | `client/main.js` (IPC get-screen-source-id), `client/js/capture.js` (desktopCapturer → getUserMedia) |
| Экран ожидания vs полноэкранный сайт | `client/src/App.jsx`, `client/src/WaitingScreen.jsx`, `client/src/BrowserView.jsx` (onOpenUrl/onCloseSite, showBrowser) |
| Разблокировка по паролю | `client/main.js` (globalShortcut, unlock window), `client/unlock.html`, `client/config.json` (unlockPassword, unlockShortcut) |
| Группы (создание, список, действия по группе) | `backend/app/state/groups.py`, `backend/app/routers/groups.py`, `monitor/src/components/GroupSidebar.jsx`, `GroupPanel.jsx` |
| UI карточек и меню ⋯ | `monitor/src/components/DeviceCard.jsx`, `DeviceDetailView.jsx` |

---

## Заметки для быстрого контекста (другие чаты)

Копируй в новый чат, чтобы быстро восстановить контекст:

```
Проект: kiosk-app — система мониторинга киосков.

Три части:
- client/ — Electron + React + Vite + Tailwind, kiosk, WebSocket к бэкенду, передаёт экран/камеру/звук, выполняет команды (open_url, close_site, close_app, shutdown). Конфиг: config.json. Запуск: npm run build && electron . или npm start. Разблокировка: CommandOrControl+Alt+L + пароль в config.
- backend/ — FastAPI, WebSocket /kiosk-api/ws/client и /kiosk-api/ws/monitor, REST /kiosk-api/clients, /kiosk-api/groups, команды по клиенту и группе. Токен в .env AUTH_TOKEN. Клиенты с постоянным device_id, реконнект без дубликатов.
- monitor/ — React+Vite+Tailwind, дашборд устройств и групп, меню ⋯ на карточке (URL, имя/группа, команды), полноэкранный вид устройства, создание групп в сайдбаре.

Запуск: backend — uvicorn app.main:app; monitor — npm run dev; client — npm start. Docker: docker compose up. Portable Win: client npm run build:win.
```

---

*Последнее обновление: по структуре репозитория и коду на момент создания AGENTS.md.*
