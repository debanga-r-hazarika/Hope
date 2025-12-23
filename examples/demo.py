#!/usr/bin/env python3
"""
Example usage of the Hatvoni Management System

This script demonstrates how to use the management system programmatically.
"""

import sys
import os
# Add parent directory to path so we can import hatvoni
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from hatvoni import Project, ProjectTracker, Task, TaskManager, TeamMember, TeamManager


def main():
    print("=== Hatvoni Management System Demo ===\n")
    
    # Initialize managers
    project_tracker = ProjectTracker()
    task_manager = TaskManager()
    team_manager = TeamManager()
    
    # Add team members
    print("1. Adding team members...")
    members = [
        TeamMember("m001", "Alice Johnson", "alice@hatvoni.com", "project_manager", ["leadership", "planning"]),
        TeamMember("m002", "Bob Smith", "bob@hatvoni.com", "developer", ["python", "javascript"]),
        TeamMember("m003", "Carol Davis", "carol@hatvoni.com", "designer", ["ui/ux", "figma"])
    ]
    
    for member in members:
        if team_manager.add_member(member):
            print(f"   Added: {member.name} ({member.role})")
    
    # Add a project
    print("\n2. Creating project...")
    project = Project(
        "p001",
        "Hatvoni Web Platform",
        "Development of the main web platform for Hatvoni services",
        "active"
    )
    if project_tracker.add_project(project):
        print(f"   Created: {project.name}")
    
    # Add milestones
    print("\n3. Adding project milestones...")
    milestones = [
        "Complete initial design mockups",
        "Set up development environment",
        "Implement core features"
    ]
    for milestone in milestones:
        project_tracker.add_milestone("p001", milestone)
        print(f"   Added milestone: {milestone}")
    
    # Add tasks
    print("\n4. Creating tasks...")
    tasks = [
        Task("t001", "Design homepage", "Create homepage design mockups", "p001", "m003", "high", "in_progress"),
        Task("t002", "Set up backend API", "Initialize backend API structure", "p001", "m002", "high", "todo"),
        Task("t003", "Project planning", "Define project scope and timeline", "p001", "m001", "medium", "completed")
    ]
    
    for task in tasks:
        if task_manager.add_task(task):
            print(f"   Created: {task.title} (assigned to {task.assigned_to or 'unassigned'})")
    
    # Display summary
    print("\n=== Current Status ===")
    
    print("\nProjects:")
    for proj in project_tracker.list_projects():
        print(f"  [{proj.project_id}] {proj.name} - Status: {proj.status}")
        print(f"    Milestones: {len(proj.milestones)}")
    
    print("\nTasks:")
    for task in task_manager.list_tasks():
        print(f"  [{task.task_id}] {task.title}")
        print(f"    Status: {task.status} | Priority: {task.priority}")
    
    print("\nTeam Members:")
    for member in team_manager.list_members():
        assigned_tasks = task_manager.get_tasks_by_assignee(member.member_id)
        print(f"  [{member.member_id}] {member.name} - {member.role}")
        print(f"    Assigned tasks: {len(assigned_tasks)}")
    
    print("\n=== Demo Complete ===")


if __name__ == '__main__':
    main()
