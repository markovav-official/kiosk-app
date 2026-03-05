# =============================================================================
# Kiosk NixOS — один файл для целевой машины (репозиторий не клонируется)
# =============================================================================
#
# Как использовать:
#   1. Скопируйте ЭТОТ файл на целевую машину, например в /etc/nixos/flake.nix
#   2. Отредактируйте ниже: inputs.kiosk-app.url и опции kiosk.*
#   3. На целевой машине: sudo nixos-rebuild switch --flake .#kiosk
#   4. Перезагрузка: sudo reboot
#
#   Вариант без доступа к репо с целевой машины: соберите пакет в CI (с секретом),
#   залейте closure в binary cache; в этом flake укажите только cache — целевая
#   машина будет качать готовый образ, не обращаясь к git.
#
# =============================================================================

{
  description = "Kiosk NixOS — single deploy file, app fetched by URL";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    kiosk-app.url = "git@github.com:markovav-official/kiosk-app.git?ref=main";
  };

  outputs = { self, nixpkgs, kiosk-app }: {
    nixosConfigurations.kiosk = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      specialArgs = { kioskFlake = kiosk-app; };
      modules = [
        kiosk-app.nixosModules.kiosk
        ({ config, pkgs, kioskFlake, ... }: {
          networking.hostName = "kiosk";

          kiosk.enable = true;
          kiosk.package = kioskFlake.packages.${pkgs.system}.default;
          kiosk.user = "kiosk";

          kiosk.backendWsUrl = "ws://192.168.1.100:8000/kiosk-api/ws/client";
          kiosk.authToken = "your-secret-token";
          kiosk.groupId = "";
          kiosk.unlockPassword = "admin";
          kiosk.unlockShortcut = "CommandOrControl+Alt+L";

          kiosk.wifi.enable = true;
          kiosk.wifi.ssid = "MyKioskNetwork";
          kiosk.wifi.password = "your-wifi-password";
        })
      ];
    };
  };
}
