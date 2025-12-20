# Hatvoni Management System

A comprehensive project management system for tracking projects, tasks, and team members.

## Overview

Hatvoni is a lightweight, file-based management system designed to help teams organize and track their projects effectively. It provides three main components:

- **Project Tracker**: Manage projects, their status, and milestones
- **Task Manager**: Create and assign tasks, track their progress
- **Team Manager**: Maintain team member information and skills

## Features

- ✅ Project management with status tracking
- ✅ Task assignment and prioritization
- ✅ Team member profiles with skills tracking
- ✅ Milestone tracking for projects
- ✅ JSON-based data persistence
- ✅ Command-line interface
- ✅ Python API for programmatic access

## Installation

1. Clone the repository:
```bash
git clone https://github.com/debanga-r-hazarika/Hope.git
cd Hope
```

2. No additional dependencies required - uses only Python standard library!

## Usage

### Command Line Interface

The system provides a CLI for quick operations:

```bash
# Add a project
python hatvoni_cli.py project add p001 "My Project" "Project description"

# List all projects
python hatvoni_cli.py project list

# Update project status
python hatvoni_cli.py project status p001 active

# Add a team member
python hatvoni_cli.py team add m001 "John Doe" "john@example.com" --role developer

# List team members
python hatvoni_cli.py team list

# Add a task
python hatvoni_cli.py task add t001 "Task title" "Task description" p001

# List tasks
python hatvoni_cli.py task list

# Assign a task
python hatvoni_cli.py task assign t001 m001
```

### Programmatic Usage

You can also use the system programmatically in your Python scripts:

```python
from hatvoni import Project, ProjectTracker, Task, TaskManager, TeamMember, TeamManager

# Initialize managers
project_tracker = ProjectTracker()
task_manager = TaskManager()
team_manager = TeamManager()

# Create a project
project = Project("p001", "My Project", "Description", "active")
project_tracker.add_project(project)

# Add a team member
member = TeamMember("m001", "John Doe", "john@example.com", "developer")
team_manager.add_member(member)

# Create and assign a task
task = Task("t001", "Implement feature", "Description", "p001")
task_manager.add_task(task)
task_manager.assign_task("t001", "m001")
```

### Running the Demo

See the system in action with the example demo:

```bash
python examples/demo.py
```

## Project Structure

```
Hope/
├── hatvoni/                    # Main package
│   ├── __init__.py            # Package initialization
│   ├── project_tracker.py     # Project management module
│   ├── task_manager.py        # Task management module
│   └── team_manager.py        # Team management module
├── examples/                   # Example scripts
│   └── demo.py                # Demo script
├── hatvoni_cli.py             # Command-line interface
├── data/                      # Data directory (auto-created)
│   ├── projects.json          # Projects data
│   ├── tasks.json             # Tasks data
│   └── team.json              # Team members data
└── README.md                  # This file
```

## Data Storage

All data is stored in JSON format in the `data/` directory:

- `projects.json`: Project information and milestones
- `tasks.json`: Task details and assignments
- `team.json`: Team member profiles and skills

## Project Statuses

Projects can have the following statuses:
- `planning`: Initial planning phase
- `active`: Currently in progress
- `on_hold`: Temporarily paused
- `completed`: Finished
- `cancelled`: Discontinued

## Task Statuses

Tasks can have the following statuses:
- `todo`: Not yet started
- `in_progress`: Currently being worked on
- `review`: Ready for review
- `completed`: Finished
- `blocked`: Blocked by dependencies

## Task Priorities

Tasks can be prioritized as:
- `low`: Low priority
- `medium`: Medium priority
- `high`: High priority
- `critical`: Critical priority

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available for use and modification.

## Contact

For questions or support, please open an issue on GitHub.