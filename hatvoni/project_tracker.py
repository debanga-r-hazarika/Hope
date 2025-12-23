"""
Hatvoni Project Tracker Module

This module provides functionality to track project information,
status, milestones, and progress for the Hatvoni management system.
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional

from .constants import DATE_FORMAT, DATETIME_FORMAT


class Project:
    """Represents a project with its properties."""
    
    def __init__(self, project_id: str, name: str, description: str,
                 status: str = "planning", start_date: Optional[str] = None):
        self.project_id = project_id
        self.name = name
        self.description = description
        self.status = status
        self.start_date = start_date or datetime.now().strftime(DATE_FORMAT)
        self.milestones = []
        self.created_at = datetime.now().strftime(DATETIME_FORMAT)
    
    def to_dict(self) -> Dict:
        """Convert project to dictionary."""
        return {
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "start_date": self.start_date,
            "milestones": self.milestones,
            "created_at": self.created_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Project':
        """Create project from dictionary."""
        project = cls(
            data["project_id"],
            data["name"],
            data["description"],
            data.get("status", "planning"),
            data.get("start_date")
        )
        project.milestones = data.get("milestones", [])
        project.created_at = data.get("created_at", datetime.now().strftime(DATETIME_FORMAT))
        return project


class ProjectTracker:
    """Manages multiple projects."""
    
    def __init__(self, data_file: str = "data/projects.json"):
        self.data_file = data_file
        self.projects: Dict[str, Project] = {}
        self._load_projects()
    
    def _load_projects(self):
        """Load projects from file."""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    for project_data in data.get("projects", []):
                        project = Project.from_dict(project_data)
                        self.projects[project.project_id] = project
            except Exception as e:
                print(f"Error loading projects: {e}")
    
    def _save_projects(self):
        """Save projects to file."""
        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
        data = {
            "projects": [p.to_dict() for p in self.projects.values()]
        }
        with open(self.data_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def add_project(self, project: Project) -> bool:
        """Add a new project."""
        if project.project_id in self.projects:
            return False
        self.projects[project.project_id] = project
        self._save_projects()
        return True
    
    def get_project(self, project_id: str) -> Optional[Project]:
        """Get a project by ID."""
        return self.projects.get(project_id)
    
    def update_project_status(self, project_id: str, status: str) -> bool:
        """Update project status."""
        project = self.get_project(project_id)
        if project:
            project.status = status
            self._save_projects()
            return True
        return False
    
    def add_milestone(self, project_id: str, milestone: str) -> bool:
        """Add a milestone to a project."""
        project = self.get_project(project_id)
        if project:
            project.milestones.append({
                "description": milestone,
                "added_at": datetime.now().strftime(DATETIME_FORMAT)
            })
            self._save_projects()
            return True
        return False
    
    def list_projects(self) -> List[Project]:
        """List all projects."""
        return list(self.projects.values())
    
    def get_projects_by_status(self, status: str) -> List[Project]:
        """Get projects by status."""
        return [p for p in self.projects.values() if p.status == status]
