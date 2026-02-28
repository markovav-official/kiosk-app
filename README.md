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

## NixOS (киоск) — развёртывание одним файлом без клона репозитория

На целевой машине с NixOS **не нужно клонировать репозиторий**. Достаточно одного файла — Nix подтянет приложение по URL при сборке; исходники не оказываются в домашнем каталоге или в `/opt`, только в store.

1. Скопируйте на целевую машину **только** файл `deploy/flake.nix` (например в `/etc/nixos/flake.nix`).
2. Отредактируйте в нём:
   - `inputs.kiosk-app.url` — URL вашего репозитория (например `github:YOUR_ORG/kiosk-app` или тег `?ref=refs/tags/v1.0.0`);
   - `networking.hostName`, `kiosk.backendWsUrl`, `kiosk.authToken`, `kiosk.wifi.*` и т.д.
3. На целевой машине выполните:
   ```bash
   cd /etc/nixos   # или каталог, куда положили flake.nix
   sudo nixos-rebuild switch --flake .#kiosk
   sudo reboot
   ```

После загрузки LightDM автоматически войдёт под пользователем `kiosk`, поднимется графическая сессия, и в ней запустится приложение (systemd user service с корректным `DISPLAY`). Wi‑Fi при необходимости настраивается через опции `kiosk.wifi`.

**Приватный репозиторий:** в `deploy/flake.nix` укажите URL по SSH: `git+ssh://git@github.com/ORG/kiosk-app.git?ref=main`. Nix будет клонировать репо через `git` по SSH; на целевой машине должен быть настроен SSH-ключ с доступом к репо (деплой-ключ в настройках репо или ключ пользователя в GitHub/GitLab). Токен в конфиг класть не нужно.

**Без доступа к репо с целевой машины:** соберите пакет в CI (с секретом), залейте closure в binary cache; в flake на целевой машине укажите этот cache — киоск будет только скачивать готовый образ.

## Сборка клиента (portable Windows)

```bash
cd client
npm run build:win
```

Результат: `dist/Kiosk App-1.0.0-portable.exe`.
