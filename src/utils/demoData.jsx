import React from 'react';
import { Smartphone, Film, Ticket } from 'lucide-react';

export const MOCK_USERS = [
  { id: 'p1', name: "Sarah", role: "Parent", initials: "S", color: "from-pink-500 to-rose-500" },
  { id: 'p2', name: "Dad", role: "Parent", initials: "D", color: "from-blue-500 to-cyan-500" },
  { id: 'c1', name: "Tommy", role: "Child", initials: "T", color: "from-emerald-400 to-teal-500" },
  { id: 'c2', name: "Lily", role: "Child", initials: "L", color: "from-purple-500 to-indigo-500" }
];

export const mockTasks = [
  { id: 1, title: "Empty Dishwasher", assignee: "Tommy", points: 10, status: 'open', requiresPhoto: false },
  { id: 4, title: "Clean Bedroom", assignee: "Tommy", points: 25, status: 'open', requiresPhoto: true },
  { id: 2, title: "Walk the Dog", assignee: "Sarah", points: 20, status: 'approved', requiresPhoto: false },
  { id: 3, title: "Finish Math Homework", assignee: "Lily", points: 15, status: 'pending', requiresPhoto: true, photoUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80" },
];

export const mockChats = [
  { id: 1, senderId: 'p1', text: "Hey family, what's everyone doing?", time: "3:30 PM" },
  { id: 2, senderId: 'c1', text: "Just finished my homework! Can I have a snack?", time: "3:32 PM" },
];

export const mockEvents = [
  { id: 1, title: "Tommy's Soccer Practice", time: "4:00 PM - 5:30 PM", location: "City Park", color: "bg-emerald-500" },
  { id: 2, title: "Family Dinner", time: "6:30 PM", location: "Home", color: "bg-indigo-500" }
];

export const mockMeals = [
  { id: 1, day: "Today", meal: "Spaghetti Bolognese", prepTime: "30m", tags: ["Pasta"], ingredients: "1 lb Ground Beef\n1 box Spaghetti\n1 jar Marinara Sauce", instructions: "1. Boil water and cook pasta.\n2. Brown ground beef.\n3. Simmer sauce." }
];

export const mockRewards = [
  { id: 1, title: "30 Min Screen Time", cost: 20, icon: <Smartphone className="w-6 h-6"/>, color: "bg-blue-100 text-blue-600" },
  { id: 2, title: "Choose Movie Night", cost: 50, icon: <Film className="w-6 h-6"/>, color: "bg-purple-100 text-purple-600" },
  { id: 3, title: "Special Activity", cost: 100, icon: <Ticket className="w-6 h-6"/>, color: "bg-pink-100 text-pink-600" },
];
