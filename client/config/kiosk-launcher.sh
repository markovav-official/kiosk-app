#!/usr/bin/env bash
#
# Kiosk launcher: держит Wi‑Fi подключение и при необходимости перезапускает приложение.
#
# Запуск при старте системы (рекомендуется — systemd):
#   Скопируйте kiosk-launcher.service в /etc/systemd/system/, настройте пути и переменные,
#   затем: systemctl daemon-reload && systemctl enable --now kiosk-launcher
#   При падении скрипта systemd автоматически перезапустит его (Restart=always).
#
# Альтернатива — cron @reboot (скрипт с бесконечным циклом):
#   crontab -e → добавить строку:
#   @reboot /полный/путь/kiosk-launcher.sh >> /var/log/kiosk-launcher.log 2>&1
#   Минус: если скрипт упадёт, перезапуска не будет. Лучше использовать systemd.
#
# Требования: Linux, NetworkManager (nmcli), Node.js (если запуск через npm).
#

set -e

# ============== НАСТРОЙКИ WI-FI ==============
# Обычная сеть (WPA2-PSK): укажите SSID и пароль.
# Для WPA-Enterprise добавьте WIFI_IDENTITY (логин).
readonly WIFI_SSID="${WIFI_SSID:-MyKioskNetwork}"
readonly WIFI_PASSWORD="${WIFI_PASSWORD:-}"
# Для WPA-Enterprise (EAP): раскомментируйте и задайте логин
# readonly WIFI_IDENTITY="${WIFI_IDENTITY:-}"

# Интервал проверки Wi‑Fi и приложения (секунды)
readonly CHECK_INTERVAL="${CHECK_INTERVAL:-15}"

# ============== НАСТРОЙКИ ПРИЛОЖЕНИЯ ==============
# Каталог, из которого запускать клиент (где package.json и main.js)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly APP_DIR="${APP_DIR:-$SCRIPT_DIR}"
# Команда запуска: "npm" — из исходников (npm start), "appimage" или путь к бинарнику
readonly LAUNCH_MODE="${LAUNCH_MODE:-npm}"
# Путь к AppImage или исполняемому файлу (если LAUNCH_MODE=appimage или LAUNCH_MODE=path)
readonly APP_IMAGE_PATH="${APP_IMAGE_PATH:-$APP_DIR/dist-app/Kiosk App-1.0.0.AppImage}"

# Имя процесса для проверки «приложение запущено»
# npm: node+electron; AppImage: обычно содержит "Kiosk" или "electron"
readonly PROCESS_MARKER="${PROCESS_MARKER:-Kiosk App}"

# Лог (по желанию раскомментируйте и укажите путь)
# readonly LOG_FILE="${LOG_FILE:-/var/log/kiosk-launcher.log}"
readonly LOG_FILE="${LOG_FILE:-}"

# ============== Служебные функции ==============

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  if [[ -n "$LOG_FILE" ]]; then
    echo "$msg" >> "$LOG_FILE"
  fi
  echo "$msg"
}

# Подключение к Wi‑Fi через NetworkManager
connect_wifi() {
  if ! command -v nmcli &>/dev/null; then
    log "nmcli не найден. Установите NetworkManager."
    return 1
  fi

  local conn_name="kiosk-wifi-${WIFI_SSID//[^a-zA-Z0-9]/-}"
  conn_name="${conn_name:0:50}"

  # Уже подключены к нужной сети?
  local active_ssid
  active_ssid=$(nmcli -t -f active,ssid dev wifi | grep '^yes:' | cut -d: -f2 | head -1)
  if [[ "$active_ssid" == "$WIFI_SSID" ]]; then
    return 0
  fi

  # Есть ли сохранённое подключение
  if nmcli connection show "$conn_name" &>/dev/null; then
    log "Подключаемся к Wi‑Fi: $WIFI_SSID (существующий профиль)"
    nmcli connection up "$conn_name" 2>/dev/null && return 0
  fi

  if [[ -z "$WIFI_PASSWORD" ]]; then
    log "WIFI_PASSWORD не задан. Задайте в начале скрипта или через env."
    return 1
  fi

  # Создаём и подключаем (WPA2-PSK)
  log "Создаём профиль и подключаемся к Wi‑Fi: $WIFI_SSID"
  nmcli connection delete "$conn_name" 2>/dev/null || true
  if [[ -n "${WIFI_IDENTITY:-}" ]]; then
    nmcli connection add type wifi con-name "$conn_name" ssid "$WIFI_SSID" \
      wifi-sec.key-mgmt wpa-eap 802-1x.eap peap 802-1x.phase2-auth mschapv2 \
      802-1x.identity "$WIFI_IDENTITY" 802-1x.password "$WIFI_PASSWORD" 2>/dev/null || true
  else
    nmcli connection add type wifi con-name "$conn_name" ssid "$WIFI_SSID" \
      wifi-sec.psk "$WIFI_PASSWORD" wifi-sec.key-mgmt wpa-psk 2>/dev/null || true
  fi
  nmcli connection up "$conn_name"
}

# Проверка: запущено ли приложение
is_app_running() {
  if pgrep -f "$PROCESS_MARKER" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

# Запуск приложения в фоне (без ожидания)
start_app() {
  if is_app_running; then
    return 0
  fi

  log "Запуск приложения..."
  cd "$APP_DIR" || exit 1

  case "$LAUNCH_MODE" in
    npm)
      # Запуск из исходников (build + electron)
      nohup npm start >> "${LOG_FILE:-/dev/null}" 2>&1 &
      ;;
    appimage|path)
      if [[ -x "$APP_IMAGE_PATH" ]]; then
        nohup "$APP_IMAGE_PATH" >> "${LOG_FILE:-/dev/null}" 2>&1 &
      else
        log "Исполняемый файл не найден или не исполняемый: $APP_IMAGE_PATH"
        return 1
      fi
      ;;
    *)
      log "Неизвестный LAUNCH_MODE: $LAUNCH_MODE (npm | appimage | path)"
      return 1
      ;;
  esac

  # Даём процессу подняться
  sleep 3
  if is_app_running; then
    log "Приложение запущено."
    return 0
  fi
  log "Предупреждение: процесс мог не стартовать. Проверьте логи."
  return 0
}

# ============== Основной цикл ==============

main_loop() {
  log "Kiosk launcher стартовал. APP_DIR=$APP_DIR LAUNCH_MODE=$LAUNCH_MODE"
  log "Wi‑Fi: SSID=$WIFI_SSID CHECK_INTERVAL=${CHECK_INTERVAL}s"

  while true; do
    # 1) Wi‑Fi
    if ! connect_wifi; then
      log "Не удалось подключиться к Wi‑Fi. Повтор через ${CHECK_INTERVAL}s."
    fi

    # 2) Приложение
    if ! is_app_running; then
      start_app
    fi

    sleep "$CHECK_INTERVAL"
  done
}

# Точка входа
main_loop
