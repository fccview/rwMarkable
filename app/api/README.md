# Checklist API Documentation

This API provides programmatic access to your checklists and notes. All endpoints require authentication via API key.

## Authentication

### Getting an API Key

1. Log into your checklist application
2. Navigate to your **Profile** (click on your username in the sidebar)
3. Go to the **Settings** tab
4. In the **API Key** section, click **Generate** to create a new API key
5. Copy the generated API key (format: `ck_` followed by random characters)
6. **Important**: Store this key securely - it provides full access to your account

### Using Your API Key

Include your API key in the request header:
```
x-api-key: ck_your_api_key_here
```

**Note**: Replace `ck_your_api_key_here` with your actual API key.

## Endpoints

### 1. Get All Checklists
**GET** `/api/checklists`

Retrieves all checklists for the authenticated user.

**Response:**
```json
{
  "checklists": [
    {
      "id": "<checklistID>",
      "title": "My Tasks",
      "category": "Work",
      "items": [
        {
          "index": 0,
          "text": "Task 1",
          "completed": false
        },
        {
          "index": 1,
          "text": "Task 2",
          "completed": true
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. Create Checklist Item
**POST** `/api/checklists/{listId}/items`

Adds a new item to the specified checklist.

**Request Body:**
```json
{
  "text": "New task to complete"
}
```

**Response:**
```json
{
  "success": true
}
```

### 3. Check Item
**PUT** `/api/checklists/{listId}/items/{itemIndex}/check`

Marks an item as completed. Use the item index (0-based) from the checklist response.

**Response:**
```json
{
  "success": true
}
```

### 4. Uncheck Item
**PUT** `/api/checklists/{listId}/items/{itemIndex}/uncheck`

Marks an item as incomplete. Use the item index (0-based) from the checklist response.

**Response:**
```json
{
  "success": true
}
```

### 5. Get All Notes
**GET** `/api/notes`

Retrieves all notes/documents for the authenticated user.

**Response:**
```json
{
  "notes": [
    {
      "id": "note-123",
      "title": "My Note",
      "category": "Personal",
      "content": "Note content here...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid or missing API key)
- `404` - Not Found (checklist/item not found)
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error message description"
}
```

## Usage Examples

### Get all checklists
```bash
curl -H "x-api-key: ck_your_api_key_here" \
     https://your-checklist-app.com/api/checklists
```

### Add item to checklist
```bash
curl -X POST \
     -H "x-api-key: ck_your_api_key_here" \
     -H "Content-Type: application/json" \
     -d '{"text": "New task"}' \
     https://your-checklist-app.com/api/checklists/<checklist_id>/items
```

### Check item (mark as completed)
```bash
curl -X PUT \
     -H "x-api-key: ck_your_api_key_here" \
     https://your-checklist-app.com/api/checklists/<checklist_id>/items/<item_index>/check
```

### Uncheck item (mark as incomplete)
```bash
curl -X PUT \
     -H "x-api-key: ck_your_api_key_here" \
     https://your-checklist-app.com/api/checklists/<checklist_id>/items/<item_index>/uncheck
```

### Get all notes
```bash
curl -H "x-api-key: ck_your_api_key_here" \
     https://your-checklist-app.com/api/notes
```

## Important Notes

- Item indices are 0-based (first item is index 0)
- All timestamps are in ISO 8601 format
- API keys are permanent and do not expire
- Only items owned by the authenticated user are accessible
- This is a beta implementation - additional features will be added in future updates
