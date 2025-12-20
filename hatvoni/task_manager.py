"""
Hatvoni Task Manager Module

This module provides functionality to manage tasks, assign them to team members,
track their status, and monitor progress.
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional


class Task:
    """Represents a task with its properties."""
    
    def __init__(self, task_id: str, title: str, description: str,
                 project_id: str, assigned_to: Optional[str] = None,
                 priority: str = "medium", status: str = "todo"):
        self.task_id = task_id
        self.title = title
        self.description = description
        self.project_id = project_id
        self.assigned_to = assigned_to
        self.priority = priority
        self.status = status
        self.created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.updated_at = self.created_at
    
    def to_dict(self) -> Dict:
        """Convert task to dictionary."""
        return {
            "task_id": self.task_id,
            "title": self.title,
            "description": self.description,
            "project_id": self.project_id,
            "assigned_to": self.assigned_to,
            "priority": self.priority,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Task':
        """Create task from dictionary."""
        task = cls(
            data["task_id"],
            data["title"],
            data["description"],
            data["project_id"],
            data.get("assigned_to"),
            data.get("priority", "medium"),
            data.get("status", "todo")
        )
        task.created_at = data.get("created_at", task.created_at)
        task.updated_at = data.get("updated_at", task.updated_at)
        return task


class TaskManager:
    """Manages tasks for projects."""
    
    def __init__(self, data_file: str = "data/tasks.json"):
        self.data_file = data_file
        self.tasks: Dict[str, Task] = {}
        self._load_tasks()
    
    def _load_tasks(self):
        """Load tasks from file."""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    for task_data in data.get("tasks", []):
                        task = Task.from_dict(task_data)
                        self.tasks[task.task_id] = task
            except Exception as e:
                print(f"Error loading tasks: {e}")
    
    def _save_tasks(self):
        """Save tasks to file."""
        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
        data = {
            "tasks": [t.to_dict() for t in self.tasks.values()]
        }
        with open(self.data_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def add_task(self, task: Task) -> bool:
        """Add a new task."""
        if task.task_id in self.tasks:
            return False
        self.tasks[task.task_id] = task
        self._save_tasks()
        return True
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Get a task by ID."""
        return self.tasks.get(task_id)
    
    def update_task_status(self, task_id: str, status: str) -> bool:
        """Update task status."""
        task = self.get_task(task_id)
        if task:
            task.status = status
            task.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            self._save_tasks()
            return True
        return False
    
    def assign_task(self, task_id: str, member_id: str) -> bool:
        """Assign task to a team member."""
        task = self.get_task(task_id)
        if task:
            task.assigned_to = member_id
            task.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            self._save_tasks()
            return True
        return False
    
    def list_tasks(self) -> List[Task]:
        """List all tasks."""
        return list(self.tasks.values())
    
    def get_tasks_by_project(self, project_id: str) -> List[Task]:
        """Get tasks for a specific project."""
        return [t for t in self.tasks.values() if t.project_id == project_id]
    
    def get_tasks_by_assignee(self, member_id: str) -> List[Task]:
        """Get tasks assigned to a specific team member."""
        return [t for t in self.tasks.values() if t.assigned_to == member_id]
    
    def get_tasks_by_status(self, status: str) -> List[Task]:
        """Get tasks by status."""
        return [t for t in self.tasks.values() if t.status == status]
