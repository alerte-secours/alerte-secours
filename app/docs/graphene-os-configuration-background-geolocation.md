# Alerte-Secours sur GrapheneOS — configuration spécifique (Google Play services)

Ce guide couvre **uniquement** le point spécifique à **GrapheneOS** qui peut bloquer la localisation/motion en arrière-plan : les **permissions de Google Play services** (sandboxé comme une app normale).

## Pourquoi c’est nécessaire sur GrapheneOS
Sur GrapheneOS, **Google Play services n’a pas de privilèges système**. Si Alerte-Secours (via `react-native-background-geolocation`) utilise les APIs Google (ex. Fused Location / Activity Recognition), alors **Google Play services doit avoir ses propres permissions**, sinon la détection de mouvement et/ou la collecte de localisation peut ne pas fonctionner en arrière-plan.

## Étapes

### 1) Vérifier que Sandboxed Google Play est installé (même profil)
Dans le **même profil utilisateur** que l’app :
- Google Play services
- Google Play Store
- (optionnel) Google Services Framework

### 2) Accorder les permissions à **Google Play services**
Réglages → Apps → **Google Play services** → Permissions

Activer / autoriser :
- **Localisation**
- **Activité physique** (Activity recognition)
- **Capteurs** (Sensors)
- **Réseau** (Network)

Puis : Réglages → Apps → **Google Play services** → Batterie
- **Unrestricted**

> Conseil : fais la même chose pour **Google Play Store** (au minimum Réseau), même si le point bloquant est généralement Play services.

## Note : “Exploit protection compatibility mode”
En général, **inutile** pour un problème de tracking/motion : ce mode sert surtout à améliorer la compatibilité d’apps qui **crashent** à cause de protections mémoire. L’activer réduit la sécurité et ne devrait être utilisé que si l’app ne fonctionne pas autrement.

