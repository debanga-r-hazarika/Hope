# Hatvoni API Documentation

Complete API reference for the Hatvoni management system.

## Table of Contents

1. [Project Tracker](#project-tracker)
2. [Task Manager](#task-manager)
3. [Team Manager](#team-manager)

---

## Project Tracker

### Project Class

Represents a single project.

#### Constructor

```python
Project(project_id: str, name: str, description: str, 
        status: str = "planning", start_date: Optional[str] = None)
```

**Parameters:**
- `project_id` (str): Unique identifier for the project
- `name` (str): Project name
- `description` (str): Project description
- `status` (str): Current status (default: "planning")
- `start_date` (str, optional): Start date in YYYY-MM-DD format

#### Methods

**`to_dict() -> Dict`**
- Returns project data as a dictionary

**`from_dict(data: Dict) -> Project` (classmethod)**
- Creates a Project instance from a dictionary

### ProjectTracker Class

Manages multiple projects.

#### Constructor

```python
ProjectTracker(data_file: str = "data/projects.json")
```

**Parameters:**
- `data_file` (str): Path to the projects data file

#### Methods

**`add_project(project: Project) -> bool`**
- Adds a new project
- Returns True if successful, False if project ID already exists

**`get_project(project_id: str) -> Optional[Project]`**
- Retrieves a project by ID
- Returns the Project object or None if not found

**`update_project_status(project_id: str, status: str) -> bool`**
- Updates the status of a project
- Returns True if successful, False if project not found

**`add_milestone(project_id: str, milestone: str) -> bool`**
- Adds a milestone to a project
- Returns True if successful, False if project not found

**`list_projects() -> List[Project]`**
- Returns a list of all projects

**`get_projects_by_status(status: str) -> List[Project]`**
- Returns a list of projects with the specified status

---

## Task Manager

### Task Class

Represents a single task.

#### Constructor

```python
Task(task_id: str, title: str, description: str, project_id: str,
     assigned_to: Optional[str] = None, priority: str = "medium", 
     status: str = "todo")
```

**Parameters:**
- `task_id` (str): Unique identifier for the task
- `title` (str): Task title
- `description` (str): Task description
- `project_id` (str): ID of the associated project
- `assigned_to` (str, optional): ID of the assigned team member
- `priority` (str): Task priority (default: "medium")
- `status` (str): Task status (default: "todo")

#### Methods

**`to_dict() -> Dict`**
- Returns task data as a dictionary

**`from_dict(data: Dict) -> Task` (classmethod)**
- Creates a Task instance from a dictionary

### TaskManager Class

Manages tasks for projects.

#### Constructor

```python
TaskManager(data_file: str = "data/tasks.json")
```

**Parameters:**
- `data_file` (str): Path to the tasks data file

#### Methods

**`add_task(task: Task) -> bool`**
- Adds a new task
- Returns True if successful, False if task ID already exists

**`get_task(task_id: str) -> Optional[Task]`**
- Retrieves a task by ID
- Returns the Task object or None if not found

**`update_task_status(task_id: str, status: str) -> bool`**
- Updates the status of a task
- Returns True if successful, False if task not found

**`assign_task(task_id: str, member_id: str) -> bool`**
- Assigns a task to a team member
- Returns True if successful, False if task not found

**`list_tasks() -> List[Task]`**
- Returns a list of all tasks

**`get_tasks_by_project(project_id: str) -> List[Task]`**
- Returns all tasks for a specific project

**`get_tasks_by_assignee(member_id: str) -> List[Task]`**
- Returns all tasks assigned to a specific team member

**`get_tasks_by_status(status: str) -> List[Task]`**
- Returns all tasks with the specified status

---

## Team Manager

### TeamMember Class

Represents a team member.

#### Constructor

```python
TeamMember(member_id: str, name: str, email: str,
           role: str = "developer", skills: Optional[List[str]] = None)
```

**Parameters:**
- `member_id` (str): Unique identifier for the team member
- `name` (str): Member's name
- `email` (str): Member's email address
- `role` (str): Member's role (default: "developer")
- `skills` (List[str], optional): List of skills

#### Methods

**`to_dict() -> Dict`**
- Returns member data as a dictionary

**`from_dict(data: Dict) -> TeamMember` (classmethod)**
- Creates a TeamMember instance from a dictionary

### TeamManager Class

Manages team members.

#### Constructor

```python
TeamManager(data_file: str = "data/team.json")
```

**Parameters:**
- `data_file` (str): Path to the team members data file

#### Methods

**`add_member(member: TeamMember) -> bool`**
- Adds a new team member
- Returns True if successful, False if member ID already exists

**`get_member(member_id: str) -> Optional[TeamMember]`**
- Retrieves a team member by ID
- Returns the TeamMember object or None if not found

**`update_member_role(member_id: str, role: str) -> bool`**
- Updates a team member's role
- Returns True if successful, False if member not found

**`add_skill(member_id: str, skill: str) -> bool`**
- Adds a skill to a team member's profile
- Returns True if successful, False if member not found or skill already exists

**`list_members() -> List[TeamMember]`**
- Returns a list of all team members

**`get_members_by_role(role: str) -> List[TeamMember]`**
- Returns all team members with the specified role

**`get_members_by_skill(skill: str) -> List[TeamMember]`**
- Returns all team members with the specified skill

---

## Example Usage

```python
from hatvoni import Project, ProjectTracker, Task, TaskManager, TeamMember, TeamManager

# Initialize
project_tracker = ProjectTracker()
task_manager = TaskManager()
team_manager = TeamManager()

# Create and add a project
project = Project("p001", "Website Redesign", "Complete redesign of company website")
project_tracker.add_project(project)

# Add a team member
developer = TeamMember("m001", "Jane Doe", "jane@example.com", "developer", ["Python", "JavaScript"])
team_manager.add_member(developer)

# Create and assign a task
task = Task("t001", "Design homepage", "Create new homepage design", "p001")
task_manager.add_task(task)
task_manager.assign_task("t001", "m001")

# Update task status
task_manager.update_task_status("t001", "in_progress")

# List all tasks for the project
project_tasks = task_manager.get_tasks_by_project("p001")
```
