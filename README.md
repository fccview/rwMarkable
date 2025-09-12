# rwMarkable

<p align="center">
  <a href="https://www.buymeacoffee.com/fccview">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy me a coffee" width="150">
  </a>
</p>

A simple, self-hosted app for your checklists and notes.

Tired of bloated, cloud-based to-do apps? `rwMarkable` is a lightweight alternative for managing your personal checklists and notes. It's built with Next.js 14, is easy to deploy, and keeps all your data on your own server.

<div align="center">
  <p align="center">
    <em>Clean, intuitive interface for managing your checklists and tasks.</em>
  </p>
  <img src="public/app-screenshots/checklist-home.png" alt="Checklist Home View" width="400" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

  <p align="center">
    <em>Heavily customisable themes.</em>
  </p>
  <img src="public/app-screenshots/checklist-theme.png" alt="Checklist with Theme" width="400" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 0 8px;">

  <p align="center">
    <em>Rich text editor for notes and beautiful theme customization.</em>
  </p>
  <img src="public/app-screenshots/document-view.png" alt="Note Editor" width="400" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 0 8px;">
</div>

## Features

- **Checklists:** Create task lists with drag & drop reordering, progress bars, and categories.
- **Rich Text Notes:** A clean WYSIWYG editor for your notes, powered by TipTap with full Markdown support.
- **Simple Sharing:** Share checklists or notes with other users on your instance.
- **File-Based:** No database needed! Everything is stored in simple Markdown and JSON files in a single data directory.
- **User Management:** An admin panel to create and manage user accounts.
- **Customisable:** Plenty of themes to make it your own.
- **API Access:** Programmatic access to your checklists and notes via REST API.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Editor:** TipTap
- **Drag & Drop:** @dnd-kit
- **Deployment:** Docker

## API

`rwMarkable` includes a REST API for programmatic access to your checklists and notes. This is perfect for:

- **Automation:** Create tasks from external systems
- **Integrations:** Connect with other tools and services
- **Scripts:** Automate repetitive tasks
- **Dashboards:** Build custom interfaces

📖 **For the complete API documentation, see [app/api/README.md](app/api/README.md)**

## Getting Started

The recommended way to run `rwMarkable` is with Docker.

### Docker Compose (Recommended)

1.  Create a `docker-compose.yml` file:

    ```yaml
    services:
      app:
        image: ghcr.io/fccview/rwmarkable:main
        container_name: rwmarkable
        # Use a non-root user for better security.
        # If you haven't previously, create the user on your host with: sudo useradd -u 1000 rwmarkable
        user: "1000:1000"
        ports:
          # Mapping port 1122 for this as port 3000 is a very common one. Feel free to change it.
          - "1122:3000"
        volumes:
          # Mount your local data directory into the container.
          - ./data:/app/data:rw
          # Mount your custom themes/emojis within the config folder.
          - ./config:/app/config:ro
        restart: unless-stopped
        environment:
          - NODE_ENV=production
        init: true
    ```

2.  Create the data directory and set permissions:

    ```bash
    mkdir data
    sudo chown -R 1000:1000 data/
    ```

3.  Start the container:

    ```bash
    docker-compose up -d
    ```

The application will be available at `http://localhost:1122`.

### Initial Setup

On your first visit, you'll be redirected to `/auth/setup` to create your admin account. Once that's done, you're ready to go!

### Local Development (Without Docker)

If you want to run the app locally for development:

1.  **Clone & Install:**
    ```bash
    git clone <repository-url>
    cd checklist
    yarn install
    ```
2.  **Run Dev Server:**
    ```bash
    yarn dev
    ```
    The app will be running at `http://localhost:3000`.

## Data Storage

`rwMarkable` uses a simple file-based storage system inside the `data/` directory.

- `data/checklists/`: Stores all checklists as `.md` files.
- `data/notes/`: Stores all notes as `.md` files.
- `data/users/`: Contains `users.json` and `sessions.json`.
- `data/sharing/`: Contains `shared-items.json`.

**Make sure you back up the `data` directory!**

## Updating

### Docker Compose

Pull the latest image and restart your container.

```bash
docker-compose pull
docker-compose up -d
```

### Manual

If you're running from source, pull the latest changes and rebuild.

```bash
git pull
yarn install
yarn build
yarn start
```

## Custom Themes and Emojis

You can easily add custom themes and emojis by creating configuration files in a `config/` directory. These will be automatically loaded and merged with the built-in themes and emojis.

### Custom Themes

Create `config/themes.json` with your custom themes:

```json
{
  "custom-themes": {
    "my-theme": {
      "name": "My Custom Theme",
      "icon": "Palette",
      "colors": {
        "--background": "255 255 255",
        "--background-secondary": "249 250 251",
        "--foreground": "20 20 20",
        "--primary": "37 99 235",
        "--primary-foreground": "255 255 255",
        "--secondary": "241 245 249",
        "--secondary-foreground": "20 20 20",
        "--muted": "241 245 249",
        "--muted-foreground": "100 116 139",
        "--accent": "241 245 249",
        "--accent-foreground": "20 20 20",
        "--destructive": "239 68 68",
        "--destructive-foreground": "255 255 255",
        "--border": "226 232 240",
        "--input": "226 232 240",
        "--ring": "37 99 235"
      }
    }
  }
}
```

**Required color variables:**

- `--background`, `--background-secondary`, `--foreground`
- `--card`, `--card-foreground`, `--popover`, `--popover-foreground`
- `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`

### Custom Emojis

Create `config/emojis.json` with your custom emojis:

```json
{
  "custom-emojis": {
    "meeting": "🤝",
    "deadline": "⏰",
    "project": "📋",
    "deploy": "🚀",
    "bug": "🐛",
    "feature": "✨"
  }
}
```

When you type checklist items containing these words, the custom emojis will automatically appear.

### Available Icons

For themes, you can use these icon names: `Sun`, `Moon`, `Sunset`, `Waves`, `Trees`, `CloudMoon`, `Palette`, `Terminal`, `Github`, `Monitor`, `Coffee`, `Flower2`, `Flame`, `Palmtree`, `Building`. If no icon is specified, a default will be chosen based on the theme name.

### Configuration Validation

The app validates your configuration files and will show warnings in the console if there are any format errors. Invalid configs will be ignored and the app will continue working with built-in themes and emojis.

### Docker Setup for Custom Configs

Update your `docker-compose.yml` to include the config volume:

```yaml
services:
  app:
    image: ghcr.io/fccview/rwmarkable:main
    container_name: rwmarkable
    user: "1000:1000"
    ports:
      - "1122:3000"
    volumes:
      - ./data:/app/data:rw
      - ./config:/app/config:ro
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - HTTPS=false
    init: true
```

**Important:** Make sure your local `config/` directory has the correct permissions:

```bash
mkdir -p config
chown -R 1000:1000 config/
chmod -R 755 config/
```
