# Hatvoni System Configuration

This file contains default configuration for the Hatvoni management system.

## Data Directory

The default location for all data files.

```
DATA_DIR = "data/"
```

## File Paths

Default file paths for each data type:

```
PROJECTS_FILE = "data/projects.json"
TASKS_FILE = "data/tasks.json"
TEAM_FILE = "data/team.json"
```

## Status Options

### Project Statuses

Valid project status values:
- planning
- active
- on_hold
- completed
- cancelled

### Task Statuses

Valid task status values:
- todo
- in_progress
- review
- completed
- blocked

### Task Priorities

Valid priority levels:
- low
- medium
- high
- critical

## Team Roles

Common team roles:
- project_manager
- developer
- designer
- tester
- devops
- analyst

## Customization

To customize these settings, you can:

1. Set environment variables:
   ```bash
   export HATVONI_DATA_DIR="/custom/path/"
   ```

2. Pass custom paths when initializing managers:
   ```python
   tracker = ProjectTracker(data_file="/custom/projects.json")
   ```

3. Modify the configuration in your code before creating instances.
