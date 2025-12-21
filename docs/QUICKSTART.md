# Hatvoni Management System - Quick Start Guide

This guide will help you get started with the Hatvoni management system quickly.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/debanga-r-hazarika/Hope.git
cd Hope
```

2. That's it! No external dependencies needed.

## First Steps

### Run the Demo

See the system in action:

```bash
python3 examples/demo.py
```

This will:
- Create sample team members
- Create a sample project
- Add milestones
- Create and assign tasks
- Display a summary

### Use the CLI

Try the command-line interface:

```bash
# View help
python3 hatvoni_cli.py --help

# List existing projects (from demo)
python3 hatvoni_cli.py project list

# List team members
python3 hatvoni_cli.py team list

# List tasks
python3 hatvoni_cli.py task list
```

## Common Tasks

### Create Your First Project

```bash
python3 hatvoni_cli.py project add proj001 "My First Project" "A test project"
```

### Add Team Members

```bash
python3 hatvoni_cli.py team add dev001 "John Doe" "john@example.com" --role developer
python3 hatvoni_cli.py team add pm001 "Jane Smith" "jane@example.com" --role project_manager
```

### Create and Assign Tasks

```bash
# Create a task
python3 hatvoni_cli.py task add task001 "Setup development environment" "Install all required tools" proj001

# Assign it to a team member
python3 hatvoni_cli.py task assign task001 dev001
```

### Update Project Status

```bash
python3 hatvoni_cli.py project status proj001 active
```

## Using the Python API

Create a simple script:

```python
#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from hatvoni import Project, ProjectTracker

# Initialize the tracker
tracker = ProjectTracker()

# Create a project
project = Project(
    "my_project",
    "Website Development",
    "Build a new company website",
    "active"
)

# Add it to the tracker
tracker.add_project(project)

# Add a milestone
tracker.add_milestone("my_project", "Complete design phase")

# List all projects
for p in tracker.list_projects():
    print(f"{p.name}: {p.status}")
```

## Next Steps

- Read the [API Documentation](docs/API.md) for detailed reference
- Check [Configuration](docs/CONFIGURATION.md) for customization options
- Explore the source code in the `hatvoni/` directory

## Getting Help

- Check the main [README.md](../README.md)
- Review code examples in `examples/`
- Open an issue on GitHub for bugs or questions

## Tips

1. **Data Persistence**: All data is automatically saved to JSON files in the `data/` directory
2. **Backup**: Simply copy the `data/` directory to backup your projects, tasks, and team data
3. **Reset**: Delete files in `data/` to start fresh (they'll be recreated automatically)
4. **Integration**: Import the `hatvoni` module in your own Python scripts for custom workflows
