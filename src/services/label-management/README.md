# System Zarządzania Etykietami (Label Management System)

## Przegląd

System Zarządzania Etykietami to zmodularyzowane rozwiązanie do tworzenia i zarządzania etykietami w aplikacji Label. System został zaprojektowany w celu wyeliminowania problemów z duplikacją etykiet i zapewnienia jednolitego API do wszystkich operacji tworzenia etykiet.

## Architektura

### Struktura Folderów

```
src/services/label-management/
├── README.md                    # Ta dokumentacja
├── labelCreationService.ts      # Centralny serwis tworzenia etykiet
└── utilities/
    └── labelNaming.ts          # Utilities do automatycznego nazewnictwa
```

### Główne Komponenty

#### 1. LabelCreationService (`labelCreationService.ts`)

Centralny serwis odpowiedzialny za wszystkie operacje tworzenia etykiet.

##### Główne Funkcje:

- **`createLabel(projectId: string, userId: string, data?: CreateLabelRequest)`**
  - Tworzy nową etykietę z automatycznym nazewnictwem
  - Zapewnia unikalność nazw w ramach projektu
  - Zwraca standaryzowaną odpowiedź

- **`duplicateLabel(labelId: string, userId: string)`**
  - Duplikuje istniejącą etykietę
  - Automatycznie generuje nazwę kopii (np. "Label 1 Copy")
  - Zachowuje wszystkie właściwości oryginału

- **`createFromTemplate(projectId: string, userId: string, templateData: TemplateRequest)`**
  - Tworzy etykietę na podstawie szablonu
  - Pozwala na predefiniowane wymiary i konfigurację

- **`createBulkLabels(projectId: string, userId: string, count: number, baseData?: CreateLabelRequest)`**
  - Tworzy wiele etykiet jednocześnie
  - Automatycznie numeruje etykiety (np. "Label 1", "Label 2", ...)
  - Optymalizuje operacje bazodanowe

##### Interfejsy:

```typescript
interface CreateLabelRequest {
  name?: string;
  description?: string;
  width?: number;
  height?: number;
  fabricData?: unknown;
  thumbnail?: string;
}

interface CreateLabelResponse {
  id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  fabricData?: unknown;
  thumbnail?: string;
}
```

#### 2. Label Naming Utilities (`utilities/labelNaming.ts`)

Utilities odpowiedzialne za inteligentne generowanie nazw etykiet.

##### Główne Funkcje:

- **`generateUniqueLabel(projectId: string)`**
  - Generuje unikalną nazwę etykiety w ramach projektu
  - Format: "New Label X" gdzie X to następny dostępny numer

- **`generateCopyName(originalName: string, existingLabels: LabelForNaming[])`**
  - Generuje nazwę dla kopii etykiety
  - Obsługuje wielokrotne kopiowanie (Copy, Copy 2, Copy 3, ...)

## API Endpoints

System udostępnia następujące endpointy przez router `/api/label-management`:

### Tworzenie Etykiet

```http
POST /api/label-management/projects/:projectId/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Optional custom name",
  "description": "Optional description",
  "width": 100,
  "height": 50
}
```

**Odpowiedź:**
```json
{
  "success": true,
  "message": "Label created successfully",
  "data": {
    "id": "label-uuid",
    "name": "New Label 1",
    "width": 100,
    "height": 50,
    "projectId": "project-uuid",
    "createdAt": "2025-07-23T18:49:10.000Z",
    "updatedAt": "2025-07-23T18:49:10.000Z"
  }
}
```

### Duplikowanie Etykiet

```http
POST /api/label-management/labels/:labelId/duplicate
Authorization: Bearer <token>
```

**Odpowiedź:**
```json
{
  "success": true,
  "message": "Label duplicated successfully",
  "data": {
    "id": "new-label-uuid",
    "name": "Original Label Copy",
    "width": 100,
    "height": 50,
    "projectId": "project-uuid",
    "createdAt": "2025-07-23T18:49:10.000Z",
    "updatedAt": "2025-07-23T18:49:10.000Z"
  }
}
```

### Tworzenie z Szablonu

```http
POST /api/label-management/projects/:projectId/create-from-template
Content-Type: application/json
Authorization: Bearer <token>

{
  "width": 210,
  "height": 297,
  "templateName": "A4 Label"
}
```

### Masowe Tworzenie

```http
POST /api/label-management/projects/:projectId/bulk-create
Content-Type: application/json
Authorization: Bearer <token>

{
  "count": 5,
  "width": 100,
  "height": 50,
  "description": "Bulk created labels"
}
```

## Obsługa Błędów

System implementuje jednolite obsługiwanie błędów:

- **400 Bad Request** - Nieprawidłowe dane wejściowe
- **401 Unauthorized** - Brak autoryzacji
- **403 Forbidden** - Brak uprawnień do projektu
- **404 Not Found** - Projekt lub etykieta nie istnieje
- **500 Internal Server Error** - Błąd serwera

Przykład odpowiedzi błędu:
```json
{
  "success": false,
  "message": "Project not found or access denied"
}
```

## Bezpieczeństwo

- Wszystkie endpointy wymagają autentykacji JWT
- Weryfikacja uprawnień użytkownika do projektów
- Walidacja danych wejściowych przy użyciu Joi
- Sanitizacja parametrów URL

## Integracja z Frontend

System integruje się z frontendem przez:

1. **LabelManagementService** - Serwis komunikacji z API
2. **useLabelManagement** - React Hook dla operacji na etykietach
3. **CreateLabelButton** - Komponent UI do tworzenia etykiet

## Migracja ze Starego Systemu

Stary system tworzenia etykiet (`POST /api/projects/:projectId/labels`) nadal istnieje dla kompatybilności wstecznej, ale jest zalecane przejście na nowy system.

### Różnice:

| Stary System | Nowy System |
|-------------|-------------|
| Brak automatycznego nazewnictwa | Inteligentne generowanie nazw |
| Problemy z duplikatami | Gwarantowana unikalność |
| Rozproszony kod | Centralizowany serwis |
| Podstawowa walidacja | Rozszerzona walidacja |
| `/api/projects/:id/labels` | `/api/label-management/projects/:id/create` |

## Przyszłe Rozszerzenia

System został zaprojektowany z myślą o rozszerzalności:

- Wsparcie dla kategorii etykiet
- Szablony etykiet
- Import/Export etykiet
- Wersjonowanie etykiet
- Współdzielenie etykiet między projektami

## Testowanie

System można testować używając curl lub narzędzi API:

```bash
# Test tworzenia etykiety
curl -X POST http://localhost:3001/api/label-management/projects/PROJECT_ID/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"width": 100, "height": 50}'

# Test duplikowania
curl -X POST http://localhost:3001/api/label-management/labels/LABEL_ID/duplicate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Logowanie i Monitoring

System loguje wszystkie operacje z odpowiednimi poziomami:

- INFO: Udane operacje tworzenia/duplikowania
- WARN: Próby dostępu do nieistniejących zasobów
- ERROR: Błędy systemu i bazy danych

## Wsparcie

W przypadku problemów z systemem, sprawdź:

1. Logi aplikacji w konsoli
2. Status bazy danych
3. Poprawność tokenów autoryzacji
4. Istnienie projektów i etykiet

---

*Ostatnia aktualizacja: 23 lipca 2025*
