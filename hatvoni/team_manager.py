"""
Hatvoni Team Manager Module

This module provides functionality to manage team members,
their roles, and contact information.
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional


class TeamMember:
    """Represents a team member with their properties."""
    
    def __init__(self, member_id: str, name: str, email: str,
                 role: str = "developer", skills: Optional[List[str]] = None):
        self.member_id = member_id
        self.name = name
        self.email = email
        self.role = role
        self.skills = skills or []
        self.joined_at = datetime.now().strftime("%Y-%m-%d")
    
    def to_dict(self) -> Dict:
        """Convert team member to dictionary."""
        return {
            "member_id": self.member_id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "skills": self.skills,
            "joined_at": self.joined_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'TeamMember':
        """Create team member from dictionary."""
        member = cls(
            data["member_id"],
            data["name"],
            data["email"],
            data.get("role", "developer"),
            data.get("skills", [])
        )
        member.joined_at = data.get("joined_at", member.joined_at)
        return member


class TeamManager:
    """Manages team members."""
    
    def __init__(self, data_file: str = "data/team.json"):
        self.data_file = data_file
        self.members: Dict[str, TeamMember] = {}
        self._load_members()
    
    def _load_members(self):
        """Load team members from file."""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    for member_data in data.get("members", []):
                        member = TeamMember.from_dict(member_data)
                        self.members[member.member_id] = member
            except Exception as e:
                print(f"Error loading team members: {e}")
    
    def _save_members(self):
        """Save team members to file."""
        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
        data = {
            "members": [m.to_dict() for m in self.members.values()]
        }
        with open(self.data_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def add_member(self, member: TeamMember) -> bool:
        """Add a new team member."""
        if member.member_id in self.members:
            return False
        self.members[member.member_id] = member
        self._save_members()
        return True
    
    def get_member(self, member_id: str) -> Optional[TeamMember]:
        """Get a team member by ID."""
        return self.members.get(member_id)
    
    def update_member_role(self, member_id: str, role: str) -> bool:
        """Update team member role."""
        member = self.get_member(member_id)
        if member:
            member.role = role
            self._save_members()
            return True
        return False
    
    def add_skill(self, member_id: str, skill: str) -> bool:
        """Add a skill to team member."""
        member = self.get_member(member_id)
        if member and skill not in member.skills:
            member.skills.append(skill)
            self._save_members()
            return True
        return False
    
    def list_members(self) -> List[TeamMember]:
        """List all team members."""
        return list(self.members.values())
    
    def get_members_by_role(self, role: str) -> List[TeamMember]:
        """Get team members by role."""
        return [m for m in self.members.values() if m.role == role]
    
    def get_members_by_skill(self, skill: str) -> List[TeamMember]:
        """Get team members by skill."""
        return [m for m in self.members.values() if skill in m.skills]
