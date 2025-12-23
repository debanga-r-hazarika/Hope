# Examples and Use Cases

This document provides practical examples and use cases for the Hatvoni management system.

## Use Case 1: Software Development Project

### Scenario
Managing a software development project with multiple team members and sprints.

### Implementation

```python
#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from hatvoni import Project, ProjectTracker, Task, TaskManager, TeamMember, TeamManager

# Initialize managers
pt = ProjectTracker()
tm = TaskManager()
team = TeamManager()

# Setup team
team.add_member(TeamMember("dev1", "Alice", "alice@company.com", "developer", ["Python", "React"]))
team.add_member(TeamMember("dev2", "Bob", "bob@company.com", "developer", ["Python", "Docker"]))
team.add_member(TeamMember("pm1", "Carol", "carol@company.com", "project_manager"))

# Create project
project = Project("sprint1", "Sprint 1 - User Authentication", "Implement user auth system", "active")
pt.add_project(project)
pt.add_milestone("sprint1", "Database schema designed")
pt.add_milestone("sprint1", "API endpoints implemented")
pt.add_milestone("sprint1", "Frontend integration complete")

# Create tasks
tasks = [
    Task("s1t1", "Design database schema", "Design user and auth tables", "sprint1", "dev1", "high"),
    Task("s1t2", "Implement login API", "Create login endpoint", "sprint1", "dev1", "high"),
    Task("s1t3", "Build login UI", "Create login form in React", "sprint1", "dev2", "medium"),
]

for task in tasks:
    tm.add_task(task)

# Track progress
tm.update_task_status("s1t1", "completed")
tm.update_task_status("s1t2", "in_progress")

# Generate report
print(f"Project: {project.name}")
print(f"Status: {project.status}")
print(f"\nTasks:")
for task in tm.get_tasks_by_project("sprint1"):
    print(f"  - {task.title}: {task.status}")
```

## Use Case 2: Event Planning

### Scenario
Planning and coordinating a company event.

### Implementation

```python
from hatvoni import Project, ProjectTracker, Task, TaskManager, TeamMember, TeamManager

pt = ProjectTracker()
tm = TaskManager()
team = TeamManager()

# Setup event team
team.add_member(TeamMember("coord1", "David", "david@company.com", "event_coordinator"))
team.add_member(TeamMember("cater1", "Emma", "emma@catering.com", "vendor"))

# Create event project
event = Project("annual_meeting", "Annual Company Meeting 2025", 
                "Plan annual meeting for 200 attendees", "planning")
pt.add_project(event)

# Add planning milestones
pt.add_milestone("annual_meeting", "Venue booked")
pt.add_milestone("annual_meeting", "Catering confirmed")
pt.add_milestone("annual_meeting", "Agenda finalized")

# Create planning tasks
tm.add_task(Task("evt1", "Book venue", "Reserve conference center", 
                 "annual_meeting", "coord1", "critical"))
tm.add_task(Task("evt2", "Order catering", "Arrange lunch for 200", 
                 "annual_meeting", "cater1", "high"))
tm.add_task(Task("evt3", "Send invitations", "Email all employees", 
                 "annual_meeting", "coord1", "medium"))

# Update as tasks complete
tm.update_task_status("evt1", "completed")
pt.update_project_status("annual_meeting", "active")
```

## Use Case 3: Research Project

### Scenario
Managing an academic research project with multiple researchers.

### Implementation

```python
from hatvoni import Project, ProjectTracker, Task, TaskManager, TeamMember, TeamManager

pt = ProjectTracker()
tm = TaskManager()
team = TeamManager()

# Research team
team.add_member(TeamMember("pi1", "Dr. Smith", "smith@uni.edu", "principal_investigator"))
team.add_member(TeamMember("ra1", "Student A", "studenta@uni.edu", "research_assistant"))
team.add_member(TeamMember("ra2", "Student B", "studentb@uni.edu", "research_assistant"))

# Create research project
research = Project("ml_research", "Machine Learning for Medical Diagnosis",
                   "Research ML applications in medical imaging", "active")
pt.add_project(research)

# Research phases
pt.add_milestone("ml_research", "Literature review completed")
pt.add_milestone("ml_research", "Data collection finished")
pt.add_milestone("ml_research", "Model training completed")
pt.add_milestone("ml_research", "Paper submitted")

# Research tasks
tm.add_task(Task("r1", "Literature review", "Review existing ML medical papers", 
                 "ml_research", "ra1", "high"))
tm.add_task(Task("r2", "Collect dataset", "Gather medical images", 
                 "ml_research", "ra2", "high"))
tm.add_task(Task("r3", "Train models", "Implement and train CNN models", 
                 "ml_research", "ra1", "medium"))
tm.add_task(Task("r4", "Write paper", "Draft research paper", 
                 "ml_research", "pi1", "medium"))
```

## Use Case 4: Marketing Campaign

### Scenario
Coordinating a multi-channel marketing campaign.

### Implementation

```python
from hatvoni import Project, ProjectTracker, Task, TaskManager, TeamMember, TeamManager

pt = ProjectTracker()
tm = TaskManager()
team = TeamManager()

# Marketing team
team.add_member(TeamMember("mm1", "Frank", "frank@company.com", "marketing_manager"))
team.add_member(TeamMember("designer1", "Grace", "grace@company.com", "designer"))
team.add_member(TeamMember("writer1", "Henry", "henry@company.com", "content_writer"))

# Campaign project
campaign = Project("q1_launch", "Q1 Product Launch Campaign",
                   "Multi-channel campaign for new product", "planning")
pt.add_project(campaign)

# Campaign milestones
pt.add_milestone("q1_launch", "Creative assets ready")
pt.add_milestone("q1_launch", "Content calendar finalized")
pt.add_milestone("q1_launch", "Campaign launched")

# Marketing tasks
tm.add_task(Task("mk1", "Design banner ads", "Create display ad variations", 
                 "q1_launch", "designer1", "high"))
tm.add_task(Task("mk2", "Write blog posts", "Create 5 launch blog posts", 
                 "q1_launch", "writer1", "high"))
tm.add_task(Task("mk3", "Setup email campaign", "Configure email automation", 
                 "q1_launch", "mm1", "medium"))

# Track campaign progress
for task in tm.get_tasks_by_project("q1_launch"):
    if task.assigned_to:
        member = team.get_member(task.assigned_to)
        print(f"{task.title} -> {member.name} ({task.status})")
```

## Advanced Patterns

### Pattern 1: Bulk Task Creation

```python
# Create multiple related tasks efficiently
task_templates = [
    ("Feature X", "high"),
    ("Feature Y", "medium"),
    ("Feature Z", "low"),
]

for i, (feature, priority) in enumerate(task_templates):
    task = Task(
        f"feat_{i}",
        f"Implement {feature}",
        f"Development of {feature}",
        "my_project",
        priority=priority
    )
    tm.add_task(task)
```

### Pattern 2: Progress Reporting

```python
def generate_project_report(project_id):
    project = pt.get_project(project_id)
    tasks = tm.get_tasks_by_project(project_id)
    
    total = len(tasks)
    completed = len([t for t in tasks if t.status == "completed"])
    in_progress = len([t for t in tasks if t.status == "in_progress"])
    
    print(f"Project: {project.name}")
    print(f"Progress: {completed}/{total} tasks completed ({completed/total*100:.1f}%)")
    print(f"In Progress: {in_progress}")
    print(f"Milestones: {len(project.milestones)}")
```

### Pattern 3: Team Workload Analysis

```python
def analyze_team_workload():
    for member in team.list_members():
        tasks = tm.get_tasks_by_assignee(member.member_id)
        active_tasks = [t for t in tasks if t.status in ["todo", "in_progress"]]
        
        print(f"{member.name}: {len(active_tasks)} active tasks")
        for task in active_tasks:
            print(f"  - {task.title} ({task.priority})")
```

## Tips and Best Practices

1. **Use consistent ID schemes**: e.g., `proj001`, `proj002` for projects
2. **Set realistic priorities**: Reserve "critical" for truly urgent items
3. **Update regularly**: Keep task statuses current for accurate tracking
4. **Add detailed descriptions**: Help team members understand context
5. **Track skills**: Assign tasks based on team member skills
6. **Use milestones**: Break large projects into manageable phases
7. **Regular reviews**: Periodically check project status and adjust plans
