⚡ Smetki.bg — Utility Bill Analyzer with AI

A web application for analyzing utility bills (electricity, water, gas) with a built-in AI assistant. Helps users understand why their bills are increasing or decreasing and provides personalized saving tips.


🚀 Features


Registration & Login — secure accounts with JWT authentication
Bill Tracking — add electricity, water and gas bills by month
Charts — visual 12-month history of expenses
AI Assistant — powered by Claude AI, analyzes anomalies and explains bill changes
Soft Delete — bills are never permanently deleted, only marked as removed
Conversation History — the AI remembers context between sessions



🛠️ Tech Stack

Backend


ASP.NET Core 8 — Web API
Entity Framework Core 8 — ORM
PostgreSQL — database
JWT — authentication
BCrypt — password hashing
Claude AI (Anthropic) — AI bill analysis


Frontend


React 18 — UI
Vite — build tool
Tailwind CSS — styling
React Router — navigation
Axios — HTTP requests
Recharts — charts


Architecture


Repository Pattern — data access abstraction
Unit of Work — transaction management
Clean Architecture — separation of concerns


