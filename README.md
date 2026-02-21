# Kiosk Monitoring System

Система мониторинга и управления киосками: клиент (Electron), бэкенд (FastAPI), веб-монитор (React).

## Структура

- **client** — Electron-приложение (kiosk): полный экран, WebSocket к бэкенду, передача экрана/камеры/звука, выполнение команд.
- **backend** — FastAPI: WebSocket для клиентов и монитора, REST API команд, группы, авторизация по токену.
- **monitor** — React + Vite + Tailwind: просмотр устройств, группы, управление (открыть URL, закрыть сайт/клиент, выключить ПК).

## Быстрый старт

### 1. Бэкенд

```bash
cd backend
cp .env.example .env
# Отредактируйте .env: AUTH_TOKEN=ваш-токен
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Монитор

```bash
cd monitor
cp .env.example .env
# В .env: VITE_AUTH_TOKEN=тот-же-токен, VITE_API_URL=http://localhost:8000, VITE_WS_URL=ws://localhost:8000/ws/monitor
npm install
npm run dev
```

Откройте http://localhost:5173 (монитор).

### 3. Клиент (Electron)

```bash
cd client
# Скопируйте config.example.json в config.json и укажите backendWsUrl (ws://IP:8000/ws/client) и authToken
npm install
npm start
```

На клиенте приложение откроется в полноэкранном kiosk-режиме, подключится к бэкенду и будет ждать команд. В мониторе можно открыть URL на клиенте, закрыть сайт, закрыть приложение или отправить команду на выключение ПК.

### Разблокировка клиента

На клиенте настроена комбинация клавиш для временной разблокировки (выход из kiosk) и обратной блокировки. В `config.json` укажите:
- **unlockPassword** — пароль для разблокировки (если пусто, разблокировка без пароля).
- **unlockShortcut** — комбинация (по умолчанию `CommandOrControl+Alt+L`: Ctrl+Alt+L на Windows/Linux, Cmd+Option+L на macOS).

Поведение: в заблокированном режиме по комбинации открывается окно ввода пароля; после верного пароля клиент выходит из полноэкранного kiosk-режима. Повторное нажатие той же комбинации снова блокирует клиент (без пароля).

## Docker

```bash
# В корне проекта
cp backend/.env.example backend/.env
# Задайте AUTH_TOKEN в backend/.env

docker compose up -d
```

- Бэкенд: http://localhost:8000  
- Монитор: http://localhost:3000  

Переменные для монитора (VITE_*) задаются на этапе сборки. По умолчанию в образе подставлены `http://localhost:8000` и `ws://localhost:8000/ws/monitor`. Чтобы подставить свои URL при сборке:

```bash
docker compose build monitor --build-arg VITE_API_URL=http://your-backend:8000 --build-arg VITE_WS_URL=ws://your-backend:8000/ws/monitor --build-arg VITE_AUTH_TOKEN=your-token
```

## Авторизация

Во всех компонентах используется один токен, задаётся в:

- **backend**: `.env` → `AUTH_TOKEN`
- **monitor**: `.env` → `VITE_AUTH_TOKEN`
- **client**: `config.json` → `authToken` (или переменные окружения)

Если `AUTH_TOKEN` на бэкенде пустой, проверка токена отключена (только для разработки).

## Группы

Клиент может указать `group_id` в конфиге при подключении. В мониторе можно выбрать группу и выполнять действия сразу для всех устройств в группе (открыть URL, закрыть сайт, закрыть клиент, выключить ПК). Группы создаются при первом подключении клиента с данным `group_id` или через API `POST /api/groups`.

## Сборка клиента (portable Windows)

```bash
cd client
npm run build:win
```

Результат: `dist/Kiosk App-1.0.0-portable.exe`.
