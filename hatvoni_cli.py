#!/usr/bin/env python3
"""
Hatvoni Management System CLI

Command-line interface for managing projects, tasks, and team members.
"""

import argparse
import sys
from hatvoni import Project, ProjectTracker, Task, TaskManager, TeamMember, TeamManager


def main():
    parser = argparse.ArgumentParser(description="Hatvoni Management System")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Project commands
    project_parser = subparsers.add_parser('project', help='Manage projects')
    project_subparsers = project_parser.add_subparsers(dest='action')
    
    project_add = project_subparsers.add_parser('add', help='Add a new project')
    project_add.add_argument('id', help='Project ID')
    project_add.add_argument('name', help='Project name')
    project_add.add_argument('description', help='Project description')
    
    project_list = project_subparsers.add_parser('list', help='List all projects')
    
    project_status = project_subparsers.add_parser('status', help='Update project status')
    project_status.add_argument('id', help='Project ID')
    project_status.add_argument('status', help='New status')
    
    # Task commands
    task_parser = subparsers.add_parser('task', help='Manage tasks')
    task_subparsers = task_parser.add_subparsers(dest='action')
    
    task_add = task_subparsers.add_parser('add', help='Add a new task')
    task_add.add_argument('id', help='Task ID')
    task_add.add_argument('title', help='Task title')
    task_add.add_argument('description', help='Task description')
    task_add.add_argument('project_id', help='Project ID')
    
    task_list = task_subparsers.add_parser('list', help='List all tasks')
    
    task_assign = task_subparsers.add_parser('assign', help='Assign task to member')
    task_assign.add_argument('task_id', help='Task ID')
    task_assign.add_argument('member_id', help='Member ID')
    
    # Team commands
    team_parser = subparsers.add_parser('team', help='Manage team members')
    team_subparsers = team_parser.add_subparsers(dest='action')
    
    team_add = team_subparsers.add_parser('add', help='Add a new team member')
    team_add.add_argument('id', help='Member ID')
    team_add.add_argument('name', help='Member name')
    team_add.add_argument('email', help='Member email')
    team_add.add_argument('--role', default='developer', help='Member role')
    
    team_list = team_subparsers.add_parser('list', help='List all team members')
    
    args = parser.parse_args()
    
    if args.command == 'project':
        handle_project_command(args)
    elif args.command == 'task':
        handle_task_command(args)
    elif args.command == 'team':
        handle_team_command(args)
    else:
        parser.print_help()


def handle_project_command(args):
    tracker = ProjectTracker()
    
    if args.action == 'add':
        project = Project(args.id, args.name, args.description)
        if tracker.add_project(project):
            print(f"Project '{args.name}' added successfully!")
        else:
            print(f"Project with ID '{args.id}' already exists.")
    
    elif args.action == 'list':
        projects = tracker.list_projects()
        if projects:
            print("\nProjects:")
            for project in projects:
                print(f"  [{project.project_id}] {project.name} - {project.status}")
                print(f"    Description: {project.description}")
                print(f"    Started: {project.start_date}")
        else:
            print("No projects found.")
    
    elif args.action == 'status':
        if tracker.update_project_status(args.id, args.status):
            print(f"Project status updated to '{args.status}'")
        else:
            print(f"Project with ID '{args.id}' not found.")


def handle_task_command(args):
    manager = TaskManager()
    
    if args.action == 'add':
        task = Task(args.id, args.title, args.description, args.project_id)
        if manager.add_task(task):
            print(f"Task '{args.title}' added successfully!")
        else:
            print(f"Task with ID '{args.id}' already exists.")
    
    elif args.action == 'list':
        tasks = manager.list_tasks()
        if tasks:
            print("\nTasks:")
            for task in tasks:
                assignee = task.assigned_to or "Unassigned"
                print(f"  [{task.task_id}] {task.title} - {task.status}")
                print(f"    Project: {task.project_id} | Assigned to: {assignee}")
                print(f"    Priority: {task.priority}")
        else:
            print("No tasks found.")
    
    elif args.action == 'assign':
        if manager.assign_task(args.task_id, args.member_id):
            print(f"Task assigned to member '{args.member_id}'")
        else:
            print(f"Task with ID '{args.task_id}' not found.")


def handle_team_command(args):
    manager = TeamManager()
    
    if args.action == 'add':
        member = TeamMember(args.id, args.name, args.email, args.role)
        if manager.add_member(member):
            print(f"Team member '{args.name}' added successfully!")
        else:
            print(f"Member with ID '{args.id}' already exists.")
    
    elif args.action == 'list':
        members = manager.list_members()
        if members:
            print("\nTeam Members:")
            for member in members:
                print(f"  [{member.member_id}] {member.name} - {member.role}")
                print(f"    Email: {member.email}")
                if member.skills:
                    print(f"    Skills: {', '.join(member.skills)}")
        else:
            print("No team members found.")


if __name__ == '__main__':
    main()
